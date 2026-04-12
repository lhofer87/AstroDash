import { fetchForecast } from '@/lib/api/open-meteo';
import { fetchSevenTimer } from '@/lib/api/seven-timer';
import { normalizeLatLng } from '@/lib/utils/coords';
import type { OpenMeteoForecast, SevenTimerResponse } from '@/lib/types/weather';

function normalizeSevenTimer(
  st: SevenTimerResponse | null | undefined
): SevenTimerResponse | null {
  if (!st) return null;
  if (!Array.isArray(st.dataseries)) {
    return { ...st, dataseries: [] };
  }
  return st;
}

function parseForecastJson(text: string): {
  forecast: OpenMeteoForecast | null;
  sevenTimer: SevenTimerResponse | null;
} | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const forecast = o.forecast as OpenMeteoForecast | null | undefined;
  const sevenTimer = normalizeSevenTimer(
    o.sevenTimer as SevenTimerResponse | null | undefined
  );
  return {
    forecast: forecast ?? null,
    sevenTimer,
  };
}

function apiBase(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

async function fetchBundleViaNextApi(
  lat: number,
  lng: number
): Promise<{
  forecast: OpenMeteoForecast | null;
  sevenTimer: SevenTimerResponse | null;
} | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const url = `${apiBase()}/api/forecast?${params.toString()}`;
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      mode: 'cors',
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const text = await res.text();
    return parseForecastJson(text);
  } catch {
    return null;
  }
}

async function fetchBundleDirect(
  lat: number,
  lng: number
): Promise<{
  forecast: OpenMeteoForecast | null;
  sevenTimer: SevenTimerResponse | null;
}> {
  const [forecast, st] = await Promise.all([
    fetchForecast(lat, lng),
    fetchSevenTimer(lat, lng).catch(() => null),
  ]);
  return {
    forecast,
    sevenTimer: normalizeSevenTimer(st),
  };
}

export async function fetchForecastBundle(
  lat: number,
  lng: number
): Promise<{
  forecast: OpenMeteoForecast | null;
  sevenTimer: SevenTimerResponse | null;
} | null> {
  const c = normalizeLatLng(lat, lng);
  if (!c) return null;

  const fromApi = await fetchBundleViaNextApi(c.lat, c.lng);
  if (fromApi?.forecast?.hourly?.length) {
    return fromApi;
  }

  const direct = await fetchBundleDirect(c.lat, c.lng);
  if (!direct.forecast?.hourly?.length) {
    return null;
  }
  return direct;
}

export async function fetchSevenTimerViaApi(
  lat: number,
  lng: number
): Promise<SevenTimerResponse | null> {
  const c = normalizeLatLng(lat, lng);
  if (!c) return null;

  const params = new URLSearchParams({
    lat: String(c.lat),
    lng: String(c.lng),
  });
  const url = `${apiBase()}/api/seven-timer?${params.toString()}`;
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      mode: 'cors',
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const text = await res.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return null;
    }
    const normalized = normalizeSevenTimer(raw as SevenTimerResponse | null);
    if (normalized) return normalized;
  } catch {
    /* fall through */
  }

  return fetchSevenTimer(c.lat, c.lng).then((r) => normalizeSevenTimer(r));
}
