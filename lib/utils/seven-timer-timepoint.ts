/**
 * 7Timer `timepoint` is YYYYMMDDHH at the requested coords. JSON may use string or number.
 */
export function normalizeSevenTimerTimepoint(tp: unknown): string | null {
  if (tp == null) return null;
  if (typeof tp === 'number') {
    if (!Number.isFinite(tp)) return null;
    const s = String(Math.trunc(tp));
    return s.length >= 10 ? s : null;
  }
  const s = String(tp).trim();
  return s.length >= 10 ? s : null;
}
