// HTTP sloj: sobe, tokeni igrača, zaštita od dvostrukog slanja i istodobnih promjena.
import { randomBytes, randomInt, createHash, randomUUID } from 'node:crypto';
import { newRoom, addPlayer, applyAction, publicState, GameError } from './engine.mjs';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rng = { int: (n) => randomInt(n) };
const hash = (t) => createHash('sha256').update(String(t)).digest('hex');
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const err = (msg, status = 400) => json({ error: msg }, status);

// Svaka verzija sobe je zaseban zapis koji se smije napisati samo jednom (onlyIfNew).
// Ako dva poteza stignu istovremeno, samo jedan dobije sljedeću verziju, drugi se ponavlja.
const verKey = (code, v) => `soba/${code}/${v}`;
const headKey = (code) => `soba/${code}/zadnja`;
const presKey = (code) => `prisutnost/${code}`;

function cleanCode(c) { return String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }

async function load(store, code) {
  const head = await store.get(headKey(code), { type: 'json', consistency: 'strong' });
  if (!head) return null;
  let s = await store.get(verKey(code, head.v), { type: 'json', consistency: 'strong' });
  if (!s) return null;
  // Oznaka zadnje verzije može kasniti, pa provjeri ima li novijih.
  for (;;) {
    const next = await store.get(verKey(code, s.v + 1), { type: 'json', consistency: 'strong' });
    if (!next) return s;
    s = next;
  }
}

async function commit(store, s) {
  const res = await store.setJSON(verKey(s.code, s.v), s, { onlyIfNew: true });
  if (!res.modified) return false;
  await store.setJSON(headKey(s.code), { v: s.v });
  if (s.v > 20) store.delete(verKey(s.code, s.v - 20)).catch(() => {});
  return true;
}

async function mutate(store, code, fn) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const s = await load(store, code);
    if (!s) throw new GameError('Soba ne postoji.', 404);
    const out = await fn(s);
    if (out === 'nochange') return { s, out };
    s.v += 1;
    if (await commit(store, s)) return { s, out };
  }
  throw new GameError('Previše istodobnih poteza, pokušaj ponovo.', 409);
}

function auth(s, token) {
  const h = hash(token);
  const pid = Object.keys(s.secrets || {}).find((id) => s.secrets[id] === h);
  if (!pid) throw new GameError('Nisi u ovoj sobi.', 403);
  return pid;
}

async function touch(store, code, pid) {
  try {
    const cur = (await store.get(presKey(code), { type: 'json' })) || {};
    cur[pid] = Date.now();
    await store.setJSON(presKey(code), cur);
  } catch { /* prisutnost nije kritična */ }
}

export async function handle(req, store) {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^.*\/api\//, '');
  try {
    if (req.method === 'GET' && route === 'state') {
      const code = cleanCode(url.searchParams.get('code'));
      const since = Number(url.searchParams.get('since') ?? -1);
      const s = await load(store, code);
      if (!s) return err('Soba ne postoji.', 404);
      const presence = (await store.get(presKey(code), { type: 'json' })) || {};
      if (s.v === since) return json({ same: true, v: s.v, presence, now: Date.now() });
      return json({ state: publicState(s), presence, now: Date.now() });
    }
    if (req.method !== 'POST') return err('Nepoznata adresa.', 404);
    const body = await req.json().catch(() => ({}));

    if (route === 'create') {
      for (let i = 0; i < 8; i++) {
        const code = Array.from({ length: 5 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
        const s = newRoom(code, rng, Date.now());
        const pid = randomUUID().slice(0, 8);
        const token = randomBytes(24).toString('hex');
        addPlayer(s, pid, body.name, body.figure);
        s.secrets = { [pid]: hash(token) };
        s.v = 1;
        if (await commit(store, s)) { await touch(store, code, pid); return json({ code, pid, token, state: publicState(s) }); }
      }
      return err('Nije uspjelo napraviti sobu, pokušaj ponovo.', 500);
    }

    const code = cleanCode(body.code);
    if (route === 'join') {
      const pid = randomUUID().slice(0, 8);
      const token = randomBytes(24).toString('hex');
      const { s } = await mutate(store, code, (s) => {
        addPlayer(s, pid, body.name, body.figure);
        s.secrets[pid] = hash(token);
      });
      await touch(store, code, pid);
      return json({ code, pid, token, state: publicState(s) });
    }
    if (route === 'ping') {
      const s = await load(store, code);
      if (!s) return err('Soba ne postoji.', 404);
      const pid = auth(s, body.token);
      await touch(store, code, pid);
      return json({ ok: true, pid });
    }
    if (route === 'action') {
      const presence = (await store.get(presKey(code), { type: 'json' })) || {};
      const aid = String(body.aid || '').slice(0, 40);
      let me;
      const { s, out } = await mutate(store, code, (s) => {
        me = auth(s, body.token);
        s.seen = s.seen || [];
        if (aid && s.seen.includes(aid)) return 'nochange'; // ista radnja poslana dvaput
        if (Number(body.v) !== s.v) throw new GameError('Stanje igre se promijenilo. Pogledaj ploču pa pokušaj ponovo.', 409);
        applyAction(s, me, body.action, { rng, presence, now: Date.now() });
        if (aid) { s.seen.push(aid); if (s.seen.length > 80) s.seen.splice(0, s.seen.length - 80); }
      });
      await touch(store, code, me);
      return json({ state: publicState(s), duplicate: out === 'nochange' });
    }
    return err('Nepoznata adresa.', 404);
  } catch (e) {
    if (e instanceof GameError) return err(e.message, e.status);
    console.error(e);
    return err('Greška na serveru.', 500);
  }
}
