/**
 * Public env vars are baked in at build time. Mis-pasted values (full `KEY=value` line,
 * quotes) break Mapbox / OWM at runtime.
 */

export function normalizeMapboxToken(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim();
  const prefix = 'NEXT_PUBLIC_MAPBOX_TOKEN=';
  if (v.startsWith(prefix)) v = v.slice(prefix.length).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

/** Mapbox default public tokens are `pk.` + JWT-shaped segments (not secret `sk.`). */
export function isLikelyValidMapboxPublicToken(token: string): boolean {
  if (!token.startsWith('pk.')) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [, payload, sig] = parts;
  if (!payload || payload.length < 20 || !sig || sig.length < 20) return false;
  const b64url = /^[A-Za-z0-9_-]+$/;
  return b64url.test(payload) && b64url.test(sig);
}

export function normalizeOwmKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim();
  const prefix = 'NEXT_PUBLIC_OWM_KEY=';
  if (v.startsWith(prefix)) v = v.slice(prefix.length).trim();
  return v || undefined;
}
