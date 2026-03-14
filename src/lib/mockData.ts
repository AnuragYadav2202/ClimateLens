// Mock climate data for development - replace with API calls later

export interface ClimateDataPoint {
  lat: number;
  lon: number;
  temp: number;
  year: number;
  precipitation?: number;
  windSpeed?: number;
}

export interface TimeSeriesPoint {
  year: number;
  month?: number;
  value: number;
  label: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  variables: string[];
  preview: string;
  coverage: string;
}

// Generate grid of climate data points
export function generateMapData(
  year: number,
  baseTemp = 15,
  variance = 12
): ClimateDataPoint[] {
  const data: ClimateDataPoint[] = [];
  const step = 10;

  for (let lat = -80; lat <= 80; lat += step) {
    for (let lon = -180; lon < 180; lon += step) {
      const latFactor = Math.cos((lat * Math.PI) / 180);
      const temp =
        baseTemp +
        (Math.random() - 0.5) * variance +
        (1 - Math.abs(lat) / 90) * 15 +
        (year - 1990) * 0.03;
      data.push({
        lat,
        lon,
        temp: Math.round(temp * 10) / 10,
        year,
        precipitation: Math.round((Math.random() * 200 + 50) * 10) / 10,
        windSpeed: Math.round((Math.random() * 15 + 2) * 10) / 10,
      });
    }
  }
  return data;
}

// Generate time series data
export function generateTimeSeriesData(
  variable: "temperature" | "precipitation" | "wind",
  startYear = 1990,
  endYear = 2024
): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  let baseValue = variable === "temperature" ? 14 : variable === "precipitation" ? 100 : 5;
  const trend = variable === "temperature" ? 0.05 : variable === "precipitation" ? -0.5 : 0.02;

  for (let year = startYear; year <= endYear; year++) {
    const value = baseValue + (year - startYear) * trend + (Math.random() - 0.5) * 2;
    data.push({
      year,
      value: Math.round(value * 100) / 100,
      label: `${year}`,
    });
  }
  return data;
}

// Datasets for explorer - Open-Meteo is primary data source
export const datasets: Dataset[] = [
  {
    id: "openmeteo",
    name: "Open-Meteo Climate",
    description: "Climate model data from Open-Meteo (EC-Earth3P-HR). Free, no API key required.",
    variables: ["temperature", "precipitation", "wind"],
    preview: "/datasets/openmeteo",
    coverage: "Global, 1950-2050",
  },
  {
    id: "era5",
    name: "ERA5 Reanalysis",
    description: "High-resolution reanalysis via Open-Meteo. Bias-corrected climate data.",
    variables: ["temperature", "precipitation", "wind"],
    preview: "/datasets/era5",
    coverage: "Global, 1950-present",
  },
  {
    id: "nasa",
    name: "NASA Climate Data",
    description: "Satellite and surface observations. Connect to NASA APIs for live data.",
    variables: ["temperature", "sea level", "ice extent"],
    preview: "/datasets/nasa",
    coverage: "Global, 1880-present",
  },
];

// Story timeline events
export const storyEvents = [
  { year: 1990, title: "Early Warming Trend", description: "Scientific consensus on climate change emerges." },
  { year: 1998, title: "El Niño Peak", description: "Record-breaking El Niño event drives global temperatures." },
  { year: 2004, title: "European Heatwave", description: "Devastating heatwave across Europe." },
  { year: 2023, title: "Hottest Year on Record", description: "Global temperatures reach unprecedented levels." },
];

// Mock AI insights
export const mockInsights = [
  "Average temperature in Delhi has increased 1.6°C since 1995.",
  "Arctic ice extent has decreased 13% per decade since 1980.",
  "Global sea level has risen 101mm since 1993.",
  "2023 was the warmest year in recorded history.",
];
