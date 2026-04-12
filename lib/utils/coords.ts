/** Normalize lat/lng from DB (number | string) and clamp to valid ranges. */
export function normalizeLatLng(
  lat: unknown,
  lng: unknown
): { lat: number; lng: number } | null {
  const la =
    typeof lat === 'number' ? lat : Number.parseFloat(String(lat ?? ''));
  const ln =
    typeof lng === 'number' ? lng : Number.parseFloat(String(lng ?? ''));
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  const clat = Math.min(90, Math.max(-90, la));
  const clng = Math.min(180, Math.max(-180, ln));
  return { lat: clat, lng: clng };
}
