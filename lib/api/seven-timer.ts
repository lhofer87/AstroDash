import type { SevenTimerResponse } from '@/lib/types/weather';
import { normalizeLatLng } from '@/lib/utils/coords';

export async function fetchSevenTimer(
  lat: number,
  lng: number
): Promise<SevenTimerResponse | null> {
  const c = normalizeLatLng(lat, lng);
  if (!c) return null;
  const url = `https://www.7timer.info/bin/astro.php?lon=${c.lng}&lat=${c.lat}&ac=0&unit=metric&output=json`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SevenTimerResponse;
    if (!Array.isArray(data.dataseries)) {
      return { ...data, dataseries: [] };
    }
    return data;
  } catch {
    return null;
  }
}
