// Crtanje ploče, figurica, kartica i ilustracija. Sve je vlastita SVG grafika.
import { FIELDS, GROUP_COLOR, HOUSE_COST, RULES, CHANCE, SURPRISE, GAME_NAME } from './shared/data.js';

export const km = (n) => `${Math.round(n).toLocaleString('de-DE')} KM`;
const G = Object.fromEntries(Object.entries(GROUP_COLOR).map(([k]) => [k, `--g${k}`]));
export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const S='fill="none" stroke="#141414" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const IC={
 train:`<svg viewBox="0 0 48 48" ${S}><path d="M6 32h30l4-6V18H28v-6h-8v6H10v14"/><path d="M14 18v-6h4M30 18v-4h4v4"/><rect x="31" y="20" width="7" height="5" fill="#141414"/><circle cx="12" cy="36" r="4" fill="#fff"/><circle cx="24" cy="36" r="4" fill="#fff"/><circle cx="35" cy="36" r="3" fill="#fff"/><path d="M4 41h40"/></svg>`,
 bolt:`<svg viewBox="0 0 48 48" ${S}><path d="M27 4 12 27h10l-3 17 17-25H25z" fill="#f4dc1a"/></svg>`,
 water:`<svg viewBox="0 0 48 48" ${S}><path d="M10 14h18v6H10zM28 16h6a6 6 0 0 1 6 6v4h-6v-4h-6"/><path d="M18 10v4M14 10h8"/><path d="M37 32c0 4-3 6-3 6s-3-2-3-6c0-3 3-6 3-6s3 3 3 6z" fill="#86c5e3"/></svg>`,
 tax:`<svg viewBox="0 0 48 48" ${S}><rect x="12" y="6" width="24" height="32"/><path d="M17 14h14M17 20h14M17 26h9"/><circle cx="33" cy="36" r="8" fill="#f4dc1a"/><path d="M30 36h6"/></svg>`,
 ring:`<svg viewBox="0 0 48 48" ${S}><circle cx="24" cy="31" r="11"/><path d="M18 14l6-8 6 8-6 6z" fill="#a9d8ef"/></svg>`,
 box:`<svg viewBox="0 0 48 48" ${S}><path d="M8 20h32v22H8z" fill="#86c5e3"/><path d="M6 14h36v6H6zM24 14v28"/><path d="M24 14c-6-10-14-4-8 0M24 14c6-10 14-4 8 0"/></svg>`,
 dzezva:`<svg viewBox="0 0 48 48" ${S}><path d="M16 18h16l3 20a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4z" fill="#d9a35b"/><path d="M14 18l-4-4M32 22h10"/><path d="M20 12c0-3 3-3 3-6M26 12c0-3 3-3 3-6"/></svg>`,
 cuffs:`<svg viewBox="0 0 48 48" ${S}><circle cx="14" cy="28" r="8"/><circle cx="34" cy="28" r="8"/><path d="M20 22c2-6 6-6 8 0"/></svg>`,
 city:{
  'Donji Vakuf':`<svg viewBox="0 0 40 40" ${S}><path d="M20 4v6M17 10h6l-1 4v20h-4V14z"/><path d="M8 34V22a5 5 0 0 1 10 0v12M24 34V24h10v10M4 34h32"/></svg>`,
  'Bugojno':`<svg viewBox="0 0 40 40" ${S}><path d="M4 26c4-3 8-3 12 0s8 3 12 0 6-2 8 0M4 32c4-3 8-3 12 0s8 3 12 0 6-2 8 0"/><path d="M10 18c6-6 14-6 18 0-4 6-12 6-18 0zM28 18l5-4v8z" fill="#a9d8ef"/></svg>`,
  'Jajce':`<svg viewBox="0 0 40 40" ${S}><path d="M4 12h12l2 6h18"/><path d="M18 18c0 6-1 10 0 16M22 18c0 6 1 10 0 16M26 18c0 6 2 10 2 16" stroke="#3a8fc4"/><path d="M4 12v22h12M6 6l4-4 4 4M4 34h32"/></svg>`,
  'Konjic':`<svg viewBox="0 0 40 40" ${S}><path d="M4 28c4-2 8-2 12 0s8 2 12 0 6-2 8 0"/><path d="M8 22h22l-3 4H11z" fill="#f08a24"/><path d="M28 8 16 30"/><circle cx="18" cy="17" r="3"/></svg>`,
  'Trebinje':`<svg viewBox="0 0 40 40" ${S}><path d="M2 30h36M4 30v-6c0-4 4-8 8-8s8 4 8 8v6M20 30v-6c0-4 4-8 8-8s8 4 8 8v6"/><path d="M2 16h36"/><path d="M8 10c0-4 4-6 6-4M28 10c0-4 4-6 6-4" stroke="#1f9a4b"/></svg>`,
  'Brčko':`<svg viewBox="0 0 40 40" ${S}><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="10" stroke-dasharray="2 2"/><path d="M14 16h12M14 20h12M14 24h8"/></svg>`,
  'Doboj':`<svg viewBox="0 0 40 40" ${S}><path d="M4 34V18h4v4h4v-4h4v4h4V12h4v4h4v-4h4v22z"/><path d="M14 34v-6a3 3 0 0 1 6 0v6"/></svg>`,
  'Tuzla':`<svg viewBox="0 0 40 40" ${S}><path d="M13 14h14l2 20H11z"/><path d="M14 14c0-6 12-6 12 0"/><path d="M17 9h1M20 8h1M23 9h1" stroke-width="2.6"/></svg>`,
  'Bihać':`<svg viewBox="0 0 40 40" ${S}><path d="M4 10h10l3 8h19"/><path d="M17 18v14M21 18v14M25 18v14M29 18v14" stroke="#3a8fc4"/><path d="M4 34h32M4 10v24"/></svg>`,
  'Cazin':`<svg viewBox="0 0 40 40" ${S}><path d="M10 34V14h-2V8h4v3h4V8h4v3h4V8h4v6h-2v20z"/><path d="M17 34v-7a3 3 0 0 1 6 0v7M4 34h32"/></svg>`,
  'Banja Luka':`<svg viewBox="0 0 40 40" ${S}><path d="M20 34V22"/><path d="M20 22c-10 0-14-6-10-12 2-4 8-6 10-4 2-2 8 0 10 4 4 6 0 12-10 12z" fill="#1f9a4b" fill-opacity=".25"/><path d="M14 34h12"/></svg>`,
  'Mostar':`<svg viewBox="0 0 40 40" ${S}><path d="M2 30c4-14 10-20 18-20s14 6 18 20"/><path d="M2 26c4-12 10-18 18-18s14 6 18 18"/><path d="M2 34c4-2 8-2 12 0s8 2 12 0 8-2 12 0" stroke="#3a8fc4"/></svg>`,
  'Neum':`<svg viewBox="0 0 40 40" ${S}><path d="M6 18c4-10 24-10 28 0z" fill="#d8232a" fill-opacity=".3"/><path d="M20 18v16"/><path d="M2 32c4-2 8-2 12 0s8 2 12 0 8-2 12 0" stroke="#3a8fc4"/><circle cx="33" cy="7" r="3" fill="#f4dc1a"/></svg>`,
  'Sarajevo':`<svg viewBox="0 0 40 40" ${S}><path d="M10 34V18h20v16M8 18h24M12 18c0-8 16-8 16 0"/><path d="M20 6v4M16 26h8M8 34h24"/></svg>`,
  'Buzuci':`<svg viewBox="0 0 40 40" ${S}><path d="M8 34c0-14 6-26 12-26s12 12 12 26z" fill="#f4dc1a" fill-opacity=".4"/><path d="M20 4v30M14 20l4 2M24 26l3-2"/></svg>`,
  'Brnjaci':`<svg viewBox="0 0 40 40" ${S}><path d="M6 34V18l10-8 10 8v16zM12 34v-8h6v8"/><path d="M26 22h10M26 28h10M30 18v16M35 18v16"/></svg>`,
  'Kiseljak':`<svg viewBox="0 0 40 40" ${S}><path d="M16 4h8v4l3 6v20H13V14l3-6z"/><path d="M13 20h14v8H13z" fill="#a9d8ef"/><circle cx="18" cy="16" r="1"/><circle cx="22" cy="12" r="1"/></svg>`,
  'Ilidža':`<svg viewBox="0 0 40 40" ${S}><path d="M4 30c8-2 14-2 16 0s10 2 16 0" stroke="#3a8fc4"/><path d="M14 24c-4 0-6-4-2-6l6-2c0-6-4-6-6-4M18 16c6-2 12 2 12 8H14"/></svg>`,
  'Azići':`<svg viewBox="0 0 40 40" ${S}><path d="M8 34V6h14v28M22 14h10v20"/><path d="M12 10h2M17 10h2M12 15h2M17 15h2M12 20h2M17 20h2M12 25h2M17 25h2M26 19h2M26 24h2M4 34h32"/></svg>`,
  'Travnik':`<svg viewBox="0 0 40 40" ${S}><ellipse cx="20" cy="26" rx="16" ry="7"/><path d="M10 24h10M12 21h10M14 27h9" stroke-width="3"/><path d="M26 18c4-2 8 0 8 4" /></svg>`,
  'Prahulje':`<svg viewBox="0 0 40 40" ${S}><path d="M20 34V20"/><path d="M20 20c-8 0-12-4-10-10s8-6 10-2c2-4 8-4 10 2s-2 10-10 10z" fill="#1f9a4b" fill-opacity=".2"/><ellipse cx="14" cy="26" rx="3" ry="4" fill="#6b3fa0"/><ellipse cx="27" cy="25" rx="3" ry="4" fill="#6b3fa0"/></svg>`,
  'Nova Bila':`<svg viewBox="0 0 40 40" ${S}><path d="M6 30 4 12l9 8 7-12 7 12 9-8-2 18z" fill="#f4dc1a"/><path d="M6 34h28"/><circle cx="20" cy="22" r="2" fill="#d8232a"/></svg>`
 },
 ili:{
  cevapi:`<svg viewBox="0 0 64 64" ${S}><ellipse cx="32" cy="40" rx="26" ry="10"/><path d="M14 36c4-6 8-6 12 0M24 35c4-6 8-6 12 0M34 36c4-6 8-6 12 0"/><path d="M40 22l6-10M46 24l8-8"/></svg>`,
  kljuc:`<svg viewBox="0 0 64 64" ${S}><circle cx="20" cy="32" r="10"/><circle cx="20" cy="32" r="3"/><path d="M30 32h26M48 32v8M54 32v6"/></svg>`,
  telefon:`<svg viewBox="0 0 64 64" ${S}><rect x="20" y="8" width="24" height="46" rx="3"/><path d="M28 13h8"/><circle cx="32" cy="48" r="2"/><path d="M50 18c4 4 4 10 0 14M54 14c7 7 7 18 0 25"/></svg>`
 }
};
IC.ili.rakija = `<svg viewBox="0 0 64 64" ${S}><path d="M26 6h12v10l6 8v34H20V24l6-8z"/><path d="M20 34h24v14H20z"/><path d="M50 40h8l-1 14h-6z"/></svg>`;
IC.ili.tegla = `<svg viewBox="0 0 64 64" ${S}><path d="M18 18h28v6c4 2 4 6 4 10v18a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V34c0-4 0-8 4-10z"/><path d="M16 12h32v6H16zM22 38h20v10H22z"/></svg>`;
IC.ili.kocka = `<svg viewBox="0 0 64 64" ${S}><rect x="12" y="12" width="40" height="40" rx="6"/><circle cx="22" cy="22" r="3" fill="#141414"/><circle cx="32" cy="32" r="3" fill="#141414"/><circle cx="42" cy="42" r="3" fill="#141414"/></svg>`;
IC.ili.vlak = IC.train;
IC.ili.kljucevi = `<svg viewBox="0 0 64 64" ${S}><rect x="10" y="22" width="44" height="30"/><path d="M18 22V12h28v10M22 32h20M22 40h12"/></svg>`;
export { IC };

// Male ilustracije uz pojedine kartice (skromno, tekst ostaje glavni).
const CARD_ILL = {
  'Travnička diploma': 'cevapi', 'Hari ili Željo?': 'cevapi', 'Treći ključ': 'kljuc', 'Javio se Crni': 'telefon',
  'Snimljen razgovor': 'telefon', 'Peče se rakija': 'rakija', 'Pravi se pekmez': 'tegla', 'Čovićev izborni zakon': 'kocka',
  'Bosna ulazi u EU': 'vlak', 'Pomilovanje': 'kljucevi',
};

export function pos(i){ // red, stupac, rotacija
 if(i===0)return[11,11,0]; if(i<10)return[11,11-i,0]; if(i===10)return[11,1,0];
 if(i<20)return[11-(i-10),1,90]; if(i===20)return[1,1,0]; if(i<30)return[1,1+(i-20),180];
 if(i===30)return[1,11,0]; return[1+(i-30),11,-90];
}

export const TOK = {
 dzezva:`<svg viewBox="0 0 32 32"><path d="M10 11h12l2 15a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.3"/><path d="M10 11 6 7" stroke="#3a3d42" stroke-width="2.4" stroke-linecap="round"/><path d="M22 14h7" stroke="#3a3d42" stroke-width="2.6" stroke-linecap="round"/><path d="M12 15h3v12h-3z" fill="#e8eaec" opacity=".7"/></svg>`,
 golf:`<svg viewBox="0 0 32 32"><path d="M3 21v-4l3-1 3-6h12l5 6 3 1v4z" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.3" stroke-linejoin="round"/><path d="M11 11h4v5h-6zM17 11h3l3 5h-6z" fill="#e8eaec" stroke="#3a3d42"/><circle cx="9" cy="22" r="3.2" fill="#55595f" stroke="#2a2c30"/><circle cx="23" cy="22" r="3.2" fill="#55595f" stroke="#2a2c30"/></svg>`,
 fildzan:`<svg viewBox="0 0 32 32"><path d="M7 11h18l-3 14H10z" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.3"/><ellipse cx="16" cy="27" rx="11" ry="2.6" fill="#a7aaae" stroke="#3a3d42"/><path d="M9 15h14" stroke="#7d8187"/><path d="M11 12h3v11h-2z" fill="#eef0f2" opacity=".7"/></svg>`,
 subara:`<svg viewBox="0 0 32 32"><path d="M6 20c0-8 4-13 10-13s10 5 10 13z" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.3"/><path d="M4 20h24v5H4z" fill="#8d9096" stroke="#3a3d42" stroke-width="1.3"/><path d="M9 12q7-4 14 0M8 16q8-4 16 0" stroke="#7d8187" fill="none"/></svg>`,
 kanister:`<svg viewBox="0 0 32 32"><path d="M7 9h14l4 4v15H7z" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 9V5h6v4" fill="none" stroke="#3a3d42" stroke-width="2"/><path d="M21 9l3-4h3v4" fill="#9ea2a7" stroke="#3a3d42" stroke-width="1.3"/><path d="M10 14l11 11M21 14 10 25" stroke="#7d8187" stroke-width="1.5"/></svg>`,
 kljuc:`<svg viewBox="0 0 32 32"><circle cx="10" cy="16" r="6.5" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.3"/><circle cx="10" cy="16" r="2.2" fill="#e8eaec" stroke="#3a3d42"/><path d="M16 14.5h13v3h-2v3h-3v-3h-2v2h-3v-2h-3z" fill="#b9bcc0" stroke="#3a3d42" stroke-width="1.2" stroke-linejoin="round"/></svg>`
};

export function cellHTML(f, i) {
 const n = f.name, k = { prop: 'p', station: 'st', utility: 'u', tax: 'tax', chance: 's', surprise: 'i', start: 'start', jail: 'jail', free: 'free', gotojail: 'go' }[f.kind];
 const a = f.kind === 'prop' ? f.group : f.kind === 'utility' ? f.icon : f.kind === 'tax' ? (f.amount === 100 ? 'ring' : 'tax') : 0;
 const b = f.price ?? `Plati ${km(f.amount || 0)}`;
 let h = '';
 if(k==='p') h=`<div class="band" style="background:var(${G[a]})"></div><div class="nm">${n}</div><div class="cty">${IC.city[n]||''}</div><div class="pr">${km(b)}</div>`;
 else if(k==='st') h=`<div class="nm">${n.replace('Stanica ','Stanica<br>')}</div><div class="ico">${IC.train}</div><div class="pr">${km(b)}</div>`;
 else if(k==='u') h=`<div class="nm">${n}</div><div class="ico sm">${IC[a]}</div><div class="pr">${km(b)}</div>`;
 else if(k==='tax') h=`<div class="nm">${n}</div><div class="ico sm">${IC[a]}</div><div class="pr">${b}</div>`;
 else if(k==='s') h=`<div class="nm">Šansa</div><div style="font:900 56px/1 var(--f-board);color:var(--red);-webkit-text-stroke:1.5px #141414;margin-top:8px">?</div>`;
 else if(k==='i') h=`<div class="nm">Iznenađenje</div><div class="ico">${IC.box}</div>`;
 else if(k==='start') h=`<div class="small">Prolaziš i primaš 200 KM</div><div class="big" style="font-size:22px">Legla<br>plata</div><svg viewBox="0 0 90 30" width="84" height="28"><path d="M86 15H16M28 3 12 15l16 12" fill="none" stroke="#d2242a" stroke-width="7" stroke-linejoin="round"/></svg>`;
 else if(k==='jail') h=`<div style="display:grid;grid-template-columns:30px 1fr;width:117px;height:117px"><div style="grid-row:1/3;display:flex;align-items:center;justify-content:center;border-right:1px solid #141414"><span style="transform:rotate(90deg);font:700 10px var(--f-board);white-space:nowrap;letter-spacing:.1em">SAMO U POSJETI</span></div><div style="background:#f08a24;border-bottom:1px solid #141414;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:87px;box-sizing:border-box"><span class="big" style="font-size:13px">KP dom<br>Zenica</span><svg viewBox="0 0 40 30" width="40" height="28"><rect x="2" y="2" width="36" height="26" fill="#fff" stroke="#141414" stroke-width="2"/><path d="M10 2v26M18 2v26M26 2v26M33 2v26" stroke="#141414" stroke-width="2.4"/></svg></div><div class="small" style="font-size:8.5px;display:flex;align-items:center;justify-content:center;font-style:italic;padding:0 2px">„U Zenicu kada pođem ja…”</div></div>`;
 else if(k==='free') h=`<div class="big">Kod</div><div class="ico" style="width:40px;height:40px;margin:0">${IC.dzezva}</div><div class="big">babe</div><div class="small">Predah, kahva i ništa se ne plaća</div>`;
 else if(k==='go') h=`<div class="big">Idi u</div><div class="ico" style="width:40px;height:40px;margin:0">${IC.cuffs}</div><div class="big">Zenicu</div><div class="small">Bez naplate Starta</div>`;
 return h;
}

function person(cx,o){
 const k='stroke="#141414" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
 let s=`<g>`;
 // ruke iza (podignuta ruka)
 if(o.arm==='glass') s+=`<path d="M${cx-50} 372 L${cx-92} 300 L${cx-104} 262" fill="none" ${k} stroke-width="26" stroke="#141414"/><path d="M${cx-50} 372 L${cx-92} 300 L${cx-104} 262" fill="none" stroke="${o.suit}" stroke-width="20" stroke-linecap="round"/><circle cx="${cx-104}" cy="254" r="13" fill="#f2c39b" ${k}/><path d="M${cx-114} 222h22l-3 22h-16z" fill="#e8f4ff" ${k}/><path d="M${cx-111} 232h16" stroke="#e7b84a" stroke-width="5"/>`;
 if(o.arm==='point') s+=`<path d="M${cx+50} 372 L${cx+80} 300 L${cx+86} 238" fill="none" stroke="#141414" stroke-width="26" stroke-linecap="round"/><path d="M${cx+50} 372 L${cx+80} 300 L${cx+86} 238" fill="none" stroke="${o.suit}" stroke-width="20" stroke-linecap="round"/><circle cx="${cx+86}" cy="230" r="13" fill="#f2c39b" ${k}/><path d="M${cx+86} 220v-26" stroke="#141414" stroke-width="12" stroke-linecap="round"/><path d="M${cx+86} 220v-26" stroke="#f2c39b" stroke-width="6" stroke-linecap="round"/>`;
 // tijelo
 s+=`<path d="M${cx-78} 480 L${cx-70} 360 Q${cx} 316 ${cx+70} 360 L${cx+78} 480 Z" fill="${o.suit}" ${k}/>`;
 s+=`<path d="M${cx-78} 480 L${cx-70} 360 Q${cx} 316 ${cx+70} 360 L${cx+78} 480 Z" fill="url(#dk)"/>`;
 s+=`<path d="M${cx-20} 334 L${cx} 388 L${cx+20} 334 Z" fill="#fff" ${k}/>`;
 s+=`<path d="M${cx-7} 340 h14 l5 56 l-12 14 l-12-14 z" fill="${o.tie}" ${k}/>`;
 s+=`<path d="M${cx-20} 334 L${cx-34} 400 M${cx+20} 334 L${cx+34} 400" ${k} fill="none"/>`;
 // vrat i glava
 s+=`<rect x="${cx-14}" y="312" width="28" height="26" fill="#f2c39b" ${k}/>`;
 s+=`<circle cx="${cx-40}" cy="282" r="9" fill="#f2c39b" ${k}/><circle cx="${cx+40}" cy="282" r="9" fill="#f2c39b" ${k}/>`;
 s+=`<ellipse cx="${cx}" cy="278" rx="40" ry="46" fill="#f2c39b" ${k}/>`;
 s+=`<ellipse cx="${cx+14}" cy="292" rx="22" ry="26" fill="url(#dk)" opacity=".6"/>`;
 // kosa
 if(o.hair==='bald') s+=`<path d="M${cx-40} 270 q-4 -26 8 -30 M${cx+40} 270 q4 -26 -8 -30" stroke="#9a9a9a" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${cx-14} 244 q10 -8 20 -4" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`;
 if(o.hair==='dark') s+=`<path d="M${cx-41} 272 q-6 -46 30 -52 q40 -6 52 30 q-26 -20 -50 -10 q-14 6 -32 32 z" fill="#3a2a1e" ${k}/>`;
 if(o.hair==='grey') s+=`<path d="M${cx-41} 268 q0 -44 40 -46 q44 0 42 44 q-12 -24 -36 -28 q-26 4 -46 30 z" fill="#d6d6d6" ${k}/>`;
 // obrve i oči
 const ey=o.look||0;
 s+=`<path d="M${cx-26} ${o.brow==='angry'?258:254} L${cx-8} ${o.brow==='angry'?264:254} M${cx+8} ${o.brow==='angry'?264:254} L${cx+26} ${o.brow==='angry'?258:254}" ${k} stroke-width="5" fill="none"/>`;
 s+=`<ellipse cx="${cx-16}" cy="274" rx="8" ry="10" fill="#fff" ${k} stroke-width="2.4"/><ellipse cx="${cx+16}" cy="274" rx="8" ry="10" fill="#fff" ${k} stroke-width="2.4"/>`;
 s+=`<circle cx="${cx-16+ey}" cy="276" r="3.6" fill="#141414"/><circle cx="${cx+16+ey}" cy="276" r="3.6" fill="#141414"/>`;
 if(o.glasses) s+=`<circle cx="${cx-16}" cy="274" r="13" fill="none" ${k}/><circle cx="${cx+16}" cy="274" r="13" fill="none" ${k}/><path d="M${cx-3} 274h6" ${k}/>`;
 s+=`<path d="M${cx-3} 280 q-6 14 4 16" ${k} fill="none" stroke-width="2.5"/>`;
 if(o.mous) s+=`<path d="M${cx-24} 302 q12 -10 24 -4 q12 -6 24 4 q-12 4 -24 0 q-12 4 -24 0z" fill="#8a8a8a" ${k} stroke-width="2.4"/>`;
 // usta
 if(o.mouth==='shout') s+=`<path d="M${cx-16} 302 q16 -6 32 0 q-4 20 -16 20 q-12 0 -16 -20z" fill="#8a1c1c" ${k} stroke-width="2.6"/><path d="M${cx-10} 304h20" stroke="#fff" stroke-width="3"/>`;
 if(o.mouth==='smug') s+=`<path d="M${cx-14} 310 q14 10 28 -4" ${k} fill="none"/>`;
 if(o.mouth==='grin') s+=`<path d="M${cx-18} 302 q18 22 36 0z" fill="#fff" ${k} stroke-width="2.6"/>`;
 // prekrižene ruke
 if(o.arm==='cross') s+=`<path d="M${cx-62} 420 q62 -24 124 0 v26 q-62 -18 -124 0z" fill="${o.suit}" ${k}/><circle cx="${cx-56}" cy="428" r="11" fill="#f2c39b" ${k}/><circle cx="${cx+56}" cy="428" r="11" fill="#f2c39b" ${k}/>`;
 // značka
 s+=`<circle cx="${cx-44}" cy="380" r="6" fill="${o.pin}" ${k} stroke-width="2"/>`;
 return s+`</g>`;
}
function bubble(cx,cy,w,h,tx,ty,lines){
 const k='stroke="#141414" stroke-width="3" stroke-linejoin="round"';
 return `<path d="M${cx-18} ${cy+h/2-6} L${tx} ${ty} L${cx+10} ${cy+h/2-4}" fill="#fff" ${k}/>
 <ellipse cx="${cx}" cy="${cy}" rx="${w/2}" ry="${h/2}" fill="#fff" ${k}/>
 <path d="M${cx-14} ${cy+h/2-8} L${tx} ${ty} L${cx+8} ${cy+h/2-6}" fill="#fff"/>
 <text x="${cx}" y="${cy-(lines.length-1)*9+5}" text-anchor="middle" font-family="'Comic Neue','Comic Sans MS',cursive" font-weight="700" font-size="16" fill="#141414">${lines.map((l,i)=>`<tspan x="${cx}" dy="${i?18:0}">${l}</tspan>`).join('')}</text>`;
}
export function centerArt(){
 let rays='';for(let i=0;i<24;i++){const a1=i*15*Math.PI/180,a2=(i*15+7.5)*Math.PI/180;rays+=`<path d="M333 330 L${333+700*Math.cos(a1)} ${330+700*Math.sin(a1)} L${333+700*Math.cos(a2)} ${330+700*Math.sin(a2)}Z" fill="#ffc531"/>`}
 const k='stroke="#141414" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
 return `<svg class="art" viewBox="0 0 666 666" aria-label="Stripska ilustracija: trojica političara na ručku u kafani">
 <defs>
  <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.8" fill="#f0a020"/></pattern>
  <pattern id="dk" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1.3" fill="#000" opacity=".22"/></pattern>
  <pattern id="chk" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#fff"/><rect width="14" height="14" fill="#d2242a"/><rect x="14" y="14" width="14" height="14" fill="#d2242a"/></pattern>
  <clipPath id="cov"><rect x="22" y="22" width="622" height="622"/></clipPath>
 </defs>
 <g clip-path="url(#cov)">
  <rect x="22" y="22" width="622" height="622" fill="#ffe27a"/>${rays}
  <rect x="22" y="22" width="622" height="622" fill="url(#dots)" opacity=".55"/>
  ${person(165,{suit:'#3b4a63',tie:'#1f9a4b',pin:'#1f9a4b',hair:'bald',glasses:true,mouth:'shout',brow:'angry',arm:'glass',look:3})}
  ${person(333,{suit:'#4a3b34',tie:'#1f4fa3',pin:'#1f4fa3',hair:'dark',mouth:'grin',brow:'up',arm:'point',look:0})}
  ${person(501,{suit:'#2f2f36',tie:'#d2242a',pin:'#d2242a',hair:'grey',mous:true,mouth:'smug',brow:'angry',arm:'cross',look:-3})}
  <!-- stol s karirani stolnjakom -->
  <path d="M40 452 H626 L644 560 H22 Z" fill="url(#chk)" ${k}/>
  <path d="M40 452 H626 L644 560 H22 Z" fill="url(#dk)" opacity=".35"/>
  <!-- ćevapi -->
  <ellipse cx="170" cy="470" rx="62" ry="16" fill="#fff" ${k}/>
  <path d="M128 466 q40 -14 84 0 q-42 12 -84 0z" fill="#e6c48a" ${k} stroke-width="2.4"/>
  ${[0,1,2,3,4].map(i=>`<rect x="${136+i*14}" y="456" width="10" height="20" rx="5" fill="#7a3b1c" stroke="#141414" stroke-width="2"/>`).join('')}
  <path d="M206 462 q8 -2 14 4" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- džezva i fildžani -->
  <path d="M288 440h30l5 34a5 5 0 0 1-5 5h-30a5 5 0 0 1-5-5z" fill="#c9893c" ${k}/><path d="M290 440l-10-8M318 448h16" ${k} stroke-width="5"/>
  <path d="M338 466h18l-3 12h-12z" fill="#fff" ${k} stroke-width="2.4"/>
  <!-- rakija -->
  <path d="M420 396h12v18l8 10v52h-28v-52l8-10z" fill="#e8f4ff" ${k}/><path d="M413 436h26v20h-26z" fill="#fff" ${k} stroke-width="2"/><text x="426" y="450" text-anchor="middle" font-family="var(--f-board)" font-weight="800" font-size="8">ŠLJIVA</text>
  <!-- račun -->
  <g transform="rotate(-8 360 506)"><path d="M300 486h120v52l-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5z" fill="#fffef4" ${k} stroke-width="2.4"/>
   <text x="360" y="504" text-anchor="middle" font-family="'Comic Neue','Comic Sans MS',cursive" font-weight="700" font-size="13" fill="#141414">RAČUN</text>
   <text x="360" y="522" text-anchor="middle" font-family="'Comic Neue','Comic Sans MS',cursive" font-weight="700" font-size="12" fill="#d2242a">plaća: NAROD</text></g>
  <!-- naslovnica -->
  <rect x="22" y="22" width="622" height="96" fill="#d2242a"/><path d="M22 118 H644" ${k} stroke-width="4"/>
  <rect x="22" y="22" width="622" height="96" fill="url(#dk)" opacity=".35"/>
  <text x="44" y="86" font-family="'League Spartan',sans-serif" font-weight="900" font-size="60" fill="#fff" stroke="#141414" stroke-width="3" paint-order="stroke" letter-spacing="1" class="g-name1">${GAME_NAME[0].toUpperCase()}</text>
  <text x="47" y="110" font-family="'League Spartan',sans-serif" font-weight="800" font-size="20" fill="#ffe27a" letter-spacing="9" class="g-name2">${GAME_NAME[1].toUpperCase()}</text>
  <g transform="rotate(10 586 70)"><circle cx="586" cy="70" r="38" fill="#ffe27a" ${k}/><text x="586" y="64" text-anchor="middle" font-family="'League Spartan',sans-serif" font-weight="900" font-size="15" fill="#141414">BR. 1</text><text x="586" y="84" text-anchor="middle" font-family="'League Spartan',sans-serif" font-weight="700" font-size="12" fill="#141414">2 KM</text></g>
  <!-- oblačići -->
  ${bubble(150,180,210,74,190,228,['OVO JE HISTORIJSKI','DOGOVOR!'])}
  ${bubble(515,184,210,74,486,232,['MOŽE. AL’ TEK','POSLIJE IZBORA.'])}
  ${bubble(333,158,170,62,330,222,['NIJE DOK NIJE','MOJ!'])}
  <!-- natpisna kutija -->
  <g transform="rotate(-2 333 600)"><rect x="186" y="572" width="294" height="58" fill="#fff6c9" ${k}/>
   <text x="333" y="596" text-anchor="middle" font-family="'Comic Neue','Comic Sans MS',cursive" font-weight="700" font-size="14" fill="#141414"><tspan x="333">Ti se zbog njih posvađao s komšijom.</tspan><tspan x="333" dy="18">Oni zajedno na ručku.</tspan></text></g>
 </g>
 <rect x="22" y="22" width="622" height="622" fill="none" ${k} stroke-width="4"/>
 </svg>`;
}


const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
export const dieHTML = (v) => `<div class="die" aria-label="Kockica ${v}">${[...Array(9)].map((_, k) => `<i class="${PIPS[v].includes(k) ? 'on' : ''}"></i>`).join('')}</div>`;

export function cardHTML(deck, idx) {
  const c = (deck === 'chance' ? CHANCE : SURPRISE)[idx];
  const ill = CARD_ILL[c.title];
  const eff = esc(c.effectText).replace(/(\d[\d.]* KM)/g, '<b>$1</b>');
  return `<div class="chance"><div class="t">${deck === 'chance' ? 'ŠANSA' : 'IZNENAĐENJE'}</div><div class="k">${esc(c.title)}</div>${ill ? `<div class="ill">${IC.ili[ill]}</div>` : ''}<p class="x">${esc(c.text)}</p><p class="e">${eff}</p></div>`;
}
export function backHTML(deck) {
  return deck === 'chance'
    ? '<div class="back s"><div><span class="q">?</span>ŠANSA</div></div>'
    : `<div class="back i"><div><span style="width:80px;height:80px">${IC.box}</span>IZNENAĐENJE</div></div>`;
}

// Vlasnički list: svi iznosi dolaze iz istih podataka koje koristi server.
export function deedHTML(pos) {
  const f = FIELDS[pos];
  if (f.kind === 'prop') {
    const r = f.rent, hc = HOUSE_COST[f.group];
    const names = FIELDS.filter((x) => x.group === f.group).map((x) => x.name);
    return `<div class="deed"><div class="in"><div class="hd${[2, 6].includes(f.group) ? ' light' : ''}" style="background:var(${G[f.group]})"><small>VLASNIČKI LIST</small><b>${f.name}</b></div>
 <div class="deed-ico">${IC.city[f.name] || ''}</div>
 <table><tr class="rent1"><td colspan="2">Kirija ${km(r[0])}</td></tr>
 <tr><td>S 1 kućom</td><td>${km(r[1])}</td></tr><tr><td>S 2 kuće</td><td>${km(r[2])}</td></tr><tr><td>S 3 kuće</td><td>${km(r[3])}</td></tr><tr><td>S 4 kuće</td><td>${km(r[4])}</td></tr>
 <tr><td colspan="2" class="hotel-row">S hotelom ${km(r[5])}</td></tr></table><hr>
 <table><tr><td>Cijena</td><td>${km(f.price)}</td></tr><tr><td>Hipoteka</td><td>${km(f.price * RULES.mortgageRate)}</td></tr><tr><td>Otkup</td><td>${km(Math.ceil(Math.round(f.price * RULES.unmortgageRate * 100) / 100))}</td></tr><tr><td>Kuća košta</td><td>${km(hc)}</td></tr><tr><td>Hotel košta</td><td>${km(hc)} + 4 kuće</td></tr></table>
 <div class="dnote">Ko ima cijelu grupu (${names.join(', ')}) naplaćuje duplu kiriju na praznim posjedima.</div></div></div>`;
  }
  if (f.kind === 'station') {
    return `<div class="deed"><div class="in"><div class="hd light" style="background:#fff"><small>ŽELJEZNIČKA STANICA</small><b>${f.name.replace('Stanica ', '')}</b></div>
 <div class="deed-ico big">${IC.train}</div>
 <table><tr><td>Kirija s 1 stanicom</td><td>${km(25)}</td></tr><tr><td>S 2 stanice</td><td>${km(50)}</td></tr><tr><td>S 3 stanice</td><td>${km(100)}</td></tr><tr><td>S 4 stanice</td><td>${km(200)}</td></tr></table><hr>
 <table><tr><td>Cijena</td><td>${km(f.price)}</td></tr><tr><td>Hipoteka</td><td>${km(f.price / 2)}</td></tr></table></div></div>`;
  }
  if (f.kind === 'utility') {
    return `<div class="deed"><div class="in"><div class="hd light" style="background:#fff"><small>REŽIJA</small><b>${f.name}</b></div>
 <div class="deed-ico big">${IC[f.icon]}</div>
 <div class="dnote" style="font-size:13px">Ako imaš jednu režiju, kirija je 4 puta zbir kockica.<br>Ako imaš obje, 10 puta zbir kockica.</div><hr>
 <table><tr><td>Cijena</td><td>${km(f.price)}</td></tr><tr><td>Hipoteka</td><td>${km(f.price / 2)}</td></tr></table></div></div>`;
  }
  return `<div class="deed"><div class="in"><div class="hd light" style="background:#fff"><b>${f.name}</b></div><div class="dnote" style="font-size:14px;margin:14px">${fieldInfo(pos)}</div></div></div>`;
}

function fieldInfo(pos) {
  const f = FIELDS[pos];
  return {
    start: `Svaki put kad prođeš ili staneš na Start, primaš ${km(RULES.passStart)}.`,
    tax: `Plaćaš ${km(f.amount || 0)} banci.`,
    chance: 'Izvlačiš kartu Šanse.', surprise: 'Izvlačiš kartu Iznenađenja.',
    jail: `„U Zenicu kada pođem ja…” Ako samo prolaziš, u posjeti si. Izlaz: duple kockice, pomilovanje ili ${km(RULES.jailFine)}.`,
    free: 'Predah kod babe. Kahva, ništa se ne plaća.',
    gotojail: 'Ideš ravno u KP dom Zenica, bez naplate Starta.',
  }[f.kind] || '';
}
