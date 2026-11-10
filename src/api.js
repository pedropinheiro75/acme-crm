const http = require('http');
const os = require('os');
const { createClient } = require('redis');
const { pool, tableExists } = require('./db');

const PORT = Number(process.env.PORT || 4000);
const STARTED = new Date().toISOString();
const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (e) => console.error('redis:', e.message));

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}

// Where is this process running? stackfork sets STACKFORK_HOST_RUN=1 for
// apps it starts on your machine (hybrid mode).
function runtime() {
  const onHost = process.env.STACKFORK_HOST_RUN === '1';
  return {
    where: onHost ? 'host' : 'container',
    label: onHost ? `your machine (${os.hostname()})` : `Docker container ${os.hostname()}`,
    pid: process.pid,
    node: process.version,
    port: PORT,
    startedAt: STARTED,
  };
}

async function environment() {
  const hasMigrations = await tableExists('schema_migrations');
  const [cluster, migrations, counts] = await Promise.all([
    pool.query('SELECT system_identifier::text AS id FROM pg_control_system()'),
    hasMigrations ? pool.query('SELECT name FROM schema_migrations ORDER BY name') : { rows: [] },
    (await tableExists('deals'))
      ? pool.query(`SELECT (SELECT count(*) FROM companies)::int AS companies,
                           (SELECT count(*) FROM contacts)::int AS contacts,
                           (SELECT count(*) FROM deals)::int AS deals`)
      : { rows: [{}] },
  ]);
  return {
    runtime: runtime(),
    databaseCluster: cluster.rows[0].id,
    migrations: migrations.rows.map((r) => r.name),
    counts: counts.rows[0],
  };
}

const routes = [
  ['GET', /^\/api\/health$/, async () => ({ ok: true })],
  ['GET', /^\/api\/stack$/, environment],
  ['GET', /^\/api\/deals$/, async () =>
    (await pool.query(`SELECT d.*, c.name AS company, sp.probability FROM deals d JOIN companies c ON c.id = d.company_id LEFT JOIN stage_probability sp ON sp.stage = d.stage ORDER BY d.value_cents DESC`)).rows],
  ['GET', /^\/api\/contacts$/, async () =>
    (await pool.query(`SELECT p.*, c.name AS company FROM contacts p JOIN companies c ON c.id = p.company_id ORDER BY p.name`)).rows],
  ['POST', /^\/api\/deals\/(\d+)\/stage$/, async (req, [, id]) => {
    const { stage } = await readBody(req);
    const r = await pool.query(
      `UPDATE deals SET stage = $2, updated_at = now() WHERE id = $1
       RETURNING *, (SELECT name FROM companies WHERE id = company_id) AS company`,
      [id, stage]
    );
    if (!r.rowCount) return [404, { error: 'unknown deal' }];
    if (stage === 'won') await redis.publish('deal-won', JSON.stringify(r.rows[0]));
    return r.rows[0];
  }],
];

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  for (const [method, re, handler] of routes) {
    const m = req.method === method && path.match(re);
    if (!m) continue;
    try {
      const out = await handler(req, m);
      return Array.isArray(out) && typeof out[0] === 'number' ? send(res, out[0], out[1]) : send(res, 200, out);
    } catch (e) {
      console.error(req.method, path, e.message);
      return send(res, 500, { error: e.message });
    }
  }
  send(res, 404, { error: 'not found' });
});

redis.connect().then(() => {
  server.listen(PORT, () => console.log(`api listening on :${PORT} (${runtime().where})`));
});
