'use client';

import { GlassCard } from '@/app/components/ui/GlassCard';

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <span
      className={`block rounded-md bg-gradient-to-r from-white/[0.06] via-white/[0.12] to-white/[0.06] bg-[length:200%_100%] animate-[shimmer_1.3s_ease-in-out_infinite] ${className}`.trim()}
      aria-hidden
    />
  );
}

/** Horizontal strip matching dashboard `ForecastTimeline` cell geometry (min-height 64px). */
export function ForecastStripSkeleton({
  variant = 'dashboard',
}: {
  variant?: 'dashboard' | 'detail';
}) {
  const isDetail = variant === 'detail';

  return (
    <div className="figma-forecast-block" aria-hidden>
      <div
        className={
          isDetail
            ? 'figma-forecast-scroll figma-forecast-scroll--detail'
            : 'figma-forecast-scroll'
        }
      >
        {Array.from({ length: 7 }, (_, i) => {
          const isFirst = i === 0;
          if (isDetail) {
            return (
              <div
                key={i}
                className={`figma-forecast-cell--detail ${isFirst ? 'figma-forecast-cell--detail-today' : ''} justify-center gap-1.5 px-1`}
              >
                <Shimmer className="h-3 w-8 rounded-md" />
                <Shimmer className="h-4 w-4 rounded-full" />
                <Shimmer className="h-3 w-7 rounded-md" />
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`figma-forecast-cell ${isFirst ? 'figma-forecast-cell--today' : ''} justify-center gap-1`}
            >
              <Shimmer className="h-3 w-9 rounded-md" />
              <Shimmer className="h-4 w-4 rounded-full" />
              <Shimmer className="h-3 w-6 rounded-md" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Placeholder card while the spot store hydrates (dashboard list). */
export function DashboardSpotCardSkeleton() {
  return (
    <div
      className="w-full max-w-[383px] mx-auto"
      aria-busy="true"
      aria-label="Loading spots"
    >
      <GlassCard className="dashboard-spot-card">
        <div className="flex flex-col gap-2 w-full min-w-0">
          <div className="flex flex-col gap-2">
            <Shimmer className="h-5 w-[70%] max-w-[220px] rounded-lg" />
            <div className="flex flex-wrap gap-2">
              <Shimmer className="h-3 w-16 rounded-md" />
              <Shimmer className="h-3 w-20 rounded-md" />
              <Shimmer className="h-3 w-24 rounded-md" />
            </div>
          </div>
          <ForecastStripSkeleton variant="dashboard" />
          <Shimmer className="h-10 w-full rounded-xl mt-1" />
        </div>
      </GlassCard>
    </div>
  );
}

/** Full detail card shell while forecast is fetched. */
export function SpotDetailForecastSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full" aria-busy="true" aria-label="Loading forecast">
      <section className="spot-detail-tonight-panel">
        <Shimmer className="h-4 w-40 rounded-lg mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="spot-detail-metric">
              <Shimmer className="w-8 h-8 rounded-[10px] shrink-0" />
              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <Shimmer className="h-3 w-16 rounded-md" />
                <Shimmer className="h-5 w-14 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Shimmer className="h-4 w-36 rounded-lg mb-2" />
        <div className="spot-detail-hourly-scroll">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="spot-detail-hour-cell gap-2">
              <Shimmer className="h-3 w-10 rounded-md" />
              <Shimmer className="h-4 w-4 rounded-full" />
              <Shimmer className="h-3.5 w-8 rounded-md" />
              <Shimmer className="h-3 w-12 rounded-md mt-1" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Shimmer className="h-4 w-32 rounded-lg mb-2" />
        <ForecastStripSkeleton variant="detail" />
      </section>
    </div>
  );
}

/** Route-level loading for `/dashboard/spots/[id]` before store hydration. */
export function SpotDetailPageShellSkeleton() {
  return (
    <div className="dashboard-shell pb-6">
      <div className="flex items-center gap-2 mb-1">
        <Shimmer className="h-4 w-28 rounded-md" />
      </div>
      <div className="spot-detail-card">
        <div className="flex flex-col gap-3">
          <div>
            <Shimmer className="h-7 w-[85%] max-w-[280px] rounded-lg mb-3" />
            <Shimmer className="h-4 w-full max-w-[320px] rounded-md mb-2" />
            <div className="flex flex-wrap gap-2 mt-1">
              <Shimmer className="h-4 w-14 rounded-md" />
              <Shimmer className="h-4 w-16 rounded-md" />
              <Shimmer className="h-4 w-20 rounded-md" />
            </div>
          </div>
          <SpotDetailForecastSkeleton />
        </div>
      </div>
    </div>
  );
}
