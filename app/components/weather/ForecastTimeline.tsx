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
  selectedKey,
  onSelect,
}: {
  nights: NightVerdict[];
  /** `detail` = spot detail 7-day strip (Figma SpotDetailModal): Today pill + 12px type, max 7 days. */
  variant?: 'dashboard' | 'detail';
  className?: string;
  /** When set (detail variant), this night is highlighted as the active selection. */
  selectedKey?: string | null;
  /** When provided, cells become buttons that trigger this callback on click. */
  onSelect?: (nightKey: string) => void;
}) {
  const list = variant === 'detail' ? nights.slice(0, 7) : nights;
  const interactive = variant === 'detail' && typeof onSelect === 'function';

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
            const isSelected =
              selectedKey != null ? n.dateKey === selectedKey : isToday;
            const cellClass = [
              'figma-forecast-cell--detail',
              isSelected ? 'figma-forecast-cell--detail-today' : '',
              interactive ? 'figma-forecast-cell--detail-button' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const labelClass = isSelected
              ? 'figma-forecast-day-label-detail-today'
              : 'figma-forecast-day-label-detail';
            const cellContent = (
              <>
                <span className={labelClass}>{label}</span>
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
              </>
            );
            if (interactive) {
              return (
                <button
                  type="button"
                  key={n.dateKey}
                  className={cellClass}
                  onClick={() => onSelect?.(n.dateKey)}
                  aria-pressed={isSelected}
                  aria-label={`Show hourly forecast for ${label}`}
                >
                  {cellContent}
                </button>
              );
            }
            return (
              <div key={n.dateKey} className={cellClass}>
                {cellContent}
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
