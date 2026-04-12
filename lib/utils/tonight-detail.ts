import { normalizeNaiveIsoForCompare } from '@/lib/utils/astro-window';
import { normalizeSevenTimerTimepoint } from '@/lib/utils/seven-timer-timepoint';
import type { HourlyForecastPoint, SevenTimerPoint } from '@/lib/types/weather';
import type { NightVerdict } from '@/lib/types/conditions';
import {
  isMeteoNightHour,
  meteoLocalParts,
  nightIdFromMeteoIso,
} from '@/lib/utils/meteo-local';

export interface TonightHourSlot {
  time: string;
  timeLabel: string;
  cloudCover: number;
  /** 7Timer transparency1–10 when matched to this hour. */
  transparency: number | null;
  /** 7Timer seeing (arcseconds) when matched to this hour. */
  seeingArcsec: number | null;
}

function isoFromSevenTimerTp(tp: unknown): string | null {
  const s = normalizeSevenTimerTimepoint(tp);
  if (!s) return null;
  const y = s.slice(0, 4);
  const mo = s.slice(4, 6);
  const d = s.slice(6, 8);
  const h = s.slice(8, 10);
  return `${y}-${mo}-${d}T${h}:00`;
}

function buildSevenTimerByIso(
  series: SevenTimerPoint[] | null
): Map<string, SevenTimerPoint> {
  const m = new Map<string, SevenTimerPoint>();
  if (!series) return m;
  for (const p of series) {
    const iso = isoFromSevenTimerTp(p.timepoint);
    if (iso) m.set(normalizeNaiveIsoForCompare(iso), p);
  }
  return m;
}

function formatHourLabel(iso: string): string {
  const p = meteoLocalParts(iso);
  if (!p) return '—';
  return `${p.h}:00`;
}

export function firstNightKey(nights: NightVerdict[]): string | null {
  const n = nights[0];
  if (!n || n.dateKey === 'summary') return null;
  return n.dateKey;
}

export function hourlyForNight(
  hourly: HourlyForecastPoint[],
  nightKey: string | null
): HourlyForecastPoint[] {
  if (!nightKey) {
    return hourly.filter((p) => isMeteoNightHour(p.time)).slice(0, 14);
  }
  return hourly.filter((p) => nightIdFromMeteoIso(p.time) === nightKey);
}

export function buildTonightHourlySlots(
  hourly: HourlyForecastPoint[],
  sevenTimer: SevenTimerPoint[] | null,
  nightKey: string | null
): TonightHourSlot[] {
  const slice = hourlyForNight(hourly, nightKey);
  const stMap = buildSevenTimerByIso(sevenTimer);
  const sorted = [...slice].sort((a, b) =>
    normalizeNaiveIsoForCompare(a.time).localeCompare(
      normalizeNaiveIsoForCompare(b.time)
    )
  );
  return sorted.map((p) => {
    const st = stMap.get(normalizeNaiveIsoForCompare(p.time));
    return {
      time: p.time,
      timeLabel: formatHourLabel(p.time),
      cloudCover: Math.round(p.cloudCover),
      transparency: st && typeof st.transparency === 'number' ? st.transparency : null,
      seeingArcsec: st && typeof st.seeing === 'number' ? st.seeing : null,
    };
  });
}

/**
 * Prefer night-level best seeing from verdicts (7Timer, same source as Go/NoGo); fall back to hourly average.
 */
export function tonightSeeingDisplay(
  nights: NightVerdict[],
  summarySeeing: number | null
): number | null {
  const n0 = nights[0];
  if (n0?.dateKey === 'summary') return summarySeeing;
  if (n0?.bestSeeing != null) return n0.bestSeeing;
  return summarySeeing;
}

export function tonightConditionsSummary(
  hours: HourlyForecastPoint[],
  sevenTimer: SevenTimerPoint[] | null,
  nightKey: string | null
): {
  cloudCoverPct: number;
  seeingArcsec: number | null;
  windKmh: number;
  humidityPct: number;
} {
  const slice = hourlyForNight(hours, nightKey);
  if (slice.length === 0) {
    return {
      cloudCoverPct: 0,
      seeingArcsec: null,
      windKmh: 0,
      humidityPct: 0,
    };
  }
  const stMap = buildSevenTimerByIso(sevenTimer);
  let cloudSum = 0;
  let windSum = 0;
  let humSum = 0;
  let seeingSum = 0;
  let seeingN = 0;
  for (const p of slice) {
    cloudSum += p.cloudCover;
    windSum += p.windSpeed;
    humSum += p.humidity;
    const st = stMap.get(normalizeNaiveIsoForCompare(p.time));
    if (st && typeof st.seeing === 'number') {
      seeingSum += st.seeing;
      seeingN++;
    }
  }
  const n = slice.length;
  return {
    cloudCoverPct: Math.round(cloudSum / n),
    seeingArcsec: seeingN ? seeingSum / seeingN : null,
    windKmh: Math.round(windSum / n),
    humidityPct: Math.round(humSum / n),
  };
}
