'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { ForecastTimeline } from '@/app/components/weather/ForecastTimeline';
import { fetchForecastBundle } from '@/lib/api/forecast-client';
import { normalizeLatLng } from '@/lib/utils/coords';
import { buildNightVerdicts } from '@/lib/utils/conditions';
import { bortleSkyLabel } from '@/lib/utils/bortleLabels';
import type { NightVerdict } from '@/lib/types/conditions';
import type { Spot } from '@/lib/types/spot';
import { ForecastStripSkeleton } from '@/app/components/ui/Skeleton';

export function SpotCard({ spot }: { spot: Spot }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nights, setNights] = useState<NightVerdict[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const coords = normalizeLatLng(spot.lat, spot.lng);
      try {
        const bundle = coords
          ? await fetchForecastBundle(coords.lat, coords.lng)
          : null;
        if (cancelled) return;
        if (!bundle?.forecast?.hourly?.length) {
          setError('Forecast unavailable');
          return;
        }
        let nv: NightVerdict[];
        try {
          nv = buildNightVerdicts(
            bundle.forecast.hourly,
            bundle.sevenTimer?.dataseries ?? null,
            bundle.forecast.daily ?? null
          );
        } catch {
          setError('Forecast unavailable');
          return;
        }
        setNights(nv);
        setError(null);
      } catch {
        setError('Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spot.id, spot.lat, spot.lng]);

  return (
    <GlassCard className="dashboard-spot-card animate-fade-in">
      <div className="flex flex-col gap-2 w-full min-w-0">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-outfit font-semibold text-base leading-snug tracking-tight text-[#f8fafc] pr-1">
            {spot.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[11px] leading-tight text-[var(--comet-silver)]">
            <span>{spot.elevation}m</span>
            <span className="opacity-80">·</span>
            <span>Bortle {spot.bortleClass}</span>
            <span className="opacity-80">·</span>
            <span>{bortleSkyLabel(spot.bortleClass)}</span>
          </div>
        </div>

        {loading && <ForecastStripSkeleton variant="dashboard" />}
        {error && <p className="text-rose-400 text-xs py-0.5">{error}</p>}
        {!loading && !error && (
          <ForecastTimeline nights={nights} />
        )}

        <Link
          href={`/dashboard/spots/${spot.id}`}
          className="mt-2 -mx-1 px-1 py-1.5 inline-flex items-center justify-center gap-1 w-full rounded-xl text-sm font-medium text-[var(--star-blue)] hover:bg-[var(--star-blue)]/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--star-blue)]"
        >
          Tonight Detail
          <ChevronRight className="w-4 h-4 shrink-0 opacity-90" strokeWidth={2} />
        </Link>
      </div>
    </GlassCard>
  );
}
