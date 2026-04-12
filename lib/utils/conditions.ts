import type { GoNoGo, NightVerdict } from '@/lib/types/conditions';
import type { HourlyForecastPoint, OpenMeteoDailySun } from '@/lib/types/weather';
import type { SevenTimerPoint } from '@/lib/types/weather';
import {
  addMinutesToNaiveIso,
  naiveIsoInHalfOpenInterval,
  normalizeNaiveIsoForCompare,
} from '@/lib/utils/astro-window';
import {
  isMeteoNightHour,
  meteoLocalParts,
  nightIdFromMeteoIso,
} from '@/lib/utils/meteo-local';
import { normalizeSevenTimerTimepoint } from '@/lib/utils/seven-timer-timepoint';

function verdictFromMetrics(cloud: number, seeing: number | null): GoNoGo {
  const s = seeing ?? 8;
  if (cloud < 25 && s <= 3) return 'go';
  if (cloud < 50 || s <= 5) return 'maybe';
  return 'nogo';
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 7Timer `timepoint` is YYYYMMDDHH in local time at the requested coords. */
function nightIdFromSevenTimer(tp: unknown): string | null {
  const s = normalizeSevenTimerTimepoint(tp);
  if (!s) return null;
  const y = +s.slice(0, 4);
  const mo = +s.slice(4, 6);
  const d = +s.slice(6, 8);
  const h = +s.slice(8, 10);
  const iso = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:00`;
  return nightIdFromMeteoIso(iso);
}

/** Počet po sobě jdoucích hodinových bodů: nejnižší průměr oblačnosti = nejlepší okno. */
const BEST_CONSECUTIVE_HOURS = 2;

function bestConsecutiveCloudAverage(
  series: number[],
  width: number = BEST_CONSECUTIVE_HOURS
): number {
  if (series.length === 0) return 100;
  if (series.length < width) {
    return series.reduce((a, b) => a + b, 0) / series.length;
  }
  let best = Infinity;
  for (let i = 0; i <= series.length - width; i++) {
    let sum = 0;
    for (let j = 0; j < width; j++) sum += series[i + j]!;
    const avg = sum / width;
    if (avg < best) best = avg;
  }
  return best;
}

function minSeeingForNight(
  nightKey: string,
  series: SevenTimerPoint[] | null
): number | null {
  if (!Array.isArray(series) || !series.length) return null;
  let min = 99;
  let any = false;
  for (const p of series) {
    const tp = normalizeSevenTimerTimepoint(p.timepoint);
    if (!tp) continue;
    const h = +tp.slice(8, 10);
    if (h < 21 && h > 5) continue;
    const id = nightIdFromSevenTimer(tp);
    if (!id || id !== nightKey) continue;
    any = true;
    if (p.seeing < min) min = p.seeing;
  }
  return any ? min : null;
}

/**
 * Pro každý den: západ + 1 h … + 5 h kandidátní okno; zobrazené % = nejlepší průměr
 * přes BEST_CONSECUTIVE_HOURS po sobě jdoucích hodin (ne celkový průměr noci).
 */
function buildSunsetWindowVerdicts(
  hourly: HourlyForecastPoint[],
  sevenTimer: SevenTimerPoint[] | null,
  daily: OpenMeteoDailySun
): NightVerdict[] | null {
  const { time: dates, sunset } = daily;
  if (!dates.length || dates.length !== sunset.length) return null;

  const results: NightVerdict[] = [];

  for (let i = 0; i < Math.min(dates.length, 14); i++) {
    const dateKey = dates[i];
    const sun = sunset[i]?.trim();
    if (!dateKey || !sun) continue;

    const winStart = addMinutesToNaiveIso(sun, 60);
    const winEnd = addMinutesToNaiveIso(sun, 60 + 300);

    const samples: { time: string; cloudCover: number }[] = [];
    for (const p of hourly) {
      if (naiveIsoInHalfOpenInterval(p.time, winStart, winEnd)) {
        samples.push({ time: p.time, cloudCover: p.cloudCover });
      }
    }

    if (samples.length === 0) continue;

    samples.sort((a, b) =>
      normalizeNaiveIsoForCompare(a.time).localeCompare(
        normalizeNaiveIsoForCompare(b.time)
      )
    );
    const series = samples.map((s) => s.cloudCover);
    const avgCloud = bestConsecutiveCloudAverage(
      series,
      BEST_CONSECUTIVE_HOURS
    );
    const bestSeeing = minSeeingForNight(dateKey, sevenTimer);
    const verdict = verdictFromMetrics(avgCloud, bestSeeing);
    const reason =
      verdict === 'go'
        ? 'Low clouds and decent seeing expected'
        : verdict === 'maybe'
          ? 'Marginal — check closer to observing time'
          : 'Cloudy or poor seeing';

    results.push({
      dateKey,
      label: formatNightLabel(dateKey),
      verdict,
      avgCloudCover: Math.round(avgCloud),
      bestSeeing,
      reason,
    });
  }

  return results.length > 0 ? results : null;
}

/**
 * Build up to 14 nightly verdicts from hourly Open-Meteo + optional 7Timer.
 */
export function buildNightVerdicts(
  hourly: HourlyForecastPoint[],
  sevenTimer: SevenTimerPoint[] | null,
  daily?: OpenMeteoDailySun | null
): NightVerdict[] {
  if (daily?.time?.length && daily.sunset?.length === daily.time.length) {
    const fromSun = buildSunsetWindowVerdicts(hourly, sevenTimer, daily);
    if (fromSun?.length) return fromSun;
  }

  const cloudByNight = new Map<string, number[]>();

  for (const p of hourly) {
    if (!isMeteoNightHour(p.time)) continue;
    const nightKey = nightIdFromMeteoIso(p.time);
    if (!nightKey) continue;
    if (!cloudByNight.has(nightKey)) cloudByNight.set(nightKey, []);
    cloudByNight.get(nightKey)!.push(p.cloudCover);
  }

  if (cloudByNight.size === 0) {
    for (const p of hourly) {
      const parts = meteoLocalParts(p.time);
      if (!parts) continue;
      const dayKey = `${parts.y}-${pad(parts.m)}-${pad(parts.d)}`;
      if (!cloudByNight.has(dayKey)) cloudByNight.set(dayKey, []);
      cloudByNight.get(dayKey)!.push(p.cloudCover);
    }
  }

  let keys = [...cloudByNight.keys()].sort();

  if (keys.length === 0 && hourly.length > 0) {
    const avg = bestConsecutiveCloudAverage(
      hourly.map((p) => p.cloudCover),
      BEST_CONSECUTIVE_HOURS
    );
    const verdict = verdictFromMetrics(avg, null);
    return [
      {
        dateKey: 'summary',
        label: 'Forecast',
        verdict,
        avgCloudCover: Math.round(avg),
        bestSeeing: null,
        reason:
          verdict === 'go'
            ? 'Low clouds and decent seeing expected'
            : verdict === 'maybe'
              ? 'Marginal — check closer to observing time'
              : 'Cloudy or poor seeing',
      },
    ];
  }

  const results: NightVerdict[] = [];

  for (const dateKey of keys.slice(0, 14)) {
    const clouds = cloudByNight.get(dateKey) ?? [];
    const avgCloud =
      clouds.length > 0
        ? bestConsecutiveCloudAverage(clouds, BEST_CONSECUTIVE_HOURS)
        : 100;
    const bestSeeing = minSeeingForNight(dateKey, sevenTimer);
    const verdict = verdictFromMetrics(avgCloud, bestSeeing);
    const reason =
      verdict === 'go'
        ? 'Low clouds and decent seeing expected'
        : verdict === 'maybe'
          ? 'Marginal — check closer to observing time'
          : 'Cloudy or poor seeing';

    results.push({
      dateKey,
      label: formatNightLabel(dateKey),
      verdict,
      avgCloudCover: Math.round(avgCloud),
      bestSeeing,
      reason,
    });
  }

  return results;
}

function formatNightLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function goNoGoLabel(v: GoNoGo): string {
  switch (v) {
    case 'go':
      return 'Go';
    case 'maybe':
      return 'Marginal';
    case 'nogo':
      return 'Poor';
  }
}
