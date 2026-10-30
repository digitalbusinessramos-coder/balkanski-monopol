// Zajednički podaci igre: koriste ih i server (pravila) i preglednik (prikaz).
// Naziv igre mijenja se samo ovdje.
export const GAME_NAME = ['Bosanski', 'monopol'];

export const RULES = {
  startMoney: 1800,
  passStart: 200,
  jailFine: 50,
  jailPos: 10,
  maxJailTries: 3,
  fastRounds: 20,
  mortgageRate: 0.5,
  unmortgageRate: 0.55,
  repairPerLevel: 40,
  stationRent: [0, 25, 50, 100, 200],
  utilityMult: [0, 4, 10],
  minPlayers: 2,
  maxPlayers: 6,
};

// Cijena gradnje po kućici za svaku grupu boja.
export const HOUSE_COST = { 1: 50, 2: 50, 3: 100, 4: 100, 5: 150, 6: 150, 7: 200, 8: 200 };

export const GROUP_COLOR = {
  1: '#8a4b2d', 2: '#a9d8ef', 3: '#d63c8f', 4: '#f08a24',
  5: '#d8232a', 6: '#f4dc1a', 7: '#1f9a4b', 8: '#1f4fa3',
};

// kind: start | prop | chance | surprise | tax | station | jail | utility | free | gotojail
// rent: [prazno, 1 kuća, 2, 3, 4, hotel]
export const FIELDS = [
  { name: 'Legla plata', kind: 'start' },
  { name: 'Donji Vakuf', kind: 'prop', group: 1, price: 60, rent: [2, 10, 30, 90, 160, 250] },
  { name: 'Iznenađenje', kind: 'surprise' },
  { name: 'Bugojno', kind: 'prop', group: 1, price: 80, rent: [4, 20, 60, 180, 320, 450] },
  { name: 'Porez', kind: 'tax', amount: 200 },
  { name: 'Stanica Sarajevo', kind: 'station', price: 200 },
  { name: 'Jajce', kind: 'prop', group: 2, price: 100, rent: [6, 30, 90, 270, 400, 550] },
  { name: 'Šansa', kind: 'chance' },
  { name: 'Konjic', kind: 'prop', group: 2, price: 120, rent: [7, 35, 100, 285, 425, 575] },
  { name: 'Trebinje', kind: 'prop', group: 2, price: 140, rent: [8, 40, 100, 300, 450, 600] },
  { name: 'KP dom Zenica', kind: 'jail' },
  { name: 'Brčko', kind: 'prop', group: 3, price: 160, rent: [12, 60, 180, 500, 700, 900] },
  { name: 'Elektroprivreda BiH', kind: 'utility', price: 150, icon: 'bolt' },
  { name: 'Doboj', kind: 'prop', group: 3, price: 180, rent: [14, 70, 200, 550, 750, 950] },
  { name: 'Tuzla', kind: 'prop', group: 3, price: 200, rent: [16, 80, 220, 600, 800, 1000] },
  { name: 'Stanica Doboj', kind: 'station', price: 200 },
  { name: 'Bihać', kind: 'prop', group: 4, price: 220, rent: [18, 90, 250, 700, 875, 1050] },
  { name: 'Iznenađenje', kind: 'surprise' },
  { name: 'Cazin', kind: 'prop', group: 4, price: 230, rent: [19, 95, 260, 720, 890, 1070] },
  { name: 'Banja Luka', kind: 'prop', group: 4, price: 240, rent: [20, 100, 300, 750, 925, 1100] },
  { name: 'Kod babe', kind: 'free' },
  { name: 'Mostar', kind: 'prop', group: 5, price: 260, rent: [22, 110, 330, 800, 975, 1150] },
  { name: 'Šansa', kind: 'chance' },
  { name: 'Neum', kind: 'prop', group: 5, price: 280, rent: [24, 120, 360, 850, 1025, 1200] },
  { name: 'Sarajevo', kind: 'prop', group: 5, price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
  { name: 'Stanica Banja Luka', kind: 'station', price: 200 },
  { name: 'Buzuci', kind: 'prop', group: 6, price: 320, rent: [28, 150, 450, 1000, 1200, 1400] },
  { name: 'Brnjaci', kind: 'prop', group: 6, price: 330, rent: [29, 155, 460, 1020, 1220, 1420] },
  { name: 'Vodovod Sarajevo', kind: 'utility', price: 150, icon: 'water' },
  { name: 'Kiseljak', kind: 'prop', group: 6, price: 340, rent: [30, 160, 470, 1050, 1250, 1450] },
  { name: 'Idi u Zenicu', kind: 'gotojail' },
  { name: 'Ilidža', kind: 'prop', group: 7, price: 360, rent: [35, 175, 500, 1100, 1300, 1500] },
  { name: 'Azići', kind: 'prop', group: 7, price: 380, rent: [38, 185, 550, 1200, 1450, 1700] },
  { name: 'Iznenađenje', kind: 'surprise' },
  { name: 'Travnik', kind: 'prop', group: 8, price: 370, rent: [36, 180, 520, 1150, 1350, 1550] },
  { name: 'Stanica Mostar', kind: 'station', price: 200 },
  { name: 'Šansa', kind: 'chance' },
  { name: 'Prahulje', kind: 'prop', group: 8, price: 390, rent: [40, 190, 570, 1250, 1500, 1750] },
  { name: 'Porez na luksuz', kind: 'tax', amount: 100 },
  { name: 'Nova Bila', kind: 'prop', group: 8, price: 400, rent: [50, 200, 600, 1400, 1700, 2000] },
];

export const BUYABLE = FIELDS.map((f, i) => (f.price ? i : -1)).filter((i) => i >= 0);
export const STATIONS = [5, 15, 25, 35];
export const UTILITIES = [12, 28];
export const groupOf = (g) => FIELDS.map((f, i) => (f.group === g ? i : -1)).filter((i) => i >= 0);

export const FIGURES = [
  { id: 'dzezva', name: 'Džezva' },
  { id: 'golf', name: 'Golf dvojka' },
  { id: 'fildzan', name: 'Fildžan' },
  { id: 'subara', name: 'Šubara' },
  { id: 'kanister', name: 'Kanister' },
  { id: 'kljuc', name: 'Treći ključ' },
];
export const PLAYER_COLORS = ['#1f4fa3', '#d2242a', '#1f9a4b', '#8e44ad', '#e67e22', '#16a3a3'];

// Odobrene kartice: 20 Šansi i 20 Iznenađenja.
export const CHANCE = [
 {
  "title": "Travnička diploma",
  "text": "Svratio kod Harija na desetku. Dok si pojeo, završio fakultet.",
  "effect": "cash",
  "value": -150,
  "effectText": "Plati 150 KM banci."
 },
 {
  "title": "Bakirovih 100.000 radnih mjesta",
  "text": "Našao i ti svoje. U Njemačkoj.",
  "effect": "cash",
  "value": 100,
  "effectText": "Primi 100 KM iz banke."
 },
 {
  "title": "Dodikov referendum",
  "text": "Opet najavio odlazak. Ti već platio muziku za ispraćaj.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "Čovićev izborni zakon",
  "text": "Ne priznaješ rezultat kockice dok ne provjeriš ko ju je birao.",
  "effect": "again",
  "value": 0,
  "effectText": "Dobivaš novo bacanje."
 },
 {
  "title": "Bakir, Dodik i Čović",
  "text": "Ti se zbog njih posvađao s komšijom. Oni zajedno na ručku.",
  "effect": "cash",
  "value": -40,
  "effectText": "Plati 40 KM banci."
 },
 {
  "title": "Bosna ulazi u EU",
  "text": "Zasad samo pojedinačno, preko granice.",
  "effect": "station",
  "value": 0,
  "effectText": "Idi na najbližu sljedeću stanicu."
 },
 {
  "title": "Popis 2013.",
  "text": "Po papirima puna kuća. Uživo poštar ostavlja račune pod kamen.",
  "effect": "cash",
  "value": -40,
  "effectText": "Plati 40 KM banci."
 },
 {
  "title": "Stranačka iskaznica",
  "text": "Diploma ti otvorila fasciklu. Iskaznica vrata.",
  "effect": "cash",
  "value": 120,
  "effectText": "Primi 120 KM iz banke."
 },
 {
  "title": "Tender po mjeri",
  "text": "Traže firmu osnovanu jučer, s vlasnikom tvog imena. Kakva slučajnost.",
  "effect": "cash",
  "value": 150,
  "effectText": "Primi 150 KM iz banke."
 },
 {
  "title": "Digitalizacija",
  "text": "Online zahtjev uspješno zaprimljen. Sad ga isprintaj i donesi.",
  "effect": "back",
  "value": 2,
  "effectText": "Vrati se 2 polja."
 },
 {
  "title": "Fali jedan papir",
  "text": "Imaš original, kopiju i ovjeru. Treba kopija ovjerene kopije.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Predizborni paket",
  "text": "Četiri godine ništa. Danas ulje, brašno i broj za zaokružit.",
  "effect": "cash",
  "value": 50,
  "effectText": "Primi 50 KM iz banke."
 },
 {
  "title": "Samo nek ne puca",
  "text": "Pitao zašto nema vode. Odgovor počeo devedeset prve.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Komentari na Klixu",
  "text": "Otvorio vijest o jagodama. Završio u raspravi čija je država.",
  "effect": "back",
  "value": 3,
  "effectText": "Vrati se 3 polja."
 },
 {
  "title": "Vučić izgubio izbore",
  "text": "Tetak traži drugi kanal. Na svakom ista vijest.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Naši i njihovi",
  "text": "Za njihove tražiš zatvor. Za svog kažeš da mu je namješteno.",
  "effect": "cash",
  "value": -80,
  "effectText": "Plati 80 KM banci."
 },
 {
  "title": "Snimljen razgovor",
  "text": "„Ovo nemoj nikome.” Sutra cijela država sluša.",
  "effect": "choice",
  "value": 150,
  "effectText": "Plati 150 KM ili jedan potez u Zenici."
 },
 {
  "title": "Građevinska dozvola",
  "text": "Kuća gotova. Sad da vidimo smije li tu stajat.",
  "effect": "repairs",
  "value": 40,
  "effectText": "Plati 40 KM po nadogradnji."
 },
 {
  "title": "Povrat poreza",
  "text": "Država ti vratila tvoje pare. Osjećaš se kao da si dobio na lotu.",
  "effect": "cash",
  "value": 100,
  "effectText": "Primi 100 KM iz banke."
 },
 {
  "title": "Pomilovanje",
  "text": "Izašao prije nego što je mater komšiluku objasnila da si poslovno odsutan.",
  "effect": "free",
  "value": 0,
  "effectText": "Sačuvaj za besplatan izlazak iz Zenice."
 }
];
export const SURPRISE = [
 {
  "title": "Maksuz pozdrav",
  "text": "Baba te maksuz pozdravila.",
  "effect": "cash",
  "value": 50,
  "effectText": "Primi 50 KM iz banke."
 },
 {
  "title": "Javio se Crni",
  "text": "„Čujem da po Hercegovini pričaš o Novoj Biloj. Momak nije prijetnja, je l’ tako?”",
  "effect": "choice",
  "value": 200,
  "effectText": "Plati 200 KM ili jedan potez u Zenici."
 },
 {
  "title": "Hari ili Željo?",
  "text": "„Dobri su, ali kod nas…” I ručak je službeno propao.",
  "effect": "duel",
  "value": 50,
  "effectText": "Ćevap-duel za 50 KM."
 },
 {
  "title": "Brajlović",
  "text": "Naručili za dvoje. Konobar pita gdje će ostali sjest.",
  "effect": "cash",
  "value": -60,
  "effectText": "Plati 60 KM banci."
 },
 {
  "title": "Burek sa sirom",
  "text": "Tražio doručak. Dobio predavanje o nacionalnoj gastronomiji.",
  "effect": "cash",
  "value": -20,
  "effectText": "Plati 20 KM banci."
 },
 {
  "title": "Bingo",
  "text": "Ušao po kruh. Na kasi te pitaju treba li dostava.",
  "effect": "cash",
  "value": -80,
  "effectText": "Plati 80 KM banci."
 },
 {
  "title": "Konzum bodovi",
  "text": "Skupljao pola godine. Fale dva za tavu koju ne trebaš.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Peče se rakija",
  "text": "Svaki komšija došao provjerit je li dobra. Za prodaju ostalo pola kanistera.",
  "effect": "cash",
  "value": 60,
  "effectText": "Primi 60 KM iz banke."
 },
 {
  "title": "Pravi se pekmez",
  "text": "Kupio šljive, šećer, drva i tegle. Baba kaže da je domaće džaba.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "Svinjokolja",
  "text": "Došao pomoći. Uhvatio se flaše prije noža. Poslali te po kruh.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Ajvar",
  "text": "Rekli „samo malo paprika”. Tri dana ne osjećaš prste.",
  "effect": "cash",
  "value": 80,
  "effectText": "Primi 80 KM iz banke."
 },
 {
  "title": "Svadbena koverta",
  "text": "Mater provjerila koliko su oni vama dali. Dodaj još dvadeset, da se ne priča.",
  "effect": "cash",
  "value": -120,
  "effectText": "Plati 120 KM banci."
 },
 {
  "title": "Naručio pjesmu",
  "text": "Pjevač pogrešno izgovorio ime. Sad plaćaš opet da ispravi.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "U Zenicu kada pođem ja…",
  "text": "Znaš prvu strofu. Ostatak ćeš naučit na licu mjesta.",
  "effect": "jail",
  "value": 0,
  "effectText": "Idi u Zenicu bez naplate Starta."
 },
 {
  "title": "Treći ključ",
  "text": "Kupio auto u Novoj Biloj. Dva ključa dobio. Treći se sam dovezao po auto.",
  "effect": "cash",
  "value": -100,
  "effectText": "Plati 100 KM banci."
 },
 {
  "title": "Sarajevski smog",
  "text": "Pratio zadnja svjetla. Završio čovjeku u garaži.",
  "effect": "back",
  "value": 3,
  "effectText": "Vrati se 3 polja."
 },
 {
  "title": "Siguran tiket",
  "text": "Devet prošlo. Deseti završio 0:0, a ti čekao jedan gol.",
  "effect": "cash",
  "value": -40,
  "effectText": "Plati 40 KM banci."
 },
 {
  "title": "Rođendan u kafani",
  "text": "Neko viknuo da častiš. Ti se nasmijao. Konobar shvatio ozbiljno.",
  "effect": "everyone",
  "value": 10,
  "effectText": "Plati svakom igraču 10 KM."
 },
 {
  "title": "Prahulje šalju",
  "text": "Krenuo kući s jednom kesom. Sad ti treba pomoć do auta.",
  "effect": "cash",
  "value": 80,
  "effectText": "Primi 80 KM iz banke."
 },
 {
  "title": "Našao pare u jakni",
  "text": "Izvadio zimsku jaknu. Prošlogodišnji ti ostavio nešto pametno.",
  "effect": "cash",
  "value": 50,
  "effectText": "Primi 50 KM iz banke."
 }
];
