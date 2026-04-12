/**
 * Open-Meteo hourly `time` values are wall-clock at the forecast location (timezone=auto),
 * without a zone suffix. Parsing with `new Date(iso)` uses the *browser* timezone and breaks
 * night bucketing when the user is not in the same zone as the spot.
 */

export function meteoLocalParts(
  iso: string
): { y: number; m: number; d: number; h: number } | null {
  const s = iso.trim();
  const withTime =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(?::(\d{2}))?(?::(\d{2}))?/.exec(s);
  if (withTime) {
    return {
      y: +withTime[1],
      m: +withTime[2],
      d: +withTime[3],
      h: +withTime[4],
    };
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    return {
      y: +dateOnly[1],
      m: +dateOnly[2],
      d: +dateOnly[3],
      h: 0,
    };
  }
  return null;
}

export function isMeteoNightHour(iso: string): boolean {
  const p = meteoLocalParts(iso);
  if (!p) return false;
  return p.h >= 21 || p.h <= 5;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Night id (evening date) in spot-local calendar. */
export function nightIdFromMeteoIso(iso: string): string | null {
  const p = meteoLocalParts(iso);
  if (!p) return null;
  const { y, m, d, h } = p;
  if (h >= 21) return `${y}-${pad2(m)}-${pad2(d)}`;
  if (h <= 5) {
    const t = Date.UTC(y, m - 1, d - 1);
    const nd = new Date(t);
    return `${nd.getUTCFullYear()}-${pad2(nd.getUTCMonth() + 1)}-${pad2(nd.getUTCDate())}`;
  }
  return null;
}
