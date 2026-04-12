import { create } from 'zustand';
import { db } from '@/lib/db';
import type { Spot, SpotInput } from '@/lib/types/spot';

interface SpotState {
  spots: Spot[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addSpot: (input: SpotInput) => Promise<Spot>;
  updateSpot: (id: string, patch: Partial<SpotInput>) => Promise<void>;
  deleteSpot: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

function now() {
  return Date.now();
}

export const useSpotStore = create<SpotState>((set, get) => ({
  spots: [],
  hydrated: false,

  hydrate: async () => {
    const rows = await db.spots.toArray();
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ spots: rows, hydrated: true });
  },

  addSpot: async (input) => {
    const t = now();
    const spot: Spot = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: t,
      updatedAt: t,
    };
    await db.spots.add(spot);
    await get().hydrate();
    return spot;
  },

  updateSpot: async (id, patch) => {
    const prev = await db.spots.get(id);
    if (!prev) return;
    const next: Spot = {
      ...prev,
      ...patch,
      updatedAt: now(),
    };
    await db.spots.put(next);
    await get().hydrate();
  },

  deleteSpot: async (id) => {
    await db.spots.delete(id);
    await get().hydrate();
  },

  toggleFavorite: async (id) => {
    const prev = await db.spots.get(id);
    if (!prev) return;
    await db.spots.put({
      ...prev,
      isFavorite: !prev.isFavorite,
      updatedAt: now(),
    });
    await get().hydrate();
  },
}));
