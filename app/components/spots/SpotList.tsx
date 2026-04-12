'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Star, Pencil, Trash2, Navigation } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Modal } from '@/app/components/ui/Modal';
import { SpotForm } from '@/app/components/spots/SpotForm';
import { bortleSkyLabel } from '@/lib/utils/bortleLabels';
import type { Spot } from '@/lib/types/spot';
import { useSpotStore } from '@/lib/stores/spot-store';

type SortKey = 'name' | 'bortle' | 'date';

export function SpotList({ spots }: { spots: Spot[] }) {
  const updateSpot = useSpotStore((s) => s.updateSpot);
  const deleteSpot = useSpotStore((s) => s.deleteSpot);
  const toggleFavorite = useSpotStore((s) => s.toggleFavorite);

  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('date');
  const [editing, setEditing] = useState<Spot | null>(null);
  const [deleting, setDeleting] = useState<Spot | null>(null);

  const filtered = useMemo(() => {
    let rows = spots.filter(
      (s) =>
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === 'name') {
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'bortle') {
      rows = [...rows].sort((a, b) => a.bortleClass - b.bortleClass);
    } else {
      rows = [...rows].sort((a, b) => b.createdAt - a.createdAt);
    }
    return rows;
  }, [spots, q, sort]);

  const pill = (key: SortKey, label: string) => {
    const active = sort === key;
    return (
      <button
        type="button"
        onClick={() => setSort(key)}
        className={`inline-flex shrink-0 items-center justify-center rounded-full !px-5 !py-2.5 text-sm font-medium leading-snug transition-colors ${
          active
            ? 'bg-[#38BDF8] text-[#020617]'
            : 'bg-[rgba(148,163,184,0.15)] text-[#94A3B8] hover:bg-[rgba(148,163,184,0.22)]'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Figma 9:1077 layout_V3XPCC: gap 24px pod header blokem; uvnitř header gap 16px (gap-4) */}
      <div className="flex flex-col gap-4">
        <div
          className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl border !px-6 bg-[var(--glass-bg)] backdrop-blur-xl"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <Search className="h-5 w-5 shrink-0 text-[#94A3B8]" aria-hidden />
          <input
            type="search"
            placeholder="Search spots..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-h-0 min-w-0 flex-1 bg-transparent !py-2 font-sans text-base font-normal leading-normal text-[#f8fafc] outline-none placeholder:text-[rgba(248,250,252,0.5)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pill('date', 'Date')}
          {pill('name', 'Name')}
          {pill('bortle', 'Bortle')}
        </div>
      </div>

      <ul className="flex flex-col gap-6">
        {filtered.map((spot) => (
          <li key={spot.id}>
            <GlassCard className="!rounded-3xl !p-7 animate-fade-in">
              <div className="flex flex-col gap-4">
                <div className="min-w-0 flex flex-col gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate font-outfit text-[18px] font-semibold leading-7 text-[#f8fafc]">
                      {spot.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(spot.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center text-[#94A3B8] transition-colors hover:text-amber-400"
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className={`h-5 w-5 ${spot.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                  </div>
                  <p className="text-sm font-normal leading-5 text-[#94A3B8]">
                    {spot.lat.toFixed(4)}°, {spot.lng.toFixed(4)}°
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-normal leading-5 text-[#94A3B8]">
                    <span>Bortle {spot.bortleClass}</span>
                    <span>{bortleSkyLabel(spot.bortleClass)}</span>
                    <span>{spot.elevation}m</span>
                  </div>
                  {spot.tags.length > 0 && (
                    <p className="pt-1 text-xs text-[#38BDF8]/90">
                      {spot.tags.join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex w-full min-w-0 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(spot)}
                    className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] !px-2 !py-2.5 bg-[rgba(56,189,248,0.1)] text-sm font-medium text-[#38BDF8] hover:bg-[rgba(56,189,248,0.15)] sm:!px-3"
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    <span className="truncate">Edit</span>
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] !px-2 !py-2.5 bg-[rgba(56,189,248,0.1)] text-sm font-medium text-[#38BDF8] hover:bg-[rgba(56,189,248,0.15)] sm:!px-3"
                  >
                    <Navigation className="h-4 w-4 shrink-0" />
                    <span className="truncate">Navigate</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleting(spot)}
                    className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] !px-2 !py-2.5 bg-[rgba(248,113,113,0.1)] text-sm font-medium text-[#F87171] hover:bg-[rgba(248,113,113,0.2)] sm:!px-3"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Delete</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-[var(--comet-silver)] text-sm text-center py-6 mt-6">
          No spots match.{' '}
          <Link href="/map" className="text-[var(--star-blue)] underline">
            Add from map
          </Link>
        </p>
      )}

      <Modal
        open={!!editing}
        title="Edit Spot"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <SpotForm
            spot={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(patch) => {
              void updateSpot(editing.id, patch);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        title="Delete spot?"
        onClose={() => setDeleting(null)}
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Remove <strong>{deleting.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="px-4 py-2 rounded-xl text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void deleteSpot(deleting.id);
                  setDeleting(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
