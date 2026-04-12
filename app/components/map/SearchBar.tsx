'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

type Feature = {
  id: string;
  place_name: string;
  center: [number, number];
};

export function SearchBar({
  onSelect,
}: {
  onSelect: (lng: number, lat: number, label: string) => void;
}) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Feature[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const search = useCallback(
    async (query: string) => {
      if (!token || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${token}&limit=5`;
        const res = await fetch(url);
        const data = (await res.json()) as { features?: Feature[] };
        setResults(data.features ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return (
    <div className="absolute top-6 left-6 right-6 z-20 max-w-none pointer-events-none">
      <div className="relative group max-w-md mx-auto pointer-events-auto">
        <div className="map-search-field group-focus-within:border-[var(--star-blue)]/35 transition-colors">
          <Search
            className="w-5 h-5 shrink-0 text-[var(--comet-silver)] group-focus-within:text-[var(--star-blue)] transition-colors"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search location..."
            value={q}
            onChange={(e) => {
              const v = e.target.value;
              setQ(v);
              void search(v);
            }}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-[#f8fafc] placeholder:text-[#f8fafc]/50"
          />
          {loading && (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--star-blue)] shrink-0" />
          )}
        </div>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 glass-card max-h-56 overflow-y-auto space-y-1 max-w-md mx-auto pointer-events-auto !py-2 !px-2">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className="w-full text-left text-sm py-2.5 px-3 rounded-xl hover:bg-white/10 text-[#f8fafc]"
                onClick={() => {
                  const [lng, lat] = f.center;
                  onSelect(lng, lat, f.place_name);
                  setResults([]);
                  setQ('');
                }}
              >
                {f.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
