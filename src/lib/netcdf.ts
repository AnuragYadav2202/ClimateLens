import { NetCDFReader } from "netcdfjs";
import type { ClimateDataPoint } from "./mockData";

/**
 * Smart variable detection — tries a list of candidate names first,
 * then falls back to scanning all variables for a matching pattern.
 */
function pickVariable(reader: NetCDFReader, candidates: string[]): string | null {
  const vars = (reader as any).variables as { name: string }[];
  if (!vars || vars.length === 0) return null;
  const lower = candidates.map((n) => n.toLowerCase());
  // Try exact match first
  const exact = vars.find((v) => lower.includes(v.name.toLowerCase()));
  if (exact) return exact.name;
  // Try partial match (e.g. "lat_0" or "latitude_1")
  const partial = vars.find((v) =>
    lower.some((c) => v.name.toLowerCase().startsWith(c))
  );
  return partial ? partial.name : null;
}

/**
 * Auto-detect the first numeric data variable that isn't lat/lon/time
 * — used when no standard climate variable name is found.
 */
function pickFallbackDataVar(
  reader: NetCDFReader,
  exclude: (string | null)[]
): string | null {
  const vars = (reader as any).variables as { name: string; dimensions: number[] }[];
  if (!vars) return null;
  const excludeSet = new Set(exclude.filter(Boolean).map((s) => s!.toLowerCase()));
  const timePatterns = ["time", "date", "step", "level", "plev", "lev", "height"];
  for (const v of vars) {
    const name = v.name.toLowerCase();
    if (excludeSet.has(name)) continue;
    if (timePatterns.some((t) => name.includes(t))) continue;
    // Must have more than 1 element to be a grid variable
    try {
      const data = reader.getDataVariable(v.name) as number[];
      if (Array.isArray(data) && data.length > 1) return v.name;
    } catch {
      // skip unreadable vars
    }
  }
  return null;
}

export async function parseNetCDFFile(
  file: File,
  fallbackYear: number
): Promise<ClimateDataPoint[]> {
  const buffer = await file.arrayBuffer();
  let reader: NetCDFReader;
  try {
    reader = new NetCDFReader(buffer);
  } catch (e) {
    throw new Error(`Not a valid NetCDF file: ${(e as Error).message}`);
  }

  // --- Detect coordinate variables ---
  const latName = pickVariable(reader, [
    "lat", "latitude", "y", "lat_0", "nlat", "rlat", "la",
  ]);
  const lonName = pickVariable(reader, [
    "lon", "longitude", "x", "lon_0", "nlon", "rlon", "lo",
  ]);

  if (!latName || !lonName) {
    // List available variables to help debugging
    const vars = (reader as any).variables as { name: string }[];
    const names = vars?.map((v) => v.name).join(", ") ?? "none";
    throw new Error(
      `Could not find lat/lon variables in this NetCDF file.\n` +
      `Available variables: ${names}\n` +
      `Expected names like: lat, lon, latitude, longitude, x, y`
    );
  }

  // --- Detect climate variables ---
  const tempName = pickVariable(reader, [
    "temp", "temperature", "t2m", "tas", "tmp", "t_air", "air_temp",
    "tair", "air_temperature", "2m_temperature", "tempmax", "tempmin",
  ]);
  const precName = pickVariable(reader, [
    "precip", "precipitation", "tp", "rainfall", "pr", "rain",
    "prec", "pcpn", "pre", "rr", "rf",
  ]);
  const windName = pickVariable(reader, [
    "wind", "wind_speed", "ws", "v10", "u10", "windspeed", "sfcWind",
    "speed", "uwnd", "vwnd", "u_wind", "v_wind",
  ]);

  // Load arrays
  const lats = reader.getDataVariable(latName) as number[];
  const lons = reader.getDataVariable(lonName) as number[];

  // If we couldn't detect a specific climate variable, pick the first usable numeric one
  const knownVars = [latName, lonName, tempName, precName, windName];
  const fallbackVar = !tempName && !precName && !windName
    ? pickFallbackDataVar(reader, knownVars)
    : null;

  const temps = tempName ? (reader.getDataVariable(tempName) as number[]) : [];
  const precs = precName ? (reader.getDataVariable(precName) as number[]) : [];
  const winds = windName ? (reader.getDataVariable(windName) as number[]) : [];
  const fallbackData = fallbackVar ? (reader.getDataVariable(fallbackVar) as number[]) : [];

  // Handle 2D grids: lat[n] × lon[m] → generate all (lat, lon) pairs
  const isGrid = lats.length !== lons.length;
  interface Point { lat: number; lon: number; idx: number }
  const coords: Point[] = [];

  if (isGrid) {
    // Cartesian product
    for (let i = 0; i < lats.length; i++) {
      for (let j = 0; j < lons.length; j++) {
        coords.push({ lat: lats[i], lon: lons[j], idx: i * lons.length + j });
      }
    }
  } else {
    for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
      coords.push({ lat: lats[i], lon: lons[i], idx: i });
    }
  }

  // Detect year from global attributes
  const yearAttr = (reader as any).globalAttributes?.find(
    (a: any) =>
      a.name?.toLowerCase() === "year" ||
      a.name?.toLowerCase() === "reference_year" ||
      a.name?.toLowerCase() === "base_year"
  );
  const year =
    typeof yearAttr?.value === "number"
      ? yearAttr.value
      : typeof yearAttr?.value === "string"
        ? parseInt(yearAttr.value, 10) || fallbackYear
        : fallbackYear;

  // Build points — convert Kelvin to Celsius if values look like Kelvin
  const points: ClimateDataPoint[] = coords.map(({ lat, lon, idx }) => {
    let rawTemp = temps[idx] ?? fallbackData[idx] ?? 0;
    // Auto-convert Kelvin → Celsius
    if (rawTemp > 150 && rawTemp < 400) rawTemp -= 273.15;
    return {
      lat,
      lon,
      temp: Math.round(rawTemp * 10) / 10,
      precipitation: Math.round((precs[idx] ?? 0) * 10) / 10,
      windSpeed: Math.round((winds[idx] ?? 0) * 10) / 10,
      year,
    };
  });

  // Filter out invalid coordinates
  return points.filter(
    (p) => p.lat >= -90 && p.lat <= 90 && p.lon >= -180 && p.lon <= 360
  );
}
