// Open-Meteo API client with retry logic, batching, and caching

const CLIMATE_API = "https://climate-api.open-meteo.com/v1/climate";
const MODEL = "EC_Earth3P_HR";

// In-memory cache to prevent redundant fetches
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type OpenMeteoVariable =
  | "temperature_2m_mean"
  | "precipitation_sum"
  | "wind_speed_10m_mean";

export interface OpenMeteoLocationResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_mean?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_mean?: number[];
  };
}

function avg(arr: number[]): number {
  const filtered = arr.filter((v) => v != null && !Number.isNaN(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

function sum(arr: number[]): number {
  const filtered = arr.filter((v) => v != null && !Number.isNaN(v));
  return filtered.reduce((a, b) => a + b, 0);
}

/** Fetch with retry logic and exponential back-off */
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  const key = url;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    // Return a fake Response from cache
    return new Response(JSON.stringify(hit.data), { status: 200 });
  }
  let lastErr: Error = new Error("fetch failed");
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache.set(key, { data, ts: Date.now() });
      return new Response(JSON.stringify(data), { status: 200 });
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const delay = Math.pow(2, attempt) * 800;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Build a global grid of lat/lon with a coarser step to avoid 429 */
export function buildGrid(step = 15): { lats: number[]; lons: number[] } {
  const lats: number[] = [];
  const lons: number[] = [];
  for (let lat = -75; lat <= 75; lat += step) lats.push(lat);
  for (let lon = -165; lon <= 165; lon += step) lons.push(lon);
  return { lats, lons };
}

/** Build flat coordinate arrays in small batches to avoid massive URLs */
function buildBatches(batchSize = 50): Array<{ lats: string; lons: string }> {
  const { lats, lons } = buildGrid(15); // 15° step = ~225 points (manageable)
  const flatLat: number[] = [];
  const flatLon: number[] = [];
  for (const lat of lats) {
    for (const lon of lons) {
      flatLat.push(lat);
      flatLon.push(lon);
    }
  }
  const batches: Array<{ lats: string; lons: string }> = [];
  for (let i = 0; i < flatLat.length; i += batchSize) {
    batches.push({
      lats: flatLat.slice(i, i + batchSize).join(","),
      lons: flatLon.slice(i, i + batchSize).join(","),
    });
  }
  return batches;
}

/** Fetch climate data for a global grid for one year — parallelized & persistently cached */
export async function fetchClimateGrid(
  year: number
): Promise<OpenMeteoLocationResponse[]> {
  const cacheKey = `climatelens-grid-${year}`;
  
  // 1. Check persistent cache (localStorage)
  if (typeof window !== "undefined") {
    try {
      const persisted = localStorage.getItem(cacheKey);
      if (persisted) {
        const { data: cachedData, ts } = JSON.parse(persisted);
        if (Date.now() - ts < CACHE_TTL * 6) { // 30 min persistent TTL
          return cachedData as OpenMeteoLocationResponse[];
        }
      }
    } catch (e) { console.warn("Cache read failed", e); }
  }

  // 2. Check in-memory cache
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return hit.data as OpenMeteoLocationResponse[];
  }

  const batches = buildBatches(50);
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  
  // 3. Parallel fetching with limited concurrency (3 at a time)
  const allData: OpenMeteoLocationResponse[] = [];
  const CONCURRENCY = 3;
  
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(async (batch) => {
      try {
        const url = new URL(CLIMATE_API);
        url.searchParams.set("latitude", batch.lats);
        url.searchParams.set("longitude", batch.lons);
        url.searchParams.set("start_date", start);
        url.searchParams.set("end_date", end);
        url.searchParams.set("daily", "temperature_2m_mean,precipitation_sum,wind_speed_10m_mean");
        url.searchParams.set("models", MODEL);

        const res = await fetchWithRetry(url.toString(), 2);
        const data = await res.json();
        return Array.isArray(data) ? data : [data];
      } catch (e) {
        console.warn("Batch failed:", e);
        return [];
      }
    }));
    
    results.forEach(r => allData.push(...r));
    if (i + CONCURRENCY < batches.length) {
      await new Promise((r) => setTimeout(r, 200)); // Rate limiting gap
    }
  }

  // 4. Update both caches
  cache.set(cacheKey, { data: allData, ts: Date.now() });
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ data: allData, ts: Date.now() }));
    } catch (e) { console.warn("Cache write failed", e); }
  }

  return allData;
}

/** Fetch climate time series for a single point */
export async function fetchClimateTimeSeries(
  variable: OpenMeteoVariable,
  startYear: number,
  endYear: number,
  lat = 52.52,
  lon = 13.41
): Promise<{ year: number; value: number }[]> {
  const start = `${startYear}-01-01`;
  const end = `${endYear}-12-31`;
  const url = new URL(CLIMATE_API);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("start_date", start);
  url.searchParams.set("end_date", end);
  url.searchParams.set("daily", variable);
  url.searchParams.set("models", MODEL);

  const res = await fetchWithRetry(url.toString());
  const data = (await res.json()) as OpenMeteoLocationResponse;
  const daily = data.daily;
  const times = daily.time || [];
  const values =
    variable === "temperature_2m_mean"
      ? (daily.temperature_2m_mean || [])
      : variable === "precipitation_sum"
        ? (daily.precipitation_sum || [])
        : (daily.wind_speed_10m_mean || []);

  const byYear = new Map<number, number[]>();
  for (let i = 0; i < times.length; i++) {
    const y = parseInt(times[i].slice(0, 4), 10);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(values[i] ?? 0);
  }

  const result: { year: number; value: number }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const arr = byYear.get(y) || [];
    const val = variable === "precipitation_sum" ? sum(arr) : avg(arr);
    result.push({ year: y, value: Math.round(val * 100) / 100 });
  }
  return result;
}
