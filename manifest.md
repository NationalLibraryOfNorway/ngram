# ngram App Manifest

## Formål
ngram-appen skal gi en enkel, rask og forklarbar måte å utforske ordbruk over tid i Nasjonalbibliotekets materialer. Appen skal fungere for både fagbrukere og allmennheten, med lav terskel for søk og tydelig visualisering.

## Kjerneverdi
- Gjør historiske språkdata lesbare uten teknisk forkunnskap.
- Gir sammenlignbarhet på tvers av ord, perioder og korpus.
- Prioriterer interaktiv utforsking (zoom, deling, eksport) fremfor statisk rapportering.

## Primære brukeroppgaver
1. Søke etter ett eller flere ord og se utvikling over tid.
2. Bytte mellom korpus, språk og grafmodus.
3. Zoome i perioder og nullstille til definert "home"-periode.
4. Tolke skala automatisk (`%`/`ppm`) uten manuell tuning.
5. Dele funn via lenke, PNG eller Excel.

## Funksjonskrav
- Søk med kommaseparerte ord.
- Korpusvalg: bok / avis.
- Språkvalg (med begrensning når korpus = avis).
- Grafmodi: relativ, absolutt, kumulativ, kohort.
- Verktøy:
  - utjevning
  - linjetykkelse
  - transparens
  - fargepalett
  - kurvemønster (for tilgjengelighet/utskrift)
  - akseskala (auto / % / ppm)
  - periodevelger (zoom-home)
  - case-sensitivitet
- Delingsalternativer:
  - dataramme (.xlsx)
  - grafikk (.png)
  - kopier delbar lenke

## UX-prinsipper
- "Tydelighet foran kontroll": sensible defaults, få klikk, liten støy.
- "Myk interaksjon": zoom/pan skal føles stabilt uten flimring.
- "Synlig semantikk": enheter (`%`, `ppm`) skal vises eksplisitt i graf/tooltip.
- "Tilgjengelighet": ikke bare farge; også mønster/markør for kurveskille.

## Oppstart og tomtilstand
- Ved første last vises en kurve for standardordet `demokrati`.
- Inputfeltet er tomt med `demokrati` som placeholder, slik at bruker kan skrive direkte.

## Deling og kompatibilitet
- Appen skal støtte to lenkeformater:
  1. Legacy hash-format fra eldre NB ngram-lenker.
  2. Nytt `v2` hash-format kontrollert av appen.
- Appen skal kunne kjøres under flere URL-baser (GitHub Pages og NB-produksjon).

## Leveransekrav
- Skal bygge uten lint-feil i CI-modus.
- Skal fungere på desktop og mobil.
- Skal være deploybar via GitHub Pages, med egen produksjonsløype for NB (`build:nb`).

## Ikke-mål (nåværende iterasjon)
- Ikke full testpakke.
- Ikke backend i repo som del av aktiv runtime-flyt.
- Ikke avansert brukerprofilering eller personalisering.

