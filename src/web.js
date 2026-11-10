// Serves the UI and forwards /api/* to the api. index.html is read on every
// request, so an edit shows up on the next refresh.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 5173);
const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';
const INDEX = path.join(__dirname, '..', 'public', 'index.html');

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const target = new URL(req.url, API_URL);
    const proxy = http.request(target, { method: req.method, headers: { ...req.headers, host: target.host } }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    proxy.on('error', (e) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: `api unreachable at ${API_URL}: ${e.message}` }));
    });
    return req.pipe(proxy);
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  fs.createReadStream(INDEX).pipe(res);
});

server.listen(PORT, () => console.log(`web listening on :${PORT}, api at ${API_URL}`));
