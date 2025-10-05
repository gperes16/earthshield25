# EarthShield25 — Meteor Madness (NASA Space Apps 2025)

EarthShield25 is an educational web application that allows users to explore NASA's asteroid database (NeoWs), simulate impacts at any point on the planet, and visualize effects such as crater, pressure waves, thermal zone, seismic magnitude, and mitigation scenarios (Δv/Lead Time). The project was designed to be responsive, multilingual (PT/EN), and educational.

## Summary
- Overview
- Key features
- Architecture and folders
- How to run (frontend + backend proxy)
- Environment variables
- Main flows (search, rendering, simulation, mitigation, i18n)
- Calculations and educational assumptions
- Map layers and external data
- Accessibility and UX
- Known limitations and next steps

---

## Overview
- Asteroid listing with infinite scroll from the NeoWs Asteroids API.
- Impact simulation on a map (Leaflet + USGS Topo), with rings: 5 psi, 1 psi, thermal, plus the crater.
- Mitigation visualization: marker and trajectory of the deflected impact by Δv over Lead Time.
- Approximate ocean flooding (educational layer) when the target is “ocean”.
- Dynamic translation (PT/EN) and educational tooltips in results/legend.

## Key features
- Search by name or ID (client-side filter) with incremental pagination (10 items per batch) — infinite scroll.
- Cards with key information (ID, name, average size, estimated speed, potential risk, link to JPL SBDB, and shortcut to simulate).
- Interactive map with selection by click/drag of the marker; synchronized latitude/longitude inputs.
- Automatic detection of the target (Continent/Ocean) by the selected map point, via elevation query (open-meteo).
- Educational calculations of energy (Mt TNT), crater (diameter), approximate seismic magnitude, and radii (1 psi/5 psi/thermal).
- Mitigation visualization: deflected point marker, dashed trajectory line, and deflection metrics (Lat/Lon deflected, deviation in km).
- i18n PT/EN with persistence in localStorage and controlled reload.

## Architecture and folders
```
assets/           # images and icons
js/
  app.js          # UI, listing, infinite scroll, tabs, map integration
  nasaClient.js   # NeoWs client + scroller through pages
  simulation.js   # calculations and drawing layers on Leaflet
  i18n.js         # PT/EN translation and tooltips
server/
  index.js        # optional proxy to NASA API (injects key and solves CORS)
index.html        # layout, List and Simulation panels
styles.css        # application styles
README.md         # this document
```

### Decisions
- Listing consumes `GET /neo/browse` (paginated) and filters text on the client.
- Simulation is 100% client-side, does not store user data.
- Node proxy (`server/index.js`) is optional for environments where direct calls to NASA encounter CORS/rate-limit from DEMO_KEY; it injects `NASA_API_KEY` and replicates responses.

## How to run
1) Install server dependencies (if using the proxy):
```bash
cd server
npm i
```
2) Create `server/.env`:
```env
NASA_API_KEY=YOUR_NASA_KEY
PORT=8787
```
3) Run the proxy + static server:
```bash
node server/index.js
```
4) Access the site via the server: `http://localhost:8787`

Without proxy: you can open `index.html` directly, but the listing will use DEMO_KEY and may face limits.

## Environment variables (server)
- `NASA_API_KEY`: personal NASA key (`https://api.nasa.gov/`)
- `PORT`: server port (default 8787)

## Main flows
### 1) Search and rendering
- `js/nasaClient.js` exposes:
  - `search(queryText, pages?)`: fetches pages from `neo/browse`, discovers `total_pages`, and aggregates results. By default limits to 10 pages for performance; can be overridden via parameter.
  - `createScroller(queryText, batchSize)`: returns `{ next() }` delivering batches (default 10) filtered by name/ID.
- `js/app.js` uses `createScroller` for infinite scroll. The sentinel is repositioned per batch and removed at the end.

### 2) Cards and “Simulate” action
- When clicking “Simulate” on a card, `app.js` opens the map tab, fills diameter/speed inputs, and executes `resetSimulation()` to clear previous results/overlays.

### 3) Map, inputs, and synchronization
- `initImpactMap()` creates the map with USGS Topo, OSM, and extra USGS Hydro/Imagery layers.
- Draggable marker; map click updates Lat/Lon.
- Automatic target detection: queries elevation from Open-Meteo (<=0m => ocean; >0m => continent).

### 4) Impact simulation
- `simulateImpact()` reads inputs, calculates energy, crater, radii 5 psi/1 psi/thermal, draws layers, and fills results.
- If target is oceanic, also draws “Flooding (approx.)” — semi-transparent blue buffer (radius ~ 0.35 × thermal radius; minimum 10 km).
- Mitigation: applies approximate Δv/Lead Time deflection and draws dashed line + deflected marker; updates “Lat/Lon (deflected)” and “Deviation (km)”.

### 5) i18n (PT/EN)
- `js/i18n.js` loads translations, applies IDs to labels/buttons/legend/footer, and updates texts + tooltips.
- When switching language in the selector, the app saves to localStorage, marks `sessionStorage.lang_switched`, and reloads for a clean state (returns to list).

## Calculations and educational assumptions
> Important: formulas are simplified and intended for educational purposes. Do not use for real risk assessment.

- Energy (Mt):
  - Approximate mass of a sphere of standard density (3000 kg/m³ on land; 1000 kg/m³ in ocean).
  - Energy ≈ ½ m v²; conversion to Mt TNT: 1 Mt ≈ 4.184e15 J.
- Crater (diameter, m):
  - Empirical relation: `crater ≈ k * d^0.78 * v^0.44 * (0.8 + 0.4*sin(angle))` (k=1 land; 0.6 ocean).
- Radii (km):
  - 5 psi: `r5 ≈ 2.0 * E^(1/3)`; 1 psi: `r1 ≈ 4.0 * E^(1/3)`; thermal: `rT ≈ 6.0 * E^(1/3)`.
- Mitigation (deflection):
  - `displacement ≈ Δv * leadTime` (simplified projection for longitude; visual purposes).
- Ocean flooding (approx.):
  - Circle radius `max(10 km, 0.35 × rT)`. Value adjustable for UX.

## Map layers and external data
- Base:
  - USGS Topo (default), OSM, USGS Hydro, USGS Imagery (layer control).
- Elevation query: Open-Meteo (free) to distinguish continent/ocean.
- Reference links: JPL SBDB and NASA APIs website.

## Accessibility and UX
- Layout with “Asteroids”/“Simulation” tabs.
- Infinite scroll with sentinel and loader without blocking the page.
- Educational tooltips on 1 psi, 5 psi, thermal, and Mw.
- Responsive header (wrap on mobile) and cards with focus/hover (cursor-pointer + light scale).
- Professional footer with quick links and translation.

## Known limitations
- Simplified physics formulas (educational) without terrain/wind/atmosphere models.
- Ocean/continent detection based only on point elevation.
- Using DEMO_KEY (without proxy) may face rate limit; recommended `NASA_API_KEY`.

## Suggested next steps
- Slider for flood sensitivity and button to toggle the layer.
- Support for typical densities (C, S, M) with a selector in the panel.
- Export report (PNG/PDF) with map snapshot and results.
- Extra layers: seismic zones/tectonic plates (public).

## Useful scripts
- Run local server (proxy + static):
```bash
node server/index.js
```
- Adjust pages in search (e.g., 50 pages):
```js
window.NasaClient.search('gany', 50).then(console.log)
```

## License and credits
- Educational/demonstrative use.
- Data: NASA NeoWs; maps: USGS/OSM; libraries: Leaflet.

---

## Deploy on Netlify (proxying private NASA key)

This site is static, and API calls are proxied through Netlify Functions to keep your `NASA_API_KEY` private.

1) Create site on Netlify and connect this repository (or drag-and-drop the folder).
2) In Site settings → Environment variables, add:
   - `NASA_API_KEY = YOUR_NASA_KEY`
3) Ensure the file `netlify.toml` exists with:
```toml
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/neo/browse"
  to = "/.netlify/functions/neo-browse"
  status = 200

[[redirects]]
  from = "/api/neo/feed"
  to = "/.netlify/functions/neo-feed"
  status = 200

[[redirects]]
  from = "/api/neo/neo/:id"
  to = "/.netlify/functions/neo-neo/:id"
  status = 200
```
4) Functions used:
   - `netlify/functions/neo-browse.js`
   - `netlify/functions/neo-feed.js`
   - `netlify/functions/neo-neo.js`

No code changes are required in the frontend because `js/nasaClient.js` already points to `/api/neo/browse`.

After deploying, open your Netlify URL. The app will use the serverless functions, and your key remains hidden on the server side.

## Credits
- Project logo, favicon, and asteroid impact icon: Generated with AI (ChatGPT image generator).
- Location pin and share icons: Downloaded from [Flaticon](https://www.flaticon.com/) — free to use with attribution.  
  Icons by their respective authors on Flaticon.
