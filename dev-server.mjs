// Lokalni server za razvoj i testiranje: ista API logika kao na Netlifyju,
// a Netlify Blobs se emulira lokalnim BlobsServerom (s istim uvjetnim upisima).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobsServer } from '@netlify/blobs/server';
import { getStore } from '@netlify/blobs';
import { handle } from './netlify/functions/lib/server.mjs';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const port = Number(process.env.PORT || 8888);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

const blobs = new BlobsServer({ directory: fileURLToPath(new URL('./.local-blobs/', import.meta.url)), token: 'dev', port: 0 });
const { port: blobPort } = await blobs.start();
const url = `http://127.0.0.1:${blobPort}`;
const raw = getStore({ name: 'sobe', siteID: 'lokalno', token: 'dev', edgeURL: url, uncachedEdgeURL: url, consistency: 'strong' });
// Lokalni emulator provjerava postoji li zapis i upisuje u dva koraka. Pravi Netlify Blobs to radi atomarno,
// pa ovdje upise izvodimo jedan po jedan da lokalno dobijemo isto ponašanje.
let chain = Promise.resolve();
const serial = (fn) => { const r = chain.then(fn, fn); chain = r.catch(() => {}); return r; };
const store = {
  get: (...a) => raw.get(...a),
  getWithMetadata: (...a) => raw.getWithMetadata(...a),
  setJSON: (...a) => serial(() => raw.setJSON(...a)),
  delete: (...a) => raw.delete(...a),
};

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (u.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await handle(new Request(u, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined }), store);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let p = normalize(decodeURIComponent(u.pathname)).replace(/^(\.\.[/\\])+/, '');
  if (p.endsWith('/')) p += 'index.html';
  try {
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Nema');
  }
}).listen(port, () => console.log(`Bosanski monopol radi na http://localhost:${port}`));
