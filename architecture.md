# N-gram App Architecture

## 1) Systemoversikt
Frontend er en React-app (CRA) som henter N-gram-data direkte fra NB API.  
Arkitekturen er klienttung: state, visualisering, deling og eksport håndteres i browser.

Flyt:
1. Bruker endrer søkeparametre.
2. Frontend bygger query mot NB N-gram API.
3. API-respons normaliseres til intern datastruktur.
4. Grafen rendres med Chart.js + zoom-plugin.
5. Bruker kan dele (hash-lenker), eksportere (xlsx/png), eller zoome videre.

---

## 2) Hovedkomponenter

### `src/App.js`
- Overordnet state-orchestrator.
- Eier:
  - `data`
  - `graphType`
  - `settings`
  - `lastQuery`
- Kaller `fetchNgramData(...)`.
- Dedupliserer identiske requests.

### `src/components/SearchControls.js`
- Kontroller for søk og verktøy.
- Håndterer:
  - ordinput
  - språk/korpus/graftype dropdowns
  - verktøymodal (grafinnstillinger, akse/skala, periode, søk-innstillinger)
- Støtter oppstart via parsed hash (legacy/v2).
- Emmitter konsolidert settings-objekt til `App`.

### `src/components/NgramChartRecharts.js`
- Primær visualisering (Chart.js line chart).
- Ansvar:
  - datatransformasjon per grafmodus
  - smoothing
  - auto `%`/`ppm`-skalering
  - zoom/pan/reset
  - klikk på datapunkt -> søkemodal
  - tooltip-formattering
  - kurvemønster (dash + markørvarianter)

### `src/components/AppHeader.js`
- Toppbanner med:
  - NB-brand
  - `Om N-gram`-modal
  - delingsdropdown
- Genererer delingslenker i `v2`-format.
- Eksporterer:
  - Excel-dataramme
  - PNG
  - lenke til utklippstavle

### `src/services/ngramProcessor.js`
- API-adapter og responsnormalisering.
- Inneholder:
  - API-base
  - request timeout
  - mapping mellom UI-parametre og API-parametre
  - transformasjon til intern datastruktur

### `src/services/legacyHash.js`
- Parser URL-hash for:
  - legacy-format (`#1_1_...`)
  - nytt `v2`-format (`#v2?...`)
- Returnerer initial state for query/settings.

---

## 3) API-kontrakter

## 3.1 Utgående request
Endpoint:
- `https://api.nb.no/dhlab/nb_ngram/ngram/query`

HTTP:
- `GET`

Query-parametre (fra frontend):
- `terms`: kommaseparert ordliste (`"fred,frihet"`)
- `lang`: språk (`nob`, `nno`, `sme`, osv., eller `nor` for avis)
- `case_sens`: `0|1`
- `corpus`: `bok|avis`
- `mode`: `relative|absolutt`  
  (kumulativ/kohort bygges videre i frontendlogikk)
- `smooth`: settes til `1` i API-kallet (frontend håndterer visningsutjevning)
- `from`: startår
- `to`: sluttår

Eksempel:
`/ngram/query?terms=fred,frihet&lang=nob&case_sens=0&corpus=bok&mode=relative&smooth=1&from=1810&to=2025`

## 3.2 Inngående API-respons (forventet)
Array av n-gramserier, typisk:
- `key`: ord/term
- `values`: liste med punkter per år, med felter som:
  - `x`: år
  - `y`: relativ verdi
  - `f`: absolutt frekvens

Frontend normaliserer dette til intern modell:
```json
{
  "dates": [1810, 1811, 1812, "..."],
  "series": [
    { "name": "fred", "data": [0.0001, 0.00009, "..."] },
    { "name": "frihet", "data": [0.00003, 0.00004, "..."] }
  ]
}
```

---

## 4) URL, deling og routing

## 4.1 Legacy hash
Eksempel:
- `#1_1_1_fred,frihet_1_1_3_1810,2022_2_2_2_12_2`

Parseren henter ut minst:
- ord
- grafmodus
- korpus/språk
- case/smoothing
- periode

## 4.2 V2 hash (app-kontrollert)
Eksempel:
- `#v2?terms=fred,frihet&mode=cumulative&corpus=bok&lang=nob&case=0&smooth=3&scale=auto&pattern=1&from=1810&to=2022`

Dette formatet er eksplisitt, robust og lett å rekonstruere.

---

## 5) Visningslogikk

- Relativ visning:
  - auto-skala velger `%` eller `ppm` ut fra datanivå.
- Absolutt visning:
  - bruker absoluttverdi fra respons (`f`) når relevant.
- Kumulativ:
  - summerer serie over tid.
- Kohort:
  - normaliserer mot sum innen år.

Tilgjengelighet:
- fargepaletter (`standard`, `colorblind`, `bw`)
- valgfritt kurvemønster for ikke-fargebasert separasjon

---

## 6) Bygg- og deployløype

Scripts:
- `npm start` -> lokal utvikling
- `npm run build` -> GitHub Pages-basert build (`/dhlab-app-nb-ngram`)
- `npm run build:nb` -> NB produksjonsbase (`/ngram`)
- `npm run deploy` -> build + publish til `gh-pages`

---

## 7) Designvalg for robusthet

- Request timeout i API-lag.
- Beskyttelse mot click-after-zoom.
- Dropdowns/dialoger lukker ved klikk utenfor + `Esc`.
- Zoom-vindu bevares ved relevante parameterjusteringer.
- Konsistent settings-emisjon for å unngå stale-state overskriving.

