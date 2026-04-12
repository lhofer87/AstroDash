/**
 * Opt-in client diagnostics for device-specific issues (e.g. WebGL / Mapbox on some phones).
 * Enable: add `?debug=1` to the URL, or in console: `localStorage.setItem('astrodash-debug','1')` then reload.
 */

export function isClientDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const q = new URLSearchParams(window.location.search).get('debug');
    if (q === '1' || q === 'true') return true;
    if (window.localStorage?.getItem('astrodash-debug') === '1') return true;
  } catch {
    /* private mode / storage blocked */
  }
  return false;
}

export function setClientDebugPersistence(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem('astrodash-debug', '1');
    else window.localStorage.removeItem('astrodash-debug');
  } catch {
    /* ignore */
  }
}

export type WebGLProbe = {
  ok: boolean;
  vendor?: string;
  renderer?: string;
  error?: string;
  /** `strict` = GPU passed failIfMajorPerformanceCaveat; `lenient` only = often still OK for Mapbox lenient check. */
  contextMode?: 'strict' | 'lenient' | 'none';
};

export function getWebGLInfo(): WebGLProbe {
  try {
    const c = document.createElement('canvas');
    let gl =
      c.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
      c.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    let contextMode: WebGLProbe['contextMode'] = 'strict';
    if (!gl) {
      gl =
        c.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ??
        c.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ??
        c.getContext('webgl2') ??
        c.getContext('webgl');
      contextMode = gl ? 'lenient' : 'none';
    }
    if (!gl) return { ok: false, error: 'getContext returned null', contextMode: 'none' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    /** WEBGL_debug_renderer_info constants (avoid DOM lib gaps on some TS configs). */
    const UNMASKED_VENDOR_WEBGL = 0x9245;
    const UNMASKED_RENDERER_WEBGL = 0x9246;
    const vendor = dbg
      ? String(gl.getParameter(UNMASKED_VENDOR_WEBGL))
      : String(gl.getParameter(gl.VENDOR));
    const renderer = dbg
      ? String(gl.getParameter(UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return { ok: true, vendor, renderer, contextMode };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      contextMode: 'none',
    };
  }
}

/** Optional Chromium memory API (not on all devices). */
function readHeapIfAvailable():
  | { usedJSHeapSize: number; totalJSHeapSize: number; limit?: number }
  | undefined {
  try {
    const m = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit?: number };
      }
    ).memory;
    if (!m) return undefined;
    return {
      usedJSHeapSize: m.usedJSHeapSize,
      totalJSHeapSize: m.totalJSHeapSize,
      limit: m.jsHeapSizeLimit,
    };
  } catch {
    return undefined;
  }
}

type NetInfo = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
};

function readNetworkIfAvailable(): NetInfo | undefined {
  try {
    const c = (navigator as Navigator & { connection?: NetInfo }).connection;
    if (!c) return undefined;
    return {
      effectiveType: c.effectiveType,
      saveData: c.saveData,
      downlink: c.downlink,
    };
  } catch {
    return undefined;
  }
}

export type ClientEnvSnapshot = {
  capturedAt: string;
  href: string;
  ua: string;
  viewport: { width: number; height: number; dpr: number };
  heap?: ReturnType<typeof readHeapIfAvailable>;
  network?: ReturnType<typeof readNetworkIfAvailable>;
  webgl: WebGLProbe;
  mapboxSupportedStrict: unknown;
  mapboxSupportedLenient: unknown;
};

export async function buildClientEnvSnapshot(): Promise<ClientEnvSnapshot> {
  let mapboxStrict: unknown = null;
  let mapboxLenient: unknown = null;
  try {
    const m = await import('mapbox-gl');
    mapboxStrict = m.default.supported({ failIfMajorPerformanceCaveat: true });
    mapboxLenient = m.default.supported({ failIfMajorPerformanceCaveat: false });
  } catch (e) {
    mapboxStrict = { importError: e instanceof Error ? e.message : String(e) };
    mapboxLenient = mapboxStrict;
  }

  return {
    capturedAt: new Date().toISOString(),
    href: window.location.href,
    ua: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio ?? 1,
    },
    heap: readHeapIfAvailable(),
    network: readNetworkIfAvailable(),
    webgl: getWebGLInfo(),
    mapboxSupportedStrict: mapboxStrict,
    mapboxSupportedLenient: mapboxLenient,
  };
}
