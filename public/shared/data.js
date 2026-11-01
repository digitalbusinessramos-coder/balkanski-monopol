// Zajednički podaci igre: koriste ih i server (pravila) i preglednik (prikaz).
// Naziv igre mijenja se samo ovdje.
export const GAME_NAME = ['Bosanski', 'monopol'];

export const RULES = {
  startMoney: 1800,
  passStart: 300, // dupla plata ako staneš baš na Start
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
  // Načelnik: izbori svakih 5 krugova u brzoj i 10 u klasičnoj partiji, samo kad igraju barem 3.
  mayorEveryFast: 5,
  mayorEveryClassic: 10,
  mayorMinPlayers: 3,
  mayorFee: 10,
  bribe: 100,
  stealCash: 100,
  betStake: 50,
  betWin: 150,
  mercedesBonus: 10,
  mercedesService: 30,
  barRate: 0.8, // birtija naplaćuje 80 % hotelske kirije, ali gost propušta sljedeći potez
};

// Auta se kupuju na stanicama. Igrač ima najviše jedan auto.
export const CARS = [
  { id: 'golf', name: 'Golf dvojka', price: 100, desc: 'Na tuđim stanicama plaćaš pola.' },
  { id: 'traktor', name: 'Traktor', price: 150, desc: 'Po selima džaba: na seoskim poljima bez kuća ne plaćaš kiriju, a s kućama plaćaš pola.' },
  { id: 'passat', name: 'Passat karavan', price: 200, desc: 'Na tuđim stanicama ne plaćaš ništa.' },
  { id: 'mercedes', name: 'Mercedes', price: 350, desc: 'Ko stane na tvoj posjed plaća 10 KM više. Na svakom prolasku Starta servis 30 KM.' },
];
export const carById = (id) => CARS.find((c) => c.id === id);
export const VILLAGES = ['Buzuci', 'Brnjaci', 'Azići', 'Prahulje'];

// Cijena gradnje po kućici za svaku grupu boja.
export const HOUSE_COST = { 1: 50, 2: 50, 3: 100, 4: 100, 5: 150, 6: 150, 7: 200, 8: 200 };

export const GROUP_COLOR = {
  1: '#8a4b2d', 2: '#a9d8ef', 3: '#d63c8f', 4: '#f08a24',
  5: '#d8232a', 6: '#f4dc1a', 7: '#1f9a4b', 8: '#1f4fa3',
};

// kind: start | prop | chance | surprise | tax | station | jail | utility | free | gotojail
// rent: [prazno, 1 kuća, 2, 3, 4, birtija]
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
  { name: 'Kladionica', kind: 'bet', amount: 50 },
  { name: 'Nova Bila', kind: 'prop', group: 8, price: 400, rent: [50, 200, 600, 1400, 1700, 2000] },
];

export const BUYABLE = FIELDS.map((f, i) => (f.price ? i : -1)).filter((i) => i >= 0);
export const STATIONS = [5, 15, 25, 35];
export const UTILITIES = [12, 28];
export const groupOf = (g) => FIELDS.map((f, i) => (f.group === g ? i : -1)).filter((i) => i >= 0);

export const FIGURES = [
  { id: 'dzezva', name: 'Džezva' },
  { id: 'nokia', name: 'Nokia' },
  { id: 'fildzan', name: 'Fildžan' },
  { id: 'harmonika', name: 'Harmonika' },
  { id: 'krigla', name: 'Krigla' },
  { id: 'rakija', name: 'Čašica rakije' },
];
export const PLAYER_COLORS = ['#1f4fa3', '#d2242a', '#1f9a4b', '#8e44ad', '#e67e22', '#16a3a3'];

// Kartice: 19 Šansi i 20 Iznenađenja.
export const CHANCE = [
 {
  "title": "Diploma",
  "text": "Svratio na ćevape, završio fakultet.",
  "effect": "cash",
  "value": -150,
  "effectText": "Plati 150 KM banci."
 },
 {
  "title": "Nisi u stranci",
  "text": "Obećali 100.000 radnih mjesta. Al ništa za tebe jer nisi u stranci.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "Ispraćaj",
  "text": "Opet najavio da odlazi. Ti opet platio muziku.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "Novi mercedesi",
  "text": "Trebaju sredstva za nove mercedese.",
  "effect": "cash",
  "value": -40,
  "effectText": "Plati 40 KM banci."
 },
 {
  "title": "Poslao me Enes",
  "text": "Rekao da te poslao Enes.",
  "effect": "cash",
  "value": 120,
  "effectText": "Primi 120 KM iz banke."
 },
 {
  "title": "Javni natječaj",
  "text": "Raspisan javni natječaj. Već se zna ko je dobio: ti.",
  "effect": "cash",
  "value": 150,
  "effectText": "Primi 150 KM iz banke."
 },
 {
  "title": "E-uprava",
  "text": "Predao online. Sad isprintaj i donesi.",
  "effect": "back",
  "value": 2,
  "effectText": "Vrati se 2 polja."
 },
 {
  "title": "Još jedan papir",
  "text": "Fali još samo jedan papir.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Asfalt",
  "text": "Počeli asfaltirat cestu i u tvom selu. Znači idu izbori.",
  "effect": "cash",
  "value": 50,
  "effectText": "Primi 50 KM iz banke."
 },
 {
  "title": "Ključevi",
  "text": "Zaboravio ključeve.",
  "effect": "back",
  "value": 3,
  "effectText": "Vrati se 3 polja."
 },
 {
  "title": "Među nama",
  "text": "Rekao „ovo ostaje među nama”. Nije ostalo.",
  "effect": "choice",
  "value": 150,
  "effectText": "Plati 150 KM ili jedan potez u Zenici."
 },
 {
  "title": "Majstor",
  "text": "Pukla cijev. Majstor rekao da će doći danas. Nije došao.",
  "effect": "repairs",
  "value": 40,
  "hotel": 115,
  "effectText": "Plati 40 KM po kućici i 115 KM po hotelu ili birtiji."
 },
 {
  "title": "Vikendica",
  "text": "Mater rekla da si u Njemačkoj. Ti na vikendici.",
  "effect": "free",
  "value": 0,
  "effectText": "Sačuvaj za besplatan izlazak iz Zenice."
 },
 {
  "title": "Bosna ulazi u EU",
  "text": "Zasad samo pojedinačno, preko granice.",
  "effect": "station",
  "value": 0,
  "effectText": "Idi na najbližu sljedeću stanicu."
 },
 {
  "title": "Vučić izgubio izbore",
  "text": "Tetak traži drugi kanal. Na svakom ista vijest.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Povrat poreza",
  "text": "Država ti vratila tvoje pare. Osjećaš se kao da si dobio na lotu.",
  "effect": "cash",
  "value": 100,
  "effectText": "Primi 100 KM iz banke."
 }
 ,{ "title": "Kava s načelnikom", "text": "Kavu platio ti.", "effect": "mayor", "value": 30, "effectText": "Plati načelniku 30 KM. Ako nema načelnika, ide u bubanj." }
 ,{ "title": "Kašika u med", "text": "Upala ti kašika u med.", "effect": "cash", "value": 100, "effectText": "Primi 100 KM iz banke." }
 ,{ "title": "Bratić iz Austrije", "text": "Došao bratić. Ti plaćaš piće.", "effect": "cash", "value": -30, "effectText": "Plati 30 KM banci." }
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
  "title": "Večera",
  "text": "Došao na večeru. Vraćaju te trojica.",
  "effect": "cash",
  "value": -60,
  "effectText": "Plati 60 KM banci."
 },
 {
  "title": "Po kruh",
  "text": "Otišao po kruh, vratio se s još dvije kese.",
  "effect": "cash",
  "value": -80,
  "effectText": "Plati 80 KM banci."
 },
 {
  "title": "Peče se rakija",
  "text": "Svaki susjed došao probat. Ostalo pola kanistera.",
  "effect": "cash",
  "value": 60,
  "effectText": "Primi 60 KM iz banke."
 },
 {
  "title": "Degustacija",
  "text": "Svi kažu da će pomoć. Dođu kad je gotovo, pomoć degustirat.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "Svinjokolja",
  "text": "Uhvatio se rakije prije noža.",
  "effect": "cash",
  "value": -30,
  "effectText": "Plati 30 KM banci."
 },
 {
  "title": "Koverta",
  "text": "Mater provjerila u bilježnici koliko su oni dali. Dodaj 50 KM da se ne osramotite.",
  "effect": "cash",
  "value": -120,
  "effectText": "Plati 120 KM banci."
 },
 {
  "title": "Krivo ime",
  "text": "Pjevač pogriješio ime. Sad naruči opet.",
  "effect": "cash",
  "value": -50,
  "effectText": "Plati 50 KM banci."
 },
 {
  "title": "Patron župe",
  "text": "Slavi se patron župe. Poslije mise svi već imaju po promil i po.",
  "effect": "cash",
  "value": -60,
  "effectText": "Plati 60 KM banci."
 },
 {
  "title": "Magla",
  "text": "Pratio svjetla, završio u tuđem dvorištu.",
  "effect": "back",
  "value": 3,
  "effectText": "Vrati se 3 polja."
 },
 {
  "title": "Dojava od rođe",
  "text": "Rođo javio da će bit 3:2 za nas. Potkupio suca.",
  "effect": "cash",
  "value": -40,
  "effectText": "Plati 40 KM banci."
 },
 {
  "title": "Ko časti?",
  "text": "Neko viknuo da ti častiš.",
  "effect": "everyone",
  "value": 10,
  "effectText": "Plati svakom igraču 10 KM."
 },
 {
  "title": "Zimska jakna",
  "text": "Vani 5 stupnjeva. Izvadio zimsku jaknu, a u njoj pedeset maraka.",
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
  "title": "Burek sa sirom",
  "text": "Tražio doručak. Dobio predavanje o nacionalnoj gastronomiji.",
  "effect": "cash",
  "value": -20,
  "effectText": "Plati 20 KM banci."
 },
 {
  "title": "U Zenicu kada pođem ja…",
  "text": "Znaš prvu strofu. Ostatak ćeš naučit na licu mjesta.",
  "effect": "jail",
  "value": 0,
  "effectText": "Idi u Zenicu bez naplate Starta."
 },
 {
  "title": "Hari ili Željo?",
  "text": "Ti navijaš za Harija, a suparnik za Želju. Zna se ko je bolji.",
  "effect": "duel",
  "value": 50,
  "effectText": "Biraš suparnika. Pobjednik nosi 50 KM."
 }
 ,{ "title": "Didov auto", "text": "Did ti ostavio auto. 380 tisuća kilometara.", "effect": "car", "value": 100, "effectText": "Dobiješ Golfa. Ako već imaš auto, primi 100 KM." }
 ,{ "title": "Tetka iz Njemačke", "text": "Stigla tetka iz Njemačke. Poklon iz dijaspore.", "effect": "cash", "value": 100, "effectText": "Primi 100 KM iz banke." }
 ,{ "title": "Policija na okuci", "text": "Nisu ti mogli ništa nać, al plati 20 KM da te puste.", "effect": "cash", "value": -20, "effectText": "Plati 20 KM banci." }
];
