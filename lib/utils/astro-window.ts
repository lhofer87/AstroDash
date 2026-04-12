/**
 * Open-Meteo vrací časy bez zóny jako lokální „nástěnný“ čas u souřadnic.
 * Pro posun o minuty používáme Date.UTC jen jako kalendářní kalkulačku (přetečení dnů/měsíců).
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Přidá minuty k lokálnímu ISO bez zóny (YYYY-MM-DDTHH:mm). */
export function addMinutesToNaiveIso(iso: string, deltaMin: number): string {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(iso.trim());
  if (!m) return iso;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const h = +m[4];
  const mi = +m[5];
  const u = Date.UTC(y, mo - 1, d, h, mi + deltaMin, 0, 0);
  const nd = new Date(u);
  return `${nd.getUTCFullYear()}-${pad2(nd.getUTCMonth() + 1)}-${pad2(nd.getUTCDate())}T${pad2(nd.getUTCHours())}:${pad2(nd.getUTCMinutes())}`;
}

/** Normalizace pro lexikografické porovnání (hodinové řádky doplní :00). */
export function normalizeNaiveIsoForCompare(iso: string): string {
  const m =
    /^(\d{4}-\d{2}-\d{2}T\d{2})(?::(\d{2})(?::(\d{2}))?)?/.exec(iso.trim());
  if (!m) return iso.trim();
  const min = m[2] ?? '00';
  const sec = m[3] ?? '00';
  return `${m[1]}:${min}:${sec}`;
}

export function naiveIsoInHalfOpenInterval(
  t: string,
  start: string,
  endExclusive: string
): boolean {
  const a = normalizeNaiveIsoForCompare(t);
  const s = normalizeNaiveIsoForCompare(start);
  const e = normalizeNaiveIsoForCompare(endExclusive);
  return a >= s && a < e;
}
