// Pravila igre. Radi samo na serveru: svako bacanje i svaki potez prolaze kroz applyAction.
import {
  FIELDS, RULES, HOUSE_COST, STATIONS, CHANCE, SURPRISE, FIGURES, PLAYER_COLORS, groupOf, CARS, carById, VILLAGES,
} from '../../../public/shared/data.js';

export class GameError extends Error {
  constructor(msg, status = 400) { super(msg); this.status = status; }
}
const fail = (msg) => { throw new GameError(msg); };

export const ABSENT_SKIP_MS = 60_000;
export const ABSENT_KICK_MS = 120_000;

const km = (n) => `${n.toLocaleString('de-DE')} KM`;

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- soba ----------

export function cleanName(name) {
  const s = String(name ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
  if (!s) fail('Upiši nadimak.');
  return s;
}

export function newRoom(code, rng, now) {
  return {
    code, v: 0, phase: 'lobby', createdAt: now, mode: 'fast', round: 1,
    hostId: null, players: [], owners: {}, queue: [], turn: null, trade: null,
    decks: { chance: shuffle([...CHANCE.keys()], rng), surprise: shuffle([...SURPRISE.keys()], rng) },
    pot: 0, mayor: null, lastRoll: null, lastCard: null, lastDuel: null, winner: null, log: [], seq: 0, seen: [],
  };
}

export function addPlayer(s, id, name, figure) {
  if (s.phase !== 'lobby') fail('Partija je već počela.');
  if (s.players.length >= RULES.maxPlayers) fail('Soba je puna.');
  name = cleanName(name);
  if (s.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) fail('Taj nadimak je zauzet.');
  const taken = new Set(s.players.map((p) => p.figure));
  if (!FIGURES.some((f) => f.id === figure) || taken.has(figure)) figure = FIGURES.find((f) => !taken.has(f.id)).id;
  const color = PLAYER_COLORS.find((c) => !s.players.some((p) => p.color === c));
  const p = { id, name, figure, color, money: RULES.startMoney, pos: 0, inJail: false, jailTries: 0, skip: 0, pardons: [], bankrupt: false, car: null };
  s.players.push(p);
  if (!s.hostId) s.hostId = id;
  log(s, `${name} je ušao u sobu.`);
  return p;
}

// ---------- pomoćne ----------

function log(s, msg) {
  s.log.push({ n: ++s.seq, msg });
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60);
}
const P = (s, id) => s.players.find((p) => p.id === id);
const active = (s) => s.players.filter((p) => !p.bankrupt);
const own = (s, pos) => s.owners[pos];
const level = (s, pos) => s.owners[pos]?.level ?? 0;

export function ownsGroup(s, pid, g) {
  return groupOf(g).every((i) => s.owners[i]?.owner === pid);
}

export function rentFor(s, pos, diceSum) {
  const f = FIELDS[pos], o = s.owners[pos];
  if (!o || o.mortgaged) return 0;
  if (f.kind === 'prop') {
    if (o.level > 0) return f.rent[o.level];
    return ownsGroup(s, o.owner, f.group) ? f.rent[0] * 2 : f.rent[0];
  }
  if (f.kind === 'station') {
    const n = STATIONS.filter((i) => s.owners[i]?.owner === o.owner).length;
    return RULES.stationRent[n];
  }
  if (f.kind === 'utility') {
    const n = [12, 28].filter((i) => s.owners[i]?.owner === o.owner).length;
    return RULES.utilityMult[n] * diceSum;
  }
  return 0;
}

export function netWorth(s, pid) {
  const p = P(s, pid);
  let w = p.money;
  for (const [pos, o] of Object.entries(s.owners)) {
    if (o.owner !== pid) continue;
    const f = FIELDS[pos];
    w += o.mortgaged ? f.price * RULES.mortgageRate : f.price;
    if (f.group) w += o.level * HOUSE_COST[f.group];
  }
  if (p.car) w += carById(p.car).price;
  return Math.floor(w);
}

// Plaćanje: ako igrač nema dovoljno gotovine, nastaje dug koji mora riješiti prodajom ili hipotekom.
function pay(s, from, toId, amount, reason) {
  if (amount <= 0) return;
  if (from.money >= amount) {
    from.money -= amount;
    if (toId) P(s, toId).money += amount;
    else toPot(s, amount);
    return;
  }
  s.queue.push({ kind: 'debt', pid: from.id, amount, to: toId, reason });
  log(s, `${from.name} duguje ${km(amount)} (${reason}) i nema dovoljno gotovine.`);
}

// Sve što se plaća banci (porezi, kartice, kazne) ide baki u bubanj. Ko stane Kod babe, pokupi sve.
function toPot(s, amount) { s.pot = (s.pot || 0) + amount; }

// Auta mijenjaju kiriju: Golf i Passat na stanicama, Traktor po selima, Mercedes vlasniku donosi više.
const VILLAGE_POS = VILLAGES.map((n) => FIELDS.findIndex((f) => f.name === n));
function carRent(s, p, pos, rent) {
  const f = FIELDS[pos], o = s.owners[pos];
  let r = rent, why = '';
  if (f.kind === 'station' && p.car === 'golf') { r = Math.floor(r / 2); why = 'Golf dvojka: pola na stanici'; }
  if (f.kind === 'station' && p.car === 'passat') { r = 0; why = 'Passat karavan: stanica džaba'; }
  if (VILLAGE_POS.includes(pos) && p.car === 'traktor') {
    if (o.level === 0) { r = 0; why = 'Traktor: po selu džaba'; } else { r = Math.floor(r / 2); why = 'Traktor: pola po selu'; }
  }
  if (r > 0 && P(s, o.owner).car === 'mercedes') { r += RULES.mercedesBonus; why = why ? `${why}, Mercedes +${RULES.mercedesBonus}` : `vlasnikov Mercedes +${RULES.mercedesBonus}`; }
  return [r, why];
}

const mayorOn = (s) => s.players.length >= RULES.mayorMinPlayers;
const mayorOf = (s) => (s.mayor && !P(s, s.mayor)?.bankrupt ? s.mayor : null);

// Mito: umjesto Zenice, ako nisi načelnik. Načelnik dobija mito, a bez načelnika ide u bubanj.
function goToJail(s, p) {
  if (mayorOf(s) === p.id) { jailNow(s, p); return; }
  if (s.turn?.pid === p.id) { s.turn.canRoll = false; s.turn.pendingMove = 0; }
  s.queue.push({ kind: 'bribe', pid: p.id, amount: RULES.bribe, to: mayorOf(s) });
  log(s, `${p.name} treba ići u Zenicu. Može pokušat podmitit${mayorOf(s) ? ` načelnika ${P(s, mayorOf(s)).name}` : ''}.`);
}

function jailNow(s, p) {
  p.pos = RULES.jailPos; p.inJail = true; p.jailTries = 0;
  if (s.turn?.pid === p.id) { s.turn.canRoll = false; s.turn.pendingMove = 0; }
  log(s, `${p.name} ide u KP dom Zenica.`);
}

const NOVA_BILA = FIELDS.findIndex((f) => f.name === 'Nova Bila');
const stealTargets = (s, p) => active(s).filter((q) => q.id !== p.id && q.id !== mayorOf(s));

function passStart(s, p, exact) {
  const salary = exact ? RULES.passStart * 2 : RULES.passStart;
  const nb = s.owners[NOVA_BILA];
  if (nb && nb.owner === p.id && !nb.mortgaged && stealTargets(s, p).length) {
    s.queue.push({ kind: 'steal', pid: p.id, salary });
    log(s, `${p.name} je vlasnik Nove Bile: bira platu ili krađu.`);
  } else {
    p.money += salary;
    log(s, exact ? `${p.name} stao baš na Start: dupla plata ${km(salary)}.` : `${p.name} prošao Start: legla plata ${km(salary)}.`);
  }
  if (p.car === 'mercedes') { log(s, `${p.name} vozi Mercedes na servis.`); pay(s, p, null, RULES.mercedesService, 'servis Mercedesa'); }
  const m = mayorOf(s);
  if (m && m !== p.id) { log(s, `${p.name} plaća članarinu načelniku.`); pay(s, p, m, RULES.mayorFee, 'članarina načelniku'); }
}

function moveBy(s, p, steps, diceSum) {
  const np = (p.pos + steps) % 40;
  if (p.pos + steps >= 40) passStart(s, p, np === 0);
  p.pos = np;
  land(s, p, diceSum);
}

function land(s, p, diceSum) {
  const f = FIELDS[p.pos];
  switch (f.kind) {
    case 'prop': case 'station': case 'utility': {
      const o = own(s, p.pos);
      const carLot = f.kind === 'station' ? () => s.queue.push({ kind: 'car', pid: p.id }) : () => {};
      if (!o) { s.queue.push({ kind: 'buy', pid: p.id, pos: p.pos }); carLot(); return; }
      if (o.owner === p.id) { carLot(); return; }
      if (o.mortgaged) { log(s, `${f.name} je pod hipotekom, nema kirije.`); carLot(); return; }
      const [rent, why] = carRent(s, p, p.pos, rentFor(s, p.pos, diceSum));
      const owner = P(s, o.owner);
      log(s, `${p.name} plaća ${km(rent)} kirije igraču ${owner.name} za ${f.name}${why ? ` (${why})` : ''}.`);
      pay(s, p, o.owner, rent, `kirija za ${f.name}`);
      if (f.kind === 'station') s.queue.push({ kind: 'car', pid: p.id });
      return;
    }
    case 'tax':
      log(s, `${p.name} plaća ${f.name.toLowerCase()} ${km(f.amount)}.`);
      pay(s, p, null, f.amount, f.name.toLowerCase());
      return;
    case 'chance': drawCard(s, p, 'chance', diceSum); return;
    case 'surprise': drawCard(s, p, 'surprise', diceSum); return;
    case 'gotojail': goToJail(s, p); return;
    case 'bet': {
      // Kladionica: ko stane zamisli broj od 1 do 5, ostali pogađaju. Kompjuter ništa ne baca.
      if (active(s).length < 2) return;
      s.queue.push({ kind: 'betSet', pid: p.id });
      log(s, `${p.name} je u kladionici.`);
      return;
    }
    case 'free': {
      const pot = s.pot || 0;
      if (pot > 0) { p.money += pot; s.pot = 0; log(s, `${p.name} je Kod babe i kupi bubanj: ${km(pot)}.`); }
      else log(s, `${p.name} je Kod babe, ali bubanj je prazan.`);
      return;
    }
    default: return;
  }
}

function drawCard(s, p, deck, diceSum) {
  const list = deck === 'chance' ? CHANCE : SURPRISE;
  const idx = s.decks[deck].shift();
  const c = list[idx];
  if (c.effect === 'free') p.pardons.push({ deck, idx });
  else s.decks[deck].push(idx);
  s.lastCard = { n: s.seq + 1, deck, idx, pid: p.id };
  log(s, `${p.name} izvukao ${deck === 'chance' ? 'Šansu' : 'Iznenađenje'}: ${c.title}.`);
  switch (c.effect) {
    case 'cash':
      if (c.value > 0) p.money += c.value; else pay(s, p, null, -c.value, c.title);
      break;
    case 'again':
      if (s.turn.pid === p.id && !s.turn.againUsed) { s.turn.againUsed = true; s.turn.canRoll = true; }
      else log(s, 'Novo bacanje se može dobiti samo jednom po potezu.');
      break;
    case 'station': {
      const target = STATIONS.find((i) => i > p.pos) ?? STATIONS[0];
      moveBy(s, p, (target - p.pos + 40) % 40, diceSum);
      break;
    }
    case 'back':
      p.pos = (p.pos - c.value + 40) % 40;
      log(s, `${p.name} se vraća na ${FIELDS[p.pos].name}.`);
      land(s, p, diceSum);
      break;
    case 'choice':
      s.queue.push({ kind: 'choice', pid: p.id, amount: c.value, title: c.title });
      break;
    case 'repairs': {
      let lv = 0;
      for (const o of Object.values(s.owners)) if (o.owner === p.id) lv += o.level;
      const amt = lv * RULES.repairPerLevel;
      log(s, lv ? `${p.name} ima ${lv} nadogradnji i plaća ${km(amt)}.` : `${p.name} nema nadogradnji, ništa ne plaća.`);
      pay(s, p, null, amt, c.title);
      break;
    }
    case 'free': break;
    case 'jail': goToJail(s, p); break;
    case 'car':
      if (p.car) { p.money += c.value; log(s, `${p.name} već ima auto, pa prima ${km(c.value)}.`); }
      else { p.car = 'golf'; log(s, `${p.name} dobija Golfa dvojku.`); }
      break;
    case 'mayor': {
      const m = mayorOf(s);
      pay(s, p, m && m !== p.id ? m : null, c.value, c.title);
      break;
    }
    case 'everyone':
      for (const q of active(s)) if (q.id !== p.id) pay(s, p, q.id, c.value, c.title);
      break;
    case 'duel':
      if (active(s).length > 1) s.queue.push({ kind: 'duel', pid: p.id, amount: c.value });
      break;
    default: break;
  }
}

// ---------- tok poteza ----------

function startTurn(s, p) {
  s.turn = { pid: p.id, canRoll: true, rolled: false, doubles: 0, againUsed: false, pendingMove: 0, since: Date.now() };
}

function nextTurn(s) {
  const order = s.players;
  let i = order.findIndex((p) => p.id === s.turn.pid);
  for (let guard = 0; guard < order.length * 3; guard++) {
    const prev = i;
    i = (i + 1) % order.length;
    if (i <= prev) {
      s.round += 1;
      if (s.mode === 'fast' && s.round > RULES.fastRounds) return endGame(s, `Odigrano je ${RULES.fastRounds} krugova.`);
      elections(s);
    }
    const p = order[i];
    if (p.bankrupt) continue;
    if (p.skip > 0) { p.skip -= 1; log(s, `${p.name} propušta potez u Zenici.`); continue; }
    startTurn(s, p);
    log(s, `Na potezu je ${p.name}.`);
    return;
  }
}

function elections(s) {
  if (!mayorOn(s)) return;
  const every = s.mode === 'fast' ? RULES.mayorEveryFast : RULES.mayorEveryClassic;
  if (s.round <= 1 || (s.round - 1) % every !== 0) return;
  const ranked = active(s).map((q) => ({ id: q.id, w: netWorth(s, q.id) })).sort((a, b) => b.w - a.w);
  if (!ranked.length) return;
  const prev = s.mayor;
  s.mayor = ranked[0].id;
  log(s, `Izbori! Novi načelnik je ${P(s, s.mayor).name}${prev === s.mayor ? ' (opet)' : ''}.`);
}

function resolveBet(s) {
  const b = s.bet;
  if (!b || s.queue.some((q) => q.kind === 'betGuess')) return;
  const num = s.hidden?.betNum;
  const host = P(s, b.pid);
  const results = [];
  for (const [gid, g] of Object.entries(b.guesses)) {
    const q = P(s, gid);
    if (!q || q.bankrupt || g == null) continue;
    if (g === num) { results.push({ id: gid, g, win: true }); pay(s, host, gid, RULES.betWin, 'kladionica'); }
    else { results.push({ id: gid, g, win: false }); pay(s, q, host.id, RULES.betStake, 'kladionica'); }
  }
  s.lastBet = { n: s.seq + 1, pid: b.pid, num, results };
  log(s, `Kladionica: ${host.name} zamislio ${num}. ${results.map((r) => `${P(s, r.id).name} rekao ${r.g}${r.win ? ' i pogodio' : ''}`).join(', ') || 'Niko nije igrao'}.`);
  s.bet = null;
  if (s.hidden) delete s.hidden.betNum;
}

function endGame(s, why) {
  s.phase = 'over';
  const ranked = active(s).map((p) => ({ id: p.id, worth: netWorth(s, p.id) })).sort((a, b) => b.worth - a.worth);
  s.winner = ranked[0]?.id ?? null;
  s.ranking = ranked;
  s.queue = []; s.trade = null;
  log(s, `Kraj partije. ${why} Pobjednik: ${P(s, s.winner)?.name}.`);
}

// Nakon svake radnje: ako nema otvorenih odluka, nastavi odgođeno kretanje.
function settle(s) {
  if (s.phase !== 'play') return;
  if (active(s).length <= 1) { endGame(s, 'Ostao je samo jedan solventan igrač.'); return; }
  const t = s.turn;
  const p = P(s, t.pid);
  if (p.bankrupt) { nextTurn(s); return; }
  if (!s.queue.length && t.pendingMove) {
    const steps = t.pendingMove; t.pendingMove = 0;
    moveBy(s, p, steps, steps);
    settle(s);
  }
}

function bankrupt(s, p, toId) {
  const creditor = toId ? P(s, toId) : null;
  for (const [pos, o] of Object.entries(s.owners)) {
    if (o.owner !== p.id) continue;
    const f = FIELDS[pos];
    if (o.level) { p.money += Math.floor(o.level * HOUSE_COST[f.group] / 2); o.level = 0; }
    if (creditor && !creditor.bankrupt) o.owner = creditor.id;
    else delete s.owners[pos];
  }
  if (creditor && !creditor.bankrupt) {
    creditor.money += Math.max(0, p.money);
    creditor.pardons.push(...p.pardons);
    log(s, `${p.name} je bankrotirao. Sva imovina prelazi igraču ${creditor.name}.`);
  } else {
    for (const c of p.pardons) s.decks[c.deck].push(c.idx);
    log(s, `${p.name} je bankrotirao. Imovina se vraća banci.`);
  }
  p.pardons = []; p.money = 0; p.bankrupt = true; p.inJail = false; p.car = null;
  if (s.mayor === p.id) s.mayor = null;
  s.queue = s.queue.filter((q) => q.pid !== p.id);
  if (s.bet) { if (s.bet.pid === p.id) { s.bet = null; s.queue = s.queue.filter((q) => q.kind !== 'betGuess'); } else { delete s.bet.guesses[p.id]; resolveBet(s); } }
  for (const q of s.queue) if (q.kind === 'debt' && q.to === p.id) q.to = null;
  if (s.trade && (s.trade.from === p.id || s.trade.to === p.id)) s.trade = null;
  if (s.phase === 'play' && s.turn?.pid === p.id && active(s).length > 1) nextTurn(s);
}

// ---------- radnje ----------

function needTurn(s, p) {
  if (s.phase !== 'play') fail('Partija nije u toku.');
  if (s.turn.pid !== p.id) fail('Nisi na potezu.');
}
function needHead(s, p, kind) {
  const h = s.queue[0];
  if (!h || h.pid !== p.id || h.kind !== kind) fail('Ta odluka sada nije tvoja.');
  return h;
}
function needFree(s) { if (s.queue.length) fail('Prvo treba riješiti otvorenu odluku.'); }

function checkProp(s, p, pos) {
  pos = Number(pos);
  const o = s.owners[pos];
  if (!Number.isInteger(pos) || !FIELDS[pos] || !o || o.owner !== p.id) fail('To nije tvoj posjed.');
  return [pos, o, FIELDS[pos]];
}

// Ko smije upravljati imovinom: igrač na potezu bez otvorenih odluka ili dužnik koji je na redu.
function canManage(s, p) {
  if (s.phase !== 'play') return false;
  const h = s.queue[0];
  if (h) return h.kind === 'debt' && h.pid === p.id;
  return s.turn.pid === p.id;
}

function validTradeSide(s, pid, side) {
  const money = Math.floor(Number(side.money) || 0);
  if (money < 0) fail('Iznos ne može biti negativan.');
  const props = [...new Set((side.props || []).map(Number))];
  for (const pos of props) {
    const o = s.owners[pos];
    if (!o || o.owner !== pid) fail('Ponuda sadrži tuđi posjed.');
    const g = FIELDS[pos].group;
    if (g && groupOf(g).some((i) => level(s, i) > 0)) fail('Prvo prodaj kućice u grupi prije trgovanja.');
  }
  const pardons = Math.floor(Number(side.pardons) || 0);
  if (pardons < 0 || pardons > P(s, pid).pardons.length) fail('Nemaš toliko vikendica.');
  if (money > P(s, pid).money) fail('Nema dovoljno gotovine za tu ponudu.');
  return { money, props, pardons };
}

export function applyAction(s, pid, a, ctx) {
  const { rng, presence = {}, now = Date.now() } = ctx;
  Object.defineProperty(s, 'rng', { value: rng, configurable: true, enumerable: false, writable: true });
  const p = P(s, pid);
  if (!p) fail('Nisi u ovoj sobi.', 403);
  const type = a?.type;

  if (type === 'figure') {
    if (s.phase !== 'lobby') fail('Partija je već počela.');
    if (!FIGURES.some((f) => f.id === a.figure)) fail('Nepoznata figurica.');
    if (s.players.some((q) => q.id !== pid && q.figure === a.figure)) fail('Tu figuricu je neko već uzeo.');
    p.figure = a.figure; return;
  }
  if (type === 'start') {
    if (s.phase !== 'lobby') fail('Partija je već počela.');
    if (pid !== s.hostId) fail('Partiju pokreće onaj ko je napravio sobu.');
    if (s.players.length < RULES.minPlayers) fail('Trebaju barem dva igrača.');
    s.mode = a.mode === 'classic' ? 'classic' : 'fast';
    s.phase = 'play'; s.round = 1;
    shuffle(s.players, rng);
    startTurn(s, s.players[0]);
    log(s, `Partija počinje (${s.mode === 'fast' ? `brza, ${RULES.fastRounds} krugova` : 'klasična'}). Prvi baca ${s.players[0].name}.`);
    return;
  }
  if (s.phase === 'over') fail('Partija je završena.');
  if (s.phase !== 'play' && type !== 'leave') fail('Partija još nije počela.');

  switch (type) {
    case 'roll': {
      needTurn(s, p); needFree(s);
      if (!s.turn.canRoll) fail('Ne možeš više bacati u ovom potezu.');
      const d = [rng.int(6) + 1, rng.int(6) + 1];
      const sum = d[0] + d[1], dbl = d[0] === d[1];
      s.turn.rolled = true; s.turn.canRoll = false;
      s.lastRoll = { n: s.seq + 1, pid, dice: d };
      log(s, `${p.name} baca ${d[0]} i ${d[1]}.`);
      if (p.inJail) {
        p.jailTries += 1;
        if (dbl) { p.inJail = false; p.jailTries = 0; log(s, `${p.name} izlazi iz Zenice s duplim kockicama.`); moveBy(s, p, sum, sum); }
        else if (p.jailTries >= RULES.maxJailTries) {
          p.inJail = false; p.jailTries = 0;
          log(s, `Treći neuspjeli pokušaj: ${p.name} plaća ${km(RULES.jailFine)} i izlazi.`);
          s.turn.pendingMove = sum;
          pay(s, p, null, RULES.jailFine, 'izlazak iz Zenice');
        } else log(s, `${p.name} ostaje u Zenici (pokušaj ${p.jailTries} od ${RULES.maxJailTries}).`);
        break;
      }
      if (dbl) {
        s.turn.doubles += 1;
        if (s.turn.doubles >= 3) { log(s, 'Tri duple zaredom!'); goToJail(s, p); break; }
        s.turn.canRoll = true;
      }
      moveBy(s, p, sum, sum);
      break;
    }
    case 'jailPay': case 'jailPardon': {
      needTurn(s, p); needFree(s);
      if (!p.inJail) fail('Nisi u Zenici.');
      if (s.turn.rolled) fail('Ovo se bira prije bacanja.');
      if (type === 'jailPay') {
        if (p.money < RULES.jailFine) fail('Nemaš dovoljno gotovine.');
        p.money -= RULES.jailFine; toPot(s, RULES.jailFine); log(s, `${p.name} plaća ${km(RULES.jailFine)} i izlazi iz Zenice.`);
      } else {
        const c = p.pardons.shift();
        if (!c) fail('Nemaš vikendicu.');
        s.decks[c.deck].push(c.idx); log(s, `${p.name} se sakrio na vikendicu i izlazi iz Zenice.`);
      }
      p.inJail = false; p.jailTries = 0;
      break;
    }
    case 'buy': {
      const h = needHead(s, p, 'buy');
      const f = FIELDS[h.pos];
      if (p.money < f.price) fail('Nemaš dovoljno gotovine.');
      p.money -= f.price;
      s.owners[h.pos] = { owner: p.id, level: 0, mortgaged: false };
      s.queue.shift();
      log(s, `${p.name} kupuje ${f.name} za ${km(f.price)}.`);
      break;
    }
    case 'decline': {
      const h = needHead(s, p, 'buy');
      s.queue.shift();
      log(s, `${p.name} ne kupuje ${FIELDS[h.pos].name}.`);
      break;
    }
    case 'choice': {
      const h = needHead(s, p, 'choice');
      s.queue.shift();
      if (a.opt === 'jail') {
        p.pos = RULES.jailPos; p.skip += 1;
        if (s.turn.pid === p.id) { s.turn.canRoll = false; }
        log(s, `${p.name} bira jedan potez u Zenici.`);
      } else {
        log(s, `${p.name} plaća ${km(h.amount)} (${h.title}).`);
        pay(s, p, null, h.amount, h.title);
      }
      break;
    }
    case 'duel': {
      const h = needHead(s, p, 'duel');
      const o = P(s, a.target);
      if (!o || o.bankrupt || o.id === p.id) fail('Odaberi suparnika.');
      s.queue.shift();
      // Hari ili Željo: izvlačitelj navija za Harija i Hari uvijek dobija, osim svakog trećeg kruga.
      const zeljo = s.round % 3 === 0;
      const [win, lose] = zeljo ? [o, p] : [p, o];
      s.lastDuel = { n: s.seq + 1, a: p.id, b: o.id, zeljo, winner: win.id, amount: h.amount };
      log(s, `Hari ili Željo: ${zeljo ? 'danas dobio Željo' : 'dobio Hari'}. ${win.name} dobiva ${km(h.amount)} od igrača ${lose.name}.`);
      pay(s, lose, win.id, h.amount, 'Hari ili Željo');
      break;
    }
    case 'car': {
      const h = needHead(s, p, 'car');
      if (a.car) {
        const c = carById(a.car);
        if (!c) fail('Nepoznat auto.');
        if (p.car === c.id) fail('Taj auto već imaš.');
        const back = p.car ? Math.floor(carById(p.car).price / 2) : 0;
        if (p.money + back < c.price) fail('Nemaš dovoljno gotovine.');
        if (p.car) log(s, `${p.name} prodaje ${carById(p.car).name} za ${km(back)}.`);
        p.money += back - c.price; p.car = c.id;
        log(s, `${p.name} kupuje ${c.name} za ${km(c.price)}.`);
      }
      s.queue.shift();
      break;
    }
    case 'steal': {
      const h = needHead(s, p, 'steal');
      s.queue.shift();
      if (!a.target) { p.money += h.salary; log(s, `${p.name} uzima platu ${km(h.salary)}.`); break; }
      const o = P(s, a.target);
      if (!o || !stealTargets(s, p).some((q) => q.id === o.id)) fail('Od tog igrača ne možeš krast.');
      const d = rng.int(6) + 1;
      if (d === 6) {
        s.lastSteal = { n: s.seq + 1, a: p.id, b: o.id, caught: true };
        log(s, `${p.name} krenuo krast od igrača ${o.name}, ali ga uhvatila policija (kocka 6). Ide u Zenicu.`);
        s.queue = s.queue.filter((q) => q.pid !== p.id || q.kind === 'debt');
        jailNow(s, p);
        break;
      }
      let what;
      if (o.car) {
        const c = carById(o.car);
        if (p.car) p.money += Math.floor(carById(p.car).price / 2);
        p.car = o.car; o.car = null; what = c.name;
      } else {
        const amt = Math.min(o.money, RULES.stealCash);
        o.money -= amt; p.money += amt; what = km(amt);
      }
      s.lastSteal = { n: s.seq + 1, a: p.id, b: o.id, caught: false, what };
      log(s, `${p.name} ukrao ${what} od igrača ${o.name} (kocka ${d}).`);
      break;
    }
    case 'bribe': {
      const h = needHead(s, p, 'bribe');
      s.queue.shift();
      if (a.opt !== 'pay') { jailNow(s, p); break; }
      if (p.money < h.amount) { s.queue.unshift(h); fail('Nemaš dovoljno gotovine za mito.'); }
      p.money -= h.amount;
      const d = rng.int(6) + 1;
      if (d === 1) {
        toPot(s, h.amount);
        log(s, `${p.name} nudio mito, ali je otkriven (kocka 1). Pare idu u bubanj, a on u Zenicu.`);
        jailNow(s, p);
      } else {
        const to = mayorOf(s);
        if (to && to !== p.id) P(s, to).money += h.amount; else toPot(s, h.amount);
        log(s, `${p.name} podmitio ${to ? `načelnika ${P(s, to).name}` : 'koga treba'} s ${km(h.amount)} i ostaje na slobodi.`);
      }
      s.lastBribe = { n: s.seq + 1, pid: p.id, die: d, caught: d === 1 };
      break;
    }
    case 'betSet': {
      needHead(s, p, 'betSet');
      s.queue.shift();
      const num = Number(a.num);
      if (!a.num) { log(s, `${p.name} se ne kladi.`); break; }
      if (!Number.isInteger(num) || num < 1 || num > 5) { s.queue.unshift({ kind: 'betSet', pid: p.id }); fail('Biraj broj od 1 do 5.'); }
      s.hidden = { ...(s.hidden || {}), betNum: num };
      s.bet = { pid: p.id, guesses: {} };
      const others = active(s).filter((q) => q.id !== p.id);
      for (const q of others) s.queue.push({ kind: 'betGuess', pid: q.id, by: p.id });
      log(s, `${p.name} zamislio broj. Ostali pogađaju: pogodak nosi ${km(RULES.betWin)}, promašaj košta ${km(RULES.betStake)}.`);
      break;
    }
    case 'betGuess': {
      needHead(s, p, 'betGuess');
      const g = Number(a.num);
      if (!Number.isInteger(g) || g < 1 || g > 5) fail('Biraj broj od 1 do 5.');
      s.queue.shift();
      s.bet.guesses[p.id] = g;
      resolveBet(s);
      break;
    }
    case 'payDebt': {
      const h = needHead(s, p, 'debt');
      if (p.money < h.amount) fail(`Treba ti još ${km(h.amount - p.money)}. Prodaj kućice ili stavi posjed pod hipoteku.`);
      p.money -= h.amount;
      if (h.to) P(s, h.to).money += h.amount;
      else toPot(s, h.amount);
      s.queue.shift();
      log(s, `${p.name} je platio dug od ${km(h.amount)}.`);
      break;
    }
    case 'bankrupt': {
      const h = s.queue[0];
      if (!h || h.kind !== 'debt' || h.pid !== p.id) fail('Bankrot se proglašava samo kad ne možeš platiti dug.');
      bankrupt(s, p, h.to);
      break;
    }
    case 'endTurn': {
      needTurn(s, p); needFree(s);
      if (s.turn.canRoll) fail('Prvo baci kockice.');
      if (s.trade) s.trade = null;
      nextTurn(s);
      break;
    }
    case 'build': {
      if (!canManage(s, p) || s.queue.length) fail('Graditi možeš samo na svom potezu.');
      const [pos, o, f] = checkProp(s, p, a.pos);
      if (!f.group) fail('Ovdje se ne gradi.');
      const g = groupOf(f.group);
      if (!ownsGroup(s, p.id, f.group)) fail('Za gradnju trebaš cijelu grupu.');
      if (g.some((i) => s.owners[i].mortgaged)) fail('Neki posjed u grupi je pod hipotekom.');
      if (o.level >= 5) fail('Tu je već birtija.');
      if (o.level > Math.min(...g.map((i) => level(s, i)))) fail('Gradi ravnomjerno: prvo na drugim poljima grupe.');
      const cost = HOUSE_COST[f.group];
      if (p.money < cost) fail('Nemaš dovoljno gotovine.');
      p.money -= cost; o.level += 1;
      log(s, `${p.name} gradi ${o.level === 5 ? 'birtiju' : 'kućicu'} na ${f.name} (${km(cost)}).`);
      break;
    }
    case 'sell': {
      if (!canManage(s, p)) fail('Sada ne možeš prodavati.');
      const [, o, f] = checkProp(s, p, a.pos);
      if (!o.level) fail('Nema kućica za prodaju.');
      if (o.level < Math.max(...groupOf(f.group).map((i) => level(s, i)))) fail('Prodaji ravnomjerno: prvo s drugih polja grupe.');
      const back = Math.floor(HOUSE_COST[f.group] / 2);
      o.level -= 1; p.money += back;
      log(s, `${p.name} prodaje nadogradnju na ${f.name} za ${km(back)}.`);
      break;
    }
    case 'mortgage': {
      if (!canManage(s, p)) fail('Sada ne možeš uzeti hipoteku.');
      const [, o, f] = checkProp(s, p, a.pos);
      if (o.mortgaged) fail('Već je pod hipotekom.');
      if (f.group && groupOf(f.group).some((i) => level(s, i) > 0)) fail('Prvo prodaj kućice u toj grupi.');
      const v = Math.floor(f.price * RULES.mortgageRate);
      o.mortgaged = true; p.money += v;
      log(s, `${p.name} stavlja ${f.name} pod hipoteku i dobiva ${km(v)}.`);
      break;
    }
    case 'unmortgage': {
      if (!canManage(s, p) || s.queue.length) fail('Otkup je moguć na tvom potezu.');
      const [, o, f] = checkProp(s, p, a.pos);
      if (!o.mortgaged) fail('Nije pod hipotekom.');
      const v = Math.ceil(Math.round(f.price * RULES.unmortgageRate * 100) / 100);
      if (p.money < v) fail('Nemaš dovoljno gotovine.');
      o.mortgaged = false; p.money -= v;
      log(s, `${p.name} otkupljuje ${f.name} za ${km(v)}.`);
      break;
    }
    case 'tradePropose': {
      needTurn(s, p); needFree(s);
      if (s.trade) fail('Već postoji otvorena ponuda.');
      const o = P(s, a.to);
      if (!o || o.bankrupt || o.id === p.id) fail('Odaberi igrača.');
      const give = validTradeSide(s, p.id, a.give || {});
      const get = validTradeSide(s, o.id, a.get || {});
      if (!give.money && !give.props.length && !give.pardons && !get.money && !get.props.length && !get.pardons) fail('Ponuda je prazna.');
      s.trade = { n: s.seq + 1, from: p.id, to: o.id, give, get };
      log(s, `${p.name} nudi trgovinu igraču ${o.name}.`);
      break;
    }
    case 'tradeAccept': case 'tradeReject': case 'tradeCancel': {
      const t = s.trade;
      if (!t) fail('Nema otvorene ponude.');
      if (type === 'tradeCancel') { if (t.from !== p.id) fail('Ponudu povlači onaj ko ju je dao.'); s.trade = null; log(s, `${p.name} povlači ponudu.`); break; }
      if (t.to !== p.id) fail('Ova ponuda nije za tebe.');
      if (type === 'tradeReject') { s.trade = null; log(s, `${p.name} odbija ponudu.`); break; }
      if (s.queue.length) fail('Prvo treba riješiti otvorenu odluku.');
      const a1 = P(s, t.from), b1 = p;
      validTradeSide(s, a1.id, t.give); validTradeSide(s, b1.id, t.get);
      const move = (from, to, side) => {
        from.money -= side.money; to.money += side.money;
        for (const pos of side.props) s.owners[pos].owner = to.id;
        to.pardons.push(...from.pardons.splice(0, side.pardons));
      };
      move(a1, b1, t.give); move(b1, a1, t.get);
      s.trade = null;
      log(s, `${b1.name} prihvata trgovinu s igračem ${a1.name}.`);
      break;
    }
    case 'leave': {
      if (s.phase === 'lobby') {
        s.players = s.players.filter((q) => q.id !== pid);
        if (s.hostId === pid) s.hostId = s.players[0]?.id ?? null;
        log(s, `${p.name} je izašao iz sobe.`);
        return;
      }
      if (p.bankrupt) fail('Već si izvan igre.');
      const h = s.queue.find((q) => q.kind === 'debt' && q.pid === p.id);
      log(s, `${p.name} napušta partiju.`);
      bankrupt(s, p, h?.to ?? null);
      break;
    }
    case 'skipAbsent': case 'kick': {
      const h = s.queue[0];
      const targetId = h ? h.pid : s.turn.pid;
      const tgt = P(s, targetId);
      if (tgt.id === p.id) fail('Ne možeš preskočiti sebe.');
      const seen = Math.max(presence[tgt.id] || 0, s.turn.pid === tgt.id ? s.turn.since : 0);
      const limit = type === 'kick' ? ABSENT_KICK_MS : ABSENT_SKIP_MS;
      if (now - seen < limit) fail(`${tgt.name} je još tu. Pričekaj malo.`);
      if (type === 'kick') { log(s, `${tgt.name} je predugo odsutan i izlazi iz igre.`); bankrupt(s, tgt, h?.kind === 'debt' ? h.to : null); break; }
      if (h?.kind === 'debt') fail('Dužnika koji je odsutan možeš samo izbaciti.');
      // Preskakanje odsutnog: zatvori njegove odluke na najblaži način i završi potez.
      while (s.queue[0] && s.queue[0].pid === tgt.id) {
        const q = s.queue.shift();
        if (q.kind === 'choice') pay(s, tgt, null, q.amount, q.title);
        if (q.kind === 'steal') tgt.money += q.salary;
        if (q.kind === 'bribe') jailNow(s, tgt);
        if (q.kind === 'betGuess' && s.bet) { s.bet.guesses[tgt.id] = null; resolveBet(s); }
        if (q.kind === 'debt') { s.queue.unshift(q); break; }
      }
      log(s, `${tgt.name} je odsutan, potez je preskočen.`);
      if (s.turn.pid === tgt.id && !s.queue.length) { s.turn.pendingMove = 0; nextTurn(s); }
      break;
    }
    default: fail('Nepoznata radnja.');
  }
  settle(s);
}

// Stanje koje se šalje pregledniku: bez tajnih tokena.
export function publicState(s) {
  const { secrets, seen, hidden, ...rest } = s;
  return rest;
}
