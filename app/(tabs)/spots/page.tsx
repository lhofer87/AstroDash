'use client';

import Link from 'next/link';
import { useSpotStore } from '@/lib/stores/spot-store';
import { SpotList } from '@/app/components/spots/SpotList';
import { TelescopeWelcomeIcon } from '@/app/components/icons/AstroIcons';

export default function SpotsPage() {
  const spots = useSpotStore((s) => s.spots);
  const hydrated = useSpotStore((s) => s.hydrated);

  return (
    <div
      className="max-w-lg mx-auto flex min-h-[calc(100dvh-4rem)] flex-col gap-4 pb-0"
      style={{
        /* Figma 9:1077 Spots: padding 24px top + sides; below status / notch */
        paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Figma 9:1078 Header: gap 16px mezi nadpisem, search a filtry → gap-4 */}
      <header className="flex w-full min-w-0 items-center justify-between gap-3">
        <h1 className="text-2xl font-light font-outfit tracking-tight text-[#f8fafc] truncate">
          My Spots
        </h1>
        {hydrated && spots.length > 0 && (
          <span
            className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2.5 text-sm font-medium text-[#020617] bg-[#38BDF8] shrink-0"
            aria-label={`${spots.length} spots`}
          >
            {spots.length}
          </span>
        )}
      </header>

      {!hydrated && (
        <p className="text-[var(--comet-silver)] text-sm animate-pulse">
          Loading…
        </p>
      )}

      {hydrated && spots.length === 0 && (
        <div className="flex flex-col flex-1 justify-center items-center text-center gap-4 py-12 px-2">
          <div
            className="flex items-center justify-center w-24 h-24 rounded-full mb-2"
            style={{ background: 'rgba(56, 189, 248, 0.1)' }}
          >
            <TelescopeWelcomeIcon className="w-12 h-12 text-[var(--star-blue)]" />
          </div>
          <h2 className="text-lg font-semibold font-outfit text-[#f8fafc]">
            No spots yet
          </h2>
          <p className="text-sm text-[var(--comet-silver)] max-w-[320px] leading-relaxed">
            Save locations from the map to see them here, manage favorites, and
            plan your night under the stars.
          </p>
          <Link href="/map" className="btn-primary mt-2">
            Explore the Map
          </Link>
        </div>
      )}

      {hydrated && spots.length > 0 && <SpotList spots={spots} />}
    </div>
  );
}
