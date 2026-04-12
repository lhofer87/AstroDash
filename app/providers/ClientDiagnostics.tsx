'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  buildClientEnvSnapshot,
  isClientDebugEnabled,
  setClientDebugPersistence,
  type ClientEnvSnapshot,
} from '@/lib/diagnostics/client-debug';

const MAX_ENTRIES = 35;

type DiagEntry = {
  t: number;
  type: string;
  message: string;
  stack?: string;
  source?: string;
};

export function ClientDiagnostics({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<DiagEntry[]>([]);
  const [snapshot, setSnapshot] = useState<ClientEnvSnapshot | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [persistDebug, setPersistDebug] = useState(false);

  useEffect(() => {
    const on = isClientDebugEnabled();
    setEnabled(on);
    try {
      setPersistDebug(localStorage.getItem('astrodash-debug') === '1');
    } catch {
      setPersistDebug(false);
    }
    if (on) {
      const fromQuery = new URLSearchParams(window.location.search).get('debug');
      if (fromQuery === '1' || fromQuery === 'true') setExpanded(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const push = (e: DiagEntry) =>
      setEntries((prev) => [...prev.slice(-(MAX_ENTRIES - 1)), e]);

    const onErr = (ev: ErrorEvent) => {
      push({
        t: Date.now(),
        type: 'window.error',
        message: ev.message || 'ErrorEvent',
        stack: ev.error?.stack,
      });
    };
    const onRej = (ev: PromiseRejectionEvent) => {
      const r = ev.reason;
      push({
        t: Date.now(),
        type: 'unhandledrejection',
        message: r instanceof Error ? r.message : String(r),
        stack: r instanceof Error ? r.stack : undefined,
      });
    };
    const onDiag = (ev: Event) => {
      const ce = ev as CustomEvent<{ source?: string; message?: string; time?: number }>;
      const d = ce.detail;
      push({
        t: d?.time ?? Date.now(),
        type: 'mapbox-gl',
        message: d?.message ?? '',
        source: d?.source,
      });
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    window.addEventListener('astrodash-diag', onDiag);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
      window.removeEventListener('astrodash-diag', onDiag);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const snap = await buildClientEnvSnapshot();
        if (!cancelled) setSnapshot(snap);
      } catch (e) {
        if (!cancelled) {
          setSnapshot({
            capturedAt: new Date().toISOString(),
            href: typeof window !== 'undefined' ? window.location.href : '',
            ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            viewport: { width: 0, height: 0, dpr: 1 },
            webgl: { ok: false, error: e instanceof Error ? e.message : String(e) },
            mapboxSupportedStrict: null,
            mapboxSupportedLenient: null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const refreshSnapshot = useCallback(() => {
    void (async () => {
      try {
        setSnapshot(await buildClientEnvSnapshot());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const copyReport = useCallback(async () => {
    const report = {
      snapshot,
      recentEvents: entries,
    };
    const text = JSON.stringify(report, null, 2);
    setCopyState('idle');
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('ok');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      try {
        window.prompt('Zkopíruj text ručně (Ctrl/Cmd+C):', text.slice(0, 4000));
        setCopyState('ok');
      } catch {
        setCopyState('fail');
      }
      window.setTimeout(() => setCopyState('idle'), 3000);
    }
  }, [snapshot, entries]);

  if (!enabled) return <>{children}</>;

  return (
    <>
      {children}
      <div
        className="fixed z-[9999] flex flex-col gap-1 pointer-events-auto"
        style={{
          bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          left: expanded ? 'max(0.5rem, env(safe-area-inset-left, 0px))' : undefined,
          maxWidth: expanded ? 'min(100vw - 1rem, 420px)' : undefined,
        }}
      >
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="self-end rounded-full border border-white/20 bg-slate-950/95 px-3 py-2 text-[11px] font-medium text-sky-300 shadow-lg backdrop-blur-md"
          >
            AstroDash debug
          </button>
        )}
        {expanded && (
          <div className="rounded-2xl border border-white/15 bg-slate-950/96 p-3 text-[11px] text-zinc-200 shadow-2xl backdrop-blur-md max-h-[min(70vh,520px)] flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sky-400">Diagnostika</span>
              <button
                type="button"
                onClick={refreshSnapshot}
                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-zinc-300"
              >
                Obnovit snapshot
              </button>
              <button
                type="button"
                onClick={copyReport}
                className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[10px] text-sky-200"
              >
                {copyState === 'ok'
                  ? 'Zkopírováno'
                  : copyState === 'fail'
                    ? 'Kopírování selhalo'
                    : 'Kopírovat report'}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="ml-auto rounded-lg px-2 py-1 text-[10px] text-zinc-500"
              >
                Skrýt
              </button>
            </div>
            <p className="text-[10px] leading-snug text-zinc-500">
              Zapnuto přes <code className="text-zinc-400">?debug=1</code> nebo{' '}
              <code className="text-zinc-400">localStorage astrodash-debug=1</code>. Na Pixelu
              zkontroluj Chrome → úspora dat / Lite mode a zda neblokuje WebGL. Pošli report
              sobě nebo vývojáři.
            </p>
            <label className="flex items-center gap-2 text-[10px] text-zinc-400">
              <input
                type="checkbox"
                checked={persistDebug}
                onChange={(e) => {
                  const on = e.target.checked;
                  setPersistDebug(on);
                  setClientDebugPersistence(on);
                  setEnabled(isClientDebugEnabled());
                }}
                className="rounded border-zinc-600"
              />
              Zapamatovat (localStorage)
            </label>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-2 font-mono text-[10px] leading-relaxed">
              {snapshot && (
                <pre className="whitespace-pre-wrap break-words rounded-lg bg-black/40 p-2 text-zinc-300">
                  {JSON.stringify(snapshot, null, 2)}
                </pre>
              )}
              {entries.length > 0 && (
                <div>
                  <div className="mb-1 text-zinc-500">Poslední události ({entries.length})</div>
                  <ul className="space-y-1">
                    {entries.slice(-12).map((e, i) => (
                      <li key={`${e.t}-${i}`} className="rounded bg-black/30 px-2 py-1">
                        <span className="text-zinc-500">{new Date(e.t).toLocaleTimeString()}</span>{' '}
                        <span className="text-amber-200/90">{e.type}</span>{' '}
                        {e.source && <span className="text-zinc-500">({e.source}) </span>}
                        <span className="text-rose-200/90">{e.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
