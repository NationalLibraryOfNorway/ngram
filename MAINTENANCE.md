# Maintenance Guide

Praktisk guide for videre vedlikehold av N-gram-appen, med fokus pa:
- designendringer
- API/endepunkt-endringer
- trygg deploy
- rask rollback

## 1) Ved designmanual-endringer

Maal: holde visuell stil konsistent uten stor refaktor.

### Sjekkliste
- Oppdater design-tokens for farge/typografi i `src/App.css` (`--color-*`, `--font-*`).
- Unnga hardkodede farger i komponenter; bruk tokens der det er mulig.
- Sjekk at hjelp- og verktoyflater holder samme visuelle system (kort, spacing, hover).
- Verifiser kontrast i viktige flater:
  - tekst mot bakgrunn
  - knapper (normal/hover/disabled)
  - dropdown og modal-innhold
- Kjor manuell visuell test pa:
  - desktop bredt vindu
  - smalt vindu
  - mobil/touch

### Done-kriterier
- Ingen regressjoner i layout.
- Ingen hardkodede "engangs"-farger lagt inn.
- Endringen kan beskrives som token-justering, ikke komponentspesifikk lapping.

## 2) Ved API/endepunkt- eller datastruktur-endringer

Maal: isolere backend-endringer sa UI forblir stabil.

### Sjekkliste
- Dokumenter endpoint-endring (URL, query-parametre, payload, feilformat).
- Oppdater adapter/transform-lag for dataforventning i frontend.
- Behold et stabilt internt format for grafdata i appen.
- Definer fallback/default for manglende felter.
- Verifiser at legacy-lenker/hash fortsatt fungerer eller har tydelig migrering.

### Breaking change-vurdering
Marker som "breaking" hvis ett eller flere av disse gjelder:
- Fjernet/omdopt felt
- Endret datatype
- Endret semantikk (samme felt, ny betydning)
- Endret feilformat som UI er avhengig av

## 3) Rask regresjonssjekk for hver release

Kjor minimum disse scenarioene:
- Legacy hash-link lastes riktig (modus/ord/periode).
- Sok med flere ord + bytte korpus/sprak.
- Zoom: klikk-og-dra, reset, periodekontroll under graf.
- Verktoymodal: innstillinger oppdaterer graf korrekt.
- Delingsalternativer og eksport (PNG/CSV/XLSX) fungerer.
- Ingen synlige konsollfeil i normal bruk.

## 4) Deploy-prosedyre

### Standard flyt
1. Commit kodeendringer pa `main`.
2. Push til `origin/main`.
3. Deploy med:
   - `npm run deploy`

Dette oppdaterer:
- `gh-pages` (publisert build)
- `main` (deploy-commit med build-artifacts)

## 5) Rollback-prosedyre

Bruk eksisterende sikkerhetsreferanser:
- branch: `safe-branch`
- tag: `baerende-2026-02-24`

### Ved behov for rask tilbakegang
- Midlertidig test lokalt:
  - `git checkout safe-branch`
- Hvis produksjon ma tilbake:
  - opprett ny commit/merge fra `safe-branch` til `main`
  - deploy pa nytt med `npm run deploy`

Unnga destruktive git-kommandoer pa delt branch uten eksplisitt avklaring.

## 6) Endringslogg-disiplin

For hver funksjonell endring:
- kort "hva og hvorfor" i commit-melding
- noter eventuelle kjente tradeoffs
- hvis relevant: legg inn en liten oppfolgingstask (teknisk gjeld eller UX-finpuss)

Dette gjor senere vedlikehold og feilsoking betydelig enklere.
