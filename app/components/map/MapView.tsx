'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LayerToggle, type BaseStyle } from './LayerToggle';
import { SearchBar } from './SearchBar';
import { LocationDetail } from './LocationDetail';
import { fetchElevation } from '@/lib/api/elevation';
import { estimateBortleFromPixel } from '@/lib/utils/bortle';
import { sampleMapPixel } from '@/lib/utils/mapPixel';
import { fetchSevenTimerViaApi } from '@/lib/api/forecast-client';
import type { Spot } from '@/lib/types/spot';
import { useSpotStore } from '@/lib/stores/spot-store';
import { useMapUiStore } from '@/lib/stores/map-ui-store';
import { isClientDebugEnabled } from '@/lib/diagnostics/client-debug';
import {
  isLikelyValidMapboxPublicToken,
  normalizeMapboxToken,
  normalizeOwmKey,
} from '@/lib/utils/public-env';

const TOKEN = normalizeMapboxToken(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
const OWM_KEY = normalizeOwmKey(process.env.NEXT_PUBLIC_OWM_KEY);

const STYLES: Record<BaseStyle, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets: 'mapbox://styles/mapbox/streets-v12',
};

const SAVED_SPOTS_SOURCE = 'saved-spots';
const SAVED_SPOT_PIN_IMAGE = 'saved-spot-pin';
const SAVED_SPOTS_PIN = 'saved-spots-pin';

/** Keep VIIRS below clouds; both above most map symbology; saved spots on top */
function orderOverlayLayers(map: mapboxgl.Map) {
  try {
    if (map.getLayer('light-pollution-layer')) {
      map.moveLayer('light-pollution-layer');
    }
    if (map.getLayer('clouds-layer')) {
      map.moveLayer('clouds-layer');
    }
    if (map.getLayer(SAVED_SPOTS_PIN)) {
      map.moveLayer(SAVED_SPOTS_PIN);
    }
  } catch {
    /* race with style reload */
  }
}

/**
 * Night radiance overlay (VIIRS SNPP Day/Night Band).
 * Legacy VIIRS_Black_Marble + 2016-01-01 JPG tiles return HTTP 400 from GIBS — use DNB ENCC PNG instead.
 * @see https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products
 */
const VIIRS_NIGHT_TILES =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_ENCC/default/2023-06-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png';

/** NASA VIIRS + OWM rasters are heavy on mobile GPUs / network — add lazily (see rasterInitAllowedRef). */
function ensureLightPollutionLayer(map: mapboxgl.Map) {
  if (map.getSource('viirs-night-lights')) return;
  map.addSource('viirs-night-lights', {
    type: 'raster',
    tiles: [VIIRS_NIGHT_TILES],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 8,
    bounds: [-180, -85, 180, 85],
  });
  map.addLayer({
    id: 'light-pollution-layer',
    type: 'raster',
    source: 'viirs-night-lights',
    layout: { visibility: 'none' },
    paint: {
      'raster-opacity': 0,
      'raster-fade-duration': 0,
    },
  });
}

function ensureCloudLayer(map: mapboxgl.Map) {
  if (!OWM_KEY || map.getSource('clouds')) return;
  map.addSource('clouds', {
    type: 'raster',
    tiles: [
      `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
    ],
    tileSize: 256,
  });
  map.addLayer({
    id: 'clouds-layer',
    type: 'raster',
    source: 'clouds',
    layout: { visibility: 'none' },
    paint: {
      'raster-opacity': 0,
      'raster-fade-duration': 0,
    },
  });
}

/**
 * Mapbox base styles often include fog; HTML markers get opacity tied to fog and can
 * become nearly invisible. Clearing fog keeps saved-spot pins readable.
 */
function clearMapFog(map: mapboxgl.Map) {
  try {
    if (map.getFog()) map.setFog(null);
  } catch {
    /* noop */
  }
}

function spotsToFeatureCollection(spots: Spot[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: spots.map((spot) => ({
      type: 'Feature' as const,
      id: spot.id,
      properties: {
        id: spot.id,
        name: spot.name,
        bortleClass: spot.bortleClass,
        elevation: spot.elevation,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [spot.lng, spot.lat],
      },
    })),
  };
}

/**
 * Lucide `MapPin` (lucide-react — same icon set shadcn/ui uses). Rasterized for Mapbox.
 * @see node_modules/lucide-react/dist/esm/icons/map-pin.js
 */
const LUCIDE_MAP_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;

/** Fallback if SVG data-URL decode fails (rare). */
function createFallbackPinImageData(): ImageData {
  const w = 64;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new ImageData(1, 1);
  ctx.scale(w / 24, h / 24);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const outline = new Path2D(
    'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'
  );
  ctx.stroke(outline);
  ctx.beginPath();
  ctx.arc(12, 10, 3, 0, Math.PI * 2);
  ctx.stroke();
  return ctx.getImageData(0, 0, w, h);
}

function ensureLucideMapPinImage(
  map: mapboxgl.Map,
  onReady: () => void,
  opts?: { preferSync?: boolean }
): void {
  if (map.hasImage(SAVED_SPOT_PIN_IMAGE)) {
    onReady();
    return;
  }
  if (opts?.preferSync) {
    map.addImage(SAVED_SPOT_PIN_IMAGE, createFallbackPinImageData());
    onReady();
    return;
  }
  const img = new Image();
  img.onload = () => {
    if (!map.hasImage(SAVED_SPOT_PIN_IMAGE)) {
      map.addImage(SAVED_SPOT_PIN_IMAGE, img);
    }
    onReady();
  };
  img.onerror = () => {
    if (!map.hasImage(SAVED_SPOT_PIN_IMAGE)) {
      map.addImage(SAVED_SPOT_PIN_IMAGE, createFallbackPinImageData());
    }
    onReady();
  };
  img.src =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LUCIDE_MAP_PIN_SVG);
}

/** Symbol layer — Lucide MapPin; stays glued to lat/lng when panning/zooming. */
function addSavedSpotsLayers(
  map: mapboxgl.Map,
  onComplete?: () => void,
  preferSyncPin?: boolean
) {
  if (map.getSource(SAVED_SPOTS_SOURCE)) {
    onComplete?.();
    return;
  }

  ensureLucideMapPinImage(
    map,
    () => {
    if (map.getSource(SAVED_SPOTS_SOURCE)) {
      onComplete?.();
      return;
    }
    if (!map.hasImage(SAVED_SPOT_PIN_IMAGE)) {
      map.addImage(SAVED_SPOT_PIN_IMAGE, createFallbackPinImageData());
    }

    map.addSource(SAVED_SPOTS_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      promoteId: 'id',
    });

    map.addLayer({
      id: SAVED_SPOTS_PIN,
      type: 'symbol',
      source: SAVED_SPOTS_SOURCE,
      layout: {
        'icon-image': SAVED_SPOT_PIN_IMAGE,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.38, 10, 0.52, 16, 0.66],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {
        'icon-opacity': 0.98,
      },
    });
    onComplete?.();
  },
    { preferSync: preferSyncPin }
  );
}

function syncSavedSpotsData(map: mapboxgl.Map) {
  const src = map.getSource(SAVED_SPOTS_SOURCE);
  if (!src || src.type !== 'geojson') return;
  const { spots: storeSpots, hydrated: storeHydrated } = useSpotStore.getState();
  const geo = src as mapboxgl.GeoJSONSource;
  if (!storeHydrated) {
    geo.setData({ type: 'FeatureCollection', features: [] });
    return;
  }
  geo.setData(spotsToFeatureCollection(storeSpots));
}

/** Defer heavy raster / GeoJSON work so the base map can paint and the main thread stays responsive on phones. */
function scheduleHeavyIdleWork(fn: () => void, timeoutMs: number) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout: timeoutMs });
  } else {
    window.setTimeout(fn, Math.min(timeoutMs, 150));
  }
}

export function MapView() {
  const addSpot = useSpotStore((s) => s.addSpot);
  const updateSpot = useSpotStore((s) => s.updateSpot);
  const spots = useSpotStore((s) => s.spots);
  const hydrated = useSpotStore((s) => s.hydrated);
  const hydrate = useSpotStore((s) => s.hydrate);

  const baseStyle = useMapUiStore((s) => s.baseStyle);
  const lightPollution = useMapUiStore((s) => s.lightPollution);
  const clouds = useMapUiStore((s) => s.clouds);
  const seeingUi = useMapUiStore((s) => s.seeingUi);
  const cycleBaseStyle = useMapUiStore((s) => s.cycleBaseStyle);
  const toggleLightPollution = useMapUiStore((s) => s.toggleLightPollution);
  const toggleClouds = useMapUiStore((s) => s.toggleClouds);
  const toggleSeeingUi = useMapUiStore((s) => s.toggleSeeingUi);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const prevBaseStyleRef = useRef<BaseStyle>(baseStyle);
  const locationPickSeqRef = useRef(0);
  const applyLayerVisibilityRef = useRef<() => void>(() => {});
  /** On touch devices, skip NASA/OWM raster sources until this flips true (after idle) so WebGL + network are not hammered during first paint. */
  const rasterInitAllowedRef = useRef(false);

  const [ready, setReady] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [clickLngLat, setClickLngLat] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [elevation, setElevation] = useState<number | null>(null);
  const [elevLoading, setElevLoading] = useState(false);
  const [bortleClass, setBortleClass] = useState(5);
  const [radiance, setRadiance] = useState(0);

  const [centerSeeing, setCenterSeeing] = useState<number | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [activeSavedSpot, setActiveSavedSpot] = useState<Spot | null>(null);
  const [mapboxAuthHint, setMapboxAuthHint] = useState<string | null>(null);
  const mapboxAuthHintShownRef = useRef(false);

  const applyLayerVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (rasterInitAllowedRef.current) {
      ensureLightPollutionLayer(map);
      if (OWM_KEY) ensureCloudLayer(map);
      orderOverlayLayers(map);
    }

    const lpOpacity =
      baseStyle === 'satellite' ? 0.58 : baseStyle === 'streets' ? 0.48 : 0.68;
    const cloudOpacity =
      baseStyle === 'satellite' ? 0.85 : baseStyle === 'streets' ? 0.58 : 0.65;

    if (map.getLayer('light-pollution-layer')) {
      map.setLayoutProperty(
        'light-pollution-layer',
        'visibility',
        lightPollution ? 'visible' : 'none'
      );
      map.setPaintProperty(
        'light-pollution-layer',
        'raster-opacity',
        lightPollution ? lpOpacity : 0
      );
    }
    if (map.getLayer('clouds-layer')) {
      map.setLayoutProperty(
        'clouds-layer',
        'visibility',
        clouds ? 'visible' : 'none'
      );
      map.setPaintProperty(
        'clouds-layer',
        'raster-opacity',
        clouds ? cloudOpacity : 0
      );
    }
  }, [lightPollution, clouds, baseStyle]);

  applyLayerVisibilityRef.current = applyLayerVisibility;

  const dismissLocationDetail = useCallback(() => {
    locationPickSeqRef.current += 1;
    setDetailOpen(false);
    setClickLngLat(null);
    setActiveSavedSpot(null);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, []);

  useEffect(() => {
    applyLayerVisibility();
  }, [applyLayerVisibility, ready]);

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;

    mapboxgl.accessToken = TOKEN;

    const ui = useMapUiStore.getState();
    prevBaseStyleRef.current = ui.baseStyle;

    const isTouchCoarse =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLES[ui.baseStyle],
      center: [ui.centerLng, ui.centerLat],
      zoom: ui.zoom,
      pitch: ui.pitch,
      bearing: ui.bearing,
      /** Keep north at the top: no drag / pinch / keyboard rotation. */
      dragRotate: false,
      /** Default false — `true` keeps the WebGL buffer after each frame and tanks performance on phones. Only enable if you export the canvas to an image. */
      preserveDrawingBuffer: false,
      /** Slightly cheaper GPU path on touch devices (Mapbox still looks fine for map tiles). */
      antialias: !isTouchCoarse,
      /** Less compositing work while panning/zooming. */
      fadeDuration: isTouchCoarse ? 0 : 150,
    });

    mapRef.current = map;

    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    const persistView = () => {
      const c = map.getCenter();
      useMapUiStore.getState().setViewFromMap(
        c.lng,
        c.lat,
        map.getZoom(),
        map.getPitch(),
        map.getBearing()
      );
    };

    map.on('moveend', persistView);

    // Without an 'error' listener, mapbox-gl calls console.error() for every ErrorEvent
    // (common when raster tiles fail or reload while panning) — Next dev then prints "[browser] Error" repeatedly.
    map.on('error', (e) => {
      const msg = e.error?.message ?? '';
      if (typeof window !== 'undefined' && isClientDebugEnabled()) {
        window.dispatchEvent(
          new CustomEvent('astrodash-diag', {
            detail: {
              source: 'mapbox-gl',
              message: msg || '(empty Mapbox error message)',
              time: Date.now(),
            },
          })
        );
      }
      if (mapboxAuthHintShownRef.current) return;
      if (
        /401|403|Unauthorized|Forbidden|Not Authorized|Invalid.*token|invalid.*access token/i.test(
          msg
        )
      ) {
        mapboxAuthHintShownRef.current = true;
        setMapboxAuthHint(
          'Mapbox odmítl dlaždice (401/403). Zkontroluj v Mapbox Account → Tokens správný public token (pk.…), v sekci URL restrictions přidej doménu nasazení (např. *.vercel.app nebo tvou produkční URL), a v Vercel → Settings → Environment Variables nastav NEXT_PUBLIC_MAPBOX_TOKEN a znovu nasaď. V DevTools u „Provisional headers“ často blokuje rozšíření (adblock) — zkus anonymní okno.'
        );
      }
    });

    map.on('load', () => {
      clearMapFog(map);
      if (!isTouchCoarse) {
        rasterInitAllowedRef.current = true;
      }

      const finishHeavyInit = () => {
        rasterInitAllowedRef.current = true;
        applyLayerVisibilityRef.current();
        addSavedSpotsLayers(
          map,
          () => {
            applyLayerVisibilityRef.current();
            map.once('idle', () => {
              orderOverlayLayers(map);
              applyLayerVisibilityRef.current();
              syncSavedSpotsData(map);
            });
          },
          isTouchCoarse
        );
      };

      /** Show the map immediately — do not wait for VIIRS/OWM tiles or async SVG decode. */
      setReady(true);

      if (isTouchCoarse) {
        scheduleHeavyIdleWork(finishHeavyInit, 1400);
      } else {
        finishHeavyInit();
      }
    });

    map.on('click', (e) => {
      const spotHits = map.queryRenderedFeatures(e.point, {
        layers: [SAVED_SPOTS_PIN],
      });
      if (spotHits.length > 0) {
        const f = spotHits[0];
        const p = f.properties;
        if (p) {
          const id = String(p.id ?? '');
          const spot = useSpotStore.getState().spots.find((s) => s.id === id);
          if (!spot) return;

          locationPickSeqRef.current += 1;
          setActiveSavedSpot(spot);
          setClickLngLat({ lat: spot.lat, lng: spot.lng });
          setBortleClass(spot.bortleClass);
          setRadiance(spot.radiance);
          setElevation(spot.elevation);
          setElevLoading(false);
          setDetailOpen(true);

          // Saved spot is already drawn by the symbol layer — do not stack the default
          // HTML teardrop marker on top (it reads as a second, mismatched pin).
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }
        }
        return;
      }

      const pickSeq = (locationPickSeqRef.current += 1);
      const { lng, lat } = e.lngLat;
      setActiveSavedSpot(null);
      setClickLngLat({ lat, lng });
      setDetailOpen(true);
      setElevLoading(true);
      setElevation(null);

      void (async () => {
        await new Promise<void>((resolve) => {
          if (map.loaded() && map.areTilesLoaded()) resolve();
          else map.once('idle', () => resolve());
        });

        if (pickSeq !== locationPickSeqRef.current) return;

        const px = sampleMapPixel(map, e.point);
        let bc = 5;
        let rad = 50;
        if (px) {
          const est = estimateBortleFromPixel(px.r, px.g, px.b);
          bc = est.bortleClass;
          rad = est.radiance;
        }
        setBortleClass(bc);
        setRadiance(rad);

        const el = await fetchElevation(lat, lng);
        if (pickSeq !== locationPickSeqRef.current) return;

        setElevation(el);
        setElevLoading(false);

        if (pickSeq !== locationPickSeqRef.current) return;

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new mapboxgl.Marker({ color: '#38bdf8' })
          .setLngLat([lng, lat])
          .addTo(map);
      })();
    });

    return () => {
      persistView();
      map.off('moveend', persistView);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (prevBaseStyleRef.current === baseStyle) return;
    prevBaseStyleRef.current = baseStyle;

    const coarsePointer =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches;

    const onStyleLoad = () => {
      clearMapFog(map);
      rasterInitAllowedRef.current = true;
      applyLayerVisibilityRef.current();
      addSavedSpotsLayers(
        map,
        () => {
          applyLayerVisibilityRef.current();
          map.once('idle', () => {
            orderOverlayLayers(map);
            applyLayerVisibilityRef.current();
            syncSavedSpotsData(map);
          });
        },
        coarsePointer
      );
    };

    map.setStyle(STYLES[baseStyle]);
    map.once('style.load', onStyleLoad);

    return () => {
      map.off('style.load', onStyleLoad);
    };
  }, [baseStyle, applyLayerVisibility, ready]);

  const flyTo = (lng: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: 10, essential: true });
  };

  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported in this browser.');
      return;
    }
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        flyTo(longitude, latitude);
        if (markerRef.current) markerRef.current.remove();
        const map = mapRef.current;
        if (map) {
          markerRef.current = new mapboxgl.Marker({ color: '#22c55e' })
            .setLngLat([longitude, latitude])
            .addTo(map);
        }
        setGeoMessage(null);
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'Location denied — allow access in the browser address bar.'
            : err.code === 2
              ? 'Position unavailable.'
              : 'Could not get your location.';
        setGeoMessage(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!geoMessage) return;
    const t = window.setTimeout(() => setGeoMessage(null), 7000);
    return () => window.clearTimeout(t);
  }, [geoMessage]);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !hydrated) return;
    if (!map.isStyleLoaded()) return;
    const src = map.getSource(SAVED_SPOTS_SOURCE);
    if (!src || src.type !== 'geojson') return;
    syncSavedSpotsData(map);
    orderOverlayLayers(map);
  }, [spots, ready, hydrated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !seeingUi || !ready) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const c = map.getCenter();
        void fetchSevenTimerViaApi(c.lat, c.lng)
          .then((r) => {
            if (cancelled || !r?.dataseries?.[0]) return;
            setCenterSeeing(r.dataseries[0].seeing);
          })
          .catch(() => {});
      }, 450);
    };

    run();
    map.on('moveend', run);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      map.off('moveend', run);
    };
  }, [seeingUi, ready]);

  if (!TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-rose-400 p-6 text-center">
        Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local (and in Vercel env for production).
      </div>
    );
  }

  if (!isLikelyValidMapboxPublicToken(TOKEN)) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full bg-slate-950 text-amber-300 p-6 text-center text-sm max-w-lg mx-auto">
        <p>
          NEXT_PUBLIC_MAPBOX_TOKEN nevypadá jako platný public Mapbox token (očekává se tvar{' '}
          <code className="text-amber-100/90">pk.…</code> se třemi tečkami oddělenými částmi).
        </p>
        <p className="text-zinc-400 text-xs leading-relaxed">
          Zkontroluj, že v hodnotě není omylem celý řádek jako{' '}
          <code className="text-zinc-300">NEXT_PUBLIC_MAPBOX_TOKEN=pk.…</code> ani uvozovky — nebo
          zkopíruj token znovu z Mapbox Account.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full min-h-[50vh]"
      onPointerDownCapture={() => {
        if (rasterInitAllowedRef.current) return;
        rasterInitAllowedRef.current = true;
        queueMicrotask(() => applyLayerVisibilityRef.current());
      }}
    >
      <div ref={containerRef} id="map-container" className="w-full h-full absolute inset-0" />

      <SearchBar onSelect={(lng, lat) => flyTo(lng, lat)} />

      {mapboxAuthHint && (
        <div
          className="absolute top-[7.25rem] left-4 right-16 z-[22] rounded-xl border border-rose-500/40 px-3 py-2 text-xs text-rose-100 shadow-lg bg-slate-950/95 max-h-[40vh] overflow-y-auto"
          role="alert"
        >
          {mapboxAuthHint}
        </div>
      )}

      {geoMessage && (
        <div
          className={`absolute left-4 right-16 z-[21] rounded-xl border px-3 py-2 text-xs text-[#f8fafc] shadow-lg pointer-events-none ${
            mapboxAuthHint ? 'top-[11rem]' : 'top-[7.25rem]'
          }`}
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            borderColor: 'var(--glass-border)',
          }}
          role="status"
        >
          {geoMessage}
        </div>
      )}

      <LayerToggle
        lightPollution={lightPollution}
        clouds={clouds}
        seeingUi={seeingUi}
        onToggleLightPollution={toggleLightPollution}
        onToggleClouds={toggleClouds}
        onToggleSeeingUi={toggleSeeingUi}
        baseStyle={baseStyle}
        onCycleBaseStyle={cycleBaseStyle}
        onMyLocation={goToMyLocation}
      />

      {seeingUi && centerSeeing != null && (
        <div className="absolute bottom-36 left-4 z-20 glass-card py-2 px-3 text-xs max-w-[220px]">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Seeing @ map center
          </p>
          <p className="font-semibold text-sky-400">{centerSeeing}/8</p>
          <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
            Forecast from 7Timer (not a raster layer). Pan the map to sample
            another area.
          </p>
        </div>
      )}

      {!OWM_KEY && (
        <p className="absolute top-36 left-4 z-20 text-[10px] text-amber-400/90 max-w-xs">
          Add NEXT_PUBLIC_OWM_KEY for cloud tiles.
        </p>
      )}

      {detailOpen && clickLngLat && (
        <button
          type="button"
          aria-label="Dismiss location details"
          className="absolute inset-0 z-[25] bg-black/40 backdrop-blur-[2px]"
          onClick={dismissLocationDetail}
        />
      )}

      {detailOpen && clickLngLat && (
        <LocationDetail
          key={activeSavedSpot?.id ?? `pick-${clickLngLat.lat}-${clickLngLat.lng}`}
          mode={activeSavedSpot ? 'saved' : 'new'}
          spotName={activeSavedSpot?.name}
          lat={clickLngLat.lat}
          lng={clickLngLat.lng}
          elevation={activeSavedSpot ? activeSavedSpot.elevation : elevation}
          bortleClass={activeSavedSpot ? activeSavedSpot.bortleClass : bortleClass}
          radiance={activeSavedSpot ? activeSavedSpot.radiance : radiance}
          loading={activeSavedSpot ? false : elevLoading}
          onClose={dismissLocationDetail}
          onSave={async (name) => {
            if (activeSavedSpot) {
              await updateSpot(activeSavedSpot.id, { name });
            } else {
              await addSpot({
                name,
                lat: clickLngLat.lat,
                lng: clickLngLat.lng,
                elevation: elevation ?? 0,
                bortleClass,
                radiance,
                isFavorite: true,
                notes: '',
                tags: [],
              });
            }
            dismissLocationDetail();
          }}
        />
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sky-400 text-sm font-outfit">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
