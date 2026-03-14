<div align="center">

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/TensorFlow.js-AI_Insights-FF6F00?style=for-the-badge&logo=tensorflow" />
<img src="https://img.shields.io/badge/NetCDF-Upload_Support-00A6D6?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

# 🌍 ClimateLens

### *Interactive AI-Powered Climate Data Explorer*

**[Live Demo](#) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started)**

> Upload any NetCDF (.nc) climate dataset and instantly visualize it on an interactive 3D globe, heatmap, time series, and AI insights — no configuration needed.

</div>

---

## 🏆 Hackathon Highlights

ClimateLens was built to win. Here's why it stands out:

| Feature | What it does |
|---|---|
| 🌍 **Interactive 3D Globe** | Drag-to-rotate, hover lat/lon tooltip, click for exact data values |
| 🔥 **Adaptive Heatmap** | Auto-ranges color scale to uploaded data's min/max |
| 📊 **Data-Driven Everything** | Upload a `.nc` file → ALL charts, maps, globe, and AI insights update instantly |
| 🤖 **AI Forecast Engine** | TensorFlow.js-powered temperature trend predictions with confidence bounds |
| 📖 **Climate Story Page** | Scrollable data narrative with cinematic charts — driven by your data |
| 🗺️ **Continent Modal Insights** | Click any map region for deep-dive historical climate stats |
| ⚡ **Zero-Config Upload** | Handles any NetCDF layout — 2D grids, Kelvin→Celsius auto-convert, non-standard names |

---

## 🎥 Demo

### Upload → Visualize in Seconds

1. Go to the **Dashboard**
2. Drag and drop any `.nc` climate file onto the sidebar
3. Watch the **3D Globe**, **Heatmap**, **Time Series**, **AI Insights**, **Story Page**, and **Summary Stats** all update live from your data
4. Visit the **Datasets** page to see your file's full specification card (lat/lon range, year range, variable ranges)

> 📁 A sample dataset (`sample_climate.nc`) is included in `/public` for immediate testing.

---

## ✨ Features

### 💹 Advanced Scientific Analytics
- **Seasonal Climate Pulse**: Radial radar chart visualizing monthly temperature/precip cycles.
- **Global Zonal Mean**: Latitudinal distribution chart showing energy gradients from Pole to Equator.
- **Interactive 3D Globe**: Drag-to-rotate, hover lat/lon tooltip, click for exact data values.
- **Adaptive Heatmap**: Auto-ranges color scale to uploaded data's min/max.

### 🗺️ Climate Heatmap (2D)
- High-resolution heatmap powered by deck.gl
- Driven by uploaded dataset or Open-Meteo API
- Click any continent for a deep-dive climate modal

### 📈 Time Series Charts
- Derived from uploaded data (or API fallback)
- Single-snapshot files get trend-spread across year range
- Shows trend per decade, total change, anomaly vs baseline

### 💡 AI Insight Panel
- TensorFlow.js polynomial regression model
- Projects 10-year temperature trend with confidence intervals
- Automatically calculates stats from your uploaded data

### 📖 Climate Story Page
- When no file uploaded: factual climate narrative (temperature rise, CO₂, Arctic ice, extreme heat)
- When file uploaded: your data drives 3 interactive charts (temperature, precipitation, wind)

### 📁 Datasets Page
- Shows uploaded file's full spec card: point count, lat/lon coverage, year range, variable value ranges
- Clickable variable selector directly from the file card
- Source badge in all dashboard cards

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Vanilla CSS + Tailwind utilities |
| **Mapping** | deck.gl + MapLibre GL |
| **3D Globe** | Custom Canvas API renderer |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **State** | Zustand |
| **Data Fetching** | TanStack Query v5 |
| **AI / ML** | TensorFlow.js |
| **NetCDF Parsing** | netcdfjs |
| **Climate API** | Open-Meteo (with retry + cache) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AnuragYadav2202/climatelens.git
cd climatelens

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Testing the Upload Feature

A ready-to-use sample dataset is included:

```
public/sample_climate.nc
```

1. Go to `http://localhost:3000/dashboard`
2. In the left sidebar, drag `sample_climate.nc` onto the upload zone (or click "Browse files")
3. All visualizations update instantly

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page with rotating globe background
│   ├── dashboard/page.tsx    # Main dashboard (Map, Globe, Charts, Insights)
│   ├── story/page.tsx        # Data-driven climate narrative
│   └── datasets/page.tsx     # Dataset management & uploaded file specs
├── components/
│   ├── GlobeView.tsx         # Interactive 3D canvas globe
│   ├── ClimateMap.tsx        # 2D deck.gl heatmap + continent modals
│   ├── InsightPanel.tsx      # AI forecast + skeleton loaders
│   ├── TimeSeriesChart.tsx   # Recharts area chart
│   ├── SummaryStats.tsx      # 4 KPI cards (data-reactive)
│   ├── Sidebar.tsx           # Upload zone + variable/year controls
│   ├── DatasetSelector.tsx   # Source switcher (shows uploaded file specs)
│   └── CountryInsightModal.tsx # Per-continent climate deep-dive
├── lib/
│   ├── store.ts              # Zustand store (with UserDatasetMeta)
│   ├── hooks.ts              # Data hooks (userPoints-first routing)
│   ├── netcdf.ts             # NetCDF parser (smart variable detection)
│   ├── openMeteo.ts          # API client (retry + cache + batch)
│   ├── api.ts                # Unified data API layer
│   └── mockData.ts           # Fallback mock data + type definitions
```

---

## 🧠 How the Data Pipeline Works

```
User uploads .nc file
        ↓
netcdf.ts parses it
  - Smart variable detection (lat/lon/temp/precip/wind)
  - 2D grid → flat point array
  - Kelvin → Celsius auto-convert
  - Non-standard variable name fallback
        ↓
Zustand store (userPoints + UserDatasetMeta)
        ↓
All hooks check userPoints first:
  useClimateMapData → Heatmap + Globe
  useTimeSeries     → Time series chart + Summary stats
  useInsights       → AI insight panel
  useLocationTimeSeries → Location analysis
        ↓
Every component re-renders with your data
```

---

## 🌐 Data Sources

| Source | Used For |
|---|---|
| **User uploaded .nc** | Primary — overrides all API data |
| **Open-Meteo API** | Default climate grid (with retry + in-memory cache) |
| **ERA5 / NOAA mock** | Fallback when API rate-limited |
| **NASA GISS** | Reference data for Story page static charts |

---

## 🏗 Key Engineering Decisions

### Why Canvas API for the Globe?
deck.gl's `GlobeView` hit WebGPU texture dimension limits (`maxTextureDimension2D`) on some devices. The custom Canvas renderer is more portable and gives us pixel-level control over the heatmap shading.

### Why Zustand + TanStack Query?
Zustand holds the uploaded `userPoints` as global state. TanStack Query's key-based cache invalidation (`queryKey: [..., userDatasetName]`) ensures all hooks re-fetch the moment a new file is uploaded — no manual cache clearing.

### How does single-snapshot NetCDF work?
Many climate datasets capture a single year. The `deriveTimeSeriesFromPoints()` function detects this and synthetically spreads a meaningful trend across the selected year range using the dataset's actual mean value + a slight periodic drift, so time series charts always render usefully.

---

## 📜 License

MIT © [Anurag Yadav](https://github.com/AnuragYadav2202)

---

<div align="center">

Built with ❤️ for climate action · Powered by open data

**[⬆ Back to top](#-climatelens)**

</div>
