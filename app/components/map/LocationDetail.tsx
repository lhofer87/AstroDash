'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { bortleSkyLabel } from '@/lib/utils/bortleLabels';
import { SaveBookmarkIcon } from '@/app/components/icons/AstroIcons';

/**
 * Matches Figma LocationDetailSheet (node 10:2259): 383px max card, 24px screen inset,
 * 25px inner padding, stat rows = label above / value below (column layout).
 */
export function LocationDetail({
  lat,
  lng,
  elevation,
  bortleClass,
  radiance,
  loading,
  onClose,
  onSave,
  mode = 'new',
  spotName,
}: {
  lat: number;
  lng: number;
  elevation: number | null;
  bortleClass: number;
  radiance: number;
  loading: boolean;
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
  /** `saved` = existing spot from the map; same stats as when saving, title + optional rename */
  mode?: 'new' | 'saved';
  spotName?: string;
}) {
  const [name, setName] = useState(() => (mode === 'saved' && spotName ? spotName : ''));

  const bortleLine = `Bortle ${bortleClass} ${bortleSkyLabel(bortleClass)}`;

  const title =
    mode === 'saved' && spotName?.trim()
      ? spotName
      : mode === 'saved'
        ? 'Saved spot'
        : 'New Location';

  const saveLabel = mode === 'saved' ? 'Update spot' : 'Save Spot';

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none flex justify-center">
      <div className="location-sheet-wrap pointer-events-auto animate-slide-up">
        <div className="location-sheet-card">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-outfit font-semibold text-[18px] leading-7 text-[#f8fafc] tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-white/10 hover:text-[#f8fafc] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <StatRow
                label="Coordinates"
                value={`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`}
              />
              <StatRow
                label="Elevation"
                value={
                  loading
                    ? '…'
                    : elevation != null
                      ? `${elevation} meters`
                      : '—'
                }
              />
              <StatRow label="Bortle Class" value={bortleLine} />
              <StatRow
                label="Radiance"
                value={`${radiance.toFixed(2)} (screen units)`}
              />
            </div>

            <p className="text-[11px] leading-relaxed text-[#94a3b8]/90">
              Bortle a „radiance“ jsou{' '}
              <strong className="font-medium text-[#94a3b8]">orientační odhad</strong> z barvy
              pixelu na vykreslené mapě (noční vrstva + podklad Mapboxu), ne oficiální atlas ani
              měření na místě. Pro přesné Bortle použij terénní pozorování nebo specializované mapy.
            </p>

            <div className="flex flex-col gap-3">
              <label className="sr-only" htmlFor="location-name-input">
                Location name
              </label>
              <input
                id="location-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Location name"
                autoComplete="off"
                className="location-sheet-input"
              />
              <button
                type="button"
                disabled={!name.trim() || loading}
                onClick={() => void onSave(name.trim())}
                className="btn-primary w-full"
              >
                <SaveBookmarkIcon className="w-5 h-5 shrink-0" />
                {saveLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Figma: label row + value row (stacked), Inter 14px, gap 12px between blocks */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-normal leading-5 text-[#94a3b8]">{label}</span>
      <span className="text-sm font-normal leading-5 text-[#f8fafc]">{value}</span>
    </div>
  );
}
