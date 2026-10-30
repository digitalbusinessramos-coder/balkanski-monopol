// Provjera objavljene igre preko javnog linka:
//   node scripts/provjera-uzivo.mjs https://tvoja-stranica.netlify.app
// Napravi sobu, uđe drugim igračem, pokrene partiju i pošalje 8 istih i različitih bacanja odjednom.
// Ispravno: tačno jedno bacanje prođe, isti zahtjevi se prepoznaju kao duplikati, ostali dobiju 409.
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) { console.log('Upotreba: node scripts/provjera-uzivo.mjs https://adresa-igre'); process.exit(1); }
const post = (r, b) => fetch(`${base}/api/${r}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
  .then(async (x) => ({ status: x.status, ...(await x.json()) }));

const a = await post('create', { name: 'Test A' });
if (a.status !== 200) { console.log('Pravljenje sobe nije uspjelo:', a); process.exit(1); }
const b = await post('join', { code: a.code, name: 'Test B' });
const s = (await post('action', { code: a.code, token: a.token, aid: 'start', v: b.state.v, action: { type: 'start' } })).state;
const cur = s.turn.pid === a.pid ? a : b;
const other = cur === a ? b : a;
const tudje = await post('action', { code: a.code, token: other.token, aid: 'tudje', v: s.v, action: { type: 'roll' } });
const res = await Promise.all(Array.from({ length: 8 }, (_, i) => post('action', { code: a.code, token: cur.token, aid: `k${i % 2}`, v: s.v, action: { type: 'roll' } })));
const fin = await fetch(`${base}/api/state?code=${a.code}`).then((r) => r.json());
const rolls = fin.state.log.filter((l) => / baca \d/.test(l.msg)).length;
const applied = res.filter((r) => r.status === 200 && !r.duplicate).length;
console.log(`Soba ${a.code}`);
console.log(`Bacanje za drugoga odbijeno: ${tudje.status === 400 ? 'DA' : 'NE'} (${tudje.error || tudje.status})`);
console.log(`Primijenjeno bacanja: ${applied}, duplikata: ${res.filter((r) => r.duplicate).length}, odbijeno (409): ${res.filter((r) => r.status === 409).length}`);
console.log(`Bacanja u dnevniku: ${rolls}`);
console.log(rolls === 1 && applied === 1 ? 'PROŠLO: istodobni potezi su zaštićeni.' : 'NIJE PROŠLO: provjeri Netlify Blobs.');
