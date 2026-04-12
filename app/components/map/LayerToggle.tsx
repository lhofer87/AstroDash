'use client';

import { useEffect, useRef, useState } from 'react';
import { SunDim, Cloud, Eye, Map as MapIcon, Crosshair, Layers } from 'lucide-react';

export type BaseStyle = 'dark' | 'satellite' | 'streets';

export function LayerToggle({
  lightPollution,
  clouds,
  seeingUi,
  onToggleLightPollution,
  onToggleClouds,
  onToggleSeeingUi,
  baseStyle,
  onCycleBaseStyle,
  onMyLocation,
}: {
  lightPollution: boolean;
  clouds: boolean;
  seeingUi: boolean;
  onToggleLightPollution: () => void;
  onToggleClouds: () => void;
  onToggleSeeingUi: () => void;
  baseStyle: BaseStyle;
  onCycleBaseStyle: () => void;
  onMyLocation: () => void;
}) {
  const [layersOpen, setLayersOpen] = useState(false);
  const layersWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layersOpen) return;
    const onDown = (e: PointerEvent) => {
      const el = layersWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setLayersOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [layersOpen]);

  useEffect(() => {
    if (!layersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLayersOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [layersOpen]);

  /** Figma: compact rounded squares */
  const btnOuter = (active: boolean) =>
    `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-[background,border-color,transform] ${
      active
        ? 'bg-[var(--star-blue)] border-[var(--star-blue)] text-[var(--obsidian)] shadow-md shadow-sky-500/15'
        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[#f8fafc] hover:bg-white/10 md:backdrop-blur-md'
    }`;

  const btnInner = (active: boolean) =>
    `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-[background,border-color] ${
      active
        ? 'bg-[var(--star-blue)] border-[var(--star-blue)] text-[var(--obsidian)]'
        : 'bg-white/5 border-[var(--glass-border)] text-[#f8fafc] hover:bg-white/10'
    }`;

  return (
    <div className="absolute top-24 right-4 z-20 flex flex-col gap-2 items-end sm:right-6">
      <button
        type="button"
        title="Center map on your GPS location (requires permission)"
        onClick={onMyLocation}
        className={btnOuter(false)}
        aria-label="My location"
      >
        <Crosshair className="w-5 h-5" strokeWidth={1.75} />
      </button>

      <div ref={layersWrapRef} className="relative flex flex-col items-end">
        <button
          type="button"
          title="Map layers & style"
          onClick={() => setLayersOpen((o) => !o)}
          className={btnOuter(layersOpen)}
          aria-expanded={layersOpen}
          aria-haspopup="true"
          aria-label="Map layers"
        >
          <Layers className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {layersOpen && (
          <div
            className="absolute top-full right-0 mt-2 flex min-w-[10.5rem] flex-col gap-2 rounded-2xl border !p-2 shadow-2xl md:backdrop-blur-xl"
            style={{
              background: 'rgba(15, 23, 42, 0.98)',
              borderColor: 'var(--glass-border)',
            }}
            role="menu"
            aria-label="Layer options"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--comet-silver)]">
                Night lights
              </span>
              <button
                type="button"
                title="NASA VIIRS night radiance"
                onClick={onToggleLightPollution}
                className={btnInner(lightPollution)}
                aria-pressed={lightPollution}
                aria-label="Light pollution layer"
                role="menuitemcheckbox"
              >
                <SunDim className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--comet-silver)]">
                Clouds
              </span>
              <button
                type="button"
                title="OpenWeatherMap cloud tiles"
                onClick={onToggleClouds}
                className={btnInner(clouds)}
                aria-pressed={clouds}
                aria-label="Cloud layer"
                role="menuitemcheckbox"
              >
                <Cloud className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--comet-silver)]">
                Seeing
              </span>
              <button
                type="button"
                title="7Timer seeing readout at map center"
                onClick={onToggleSeeingUi}
                className={btnInner(seeingUi)}
                aria-pressed={seeingUi}
                aria-label="Seeing readout"
                role="menuitemcheckbox"
              >
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-0.5 border-t border-[var(--glass-border)] pt-2.5">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--comet-silver)]">
                Base map
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs capitalize text-[#f8fafc]">
                  {baseStyle === 'dark' && 'Dark'}
                  {baseStyle === 'satellite' && 'Satellite'}
                  {baseStyle === 'streets' && 'Streets'}
                </span>
                <button
                  type="button"
                  title="Switch: Dark → Satellite → Streets"
                  onClick={onCycleBaseStyle}
                  className={btnInner(false)}
                  aria-label="Change map style"
                  role="menuitem"
                >
                  <MapIcon className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
