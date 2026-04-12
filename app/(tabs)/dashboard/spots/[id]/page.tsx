'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSpotStore } from '@/lib/stores/spot-store';
import { SpotDetailView } from '@/app/components/spots/SpotDetailView';
import { SpotDetailPageShellSkeleton } from '@/app/components/ui/Skeleton';

export default function SpotDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const hydrated = useSpotStore((s) => s.hydrated);
  const spot = useSpotStore((s) => s.spots.find((x) => x.id === id));

  if (!hydrated) {
    return <SpotDetailPageShellSkeleton />;
  }

  if (!id || !spot) {
    return (
      <div className="dashboard-shell flex flex-col gap-4">
        <p className="text-[var(--comet-silver)] text-sm">
          This spot could not be found.
        </p>
        <Link href="/dashboard" className="btn-primary w-fit">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <SpotDetailView spot={spot} />;
}
