'use client';

import Link from 'next/link';
import { useSpotStore } from '@/lib/stores/spot-store';
import { SpotCard } from '@/app/components/spots/SpotCard';
import { DashboardSpotCardSkeleton } from '@/app/components/ui/Skeleton';
import { LogoMark, TelescopeWelcomeIcon } from '@/app/components/icons/AstroIcons';

export default function DashboardPage() {
  const spots = useSpotStore((s) => s.spots);
  const hydrated = useSpotStore((s) => s.hydrated);

  const favorites = spots.filter((s) => s.isFavorite);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header-block">
        <div className="flex items-center gap-2">
          <span className="text-[var(--star-blue)]">
            <LogoMark className="w-6 h-6" />
          </span>
          <h1 className="text-2xl font-light font-outfit tracking-tight text-[#f8fafc]">
            AstroDash
          </h1>
        </div>
        <p className="text-sm text-[var(--comet-silver)] leading-snug">
          Your Observing Conditions
        </p>
      </header>

      {!hydrated && (
        <div className="dashboard-spot-list w-full">
          <DashboardSpotCardSkeleton />
          <DashboardSpotCardSkeleton />
        </div>
      )}

      {hydrated && favorites.length === 0 && (
        <div className="flex flex-col flex-1 justify-center items-center text-center gap-4 py-10 px-2 min-h-[360px]">
          <div
            className="flex items-center justify-center w-24 h-24 rounded-full mb-2"
            style={{ background: 'rgba(56, 189, 248, 0.1)' }}
          >
            <TelescopeWelcomeIcon className="w-12 h-12 text-[var(--star-blue)]" />
          </div>
          <h2 className="text-lg font-semibold font-outfit text-[#f8fafc]">
            Welcome to AstroDash!
          </h2>
          <p className="text-sm text-[var(--comet-silver)] max-w-[335px] leading-relaxed">
            Start by finding dark sky locations on the map. Click on any location
            to save it and track observing conditions.
          </p>
          <Link href="/map" className="btn-primary mt-2">
            Explore the Map
          </Link>
        </div>
      )}

      {hydrated && favorites.length > 0 && (
        <div className="dashboard-spot-list">
          {favorites.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}
    </div>
  );
}
