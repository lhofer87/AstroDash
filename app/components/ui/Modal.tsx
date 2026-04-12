'use client';

import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 backdrop-blur-[2px] animate-fade-in"
      style={{ background: 'rgba(2, 6, 23, 0.85)' }}
      role="dialog"
      aria-modal
    >
      {/* Figma SpotFormModal: max 383px, padding 25px, radius 24px, gap 16 title → body */}
      <div
        className="glass-card relative flex max-h-[90vh] w-full max-w-[383px] flex-col gap-4 overflow-y-auto !rounded-3xl !p-[25px]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h2 className="font-outfit text-[20px] font-semibold leading-[1.4] tracking-tight text-[#f8fafc]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-[#f8fafc]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
