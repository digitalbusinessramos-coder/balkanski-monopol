# Bosanski monopol

Online igra kupovanja nekretnina po BiH, u stilu klasične društvene igre. Igra 2 do 6 ljudi, svako sa svog mobitela ili računala, u privatnoj sobi s kodom i linkom. Bez registracije.

## Kako radi

- **Stranica** (`public/`): obični HTML, CSS i JavaScript, bez build koraka.
- **Server** (`netlify/functions/api.mjs`): jedna Netlify funkcija za sve `/api/*` adrese. Ona baca kockice, provjerava svaki potez i čuva stanje.
- **Stanje soba**: Netlify Blobs, ugrađeno spremište na samom Netlifyju. Ne treba poseban račun, bazu ni tajne ključeve.
- **Zaštita poteza**: svaka verzija sobe upisuje se samo jednom (`onlyIfNew`). Ako dva poteza stignu u isto vrijeme, prolazi samo jedan. Ista radnja poslana dvaput (dupli klik, prekid veze) prepozna se po ID-u i ne izvrši se ponovo. Potez poslan sa zastarjelog stanja se odbija.
- **Igrači**: svaki igrač dobije tajni token koji ostaje samo u njegovom pregledniku. Server sprema samo njegov hash. Bez tokena se ne može bacati, kupovati ni prihvatiti ponudu u tuđe ime.
- **Povratak u igru**: ko osvježi stranicu ili izgubi vezu, otvori isti link na istom uređaju i nastavlja.
- **Odsutni igrači**: ako se na nekoga čeka duže od 1 minute, ostali ga mogu preskočiti, a nakon 2 minute izbaciti.

Naziv igre mijenja se na jednom mjestu: `GAME_NAME` u `public/shared/data.js` (i `<title>` u `public/index.html`).

## Lokalno pokretanje

Treba Node.js 20 ili noviji.

```bash
npm install
npm test          # testovi pravila
npm run dev       # igra na http://localhost:8888
```

Lokalni server koristi isti kod funkcije i emulator Netlify Blobsa. Za test s više igrača otvori adresu u dva različita preglednika (ili jedan običan i jedan privatni prozor).

## Objava na Netlifyju

Igra koristi serverless funkciju, pa **nije dovoljno prevući mapu `public` u Netlify Drop**. Objavi cijeli projekt na jedan od ova dva načina.

### A) Preko GitHuba (preporučeno)

1. Napravi novi repozitorij na GitHubu i u njega stavi cijelu ovu mapu.
2. Na [app.netlify.com](https://app.netlify.com) klikni **Add new site → Import an existing project** i odaberi repozitorij.
3. Postavke se čitaju iz `netlify.toml` (objavljuje se `public`, funkcije iz `netlify/functions`). Klikni **Deploy**.
4. Kad objava završi, otvori adresu stranice, napravi sobu i pošalji link ekipi.

### B) Preko Netlify CLI s računala

```bash
npm install
npx netlify-cli login
npx netlify-cli deploy --prod
```

Prvi put će te pitati da napraviš novu stranicu ili odabereš postojeću.

### Provjera nakon objave

```bash
node scripts/provjera-uzivo.mjs https://tvoja-stranica.netlify.app
```

Skripta napravi testnu sobu, pokuša bacati za drugog igrača i pošalje osam bacanja odjednom. Treba ispisati „PROŠLO”.

## Varijable okruženja

Nisu potrebne. Pogledaj `.env.example`.

## Struktura

```
public/index.html            stranica
public/style.css             izgled ploče, kartica i sučelja
public/app.js                klijent: ekrani, radnje, praćenje stanja
public/board.js              crtanje ploče, figurica, kartica i stripa u sredini
public/shared/data.js        polja, cijene, kirije, 20 Šansi i 20 Iznenađenja
netlify/functions/api.mjs    Netlify funkcija
netlify/functions/lib/       pravila igre (engine.mjs) i HTTP sloj (server.mjs)
dev-server.mjs               lokalni server s emulatorom Netlify Blobsa
test/engine.test.mjs         testovi pravila
scripts/provjera-uzivo.mjs   provjera objavljene igre
```

## Kućna pravila

Pravila su opisana u igri (tipka **Pravila**). Odstupanja od klasične igre:

- nema aukcije: ako igrač ne kupi posjed, posjed ostaje banci;
- broj kućica i hotela nije ograničen;
- posjed pod hipotekom prelazi trgovinom ili bankrotom s hipotekom, bez dodatne kamate;
- trgovati se može na svom potezu, a grupe s kućicama se ne mijenjaju;
- „Građevinska dozvola” broji hotel kao pet nadogradnji;
- kratki zatvor (Crni, Snimljen razgovor) vodi na polje Zenica i znači jedan propušten potez.
