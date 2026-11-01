import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRoom, addPlayer, applyAction, rentFor, netWorth } from '../netlify/functions/lib/engine.mjs';
import { CHANCE, SURPRISE, FIELDS, RULES } from '../public/shared/data.js';

// Kockice po narudžbi: svaki rng.int(6) vraća sljedeću vrijednost iz liste (1..6).
function scripted(vals) {
  const q = [...vals];
  return { int: (n) => (n === 6 ? (q.length ? q.shift() - 1 : 0) : 0), left: () => q.length };
}
const det = { int: () => 0 };

function game(n = 2, mode = 'fast') {
  const s = newRoom('TEST', det, 0);
  for (let i = 0; i < n; i++) addPlayer(s, `p${i}`, `Igrač ${i}`, null);
  applyAction(s, 'p0', { type: 'start', mode }, { rng: det });
  // poredak nakon miješanja s det rng: vrati na p0, p1...
  s.players.sort((a, b) => a.id.localeCompare(b.id));
  s.turn.pid = 'p0';
  return s;
}
const act = (s, pid, a, dice = [], extra = {}) => applyAction(s, pid, a, { rng: scripted(dice), now: 10_000_000, ...extra });
const P = (s, id) => s.players.find((p) => p.id === id);
const setDeck = (s, deck, idx) => { s.decks[deck] = [idx, ...s.decks[deck].filter((i) => i !== idx)]; };

const ci = (t) => CHANCE.findIndex((c) => c.title === t);
const si = (t) => SURPRISE.findIndex((c) => c.title === t);

test('16 Šansi i 17 Iznenađenja, bez dugih crtica, bez starih karata', () => {
  assert.equal(CHANCE.length, 16);
  assert.equal(SURPRISE.length, 17);
  const all = JSON.stringify([CHANCE, SURPRISE, FIELDS]);
  assert.ok(!all.includes('\u2014'));
  assert.ok(!all.includes('Treći ključ'));
  assert.equal(SURPRISE[0].text, 'Baba te maksuz pozdravila.');
  assert.equal(CHANCE[ci('Diploma')].text, 'Svratio na ćevape, završio fakultet.');
});

test('Nova Bila je malo skuplja od Azića, travnička grupa je zajedno', () => {
  const nb = FIELDS.find((f) => f.name === 'Nova Bila'), az = FIELDS.find((f) => f.name === 'Azići');
  assert.ok(nb.price > az.price && nb.price - az.price <= 40);
  const g = FIELDS.filter((f) => f.group === nb.group).map((f) => f.name);
  assert.deepEqual(g, ['Travnik', 'Prahulje', 'Nova Bila']);
  assert.equal(FIELDS[10].name, 'KP dom Zenica');
});

test('bacanje, kretanje, kupnja i kirija', () => {
  const s = game();
  act(s, 'p0', { type: 'roll' }, [1, 2]); // na Bugojno (3)
  assert.equal(P(s, 'p0').pos, 3);
  assert.equal(s.queue[0].kind, 'buy');
  act(s, 'p0', { type: 'buy' });
  assert.equal(s.owners[3].owner, 'p0');
  assert.equal(P(s, 'p0').money, RULES.startMoney - 80);
  assert.throws(() => act(s, 'p1', { type: 'roll' }), /Nisi na potezu/);
  act(s, 'p0', { type: 'endTurn' });
  act(s, 'p1', { type: 'roll' }, [2, 1]);
  assert.equal(P(s, 'p1').money, RULES.startMoney - 4);
  assert.equal(P(s, 'p0').money, RULES.startMoney - 80 + 4);
});

test('cijela grupa udvostručuje kiriju, gradnja je ravnomjerna, prodaja pola cijene', () => {
  const s = game();
  s.owners[1] = { owner: 'p0', level: 0, mortgaged: false };
  s.owners[3] = { owner: 'p0', level: 0, mortgaged: false };
  assert.equal(rentFor(s, 3, 7), 8);
  act(s, 'p0', { type: 'build', pos: 3 });
  assert.throws(() => act(s, 'p0', { type: 'build', pos: 3 }), /ravnomjerno/);
  act(s, 'p0', { type: 'build', pos: 1 });
  act(s, 'p0', { type: 'build', pos: 3 });
  assert.equal(rentFor(s, 3, 7), 60);
  assert.throws(() => act(s, 'p0', { type: 'sell', pos: 1 }), /ravnomjerno/);
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'sell', pos: 3 });
  assert.equal(P(s, 'p0').money, m + 25);
  assert.throws(() => act(s, 'p0', { type: 'mortgage', pos: 1 }), /kućice/);
});

test('hipoteka 50 %, otkup 55 %, nema kirije pod hipotekom', () => {
  const s = game();
  s.owners[39] = { owner: 'p0', level: 0, mortgaged: false };
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'mortgage', pos: 39 });
  assert.equal(P(s, 'p0').money, m + 200);
  assert.equal(rentFor(s, 39, 5), 0);
  act(s, 'p0', { type: 'unmortgage', pos: 39 });
  assert.equal(P(s, 'p0').money, m + 200 - 220);
});

test('tri duple vode u Zenicu bez Starta', () => {
  const s = game();
  act(s, 'p0', { type: 'roll' }, [1, 1]); // 2: Iznenađenje
  s.queue = []; s.lastCard = null; P(s, 'p0').pos = 2;
  act(s, 'p0', { type: 'roll' }, [2, 2]); // 6 Jajce
  act(s, 'p0', { type: 'decline' });
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'roll' }, [3, 3]);
  assert.equal(P(s, 'p0').pos, 10);
  assert.ok(P(s, 'p0').inJail);
  assert.equal(P(s, 'p0').money, m);
  assert.throws(() => act(s, 'p0', { type: 'roll' }), /Ne možeš više bacati/);
});

test('zatvor: tri neuspjela pokušaja, zatim obvezno plaćanje i kretanje', () => {
  const s = game();
  const p = P(s, 'p0');
  p.inJail = true; p.pos = 10;
  for (let i = 0; i < 2; i++) {
    act(s, 'p0', { type: 'roll' }, [1, 2]);
    assert.ok(p.inJail);
    act(s, 'p0', { type: 'endTurn' });
    act(s, 'p1', { type: 'roll' }, [3, 4]); s.queue = []; s.trade = null;
    act(s, 'p1', { type: 'endTurn' });
  }
  const m = p.money;
  act(s, 'p0', { type: 'roll' }, [1, 2]);
  assert.ok(!p.inJail);
  assert.equal(p.pos, 13);
  assert.equal(p.money, m - 50);
});

test('vikendica se čuva i vraća u špil kad se iskoristi', () => {
  const s = game();
  const v = ci('Vikendica');
  setDeck(s, 'chance', v);
  P(s, 'p0').pos = 4;
  act(s, 'p0', { type: 'roll' }, [1, 2]); // 7 Šansa
  assert.equal(P(s, 'p0').pardons.length, 1);
  assert.ok(!s.decks.chance.includes(v));
  P(s, 'p0').inJail = true; P(s, 'p0').pos = 10;
  act(s, 'p0', { type: 'endTurn' });
  act(s, 'p1', { type: 'roll' }, [3, 4]); s.queue = [];
  act(s, 'p1', { type: 'endTurn' });
  act(s, 'p0', { type: 'jailPardon' });
  assert.ok(!P(s, 'p0').inJail);
  assert.ok(s.decks.chance.includes(v));
});

test('plata 300 KM, a dupla kad staneš baš na Start', () => {
  const s = game();
  P(s, 'p0').pos = 36;
  let m = P(s, 'p0').money;
  act(s, 'p0', { type: 'roll' }, [1, 3]); // 36 -> 0 tačno na Start
  assert.equal(P(s, 'p0').pos, 0);
  assert.equal(P(s, 'p0').money, m + 600);
  act(s, 'p0', { type: 'endTurn' });
  P(s, 'p1').pos = 36;
  m = P(s, 'p1').money;
  act(s, 'p1', { type: 'roll' }, [2, 3]); // 36 -> 1 preko Starta
  assert.equal(P(s, 'p1').money, m + 300);
  assert.equal(RULES.passStart, 300);
});

test('porezi, kartice i kazne idu u bubanj, Kod babe se pokupi sve', () => {
  const s = game();
  act(s, 'p0', { type: 'roll' }, [1, 3]); // 4 Porez 200
  assert.equal(s.pot, 200);
  act(s, 'p0', { type: 'endTurn' });
  setDeck(s, 'chance', ci('Diploma'));
  P(s, 'p1').pos = 18;
  act(s, 'p1', { type: 'roll' }, [1, 3]); // 22 Šansa, plati 150
  assert.equal(s.pot, 350);
  act(s, 'p1', { type: 'endTurn' });
  P(s, 'p0').pos = 15;
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'roll' }, [2, 3]); // 20 Kod babe
  assert.equal(P(s, 'p0').money, m + 350);
  assert.equal(s.pot, 0);
});

test('Bosna ulazi u EU: sljedeća stanica, prolaz preko Starta plaća', () => {
  const s = game();
  setDeck(s, 'chance', ci('Bosna ulazi u EU'));
  P(s, 'p0').pos = 33;
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'roll' }, [1, 2]); // 36 Šansa -> 5 Stanica Sarajevo preko Starta
  assert.equal(P(s, 'p0').pos, 5);
  assert.equal(P(s, 'p0').money, m + RULES.passStart);
  assert.equal(s.queue[0].kind, 'buy');
});

test('E-uprava i Magla: unazad bez Starta, polje se rješava', () => {
  const s = game();
  setDeck(s, 'chance', ci('E-uprava'));
  P(s, 'p0').pos = 4;
  act(s, 'p0', { type: 'roll' }, [1, 2]); // 7 -> 5 stanica
  assert.equal(P(s, 'p0').pos, 5);
  assert.equal(s.queue[0].kind, 'buy');
  const s2 = game();
  setDeck(s2, 'surprise', si('Magla'));
  P(s2, 'p0').pos = 0;
  const m = P(s2, 'p0').money;
  act(s2, 'p0', { type: 'roll' }, [1, 1]); // 2 -> 39 Nova Bila
  assert.equal(P(s2, 'p0').pos, 39);
  assert.equal(P(s2, 'p0').money, m);
});

test('Javio se Crni: izbor plaćanja ili jednog poteza u Zenici', () => {
  const s = game(3);
  setDeck(s, 'surprise', si('Javio se Crni'));
  act(s, 'p0', { type: 'roll' }, [1, 1]);
  assert.equal(s.queue[0].kind, 'choice');
  act(s, 'p0', { type: 'choice', opt: 'jail' });
  assert.equal(P(s, 'p0').pos, 10);
  assert.ok(!P(s, 'p0').inJail);
  assert.equal(s.turn.canRoll, false); // dupla se poništava
  act(s, 'p0', { type: 'endTurn' });
  act(s, 'p1', { type: 'roll' }, [3, 4]); s.queue = [];
  act(s, 'p1', { type: 'endTurn' });
  act(s, 'p2', { type: 'roll' }, [3, 4]); s.queue = [];
  act(s, 'p2', { type: 'endTurn' });
  assert.equal(s.turn.pid, 'p1'); // p0 je propustio jedan potez
  act(s, 'p1', { type: 'roll' }, [5, 6]); s.queue = [];
  act(s, 'p1', { type: 'endTurn' });
  act(s, 'p2', { type: 'roll' }, [5, 6]); s.queue = [];
  act(s, 'p2', { type: 'endTurn' });
  assert.equal(s.turn.pid, 'p0'); // i onda normalno nastavlja
});

test('Hari ili Željo: Hari uvijek dobija, osim svakog trećeg kruga', () => {
  const s = game();
  setDeck(s, 'surprise', si('Hari ili Željo?'));
  act(s, 'p0', { type: 'roll' }, [1, 1]);
  assert.equal(s.queue[0].kind, 'duel');
  act(s, 'p0', { type: 'duel', target: 'p1' });
  assert.equal(s.lastDuel.winner, 'p0');
  assert.equal(P(s, 'p0').money, RULES.startMoney + 50);
  const s2 = game();
  s2.round = 3;
  setDeck(s2, 'surprise', si('Hari ili Željo?'));
  act(s2, 'p0', { type: 'roll' }, [1, 1]);
  act(s2, 'p0', { type: 'duel', target: 'p1' });
  assert.equal(s2.lastDuel.winner, 'p1');
  assert.ok(s2.lastDuel.zeljo);
  assert.equal(P(s2, 'p1').money, RULES.startMoney + 50);
});

test('Majstor: 40 KM po nadogradnji, hotel je pet', () => {
  const s = game();
  s.owners[1] = { owner: 'p0', level: 5, mortgaged: false };
  s.owners[3] = { owner: 'p0', level: 2, mortgaged: false };
  s.owners[6] = { owner: 'p0', level: 0, mortgaged: false };
  setDeck(s, 'chance', ci('Majstor'));
  P(s, 'p0').pos = 4;
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'roll' }, [1, 2]);
  assert.equal(P(s, 'p0').money, m - 7 * 40);
});

test('Ko časti?: 10 KM svakom drugom aktivnom igraču', () => {
  const s = game(4);
  P(s, 'p3').bankrupt = true;
  setDeck(s, 'surprise', si('Ko časti?'));
  const m = P(s, 'p0').money;
  act(s, 'p0', { type: 'roll' }, [1, 1]);
  assert.equal(P(s, 'p0').money, m - 20);
  assert.equal(P(s, 'p1').money, RULES.startMoney + 10);
  assert.equal(P(s, 'p3').money, RULES.startMoney);
});

test('dug: hipoteka pokriva dug, bez gotovine bankrot predaje imovinu vjerovniku', () => {
  const s = game(3);
  s.owners[39] = { owner: 'p1', level: 5, mortgaged: false };
  s.owners[34] = { owner: 'p1', level: 5, mortgaged: false };
  s.owners[37] = { owner: 'p1', level: 5, mortgaged: false };
  s.owners[1] = { owner: 'p0', level: 0, mortgaged: false };
  P(s, 'p0').pos = 35;
  act(s, 'p0', { type: 'roll' }, [1, 3]); // 39 Nova Bila s hotelom: 2000
  assert.equal(s.queue[0].kind, 'debt');
  assert.throws(() => act(s, 'p0', { type: 'endTurn' }), /odluku/);
  assert.throws(() => act(s, 'p0', { type: 'payDebt' }), /Treba ti još/);
  act(s, 'p0', { type: 'mortgage', pos: 1 });
  act(s, 'p0', { type: 'bankrupt' });
  assert.ok(P(s, 'p0').bankrupt);
  assert.equal(s.owners[1].owner, 'p1');
  assert.ok(s.owners[1].mortgaged);
  assert.equal(s.turn.pid, 'p1');
  assert.equal(s.phase, 'play');
});

test('bankrot prema banci vraća posjede, klasična partija završava sa zadnjim solventnim', () => {
  const s = game(2, 'classic');
  s.owners[1] = { owner: 'p0', level: 0, mortgaged: false };
  P(s, 'p0').money = 10;
  P(s, 'p0').pos = 2;
  act(s, 'p0', { type: 'roll' }, [1, 1]); // 4 Porez 200
  assert.equal(s.queue[0].kind, 'debt');
  act(s, 'p0', { type: 'bankrupt' });
  assert.equal(s.owners[1], undefined);
  assert.equal(s.phase, 'over');
  assert.equal(s.winner, 'p1');
});

test('brza partija završava nakon 20 krugova, pobjeda po imovini', () => {
  const s = game(2, 'fast');
  s.owners[39] = { owner: 'p1', level: 0, mortgaged: false };
  s.round = 20;
  s.turn.pid = 'p1'; s.turn.canRoll = false;
  act(s, 'p1', { type: 'endTurn' });
  assert.equal(s.phase, 'over');
  assert.equal(s.winner, 'p1');
  assert.equal(netWorth(s, 'p1'), RULES.startMoney + 400);
});

test('trgovina traži izričito prihvaćanje drugog igrača', () => {
  const s = game(3);
  s.owners[39] = { owner: 'p0', level: 0, mortgaged: false };
  act(s, 'p0', { type: 'tradePropose', to: 'p1', give: { props: [39] }, get: { money: 500 } });
  assert.throws(() => act(s, 'p2', { type: 'tradeAccept' }), /nije za tebe/);
  assert.throws(() => act(s, 'p0', { type: 'tradeAccept' }), /nije za tebe/);
  act(s, 'p1', { type: 'tradeAccept' });
  assert.equal(s.owners[39].owner, 'p1');
  assert.equal(P(s, 'p0').money, RULES.startMoney + 500);
  assert.throws(() => act(s, 'p0', { type: 'tradePropose', to: 'p1', give: { props: [39] } }), /tuđi posjed/);
});

test('odsutan igrač se može preskočiti, pa izbaciti', () => {
  const s = game(3);
  s.turn.since = 0;
  assert.throws(() => applyAction(s, 'p1', { type: 'skipAbsent' }, { rng: det, presence: { p0: 9_990_000 }, now: 10_000_000 }), /još tu/);
  applyAction(s, 'p1', { type: 'skipAbsent' }, { rng: det, presence: { p0: 0 }, now: 10_000_000 });
  assert.equal(s.turn.pid, 'p1');
  s.turn.pid = 'p0'; s.turn.since = 0;
  applyAction(s, 'p1', { type: 'kick' }, { rng: det, presence: { p0: 0 }, now: 10_000_000 });
  assert.ok(P(s, 'p0').bankrupt);
});

test('nadimak je očišćen od HTML znakova', () => {
  const s = newRoom('X', det, 0);
  const p = addPlayer(s, 'a', '<img src=x onerror=alert(1)>Mujo', null);
  assert.ok(!p.name.includes('<'));
});
