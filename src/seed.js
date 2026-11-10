// Demo data for a NEW database. stackfork runs it once per data volume,
// right after the migrations; it never runs again on a restart.
const { pool } = require('./db');

const companies = [
  ['Globex', 'Energy'], ['Initech', 'Software'], ['Umbrella', 'Pharma'],
  ['Stark Industries', 'Defense'], ['Wayne Enterprises', 'Conglomerate'], ['Hooli', 'Internet'],
];
const contacts = [
  ['Globex', 'Hank Scorpio', 'hank@globex.test', 'CEO'],
  ['Initech', 'Bill Lumbergh', 'bill@initech.test', 'VP Engineering'],
  ['Umbrella', 'Alice Abernathy', 'alice@umbrella.test', 'Head of Security'],
  ['Stark Industries', 'Pepper Potts', 'pepper@stark.test', 'CEO'],
  ['Wayne Enterprises', 'Lucius Fox', 'lucius@wayne.test', 'CTO'],
  ['Hooli', 'Gavin Belson', 'gavin@hooli.test', 'Founder'],
];
const deals = [
  ['Globex', 'Fusion plant monitoring', 18000000, 'proposal'],
  ['Initech', 'TPS report automation', 2400000, 'qualified'],
  ['Umbrella', 'Lab access control', 9600000, 'lead'],
  ['Stark Industries', 'Arc reactor telemetry', 32000000, 'proposal'],
  ['Wayne Enterprises', 'Fleet tracking', 7500000, 'qualified'],
  ['Hooli', 'Compression benchmarks', 5100000, 'lead'],
  ['Initech', 'Printer fleet upgrade', 800000, 'won'],
];

async function main() {
  // Idempotent: a second run (say, after switching modes) adds nothing.
  if ((await pool.query('SELECT count(*)::int AS n FROM deals')).rows[0].n > 0) {
    console.log('seed: data already there, nothing to do');
    return pool.end();
  }
  for (const [name, industry] of companies) {
    await pool.query('INSERT INTO companies (name, industry) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [name, industry]);
  }
  const ids = Object.fromEntries((await pool.query('SELECT id, name FROM companies')).rows.map((r) => [r.name, r.id]));
  for (const [company, name, email, role] of contacts) {
    await pool.query(
      'INSERT INTO contacts (company_id, name, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [ids[company], name, email, role]
    );
  }
  for (const [company, title, value, stage] of deals) {
    await pool.query('INSERT INTO deals (company_id, title, value_cents, stage) VALUES ($1, $2, $3, $4)', [ids[company], title, value, stage]);
  }
  console.log(`seed: ${companies.length} companies, ${contacts.length} contacts, ${deals.length} deals`);
  await pool.end();
}

main().catch((e) => {
  console.error('seed failed:', e.message);
  process.exit(1);
});
