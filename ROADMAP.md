# AstroDash — Roadmap

## Vize

Jedna appka, ktera nahradi lightpollutionmap.info + Google Maps + Clear Outside + Ventusky.
Cely workflow pozorovatele v jednom miste — od hledani spotu pres kontrolu podminek az po pozorovaci plan na miste.

---

## Uzivatelsky problem (dnes)

```
SPOT                    PODMINKY                 POZOROVANI
lightpollutionmap.info  Clear Outside             ???
+ Google Maps           + Ventusky                (zadny nastroj)
+ pamet (zadne save)    + zadne sdilene spoty     (zadny plan)
                        + zadne notifikace        (zadny denik)
```

Kazda faze = jina appka, zadne sdileni dat, zadne ukladani, zadna personalizace.

---

## Cilovy stav

```
ASTRODASH
├── Spot Finder       — mapa se vsemi vrstvami, hledani + ukladani spotu
├── Dashboard         — ulozene spoty + predpoved podminek na X dni dopredu
├── Spot Manager      — sprava ulozenych spotu (edit, delete, poznamky, navigace)
├── Observation Plan  — co dnes vecer uvidim z tohohle mista v tenhle cas
├── Session Live      — live pozorovaci plan s real-time updaty
└── Observation Log   — automaticky denik z pozorovani
```

---

## Architektura tabs (MVP)

### Tab 1: Dashboard
- Zobrazuje ulozene spoty oznacene jako "oblibene" / "pinned"
- Ke kazdemu spotu: predpoved podminek na nasledujicich 3-7 dni
- Hlavni metrika: oblacnost (go/no-go), sekundarni: seeing, vlhkost
- Barevne kodovani: zelena = jdi, oranzova = mozna, cervena = nema smysl
- Quick-action: klik na spot → navigace / zobraz plan
- Notifikace: "Zitra vecer budou super podminky na spotu X" (pozdeji)

### Tab 2: Spot Finder (Mapa)
- Fullscreen mapa (Mapbox dark style)
- Vrstvy (toggle):
  - Light pollution (VIIRS raster — realna data)
  - Oblacnost (realna predpoved)
  - Seeing (realna predpoved)
- Klik kamkoliv na mapu:
  - Bortle trida (z realnych VIIRS dat, ne random)
  - Presny stupen svetelneho znecisteni (radiance hodnota)
  - Nadmorska vyska (z elevation API)
  - Aktualni a predpovedni podminky
- Moznost ulozit misto jako spot
- Moznost prepnout podkladovou mapu (satellite, terrain, roads) pro planovani pristupu
- Vyhledavani lokace (geocoding)

### Tab 3: Spot Manager
- Seznam vsech ulozenych spotu
- Edit: nazev, poznamky, tagy, oznacit jako oblibeny
- Delete
- Navigace: otevri v Google Maps / Apple Maps
- Pro kazdy spot: historie podminek + pozorovani
- Export/import (pozdeji)

---

## Fazovani

### Phase 0: Cleanup + Foundation
> Pred cimkoliv — opravit zaklady

- [ ] Odstranit VSECHNY fake data a Math.random() logiku
- [ ] Prevest na TypeScript
- [ ] Zavest projektovou strukturu (features/, shared/, types/)
- [ ] Nastavit linting (ESLint + Prettier)
- [ ] Nastavit PWA manifest + service worker zaklady
- [ ] Rozhodnout state management (zustand nebo jotai — lehke, zadny Redux)
- [ ] Nastavit offline-first storage (IndexedDB pres Dexie.js pro spoty)
- [ ] Nastavit environment variables spravne (API klice)

### Phase 1: Spot Finder (mapa)
> Jadro appky — najdi si misto

- [ ] Mapbox fullscreen mapa s dark stylem
- [ ] Light pollution vrstva z realnych VIIRS dat
  - Pouzit GIBS WMTS tile service (jiz castecne implementovano)
  - Parsovat radiance hodnoty pro presny Bortle odhad
- [ ] Klik na mapu → detail mista:
  - Souradnice (lat/lng)
  - Nadmorska vyska (Open Elevation API nebo Mapbox Terrain)
  - Bortle trida (odvozena z VIIRS radiance)
  - Svetelne znecisteni (numericka radiance hodnota)
- [ ] Ulozit misto jako spot (→ IndexedDB)
- [ ] Prepinani podkladove mapy (dark / satellite / terrain / streets)
- [ ] Geocoding search bar (hledani mist podle nazvu)
- [ ] Moje poloha (geolocation API)

### Phase 2: Podminky (weather layer + dashboard)
> Odpovez na "mam dnes vecer jit ven?"

- [ ] Integrace realneho weather API:
  - Open-Meteo (free, kvalitni, nema API key limit) pro:
    - Oblacnost (celkova, vysoka, stredni, nizka — astronomove potrebuji detail)
    - Teplota, vlhkost, vitr
    - Hodinova predpoved na 7 dni
  - 7Timer Astro API pro:
    - Seeing (astronomicky specificky)
    - Transparence
- [ ] Cloud vrstva na mape (realna predpoved, ne jen aktualni stav)
- [ ] Seeing vrstva na mape (pokud dostupna)
- [ ] Dashboard tab:
  - Ulozene "oblibene" spoty jako karty
  - Kazda karta: mini-predpoved na dalsi noci
  - Go/No-Go indikator (pravidla: cloud < 25%, seeing < 3, ...)
  - Timeline pohled: dnes, zitra, pozitri, ...
- [ ] Detail spotu: hodinova predpoved podminek (graf)

### Phase 3: Spot Manager
> Spravuj svoje mista

- [ ] Seznam spotu s vyhledavanim a filtrem
- [ ] Edit spot (nazev, poznamky, tagy typu "dark site", "easy access", ...)
- [ ] Delete spot (s potvrzenim)
- [ ] Navigace: odkaz do Google Maps / Apple Maps s routingem
- [ ] Oznaceni oblibene (pro dashboard)
- [ ] Razeni podle: Bortle, vzdalenost ode me, posledni navsteva

### Phase 4: Observation Planner
> "Jsem na miste, co mam dnes vecer videt?"

- [ ] Kompletni katalog DSO (Messier 110, Caldwell 109, vybrane NGC/IC)
- [ ] Vypocet viditelnosti objektu z daneho mista a casu:
  - Altitude/azimut v realnem case (astronomy-engine knihovna)
  - Objekt nad horizontem? Jak vysoko? Kdy kulminuje?
  - Filtr: co je prave ted viditelne vs. co bude za hodinu
- [ ] Uzivatelske preference:
  - "Libim se mi DSO > hvezdokupy > galaxie"
  - Uroven zkusenosti (zacatecnik/pokrocily)
  - Vybaveni (teleskop + okulary → co realne uvidim)
- [ ] Generovani planu:
  - Input: spot + cas zacatku + preference
  - Output: serazeny seznam objektu optimalizovany na:
    - Viditelnost (altitude + azimut v case)
    - Obtiznost (mag + velikost vs. tvoje vybaveni)
    - Efektivita (nepreskakuj pul oblohy, logicke skupiny)
  - "Uz je 22:00 a zacinas → objekty co uz zasly jsou vyrazeny"
- [ ] Star hopping instrukce pro kazdy objekt:
  - "Najdi hvezdu X v souhvezdi Y, posun 2° severovychod..."
  - Idealne s mini mapkou okolnich hvezd
- [ ] Detail objektu:
  - Typ, velikost, magnituda, souhvezdi
  - Simulace pohledu okularem (realisticka, ne CSS blur)
  - Co uvidim s mym vybavenim (GSO 250 + Nagler vs. Delos)

### Phase 5: Observation Log
> Automaticky denik

- [ ] Po kazde session: "co jsi videl?"
  - Predvyplnene z planu (objekty co jsem mel videt)
  - Hodnoceni: 1-5 hvezd za kazdy objekt
  - Poznamky (text + volitelne foto)
  - Podminky (automaticky z weather dat pro ten cas a misto)
- [ ] Pozorovaci denik: timeline vsech pozorovani
- [ ] Statistiky: kolik objektu jsem videl, oblibene typy, ...
- [ ] "Messier marathon tracker" / "Caldwell challenge"

### Phase 6: Session Live Mode
> Real-time pruvodce na miste

- [ ] Zjednodusene fullscreen UI (cerveny night mode!)
- [ ] Aktualni plan → dalsi objekt → star hop instrukce
- [ ] Tlacitko "Videl jsem" / "Preskocit"
- [ ] Kompas integrace (kam tocit teleskop)
- [ ] Auto-update: pokud se zmeni podminky (mraky), upozorni

### Phase 7: Autotracking integrace
> Propojeni s fyzickym teleskopem

- [ ] ASCOM / INDI protokol
- [ ] GoTo: vyber objekt v appce → teleskop se natoci
- [ ] Stellarium-like sky view jako alternativni mapa

---

## Technologie

### POC (ted)
| Co | Technologie | Proc |
|----|------------|------|
| Framework | **Next.js 15 (App Router)** | Rychly start, SSR pro SEO, API routes |
| Jazyk | **TypeScript** (strict) | Typy jsou nutnost pro astronomicke vypocty |
| Styling | **Tailwind CSS 4** | Jiz pouzit, funguje |
| State | **Zustand** | Lehky, zadny boilerplate, persist middleware |
| Offline storage | **Dexie.js** (IndexedDB) | Spoty musi prezit offline |
| Mapa | **Mapbox GL JS** | Jiz pouzit, dark style, vlastni vrstvy |
| Astro engine | **astronomy-engine** | Presne vypocty pozic, rise/set, altitude |
| Weather | **Open-Meteo API** (free) | Oblacnost, teplota, vlhkost, vitr |
| Astro weather | **7Timer API** | Seeing, transparence |
| Elevation | **Open Elevation API** nebo **Mapbox Terrain** | Nadmorska vyska |
| Charts | **Recharts** nebo **lightweight custom** | Predpoved grafy |
| PWA | **next-pwa** + service worker | Offline, install na telefon |
| Icons | **Lucide React** | Jiz pouzit |

### Produkce (budoucnost)
| Co | Technologie | Proc |
|----|------------|------|
| Mobilni app | **React Native (Expo)** | Sdilena logika s webem, nativni pristup k GPS/kompasu/BLE |
| Nebo | **Capacitor** | Wrap existujici Next.js jako nativni app |
| Backend | **Supabase** nebo **vlastni API** | Auth, sync spotu mezi zarizenimi, sdileni |
| Notifikace | **Push API / FCM** | "Zitra vecer budou super podminky" |
| Autotracking | **BLE / USB serial** | INDI/ASCOM propojeni s montazi |

### Rozhodnuti PWA vs. Native
Pro POC: **PWA**. Funguje na vsech platformach, instalovatelna, offline capable.
Pro produkci: **React Native (Expo)** — sdili business logiku (astronomicke vypocty, 
API klienty, typy) s webem. Expo Router podporuje web export, 
takze muze byt jedno codebase pro vsechno.

Alternativa: zustat na Next.js + **Capacitor** pro nativni obalku. 
Mene prace, ale mene nativni feel.

---

## Co odstranit (fake data v soucasnem kodu)

### Map.js — `calculateSkyQuality()`
```
SMAZAT: Cela funkce pouziva Math.random() pro Bortle, LP ratio i elevaci.
NAHRADIT: Realny VIIRS radiance lookup + elevation API call.
```

### Map.js — target fly-to z RA/Dec
```
SMAZAT: convertAstroToMap() mapuje nebeske souradnice na zemsky povrch (nesmysl).
NAHRADIT: Target selection nema hybat mapou. Mapa = Zeme, ne obloha.
           Objekty se zobrazi v Observation Planner, ne na mape.
```

### EyepieceView.js — cely component
```
PREPSAT: Aktualne je to CSS blur v kruhu s random teckami.
NAHRADIT: Realisticka simulace zalozena na:
  - Velikosti objektu (arcmin) vs. TFOV okuláru
  - Povrchovy jas (surface brightness) vs. exit pupil
  - Typ objektu (galaxie = iny tvar nez mlhovina)
  - Reference obrazky pro realisticky vzhled
```

### astroCoords.js — `convertAstroToMap()`
```
SMAZAT: RA/Dec → lng/lat mapovani je konceptualne spatne.
NAHRADIT: Pouzit astronomy-engine pro alt/az vypocty z daneho mista a casu.
```

### data/astroObjects.json
```
ROZŠÍŘIT: Z 10 na kompletni Messier (110) + Caldwell (109) katalog.
PRIDAT: surface brightness, popis, obtiznost, doporuceny okular.
```

### gearStore.js
```
PREPSAT: Hardcoded vybaveni → uzivatelsky konfigurovatelne.
PRIDAT: Moznost pridat vlastni teleskop + okulary + filtry.
```

---

## Prioritizace (co delat prvni)

```
MUST HAVE (MVP)                          NICE TO HAVE (v1)           FUTURE
─────────────────                        ─────────────────           ──────
Phase 0: Cleanup + TS                    Phase 4: Obs. Planner      Phase 6: Live Mode
Phase 1: Spot Finder (mapa)              Phase 5: Obs. Log          Phase 7: Autotracking
Phase 2: Podminky + Dashboard
Phase 3: Spot Manager
```

MVP = Phase 0-3. To pokryva bod 1 (najdi spot) a bod 2 (zjisti podminky).
Bod 3 (na co koukat) = Phase 4-5.
Bod "future dream" = Phase 6-7.

---

## Metrika uspechu

- [ ] Uzivatel (= ty) nemusí otevrit lightpollutionmap.info
- [ ] Uzivatel nemusí otevrit Clear Outside ani Ventusky
- [ ] Uzivatel nemusí otevrit Google Maps pro navigaci ke spotu
- [ ] Uzivatel v terenu vi co ma pozorovat a jak to najit
- [ ] Vsechna data preziji offline a sync mezi zarizeními
