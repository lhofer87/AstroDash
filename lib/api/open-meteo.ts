import type {
  HourlyForecastPoint,
  OpenMeteoDailySun,
  OpenMeteoForecast,
} from '@/lib/types/weather';
import { normalizeLatLng } from '@/lib/utils/coords';

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = '14';

const HOURLY_FULL = [
  'cloud_cover',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
  'temperature_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
].join(',');

function parseHourlyPayload(data: unknown): OpenMeteoForecast | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.error === true) return null;
  if ('reason' in d && typeof d.reason === 'string' && !d.hourly) return null;
  const h = d.hourly as Record<string, unknown> | undefined;
  if (!h || !Array.isArray(h.time) || h.time.length === 0) return null;

  const time = h.time as string[];
  const cloud = h.cloud_cover as (number | null)[] | undefined;
  const cloudLow = h.cloud_cover_low as (number | null)[] | undefined;
  const cloudMid = h.cloud_cover_mid as (number | null)[] | undefined;
  const cloudHigh = h.cloud_cover_high as (number | null)[] | undefined;
  const temp = h.temperature_2m as (number | null)[] | undefined;
  const hum = h.relative_humidity_2m as (number | null)[] | undefined;
  const wind = h.wind_speed_10m as (number | null)[] | undefined;

  const hourly: HourlyForecastPoint[] = time.map((t, i) => ({
    time: t,
    cloudCover: cloud?.[i] ?? 0,
    cloudLow: cloudLow?.[i] ?? 0,
    cloudMid: cloudMid?.[i] ?? 0,
    cloudHigh: cloudHigh?.[i] ?? 0,
    temp: temp?.[i] ?? 0,
    humidity: hum?.[i] ?? 0,
    windSpeed: wind?.[i] ?? 0,
  }));

  const utcOff =
    typeof d.utc_offset_seconds === 'number' ? d.utc_offset_seconds : undefined;

  let daily: OpenMeteoDailySun | undefined;
  const dailyRaw = d.daily as Record<string, unknown> | undefined;
  if (
    dailyRaw &&
    Array.isArray(dailyRaw.time) &&
    Array.isArray(dailyRaw.sunset)
  ) {
    const t = dailyRaw.time as string[];
    const s = dailyRaw.sunset as (string | null)[];
    if (t.length === s.length) {
      daily = {
        time: t,
        sunset: s.map((x) => (x == null ? '' : String(x))),
      };
    }
  }

  return {
    hourly,
    timezone: typeof d.timezone === 'string' ? d.timezone : 'UTC',
    utcOffsetSeconds: utcOff,
    daily,
  };
}

async function fetchOpenMeteoOnce(
  lat: number,
  lng: number,
  hourlyVars: string
): Promise<OpenMeteoForecast | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: hourlyVars,
    daily: 'sunset',
    forecast_days: FORECAST_DAYS,
    timezone: 'auto',
  });
  const url = `${OPEN_METEO}?${params.toString()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    mode: 'cors',
    credentials: 'omit',
  });
  if (!res.ok) return null;
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  return parseHourlyPayload(data);
}

export async function fetchForecast(
  lat: number,
  lng: number
): Promise<OpenMeteoForecast | null> {
  const c = normalizeLatLng(lat, lng);
  if (!c) return null;

  try {
    const full = await fetchOpenMeteoOnce(c.lat, c.lng, HOURLY_FULL);
    if (full?.hourly?.length) return full;

    const minimal = await fetchOpenMeteoOnce(
      c.lat,
      c.lng,
      'cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m'
    );
    if (minimal?.hourly?.length) return minimal;

    return await fetchOpenMeteoOnce(c.lat, c.lng, 'cloud_cover');
  } catch {
    return null;
  }
}
