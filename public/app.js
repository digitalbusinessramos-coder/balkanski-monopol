// Klijent: prikazuje stanje sa servera i šalje radnje. Sva pravila provjerava server.
import { FIELDS, RULES, HOUSE_COST, GROUP_COLOR, FIGURES, GAME_NAME, CHANCE, SURPRISE, groupOf } from './shared/data.js';
import { IC, TOK, km, esc, pos, cellHTML, centerArt, dieHTML, cardHTML, backHTML, deedHTML } from './board.js';

const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
const modalRoot = $('#modal-root');
const SKIP_MS = 60_000, KICK_MS = 120_000;

// ---------- spremanje sesije (token ostaje samo na ovom uređaju) ----------
const store = {
  all() { try { return JSON.parse(localStorage.getItem('bm-sesije') || '{}'); } catch { return {}; } },
  get(code) { return this.all()[code] || null; },
  set(code, v) { try { const a = this.all(); a[code] = v; localStorage.setItem('bm-sesije', JSON.stringify(a)); localStorage.setItem('bm-zadnja', code); } catch { /* bez spremanja */ } },
  del(code) { try { const a = this.all(); delete a[code]; localStorage.setItem('bm-sesije', JSON.stringify(a)); } catch { /* ništa */ } },
  last() { try { const c = localStorage.getItem('bm-zadnja'); return c && this.get(c) ? c : null; } catch { return null; } },
  name() { try { return localStorage.getItem('bm-ime') || ''; } catch { return ''; } },
  setName(n) { try { localStorage.setItem('bm-ime', n); } catch { /* ništa */ } },
};

const S = {
  screen: 'home', code: null, me: null, token: null, state: null, presence: {}, serverNow: 0, clockSkew: 0,
  busy: false, zoom: 1, seen: { card: 0, roll: 0, duel: 0, trade: 0, buy: '' }, boardBuilt: false, lastPos: {},
};

// ---------- API ----------
async function api(path, body) {
  const res = await fetch(`/api/${path}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Veza sa serverom nije uspjela.'); e.status = res.status; throw e; }
  return data;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3800);
}

async function send(action) {
  if (S.busy) return;
  S.busy = true; renderActions();
  const aid = crypto.randomUUID?.() || String(Math.random()).slice(2);
  const body = { code: S.code, token: S.token, aid, v: S.state.v, action };
  try {
    let data;
    try { data = await api('action', body); }
    catch (e) { if (e.status) throw e; data = await api('action', body); } // mrežni prekid: ista radnja s istim ID-em, server je neće ponoviti
    applyState(data.state);
  } catch (e) {
    toast(e.message);
    if (e.status === 409) await pollOnce();
  } finally {
    S.busy = false; renderActions();
  }
}

// ---------- praćenje stanja ----------
let pollTimer = null;
async function pollOnce() {
  if (!S.code) return;
  try {
    const d = await fetch(`/api/state?code=${encodeURIComponent(S.code)}&since=${S.state?.v ?? -1}`, { cache: 'no-store' });
    if (d.status === 404) { store.del(S.code); toast('Ta soba više ne postoji.'); goHome(); return; }
    const data = await d.json();
    S.presence = data.presence || {};
    S.clockSkew = (data.now || Date.now()) - Date.now();
    if (data.state) applyState(data.state);
    else if (S.screen === 'game') renderActions();
  } catch { /* pokušaj ponovo u sljedećem krugu */ }
}
function startPolling() {
  clearTimeout(pollTimer);
  const loop = async () => {
    await pollOnce();
    pollTimer = setTimeout(loop, document.hidden ? 5000 : 1300);
  };
  loop();
}
setInterval(() => { if (S.code && S.token && !document.hidden) api('ping', { code: S.code, token: S.token }).catch(() => {}); }, 20_000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.code) pollOnce(); });

function applyState(st) {
  if (S.state && st.v < S.state.v) return;
  S.state = st;
  const want = st.phase === 'lobby' ? 'lobby' : 'game';
  if (S.screen !== want) { S.screen = want; render(); } else if (want === 'lobby') renderLobby(); else updateGame();
}

// ---------- pomoćne za stanje ----------
const me = () => S.state?.players.find((p) => p.id === S.me);
const P = (id) => S.state.players.find((p) => p.id === id);
const nameOf = (id) => esc(P(id)?.name ?? '');
const ownedBy = (pid) => Object.entries(S.state.owners).filter(([, o]) => o.owner === pid).map(([k]) => Number(k));
const level = (i) => S.state.owners[i]?.level ?? 0;
const now = () => Date.now() + S.clockSkew;
function lastSeen(pid) {
  const t = S.state.turn;
  return Math.max(S.presence[pid] || 0, t?.pid === pid ? t.since || 0 : 0);
}
function canManage() {
  const st = S.state, h = st.queue[0];
  if (st.phase !== 'play') return false;
  if (h) return h.kind === 'debt' && h.pid === S.me;
  return st.turn.pid === S.me;
}
function figureSVG(id) { return TOK[id] || TOK.dzezva; }

// ---------- ekrani ----------
function render() {
  closeModal();
  S.boardBuilt = false;
  if (S.screen === 'home') renderHome();
  else if (S.screen === 'lobby') renderLobby();
  else renderGameShell();
}

function goHome() {
  clearTimeout(pollTimer);
  Object.assign(S, { screen: 'home', code: null, me: null, token: null, state: null });
  history.replaceState(null, '', location.pathname);
  render();
}

function masthead(small) {
  return `<header class="mast${small ? ' small' : ''}"><div class="mast-box"><span class="m1">${esc(GAME_NAME[0])}</span><span class="m2">${esc(GAME_NAME[1])}</span></div></header>`;
}

function figurePicker(name, taken = [], selected) {
  return `<div class="figs" role="radiogroup" aria-label="Figurica">${FIGURES.map((f) => {
    const dis = taken.includes(f.id) && f.id !== selected;
    return `<label class="fig${dis ? ' taken' : ''}"><input type="radio" name="${name}" value="${f.id}" ${f.id === selected ? 'checked' : ''} ${dis ? 'disabled' : ''}><span class="fig-svg">${TOK[f.id]}</span><span class="fig-n">${f.name}</span></label>`;
  }).join('')}</div>`;
}

function renderHome() {
  const params = new URLSearchParams(location.search);
  const inv = (params.get('soba') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const last = store.last();
  const nm = esc(store.name());
  app.innerHTML = `<div class="home">
    ${masthead()}
    <p class="home-lead">Kupuj gradove od Donjeg Vakufa do Nove Bile, plaćaj kiriju i preživi Šanse i Iznenađenja. Svako igra sa svog mobitela ili računala.</p>
    ${last && !inv ? `<button class="btn primary resume" id="resume" type="button">Nastavi partiju ${esc(last)}</button>` : ''}
    <div class="home-forms">
      <form class="panel" id="f-join" ${inv ? 'data-first="1"' : ''}>
        <h2>Uđi u sobu</h2>
        <label class="fld">Kod sobe<input id="j-code" name="code" maxlength="8" autocomplete="off" autocapitalize="characters" required value="${esc(inv)}" placeholder="npr. K7MQ2"></label>
        <label class="fld">Nadimak<input id="j-name" name="name" maxlength="18" required value="${nm}" placeholder="Kako da te zovemo?"></label>
        ${figurePicker('j-fig', [], 'golf')}
        <button class="btn primary" type="submit">Uđi</button>
      </form>
      <form class="panel" id="f-new">
        <h2>Nova soba</h2>
        <label class="fld">Nadimak<input id="n-name" name="name" maxlength="18" required value="${nm}" placeholder="Kako da te zovemo?"></label>
        ${figurePicker('n-fig', [], 'dzezva')}
        <button class="btn primary" type="submit">Napravi sobu</button>
        <p class="hint">Dobit ćeš kod i link koji pošalješ ekipi. Bez registracije.</p>
      </form>
    </div>
    <button class="linkbtn" id="rules-h" type="button">Pravila igre</button>
  </div>`;
  if (inv) $('.home-forms').prepend($('#f-join'));
  $('#resume')?.addEventListener('click', () => resume(last));
  $('#rules-h').addEventListener('click', openRules);
  const lock = (f, on) => f.querySelectorAll('button,input').forEach((b) => { b.disabled = on; });
  $('#f-new').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget; lock(f, true);
    try {
      const name = $('#n-name').value; store.setName(name);
      const d = await api('create', { name, figure: f.querySelector('input[name=n-fig]:checked')?.value });
      enterRoom(d);
    } catch (err) { toast(err.message); lock(f, false); }
  });
  $('#f-join').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget; lock(f, true);
    const code = $('#j-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (store.get(code)) { resume(code); return; }
    try {
      const name = $('#j-name').value; store.setName(name);
      const d = await api('join', { code, name, figure: f.querySelector('input[name=j-fig]:checked')?.value });
      enterRoom(d);
    } catch (err) { toast(err.message); lock(f, false); }
  });
}

function enterRoom(d) {
  store.set(d.code, { pid: d.pid, token: d.token });
  S.code = d.code; S.me = d.pid; S.token = d.token; S.state = null;
  history.replaceState(null, '', `?soba=${d.code}`);
  applyState(d.state);
  startPolling();
}
function resume(code) {
  const s = store.get(code);
  if (!s) return;
  S.code = code; S.me = s.pid; S.token = s.token; S.state = null; S.screen = 'loading';
  history.replaceState(null, '', `?soba=${code}`);
  app.innerHTML = '<p class="loading">Učitavam partiju…</p>';
  startPolling();
}

function inviteURL() { return `${location.origin}${location.pathname}?soba=${S.code}`; }
async function copyInvite() {
  try { await navigator.clipboard.writeText(inviteURL()); toast('Link je kopiran.'); }
  catch { toast(`Pošalji ovaj link: ${inviteURL()}`); }
}

function renderLobby() {
  const st = S.state, host = st.hostId === S.me;
  const taken = st.players.map((p) => p.figure);
  app.innerHTML = `<div class="lobby">
    ${masthead(true)}
    <section class="panel">
      <h2>Soba</h2>
      <div class="code-row"><span class="code" aria-label="Kod sobe">${esc(st.code)}</span><button class="btn" id="copy" type="button">Kopiraj link</button></div>
      <p class="hint">Pošalji link ili kod ekipi. Igra 2 do ${RULES.maxPlayers} igrača.</p>
      <ul class="lobby-players">${st.players.map((p) => `<li><span class="mini-tok">${figureSVG(p.figure)}</span><span class="pname" style="color:${p.color}">${esc(p.name)}</span>${p.id === st.hostId ? '<span class="tag">domaćin</span>' : ''}${p.id === S.me ? '<span class="tag">ti</span>' : ''}</li>`).join('')}</ul>
    </section>
    <section class="panel">
      <h2>Tvoja figurica</h2>
      ${figurePicker('l-fig', taken, me()?.figure)}
    </section>
    <section class="panel">
      <h2>Vrsta partije</h2>
      ${host ? `<div class="modes">
        <label class="mode"><input type="radio" name="mode" value="fast" checked><b>Brza</b><span>${RULES.fastRounds} krugova oko stola, pobjeđuje najveća imovina.</span></label>
        <label class="mode"><input type="radio" name="mode" value="classic"><b>Klasična</b><span>Do zadnjeg igrača koji nije bankrotirao.</span></label>
      </div>
      <button class="btn primary" id="start" type="button" ${st.players.length < 2 ? 'disabled' : ''}>${st.players.length < 2 ? 'Čeka se još jedan igrač' : 'Pokreni partiju'}</button>`
    : `<p>Čeka se da ${nameOf(st.hostId)} pokrene partiju.</p>`}
      <div class="row-btns"><button class="linkbtn" id="rules-l" type="button">Pravila igre</button><button class="linkbtn" id="leave-l" type="button">Izađi iz sobe</button></div>
    </section>
  </div>`;
  $('#copy').addEventListener('click', copyInvite);
  $('#rules-l').addEventListener('click', openRules);
  $('#leave-l').addEventListener('click', async () => { await send({ type: 'leave' }); store.del(S.code); goHome(); });
  app.querySelectorAll('input[name=l-fig]').forEach((r) => r.addEventListener('change', () => send({ type: 'figure', figure: r.value })));
  $('#start')?.addEventListener('click', () => send({ type: 'start', mode: app.querySelector('input[name=mode]:checked')?.value }));
}

// ---------- igra ----------
function renderGameShell() {
  app.innerHTML = `<div class="game-screen">
    <div class="topbar">
      <span class="tb-name">${esc(GAME_NAME.join(' '))}</span>
      <span class="tb-code">Soba <b>${esc(S.code)}</b></span>
      <span class="tb-round" id="round"></span>
      <span class="tb-sp"></span>
      <button class="tb-btn" id="tb-invite" type="button">Pozovi</button>
      <button class="tb-btn" id="tb-rules" type="button">Pravila</button>
      <button class="tb-btn" id="tb-menu" type="button">Izađi</button>
    </div>
    <div class="game">
      <div class="board-area">
        <div class="board-scroll" id="bscroll"><div class="board-wrap" id="bwrap"><div class="board" id="board"></div></div></div>
        <div class="zoom" aria-label="Uvećanje ploče"><button class="zbtn" id="z-out" type="button" aria-label="Umanji">−</button><button class="zbtn" id="z-in" type="button" aria-label="Uvećaj">+</button></div>
      </div>
      <aside class="side" aria-label="Igrači i potez">
        <h3>Igrači</h3>
        <div id="players"></div>
        <h3>Potez</h3>
        <div class="turn">
          <div class="status" id="status"></div>
          <div class="dice" id="dice"></div>
        </div>
        <div class="log" id="log" aria-label="Dnevnik igre"></div>
      </aside>
    </div>
    <div class="actions" id="actions"></div>
  </div>`;
  buildBoard();
  $('#tb-invite').addEventListener('click', copyInvite);
  $('#tb-rules').addEventListener('click', openRules);
  $('#tb-menu').addEventListener('click', openLeave);
  $('#z-in').addEventListener('click', () => setZoom(S.zoom * 1.4));
  $('#z-out').addEventListener('click', () => setZoom(S.zoom / 1.4));
  setupPinch($('#bscroll'));
  new ResizeObserver(fitBoard).observe($('#bscroll'));
  // Ne prikazuj stare kartice i bacanja nakon osvježavanja stranice.
  const st = S.state;
  S.seen.card = st.lastCard?.n ?? 0; S.seen.roll = st.lastRoll?.n ?? 0; S.seen.duel = st.lastDuel?.n ?? 0;
  S.lastPos = Object.fromEntries(st.players.map((p) => [p.id, p.pos]));
  updateGame();
}

function setZoom(z) {
  const sc = $('#bscroll');
  if (!sc) return;
  const old = S.zoom;
  S.zoom = Math.min(3, Math.max(1, z));
  const cx = (sc.scrollLeft + sc.clientWidth / 2) / old, cy = (sc.scrollTop + sc.clientHeight / 2) / old;
  fitBoard();
  sc.scrollLeft = cx * S.zoom - sc.clientWidth / 2;
  sc.scrollTop = cy * S.zoom - sc.clientHeight / 2;
}
function fitBoard() {
  const sc = $('#bscroll'), w = $('#bwrap');
  if (!sc || !w) return;
  w.style.width = `${sc.clientWidth * S.zoom}px`;
  $('#board').style.setProperty('--s', ((sc.clientWidth * S.zoom) / 906).toFixed(4));
  sc.classList.toggle('zoomed', S.zoom > 1.01);
}
function setupPinch(el) {
  const pts = new Map(); let start = 0, z0 = 1;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') pts.set(e.pointerId, e); });
  el.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, e);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (!start) { start = d; z0 = S.zoom; } else setZoom(z0 * (d / start));
    }
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) start = 0; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}

function buildBoard() {
  const el = $('#board');
  el.innerHTML = '';
  FIELDS.forEach((f, i) => {
    const [r, c, rot] = pos(i);
    const corner = [0, 10, 20, 30].includes(i);
    const d = document.createElement('button');
    d.type = 'button';
    d.className = `cell${corner ? ' corner' : ''}`;
    d.dataset.pos = i;
    d.style.gridRow = r; d.style.gridColumn = c;
    d.setAttribute('aria-label', f.name);
    d.innerHTML = `<div class="inner" style="--r:${corner ? 0 : rot}deg">${cellHTML(f, i)}<div class="owner"></div><div class="mort" hidden>HIPOTEKA</div></div>`;
    d.addEventListener('click', () => openField(i));
    el.appendChild(d);
  });
  const c = document.createElement('div');
  c.className = 'center';
  c.innerHTML = `${centerArt()}<div class="deck sansa" aria-hidden="true"><span class="stack"><span class="q">?</span>ŠANSA</span></div>
    <div class="deck izn" aria-hidden="true"><span class="stack"><span style="width:28px;height:28px">${IC.box}</span>IZNENAĐENJE</span></div>`;
  el.appendChild(c);
  const toks = document.createElement('div');
  toks.className = 'tokens'; toks.id = 'tokens';
  el.appendChild(toks);
  S.boardBuilt = true;
  fitBoard();
}

// Središte polja u koordinatama ploče (906 px s okvirom).
function cellCenter(i) {
  const [r, c] = pos(i);
  const axis = (k) => (k === 1 ? 58.5 : k === 11 ? 117 + 9 * 74 + 58.5 : 117 + (k - 2) * 74 + 37);
  return [axis(c) + 3, axis(r) + 3];
}

function placeTokens(animate) {
  const box = $('#tokens');
  if (!box) return;
  const st = S.state;
  const alive = st.players.filter((p) => !p.bankrupt);
  const byPos = {};
  alive.forEach((p) => { (byPos[p.pos] ||= []).push(p.id); });
  for (const p of st.players) {
    let t = box.querySelector(`[data-pid="${p.id}"]`);
    if (p.bankrupt) { t?.remove(); continue; }
    if (!t) {
      t = document.createElement('div');
      t.className = 'tok'; t.dataset.pid = p.id;
      t.innerHTML = `${figureSVG(p.figure)}<span class="tok-ring" style="border-color:${p.color}"></span>`;
      box.appendChild(t);
    }
    t.classList.toggle('active', st.turn?.pid === p.id);
    t.title = p.name;
    const from = S.lastPos[p.id];
    const to = p.pos;
    const steps = (to - from + 40) % 40;
    const put = (i) => {
      const group = byPos[to] || [p.id];
      const k = i === to ? group.indexOf(p.id) : 0;
      const [x, y] = cellCenter(i);
      const off = [[0, 0], [-16, -14], [16, -14], [-16, 14], [16, 14], [0, 0]][group.length > 1 ? k + 1 : 0] || [0, 0];
      t.style.transform = `translate(${x + off[0] - 18}px, ${y + off[1] - 18}px)`;
    };
    if (animate && from != null && steps > 0 && steps <= 12 && !(to === 10 && P(p.id).inJail)) {
      let k = 0;
      clearInterval(t._walk);
      t._walk = setInterval(() => {
        k += 1;
        put((from + k) % 40);
        if (k >= steps) clearInterval(t._walk);
      }, 140);
    } else put(to);
    S.lastPos[p.id] = to;
  }
}

function updateBoardMarks() {
  const st = S.state;
  document.querySelectorAll('#board .cell').forEach((cell) => {
    const i = Number(cell.dataset.pos);
    const o = st.owners[i];
    const ow = cell.querySelector('.owner');
    ow.style.background = o ? P(o.owner)?.color : 'transparent';
    cell.querySelector('.mort').hidden = !o?.mortgaged;
    const band = cell.querySelector('.band');
    if (band) {
      const lv = o?.level ?? 0;
      const want = lv === 5 ? 'H' : String(lv);
      if (band.dataset.lv !== want) {
        band.dataset.lv = want;
        band.innerHTML = lv === 5 ? '<span class="hotel"></span>' : '<span class="house"></span>'.repeat(lv);
      }
    }
    cell.classList.toggle('here', st.players.some((p) => !p.bankrupt && p.pos === i && p.id === st.turn?.pid));
  });
}

function statusText() {
  const st = S.state, h = st.queue[0];
  if (st.phase === 'over') return `Kraj partije. Pobjednik: <b>${nameOf(st.winner)}</b>.`;
  const who = (id) => (id === S.me ? '<b>Ti</b>' : `<b>${nameOf(id)}</b>`);
  if (h) {
    const you = h.pid === S.me;
    if (h.kind === 'buy') return `${who(h.pid)} ${you ? 'odlučuješ' : 'odlučuje'} hoće li kupiti ${esc(FIELDS[h.pos].name)} za ${km(FIELDS[h.pos].price)}.`;
    if (h.kind === 'debt') return `${who(h.pid)} ${you ? 'duguješ' : 'duguje'} ${km(h.amount)} (${esc(h.reason)}). ${you ? 'Prodaj kućice ili uzmi hipoteku, pa plati.' : 'Čeka se da plati.'}`;
    if (h.kind === 'choice') return `${who(h.pid)} ${you ? 'biraš' : 'bira'}: platiti ${km(h.amount)} ili jedan potez u Zenici.`;
    if (h.kind === 'duel') return `${who(h.pid)} ${you ? 'biraš' : 'bira'} suparnika za ćevap-duel.`;
  }
  if (st.trade) return `${who(st.trade.from)} ${st.trade.from === S.me ? 'čekaš odgovor na ponudu.' : `je ponudio trgovinu igraču ${st.trade.to === S.me ? 'tebi' : nameOf(st.trade.to)}.`}`;
  const t = st.turn, p = P(t.pid), you = t.pid === S.me;
  if (p.inJail && !t.rolled) return `${who(t.pid)} ${you ? 'si' : 'je'} u Zenici. ${you ? 'Plati, iskoristi vikendicu ili pokušaj s duplim kockicama.' : 'Bira kako izaći.'}`;
  if (t.canRoll) return `${who(t.pid)} ${you ? 'bacaš' : 'baca'} kockice.`;
  return `${who(t.pid)} ${you ? 'možeš graditi, trgovati ili završiti potez.' : 'završava potez.'}`;
}

function updateGame() {
  const st = S.state;
  if (!S.boardBuilt) return;
  $('#round').textContent = `${st.mode === 'fast' ? `Krug ${Math.min(st.round, RULES.fastRounds)} od ${RULES.fastRounds}` : `Krug ${st.round}`} · Kod babe ${km(st.pot || 0)}`;
  updateBoardMarks();
  // novo bacanje: kockice se protresu, figurica hoda polje po polje
  const newRoll = st.lastRoll && st.lastRoll.n > S.seen.roll;
  placeTokens(true);
  if (newRoll) S.seen.roll = st.lastRoll.n;
  $('#dice').innerHTML = st.lastRoll ? `${dieHTML(st.lastRoll.dice[0])}${dieHTML(st.lastRoll.dice[1])}<span class="dsum">${nameOf(st.lastRoll.pid)}: ${st.lastRoll.dice[0] + st.lastRoll.dice[1]}</span>` : '<span class="hint">Još niko nije bacao.</span>';
  if (newRoll) $('#dice').classList.remove('shake'), void $('#dice').offsetWidth, $('#dice').classList.add('shake');
  renderPlayers();
  $('#status').innerHTML = statusText();
  $('#log').innerHTML = st.log.slice(-9).reverse().map((l) => `<span>${esc(l.msg)}</span>`).join('');
  renderActions();
  // prikazi koji iskaču: kartica, duel, ponuda, kupnja, kraj
  if (st.lastCard && st.lastCard.n > S.seen.card) { S.seen.card = st.lastCard.n; setTimeout(() => showCard(st.lastCard), newRoll ? 700 : 0); return; }
  if (st.lastDuel && st.lastDuel.n > S.seen.duel) { S.seen.duel = st.lastDuel.n; showDuel(st.lastDuel); return; }
  maybeAutoModal();
}

function maybeAutoModal() {
  const st = S.state;
  if (modalRoot.firstChild && !modalRoot.firstChild.dataset.auto) return;
  if (st.phase === 'over') { showGameOver(); return; }
  const h = st.queue[0];
  const key = h ? `${h.kind}-${h.pid}-${h.pos ?? ''}-${st.v}` : '';
  if (h?.pid === S.me && h.kind === 'buy' && S.seen.buy !== `${h.pos}-${st.turn.since}-${st.lastRoll?.n}`) {
    S.seen.buy = `${h.pos}-${st.turn.since}-${st.lastRoll?.n}`;
    openField(h.pos, true); return;
  }
  if (st.trade && st.trade.to === S.me && st.trade.n !== S.seen.trade) { S.seen.trade = st.trade.n; openTradeOffer(); return; }
  // zatvori automatski otvoren prozor kad odluka nestane
  if (modalRoot.firstChild?.dataset.auto && !(h?.pid === S.me) && !(st.trade?.to === S.me)) closeModal();
  void key;
}

function renderPlayers() {
  const st = S.state;
  $('#players').innerHTML = st.players.map((p) => {
    const props = ownedBy(p.id).sort((a, b) => a - b);
    const away = !p.bankrupt && now() - (S.presence[p.id] || 0) > SKIP_MS;
    const tags = [p.id === S.me ? 'ti' : '', p.inJail ? 'Zenica' : '', p.skip ? 'propušta potez' : '', p.pardons.length ? `vikendica ×${p.pardons.length}` : '', away ? 'nije tu' : ''].filter(Boolean);
    return `<div class="pl${st.turn?.pid === p.id ? ' active' : ''}${p.bankrupt ? ' out' : ''}">
      <span class="mini-tok" style="--c:${p.color}">${figureSVG(p.figure)}</span>
      <span class="n" style="color:${p.color}">${esc(p.name)}</span>
      <span class="m">${p.bankrupt ? 'bankrot' : km(p.money)}</span>
      <span class="props">${props.map((i) => `<span title="${esc(FIELDS[i].name)}" style="background:${FIELDS[i].group ? GROUP_COLOR[FIELDS[i].group] : '#fff'}${st.owners[i].mortgaged ? ';opacity:.35' : ''}"></span>`).join('')}</span>
      ${tags.length ? `<span class="ptags">${tags.map(esc).join(' · ')}</span>` : ''}
    </div>`;
  }).join('');
}

function btn(label, onClick, cls = '', disabled = false) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = `btn ${cls}`; b.textContent = label; b.disabled = disabled || S.busy;
  b.addEventListener('click', onClick);
  return b;
}

function renderActions() {
  const box = $('#actions');
  if (!box || !S.state || S.state.phase === 'lobby') return;
  const st = S.state, h = st.queue[0], m = me(), t = st.turn;
  const out = [];
  if (st.phase === 'over') {
    out.push(btn('Rezultati', showGameOver, 'primary'));
    out.push(btn('Nova partija', () => { store.del(S.code); goHome(); }));
  } else if (!m || m.bankrupt) {
    out.push(btn('Gledaš partiju', () => {}, '', true));
  } else if (h && h.pid === S.me) {
    if (h.kind === 'buy') {
      const f = FIELDS[h.pos];
      out.push(btn(`Kupi za ${km(f.price)}`, () => send({ type: 'buy' }), 'primary', m.money < f.price));
      out.push(btn('Ne kupujem', () => send({ type: 'decline' })));
      if (m.money < f.price) out.push(btn('Moji posjedi', openMine));
    } else if (h.kind === 'choice') {
      out.push(btn(`Plati ${km(h.amount)}`, () => send({ type: 'choice', opt: 'pay' }), 'primary'));
      out.push(btn('Potez u Zenici', () => send({ type: 'choice', opt: 'jail' })));
    } else if (h.kind === 'duel') {
      st.players.filter((p) => !p.bankrupt && p.id !== S.me).forEach((p) => out.push(btn(`Duel: ${p.name}`, () => send({ type: 'duel', target: p.id }), 'primary')));
    } else if (h.kind === 'debt') {
      out.push(btn(`Plati dug ${km(h.amount)}`, () => send({ type: 'payDebt' }), 'primary', m.money < h.amount));
      out.push(btn('Moji posjedi', openMine));
      out.push(btn('Bankrot', confirmBankrupt, 'danger'));
    }
  } else if (st.trade?.to === S.me) {
    out.push(btn('Pogledaj ponudu', openTradeOffer, 'primary'));
  } else if (!h && t.pid === S.me) {
    if (m.inJail && !t.rolled) {
      out.push(btn(`Plati ${km(RULES.jailFine)} i izađi`, () => send({ type: 'jailPay' }), '', m.money < RULES.jailFine));
      if (m.pardons.length) out.push(btn('Iskoristi vikendicu', () => send({ type: 'jailPardon' })));
    }
    if (t.canRoll) out.push(btn(m.inJail && !t.rolled ? 'Baci za duple' : 'Baci kockice', () => send({ type: 'roll' }), 'primary'));
    else out.push(btn('Završi potez', () => send({ type: 'endTurn' }), 'primary'));
    if (st.trade?.from === S.me) out.push(btn('Povuci ponudu', () => send({ type: 'tradeCancel' })));
    else out.push(btn('Trguj', openTrade));
    out.push(btn('Moji posjedi', openMine));
  } else {
    const waitFor = h ? h.pid : t.pid;
    const gone = now() - lastSeen(waitFor);
    out.push(btn('Moji posjedi', openMine));
    if (gone > KICK_MS) out.push(btn(`Izbaci: ${P(waitFor).name}`, () => send({ type: 'kick' }), 'danger'));
    else if (gone > SKIP_MS && h?.kind !== 'debt') out.push(btn(`Preskoči: ${P(waitFor).name}`, () => send({ type: 'skipAbsent' })));
    const wait = document.createElement('span');
    wait.className = 'waiting';
    wait.textContent = `Čeka se: ${P(waitFor).name}`;
    out.unshift(wait);
  }
  box.replaceChildren(...out);
}

// ---------- prozori ----------
function openModal(html, { auto = false, cls = '' } = {}) {
  modalRoot.innerHTML = `<div class="modal ${cls}" ${auto ? 'data-auto="1"' : ''} role="dialog" aria-modal="true"><div class="modal-box">${html}</div></div>`;
  const m = modalRoot.firstChild;
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(); });
  m.querySelector('button')?.focus({ preventScroll: true });
  return m;
}
function closeModal() { modalRoot.innerHTML = ''; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function manageButtons(i) {
  const st = S.state, o = st.owners[i], f = FIELDS[i];
  if (!o || o.owner !== S.me || st.phase !== 'play') return '';
  const can = canManage(), free = can && !st.queue.length, b = [];
  if (f.group) {
    const g = groupOf(f.group), full = g.every((k) => st.owners[k]?.owner === S.me);
    if (full && o.level < 5 && free) b.push(`<button class="btn" data-a="build" data-pos="${i}" type="button">${o.level === 4 ? 'Gradi hotel' : 'Gradi kućicu'} (${km(HOUSE_COST[f.group])})</button>`);
    if (o.level > 0 && can) b.push(`<button class="btn" data-a="sell" data-pos="${i}" type="button">Prodaj nadogradnju (+${km(HOUSE_COST[f.group] / 2)})</button>`);
    if (!o.mortgaged && can && !g.some((k) => level(k) > 0)) b.push(`<button class="btn" data-a="mortgage" data-pos="${i}" type="button">Hipoteka (+${km(f.price / 2)})</button>`);
  } else if (!o.mortgaged && can) b.push(`<button class="btn" data-a="mortgage" data-pos="${i}" type="button">Hipoteka (+${km(f.price / 2)})</button>`);
  if (o.mortgaged && free) b.push(`<button class="btn" data-a="unmortgage" data-pos="${i}" type="button">Otkupi (${km(Math.ceil(Math.round(f.price * RULES.unmortgageRate * 100) / 100))})</button>`);
  if (!b.length) return `<p class="hint">${can ? '' : 'Gradnja, hipoteka i otkup su mogući na tvom potezu.'}</p>`;
  return `<div class="manage">${b.join('')}</div>`;
}
function bindManage(root, after) {
  root.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', async () => {
    await send({ type: b.dataset.a, pos: Number(b.dataset.pos) });
    after();
  }));
}

function openField(i, auto = false) {
  const st = S.state, o = st?.owners[i], f = FIELDS[i];
  const h = st?.queue[0];
  const buying = h?.kind === 'buy' && h.pid === S.me && h.pos === i;
  const lv = o?.level ?? 0;
  const owner = o ? `<p class="own">Vlasnik: <b style="color:${P(o.owner).color}">${nameOf(o.owner)}</b>${lv ? `, ${lv === 5 ? 'hotel' : `${lv} ${lv === 1 ? 'kućica' : 'kućice'}`}` : ''}${o.mortgaged ? ', pod hipotekom' : ''}</p>` : (f.price ? '<p class="own">Slobodno za kupnju.</p>' : '');
  const buy = buying ? `<div class="manage"><button class="btn primary" id="m-buy" type="button" ${me().money < f.price ? 'disabled' : ''}>Kupi za ${km(f.price)}</button><button class="btn" id="m-dec" type="button">Ne kupujem</button></div>${me().money < f.price ? '<p class="hint">Nemaš dovoljno gotovine. Možeš uzeti hipoteku na drugi posjed.</p>' : ''}` : '';
  const m = openModal(`${deedHTML(i)}${owner}${buy}${st ? manageButtons(i) : ''}<button class="btn" data-close type="button">Zatvori</button>`, { auto, cls: 'field' });
  m.querySelector('#m-buy')?.addEventListener('click', async () => { closeModal(); await send({ type: 'buy' }); });
  m.querySelector('#m-dec')?.addEventListener('click', async () => { closeModal(); await send({ type: 'decline' }); });
  bindManage(m, () => openField(i));
}

function openMine() {
  const st = S.state;
  const mine = ownedBy(S.me).sort((a, b) => a - b);
  const rows = mine.map((i) => {
    const o = st.owners[i], f = FIELDS[i];
    return `<div class="mine-row"><button class="mine-name" data-open="${i}" type="button"><span class="sw" style="background:${f.group ? GROUP_COLOR[f.group] : '#fff'}"></span>${esc(f.name)}<small>${o.level ? (o.level === 5 ? 'hotel' : `${o.level} kuć.`) : ''}${o.mortgaged ? ' hipoteka' : ''}</small></button>${manageButtons(i)}</div>`;
  }).join('');
  const m = openModal(`<h2>Moji posjedi</h2>${rows || '<p>Još nemaš posjeda.</p>'}<button class="btn" data-close type="button">Zatvori</button>`, { cls: 'list' });
  m.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openField(Number(b.dataset.open))));
  bindManage(m, openMine);
}

function showCard(c) {
  const st = S.state;
  const h = st.queue[0];
  const mine = c.pid === S.me;
  const choice = mine && h?.kind === 'choice' && h.pid === S.me;
  const m = openModal(`<p class="card-who">${mine ? 'Izvukao si' : `${nameOf(c.pid)} izvlači`}:</p>
    <div class="flip-stage"><div class="flip ${c.deck}">${cardHTML(c.deck, c.idx)}${backHTML(c.deck)}</div></div>
    <div class="manage">${choice ? `<button class="btn primary" id="c-pay" type="button">Plati ${km(h.amount)}</button><button class="btn" id="c-jail" type="button">Potez u Zenici</button>` : '<button class="btn primary" data-close type="button">U redu</button>'}</div>`, { cls: 'cardm' });
  m.querySelector('#c-pay')?.addEventListener('click', async () => { closeModal(); await send({ type: 'choice', opt: 'pay' }); });
  m.querySelector('#c-jail')?.addEventListener('click', async () => { closeModal(); await send({ type: 'choice', opt: 'jail' }); });
  if (!choice) {
    const close = () => { if (modalRoot.firstChild === m) { closeModal(); maybeAutoModal(); } };
    m.querySelector('[data-close]').addEventListener('click', () => setTimeout(maybeAutoModal, 0));
    if (!mine) setTimeout(close, 6500);
  }
}

function showDuel(d) {
  const amt = km(d.amount ?? 50);
  const row = `<div class="duel-row"><span>${nameOf(d.a)} (Hari)</span><b>:</b><span>${nameOf(d.b)} (Željo)</span></div>`;
  const why = d.zeljo ? 'Danas sudac bio iz Sarajeva.' : 'Pa naravno, Travnički su najbolji.';
  openModal(`<h2>Hari ili Željo?</h2>${row}<p class="hint">${why}</p><p class="duel-win">${nameOf(d.winner)} dobiva ${amt}.</p><button class="btn primary" data-close type="button">U redu</button>`, { cls: 'duel' });
}

function sideEditor(prefix, pid, title) {
  const st = S.state, p = P(pid);
  const props = ownedBy(pid).filter((i) => !FIELDS[i].group || !groupOf(FIELDS[i].group).some((k) => level(k) > 0)).sort((a, b) => a - b);
  return `<fieldset class="tside"><legend>${title}</legend>
    <label class="fld">Novac (KM)<input type="number" inputmode="numeric" min="0" max="${p.money}" step="10" id="${prefix}-money" value="0"></label>
    <div class="tprops">${props.map((i) => `<label class="tprop"><input type="checkbox" value="${i}" name="${prefix}-p"><span class="sw" style="background:${FIELDS[i].group ? GROUP_COLOR[FIELDS[i].group] : '#fff'}"></span>${esc(FIELDS[i].name)}${st.owners[i].mortgaged ? ' (hipoteka)' : ''}</label>`).join('') || '<span class="hint">Nema posjeda za trgovinu.</span>'}</div>
    ${p.pardons.length ? `<label class="tprop"><input type="checkbox" id="${prefix}-pardon">Vikendica</label>` : ''}
  </fieldset>`;
}
function readSide(root, prefix) {
  return {
    money: Number(root.querySelector(`#${prefix}-money`)?.value || 0),
    props: [...root.querySelectorAll(`input[name=${prefix}-p]:checked`)].map((x) => Number(x.value)),
    pardons: root.querySelector(`#${prefix}-pardon`)?.checked ? 1 : 0,
  };
}
function openTrade(toId) {
  const others = S.state.players.filter((p) => !p.bankrupt && p.id !== S.me);
  if (!others.length) return;
  const to = typeof toId === 'string' ? toId : others[0].id;
  const m = openModal(`<h2>Trgovina</h2>
    <label class="fld">S kim<select id="t-to">${others.map((p) => `<option value="${p.id}" ${p.id === to ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    <div class="tgrid">${sideEditor('g', S.me, 'Ti daješ')}${sideEditor('w', to, `Tražiš od: ${nameOf(to)}`)}</div>
    <p class="hint">Posjed pod hipotekom prelazi s hipotekom. Grupa s kućicama se ne može mijenjati dok se kućice ne prodaju.</p>
    <div class="manage"><button class="btn primary" id="t-send" type="button">Pošalji ponudu</button><button class="btn" data-close type="button">Odustani</button></div>`, { cls: 'trade' });
  m.querySelector('#t-to').addEventListener('change', (e) => openTrade(e.target.value));
  m.querySelector('#t-send').addEventListener('click', async () => {
    const give = readSide(m, 'g'), get = readSide(m, 'w');
    closeModal();
    await send({ type: 'tradePropose', to, give, get });
  });
}
function tradeList(side) {
  const parts = [];
  if (side.money) parts.push(km(side.money));
  side.props.forEach((i) => parts.push(`<span class="sw" style="background:${FIELDS[i].group ? GROUP_COLOR[FIELDS[i].group] : '#fff'}"></span>${esc(FIELDS[i].name)}${S.state.owners[i]?.mortgaged ? ' (hipoteka)' : ''}`));
  if (side.pardons) parts.push('Vikendica');
  return parts.length ? `<ul>${parts.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p class="hint">Ništa</p>';
}
function openTradeOffer() {
  const t = S.state.trade;
  if (!t) return;
  const m = openModal(`<h2>Ponuda od: ${nameOf(t.from)}</h2>
    <div class="tgrid"><div><h3>Dobivaš</h3>${tradeList(t.give)}</div><div><h3>Daješ</h3>${tradeList(t.get)}</div></div>
    <div class="manage"><button class="btn primary" id="t-yes" type="button">Prihvati</button><button class="btn" id="t-no" type="button">Odbij</button></div>`, { auto: true, cls: 'trade' });
  m.querySelector('#t-yes').addEventListener('click', async () => { closeModal(); await send({ type: 'tradeAccept' }); });
  m.querySelector('#t-no').addEventListener('click', async () => { closeModal(); await send({ type: 'tradeReject' }); });
}

function confirmBankrupt() {
  const m = openModal(`<h2>Proglasiti bankrot?</h2><p>Sva imovina ide ${S.state.queue[0]?.to ? `igraču ${nameOf(S.state.queue[0].to)}` : 'banci'} i ispadaš iz igre. Ovo se ne može vratiti.</p>
    <div class="manage"><button class="btn danger" id="b-yes" type="button">Da, bankrot</button><button class="btn" data-close type="button">Ne</button></div>`);
  m.querySelector('#b-yes').addEventListener('click', async () => { closeModal(); await send({ type: 'bankrupt' }); });
}
function openLeave() {
  const playing = S.state?.phase === 'play' && me() && !me().bankrupt;
  const m = openModal(`<h2>Izaći?</h2><p>${playing ? 'Ako napustiš partiju, tvoja imovina se vraća banci i ispadaš iz igre.' : 'Možeš se vratiti preko istog linka.'}</p>
    <div class="manage">${playing ? '<button class="btn danger" id="l-quit" type="button">Napusti partiju</button>' : ''}<button class="btn" id="l-home" type="button">${playing ? 'Samo zatvori, vraćam se' : 'Na početnu'}</button><button class="btn" data-close type="button">Ostani</button></div>`);
  m.querySelector('#l-quit')?.addEventListener('click', async () => { closeModal(); await send({ type: 'leave' }); store.del(S.code); goHome(); });
  m.querySelector('#l-home').addEventListener('click', () => goHome());
}

function showGameOver() {
  const st = S.state;
  const rows = (st.ranking || []).map((r, k) => `<tr><td>${k + 1}.</td><td style="color:${P(r.id).color}">${nameOf(r.id)}</td><td>${km(r.worth)}</td></tr>`).join('');
  openModal(`<h2>Kraj partije</h2><p class="winner">Pobjednik: <b>${nameOf(st.winner)}</b></p>
    <table class="rank"><thead><tr><th></th><th>Igrač</th><th>Imovina</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="hint">Imovina = gotovina + cijena posjeda (pod hipotekom pola) + cijena nadogradnji.</p>
    <button class="btn" data-close type="button">Zatvori</button>`, { cls: 'over' });
}

function openRules() {
  openModal(`<h2>Pravila igre</h2><div class="rules">
  <h3>Početak</h3><p>Svako dobiva ${km(RULES.startMoney)}. Svaki prolazak preko Starta donosi ${km(RULES.passStart)}, a ko stane baš na Start dobiva duplo, ${km(RULES.passStart * 2)}. Redoslijed igrača se bira nasumično.</p>
  <h3>Potez</h3><p>Bacaš dvije kockice i ideš naprijed. Duple kockice daju novo bacanje. Tri duple zaredom vode ravno u KP dom Zenica.</p>
  <h3>Kupnja i kirija</h3><p>Slobodan posjed možeš kupiti po cijeni na polju. Ako ga ne kupiš, ostaje banci (u ovoj verziji <b>nema aukcije</b>). Kad staneš na tuđi posjed, plaćaš kiriju sa vlasničkog lista. Ko ima cijelu grupu boja, na praznim posjedima naplaćuje duplu kiriju. Stanice: 25, 50, 100 ili 200 KM prema broju stanica vlasnika. Režije: 4 puta zbir kockica, a s obje režije 10 puta.</p>
  <h3>Gradnja</h3><p>Graditi možeš na svom potezu kad imaš cijelu grupu i nijedan posjed u njoj nije pod hipotekom. Gradi se ravnomjerno: najviše jedna kućica razlike unutar grupe. Nakon četiri kućice dolazi hotel. Nadogradnje se prodaju banci za pola cijene, također ravnomjerno. <b>Broj kućica nije ograničen.</b></p>
  <h3>Hipoteka</h3><p>Hipoteka donosi 50 % kupovne cijene, a otkup košta 55 %. Na posjedu pod hipotekom nema kirije. Prije hipoteke treba prodati kućice u toj grupi.</p>
  <h3>Dug i bankrot</h3><p>Kad nemaš dovoljno gotovine za plaćanje, nastaje dug. Prodaj nadogradnje ili uzmi hipoteku pa plati. Ako ne možeš, proglašavaš bankrot. Ako duguješ igraču, on dobiva svu tvoju imovinu (posjede pod hipotekom preuzima takve, bez dodatne kamate). Ako duguješ banci, posjedi se vraćaju banci.</p>
  <h3>Trgovanje</h3><p>Na svom potezu možeš ponuditi novac, posjede i vikendicu drugom igraču. Ponuda vrijedi tek kad je drugi igrač sam prihvati. Grupe s kućicama se ne mijenjaju.</p>
  <h3>KP dom Zenica</h3><p>Izlaz: duple kockice, vikendica ili ${km(RULES.jailFine)} prije bacanja. Nakon trećeg neuspjelog pokušaja plaćaš ${km(RULES.jailFine)} i ideš za bačeni broj. Odlazak u zatvor nikad ne naplaćuje Start.</p>
  <h3>Kratki zatvor</h3><p>Kod kartica „Javio se Crni” i „Među nama” biraš: platiti ili jedan potez u Zenici. Jedan potez znači da ideš na polje KP dom Zenica, propuštaš svoj sljedeći potez i onda normalno nastavljaš.</p>
  <h3>Kod babe</h3><p>Sve što se plaća banci (porezi, kartice, kazne i izlazak iz Zenice) ide baki u bubanj. Ko stane na polje Kod babe, pokupi cijeli bubanj. Koliko je unutra piše gore pored kruga.</p>
  <h3>Kartice</h3><p>Dobici idu iz banke, a plaćanja baki u bubanj, osim kad kartica kaže drugačije. „Bosna ulazi u EU” vodi na sljedeću stanicu naprijed, uz platu ako prođeš Start. Kartice koje vraćaju unazad ne plaćaju Start. „Majstor”: 40 KM po nadogradnji (hotel se broji kao pet). „Ko časti?”: 10 KM svakom drugom igraču u igri. „Hari ili Željo?”: biraš suparnika, ti si za Harija, on za Želju. Hari uvijek dobija, osim svakog trećeg kruga. Pobjednik nosi 50 KM. „Vikendica” čuvaš dok ti ne zatreba za izlazak iz Zenice.</p>
  <h3>Kraj partije</h3><p><b>Brza:</b> nakon ${RULES.fastRounds} punih krugova oko stola pobjeđuje najveća imovina (gotovina, posjedi po kupovnoj cijeni ili pola ako su pod hipotekom, i nadogradnje po cijeni gradnje). <b>Klasična:</b> pobjeđuje zadnji igrač koji nije bankrotirao.</p>
  <h3>Ako neko ode</h3><p>Ako igrač na kojeg se čeka nije aktivan 1 minutu, drugi ga mogu preskočiti (ne kupuje, a kod kartica s izborom plaća). Nakon 2 minute ga mogu izbaciti, a njegova imovina ide banci ili vjerovniku. Ko osvježi stranicu ili izgubi vezu, vraća se preko istog linka na istom uređaju.</p>
  <h3>Napomena</h3><p>Sav novac je igraći. Satirične kartice su izmišljene situacije, a ne vijesti ni izjave stvarnih osoba.</p>
  </div><button class="btn" data-close type="button">Zatvori</button>`, { cls: 'rulesm' });
}

// ---------- start ----------
(function boot() {
  const inv = (new URLSearchParams(location.search).get('soba') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (inv && store.get(inv)) resume(inv);
  else render();
}());
void CHANCE; void SURPRISE;
