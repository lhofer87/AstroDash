# AstroDash

Web app for amateur astronomers: **light pollution map**, **saved spots**, and **7-day observing conditions** (clouds + seeing).

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_MAPBOX_TOKEN` (required).
3. Set `NEXT_PUBLIC_OWM_KEY` (optional — enables cloud raster layer).

```bash
npm install
npm run dev
```

`npm run dev` uses **Webpack** (`next dev --webpack`), not Turbopack. Next.js 16 defaults to Turbopack, which can use huge RAM and compile slowly on some machines; Webpack is the safer default here.

To try Turbopack anyway: `npx next dev` (no `--webpack`).

Open this folder as the **workspace root** in your editor (not a parent folder with many projects) so file watchers stay small.

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

## Tabs

- **Dashboard** — favorite spots with nightly Go/Marginal/Poor verdicts (Open-Meteo + 7Timer).

Optional: add `public/images/starfield-bg.png` (export from Figma) and set it as the first layer in `.app-starfield` in `app/globals.css` for a photo starfield behind the UI.
- **Map** — NASA GIBS VIIRS night-lights overlay (SNPP Day/Night Band), optional OWM clouds, 7Timer seeing readout, geocode search, save spots (IndexedDB).
- **Spots** — full CRUD, sort, Google Maps navigation, favorites.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS 4, Mapbox GL, Zustand, Dexie (IndexedDB).

See `ROADMAP.md` for future phases.
