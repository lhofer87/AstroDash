'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Cloud,
  CloudSun,
  Droplets,
  Eye,
  MapPin,
  Moon,
  Sun,
  Wind,
} from 'lucide-react';
import { ForecastTimeline } from '@/app/components/weather/ForecastTimeline';
import { fetchForecastBundle } from '@/lib/api/forecast-client';
import { normalizeLatLng } from '@/lib/utils/coords';
import { buildNightVerdicts } from '@/lib/utils/conditions';
import { bortleSkyLabel } from '@/lib/utils/bortleLabels';
import {
  buildTonightHourlySlots,
  firstNightKey,
  tonightConditionsSummary,
  tonightSeeingDisplay,
} from '@/lib/utils/tonight-detail';
import type { NightVerdict } from '@/lib/types/conditions';
import type { Spot } from '@/lib/types/spot';
import { SpotDetailForecastSkeleton } from '@/app/components/ui/Skeleton';

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

function HourCloudIcon({ pct }: { pct: number }) {
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

function longWeekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'long' });
}

export function SpotDetailView({ spot }: { spot: Spot }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nights, setNights] = useState<NightVerdict[]>([]);
  const [bundle, setBundle] = useState<Awaited<
    ReturnType<typeof fetchForecastBundle>
  > | null>(null);
  const [selectedNightKey, setSelectedNightKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedNightKey(null);
    void (async () => {
      const coords = normalizeLatLng(spot.lat, spot.lng);
      try {
        const b = coords ? await fetchForecastBundle(coords.lat, coords.lng) : null;
        if (cancelled) return;
        if (!b?.forecast?.hourly?.length) {
          setError('Forecast unavailable');
          setBundle(null);
          return;
        }
        let nv: NightVerdict[];
        try {
          nv = buildNightVerdicts(
            b.forecast.hourly,
            b.sevenTimer?.dataseries ?? null,
            b.forecast.daily ?? null
          );
        } catch {
          setError('Forecast unavailable');
          setBundle(null);
          return;
        }
        setNights(nv);
        setBundle(b);
        setError(null);
      } catch {
        setError('Failed to load');
        setBundle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spot.id, spot.lat, spot.lng]);

  const todayNightKey = firstNightKey(nights);
  const availableNightKeys = nights
    .slice(0, 7)
    .map((n) => n.dateKey)
    .filter((k) => k !== 'summary');
  const activeNightKey =
    selectedNightKey && availableNightKeys.includes(selectedNightKey)
      ? selectedNightKey
      : todayNightKey;
  const isTodaySelected =
    activeNightKey === todayNightKey || activeNightKey == null;
  const selectedVerdict =
    activeNightKey != null
      ? nights.find((n) => n.dateKey === activeNightKey)
      : nights[0];
  const selectedWeekday =
    !isTodaySelected && activeNightKey
      ? longWeekdayLabel(activeNightKey)
      : '';
  const conditionsTitle = isTodaySelected
    ? "Tonight's Conditions"
    : selectedWeekday
      ? `${selectedWeekday} Night`
      : 'Night Conditions';
  const hourlyTitle = isTodaySelected
    ? 'Tonight (Hourly)'
    : selectedWeekday
      ? `${selectedWeekday} Night (Hourly)`
      : 'Night (Hourly)';

  const hourlySlots =
    bundle?.forecast?.hourly && !error
      ? buildTonightHourlySlots(
          bundle.forecast.hourly,
          bundle.sevenTimer?.dataseries ?? null,
          activeNightKey
        )
      : [];
  const summary =
    bundle?.forecast?.hourly && !error
      ? tonightConditionsSummary(
          bundle.forecast.hourly,
          bundle.sevenTimer?.dataseries ?? null,
          activeNightKey
        )
      : null;

  const seeingSelected =
    summary != null
      ? selectedVerdict && selectedVerdict.dateKey !== 'summary'
        ? (selectedVerdict.bestSeeing ?? summary.seeingArcsec)
        : tonightSeeingDisplay(nights, summary.seeingArcsec)
      : null;

  const coordsLine = `${spot.lat.toFixed(4)}°, ${spot.lng.toFixed(4)}°`;

  return (
    <div className="dashboard-shell pb-6">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--star-blue)] hover:opacity-90 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2} />
          Dashboard
        </Link>
      </div>

      <div className="spot-detail-card animate-fade-in">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="font-outfit font-semibold text-xl tracking-tight text-[#f8fafc] leading-snug">
              {spot.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-[var(--comet-silver)]">
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0 opacity-90" />
                <span className="truncate">{coordsLine}</span>
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-[var(--comet-silver)]">
              <span>{spot.elevation}m</span>
              <span className="opacity-70">·</span>
              <span>Bortle {spot.bortleClass}</span>
              <span className="opacity-70">·</span>
              <span>{bortleSkyLabel(spot.bortleClass)}</span>
            </div>
          </div>

          {loading && <SpotDetailForecastSkeleton />}
          {error && (
            <p className="text-rose-400 text-sm py-1">{error}</p>
          )}

          {!loading && !error && summary && (
            <>
              <section className="spot-detail-tonight-panel">
                <h2 className="font-outfit text-[15px] font-semibold text-[#f8fafc] mb-3">
                  {conditionsTitle}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="spot-detail-metric">
                    <div className="spot-detail-metric-icon" aria-hidden>
                      <Cloud className="w-4 h-4 text-[var(--comet-silver)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--comet-silver)]">
                        Cloud Cover
                      </p>
                      <p
                        className="text-base font-semibold tabular-nums"
                        style={{ color: cloudPercentColor(summary.cloudCoverPct) }}
                      >
                        {summary.cloudCoverPct}%
                      </p>
                    </div>
                  </div>
                  <div className="spot-detail-metric">
                    <div className="spot-detail-metric-icon" aria-hidden>
                      <Eye className="w-4 h-4 text-[var(--comet-silver)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--comet-silver)]">
                        Seeing
                      </p>
                      <p className="text-base font-semibold text-[#f8fafc] tabular-nums">
                        {seeingSelected != null
                          ? `${seeingSelected.toFixed(1)}″`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="spot-detail-metric">
                    <div className="spot-detail-metric-icon" aria-hidden>
                      <Wind className="w-4 h-4 text-[var(--comet-silver)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--comet-silver)]">
                        Wind
                      </p>
                      <p className="text-base font-semibold text-[#f8fafc] tabular-nums">
                        {summary.windKmh} km/h
                      </p>
                    </div>
                  </div>
                  <div className="spot-detail-metric">
                    <div className="spot-detail-metric-icon" aria-hidden>
                      <Droplets className="w-4 h-4 text-[var(--comet-silver)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--comet-silver)]">
                        Humidity
                      </p>
                      <p className="text-base font-semibold text-[#f8fafc] tabular-nums">
                        {summary.humidityPct}%
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-outfit text-[15px] font-semibold text-[#f8fafc] mb-2">
                  {hourlyTitle}
                </h2>
                {hourlySlots.length === 0 ? (
                  <p className="text-sm text-[var(--comet-silver)]">
                    No night hours in the current forecast window.
                  </p>
                ) : (
                  <div className="spot-detail-hourly-scroll">
                    {hourlySlots.map((slot) => (
                      <div key={slot.time} className="spot-detail-hour-cell">
                        <span className="text-[11px] font-medium text-[var(--comet-silver)] tabular-nums">
                          {slot.timeLabel}
                        </span>
                        <HourCloudIcon pct={slot.cloudCover} />
                        <span
                          className="text-[12px] font-semibold tabular-nums"
                          style={{ color: cloudPercentColor(slot.cloudCover) }}
                        >
                          {slot.cloudCover}%
                        </span>
                        <div className="spot-detail-hour-divider">
                          {slot.seeingArcsec != null ? (
                            <>
                              <Eye
                                className="w-3 h-3 text-[var(--star-blue)] shrink-0"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              <span className="text-[11px] font-semibold text-[var(--star-blue)] tabular-nums">
                                {slot.seeingArcsec.toFixed(1)}″
                              </span>
                            </>
                          ) : slot.transparency != null ? (
                            <>
                              <Moon
                                className="w-3 h-3 text-[var(--star-blue)] shrink-0"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              <span className="text-[11px] font-semibold text-[var(--star-blue)] tabular-nums">
                                {slot.transparency}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-[var(--comet-silver)] tabular-nums">
                              —
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-outfit text-[15px] font-semibold text-[#f8fafc] mb-2">
                  7-Day Forecast
                </h2>
                <ForecastTimeline
                  nights={nights}
                  variant="detail"
                  selectedKey={activeNightKey}
                  onSelect={(key) => setSelectedNightKey(key)}
                />
              </section>
            </>
          )}

          {spot.notes?.trim() ? (
            <section className="pt-1 border-t border-white/[0.06]">
              <h2 className="font-outfit text-[13px] font-semibold text-[var(--comet-silver)] mb-1.5">
                Notes
              </h2>
              <p className="text-sm text-[#e2e8f0] leading-relaxed whitespace-pre-wrap">
                {spot.notes.trim()}
              </p>
            </section>
          ) : null}

          {spot.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {spot.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--comet-silver)] border border-white/[0.08]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
