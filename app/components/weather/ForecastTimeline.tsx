'use client';

import { Cloud, CloudSun, Sun } from 'lucide-react';
import type { NightVerdict } from '@/lib/types/conditions';

function shortDayLabel(dateKey: string): string {
  if (dateKey === 'summary') return '—';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return '—';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short' });
}

/** Pod5 % zelená, 5–20 % žlutá, nad 20 % červená */
function cloudTier(pct: number): 'good' | 'mid' | 'bad' {
  if (pct < 5) return 'good';
  if (pct <= 20) return 'mid';
  return 'bad';
}

function cloudPercentColor(pct: number): string {
  switch (cloudTier(pct)) {
    case 'good':
      return '#34d399';
    case 'mid':
      return '#fbbf24';
    case 'bad':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

function CloudMark({ pct }: { pct: number }) {
  const tier = cloudTier(pct);
  const Icon = tier === 'good' ? Sun : tier === 'mid' ? CloudSun : Cloud;
  return (
    <Icon
      className="w-4 h-4 shrink-0 text-[var(--comet-silver)]"
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

export function ForecastTimeline({
  nights,
  variant = 'dashboard',
  className = '',
}: {
  nights: NightVerdict[];
  /** `detail` = spot detail 7-day strip (Figma SpotDetailModal): Today pill + 12px type, max 7 days. */
  variant?: 'dashboard' | 'detail';
  className?: string;
}) {
  const list = variant === 'detail' ? nights.slice(0, 7) : nights;

  return (
    <div className={`figma-forecast-block ${className}`.trim()}>
      <div
        className={
          variant === 'detail'
            ? 'figma-forecast-scroll figma-forecast-scroll--detail'
            : 'figma-forecast-scroll'
        }
      >
        {list.map((n, i) => {
          const isToday = i === 0;
          const label = isToday ? 'Today' : shortDayLabel(n.dateKey);
          const pct = n.avgCloudCover;
          const pctColor = cloudPercentColor(pct);

          if (variant === 'detail') {
            return (
              <div
                key={n.dateKey}
                className={
                  isToday
                    ? 'figma-forecast-cell--detail figma-forecast-cell--detail-today'
                    : 'figma-forecast-cell--detail'
                }
              >
                <span
                  className={
                    isToday
                      ? 'figma-forecast-day-label-detail-today'
                      : 'figma-forecast-day-label-detail'
                  }
                >
                  {label}
                </span>
                <CloudMark pct={pct} />
                <span
                  className="figma-forecast-pct-detail"
                  style={{ color: pctColor }}
                >
                  {pct}%
                </span>
                {n.bestSeeing != null && (
                  <span className="figma-forecast-seeing-detail tabular-nums">
                    {n.bestSeeing.toFixed(1)}″
                  </span>
                )}
              </div>
            );
          }

          return (
            <div
              key={n.dateKey}
              className={
                isToday
                  ? 'figma-forecast-cell figma-forecast-cell--today'
                  : 'figma-forecast-cell'
              }
            >
              <span
                className={
                  isToday
                    ? 'figma-forecast-day-label-today'
                    : 'figma-forecast-day-label'
                }
              >
                {label}
              </span>
              <CloudMark pct={pct} />
              <span
                className="figma-forecast-pct"
                style={{ color: pctColor }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
