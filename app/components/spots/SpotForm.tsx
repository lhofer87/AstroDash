'use client';

import { useState } from 'react';
import type { Spot } from '@/lib/types/spot';

/** Figma 13:2905 SpotFormModal — label/input gap 8px, fields gap 16px, inputs radius 14px, footer gap 12px pt 8px */
const fieldClass =
  'w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(30,41,59,0.5)] !px-4 !py-3 font-sans text-base font-normal leading-normal text-[#f8fafc] outline-none ring-0 placeholder:text-[rgba(248,250,252,0.5)] focus:border-[rgba(56,189,248,0.5)]';

export function SpotForm({
  spot,
  onSubmit,
  onCancel,
}: {
  spot: Spot;
  onSubmit: (patch: { name: string; notes: string; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(spot.name);
  const [notes, setNotes] = useState(spot.notes);
  const [tagsRaw, setTagsRaw] = useState(spot.tags.join(', '));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const tags = tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        onSubmit({ name: name.trim(), notes, tags });
      }}
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium leading-normal text-[#94a3b8]">
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium leading-normal text-[#94a3b8]">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className={`min-h-[122px] resize-y ${fieldClass}`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium leading-normal text-[#94a3b8]">
          Tags (comma-separated)
        </label>
        <input
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="dark site, easy access"
          className={fieldClass}
        />
      </div>
      <p className="text-sm font-normal leading-normal text-[#94a3b8]">
        Bortle {spot.bortleClass} · {spot.elevation}m · radiance ~
        {spot.radiance.toFixed(1)} (from save)
      </p>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-2xl !px-4 !py-0 text-base font-medium text-[#94a3b8] transition-colors hover:bg-white/5"
          style={{ background: 'rgba(148, 163, 184, 0.15)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-2xl !px-4 !py-0 text-base font-medium text-[#020617] transition-opacity hover:opacity-95"
          style={{ background: '#38bdf8' }}
        >
          Save
        </button>
      </div>
    </form>
  );
}
