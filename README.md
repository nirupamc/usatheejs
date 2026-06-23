# 🗺️ US Crime Analytics Dashboard

An interactive 3D crime data visualization dashboard built with React, Three.js, and real-time open government APIs. Explore crime patterns across 10 major US cities with an extruded 3D map, choropleth coloring, hover tooltips, and live ECharts panels.

[Dashboard Preview <img width="1920" height="1039" alt="image" src="https://github.com/user-attachments/assets/413942ed-4a71-47f5-93e0-b49a1e794262" />

url: https://usacrimedb.netlify.app/
---

## ✨ Features

- **Interactive 3D City Maps** — Extruded GeoJSON polygons rendered with Three.js + react-three-fiber. Rotate, zoom, and pan with full OrbitControls.
- **Live Crime Data** — Fetches real crime records from each city's open data portal (Socrata SODA API), updated daily.
- **Choropleth Coloring** — Districts colored dark blue → bright red by crime intensity, recalibrated per city.
- **Hover Tooltips** — Mouse over any district to see its name and crime count, styled with the city's accent color.
- **Crime Intensity Legend** — Gradient legend overlaid inside the map canvas.
- **3 ECharts Panels:**
  - Crime Trend by month (line chart)
  - Top 8 crime categories (horizontal bar)
  - Top 8 districts by crime count (choropleth-matched bars)
- **10-City Support** — Searchable city selector with per-city accent colors, district labels, and API field mapping.
- **Fully Responsive** — Side-by-side layout on desktop, stacked on mobile.

---

## 🏙️ Supported Cities

| City | Data Source | Districts |
|---|---|---|
| Chicago | Chicago Data Portal (Socrata) | 25 Police Districts |
| New York City | NYC Open Data (Socrata) | 5 Boroughs |
| Los Angeles | LA Open Data (Socrata) | 21 LAPD Divisions |
| San Francisco | DataSF (Socrata) | 41 Neighborhoods |
| Seattle | Seattle Open Data (Socrata) | 7 SPD Beats |
| Boston | Analyze Boston | 26 Neighborhoods |
| Denver | Colorado Open Data | 78 Neighborhoods |
| Miami | Miami-Dade Open Data | 14 Districts |
| Austin | Austin Open Data (Socrata) | 84 Sectors |
| Philadelphia | OpenDataPhilly | 21 Police Districts |

---

## 🛠️ Tech Stack

### Core Framework
- **React 19** — UI framework with hooks and functional components
- **TypeScript** — Full type safety across all components, hooks, and config
- **Vite** — Build tool with fast HMR and dynamic `import.meta.glob` for GeoJSON loading

### 3D Visualization
- **Three.js** — 3D rendering engine
- **@react-three/fiber** — React renderer for Three.js
- **@react-three/drei** — OrbitControls and Three.js helpers
- **d3-geo** — GeoJSON projection (`geoMercator().fitSize()`) to convert lat/lng coordinates into Three.js geometry

### Charts
- **ECharts** — Powerful charting library
- **echarts-for-react** — React wrapper for ECharts

### State Management
- **Zustand** — Lightweight global state for selected city, crime type filter, date range, and loading state. Uses `subscribeWithSelector` middleware for granular subscriptions.

### Styling
- **styled-components** — Component-scoped CSS with theme support and transient props

### Data & APIs
- **Socrata SODA API** — Open data REST API used by Chicago, NYC, LA, SF, Seattle, Denver, Austin. Supports `$where`, `$limit`, `$order` SoQL query params.
- **GeoJSON boundary files** — Sourced from city open data portals, census data, and ArcGIS Hub. Stored locally in `src/assets/geo/` for fast loading.
- **@types/geojson** — TypeScript types for GeoJSON `FeatureCollection`, `Feature`, `Geometry`

### Architecture Highlights
- `useCrimeData.ts` — Custom hook that fetches crime records with `AbortController` for cancellation, SoQL filtering, and per-city field mapping
- `useCityGeoJSON.ts` — Dynamic GeoJSON loader using `import.meta.glob` with cancelled-guard for race condition prevention
- `dashboardStore.ts` — Zustand store with `selectedCity`, `selectedCrimeType`, `dateRange`, `isLoading`
- `cities.ts` — Central config for all 10 cities including API endpoints, GeoJSON filenames, field mappings, accent colors, and optional district name normalizers

---

## 📁 Project Structure

```
src/
├── assets/
│   └── geo/                    # GeoJSON boundary files (10 cities)
├── components/
│   └── CitySelector.tsx        # Searchable city dropdown with keyboard nav
├── config/
│   └── cities.ts               # CityConfig interface + all 10 city definitions
├── hooks/
│   ├── useCrimeData.ts         # Live crime API fetching with SoQL filtering
│   └── useCityGeoJSON.ts       # Dynamic GeoJSON loader via import.meta.glob
├── pages/
│   └── USCrimeDashboard/
│       ├── index.tsx           # Main dashboard layout
│       ├── CityMap.tsx         # 3D map with choropleth + tooltips + legend
│       └── ChartPanel.tsx      # 3 ECharts panels
├── stores/
│   └── dashboardStore.ts       # Zustand global state
└── types/
    └── crime.ts                # CrimeRecord type
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/yourusername/us-crime-dashboard
cd us-crime-dashboard
pnpm install
pnpm dev
```

Open `http://localhost:5173/dashboard`

### Build for Production

```bash
pnpm build
pnpm preview
```

---

## 🌐 Deployment

Deployed on **Vercel** with SPA fallback routing.

The `vercel.json` at the project root rewrites all paths to `index.html` so client-side routing works on direct URL access:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

For Vercel deployment, set the **Root Directory** to `sc-datav` in your Vercel project settings.

---

## 🔌 Data Sources

All crime data is fetched live from official open government portals:

| City | Portal | Dataset |
|---|---|---|
| Chicago | data.cityofchicago.org | Crimes - One Year Prior to Present |
| NYC | data.cityofnewyork.us | NYPD Complaint Data Current |
| Los Angeles | data.lacity.org | Crime Data from 2020 to Present |
| San Francisco | data.sfgov.org | Police Department Incident Reports |
| Seattle | data.seattle.gov | SPD Crime Data |
| Austin | data.austintexas.gov | Crime Reports |
| Denver | data.colorado.gov | Denver Crime Data |

GeoJSON boundary sources: Chicago Data Portal, NYC Open Data, LA GeoHub, DataSF, MassGIS, ArcGIS Hub, OpenDataPhilly.

---

## 🎯 Key Engineering Decisions

**Why static GeoJSON instead of fetching at runtime?**
City boundary files change rarely. Bundling them eliminates a live dependency on 5+ external hosts, improves load time, and removes a failure point.

**Why Zustand over Redux?**
The state surface is small (4 fields). Zustand gives global state with zero boilerplate and `subscribeWithSelector` lets components subscribe to specific slices without re-rendering on unrelated changes.

**Why `import.meta.glob` for GeoJSON?**
Vite's glob import builds a static map of lazy loaders at compile time — one chunk per city. Cities load on demand without a custom dynamic import resolver, and TypeScript is satisfied.

**Why AbortController in both data hooks?**
Rapid city switching could let a slow earlier response overwrite a newer city's data. AbortController cancels superseded requests so only the latest response wins.

**Per-city district name normalizer**
Chicago's crime API returns zero-padded district numbers (`"011"`) while the GeoJSON uses ordinal labels (`"11TH"`). A `normalizeDistrictName` function in `CityConfig` converts crime values before joining — keeping the normalizer co-located with the city definition rather than scattered through rendering code.

---


---

## 🗺️ Roadmap

- [ ] Crime type filter UI (dropdown to filter by THEFT, ASSAULT, etc.)
- [ ] Date range picker
- [ ] Boston and Philadelphia full API adapters
- [ ] Fly-line animations for crime hotspot connections
- [ ] Drill-down: click district → show street-level breakdown
- [ ] Year-over-year comparison mode
- [ ] Export chart data as CSV

---

## 📄 License

MIT License. Crime data is sourced from public government open data portals and is free to use.

---

## 🙏 Acknowledgments

- [sc-datav](https://github.com/knight-L/sc-datav) — Original 3D data visualization repo this project was inspired by and adapted from
- [Chicago Data Portal](https://data.cityofchicago.org) and all city open data teams for making crime data publicly accessible
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber) community for excellent Three.js + React integration
