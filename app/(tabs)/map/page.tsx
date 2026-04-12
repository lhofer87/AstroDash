'use client';

import dynamic from 'next/dynamic';

const mapShellClass =
  'w-full relative bg-[var(--obsidian)] overflow-hidden overscroll-none min-h-0';
const mapShellStyle = {
  /** TabBar is fixed h-16 + safe area; must match tabs layout pb so the page does not scroll past the viewport (otherwise touch drags scroll the page instead of panning the map). */
  height: 'calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px))',
} as const;

const MapView = dynamic(() => import('@/app/components/map/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div
      className={`${mapShellClass} flex items-center justify-center text-sky-400`}
      style={mapShellStyle}
    >
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className={mapShellClass} style={mapShellStyle}>
      <MapView />
    </div>
  );
}
