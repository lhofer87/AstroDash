'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/app/components/map/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="h-[100dvh] flex items-center justify-center bg-slate-950 text-sky-400">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="h-[100dvh] w-full relative bg-[var(--obsidian)]">
      <MapView />
    </div>
  );
}
