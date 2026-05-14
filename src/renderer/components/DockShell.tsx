import { useEffect, useState } from 'react';
import { X, Minus, Pin, PinOff, GripHorizontal } from 'lucide-react';
import type { DockKind } from '@shared/types';
import { api } from '../lib/api';

interface Props {
  kind: DockKind;
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
}

export function DockShell({ kind, title, subtitle, children }: Props) {
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.dockGetAlwaysOnTop(kind).then((v) => {
      if (mounted) setPinned(v);
    });
    return () => {
      mounted = false;
    };
  }, [kind]);

  const togglePin = async () => {
    const next = !pinned;
    const actual = await api.dockSetAlwaysOnTop(kind, next);
    setPinned(actual);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col p-1.5 select-none">
      <div
        className="rounded-2xl border border-white/[0.08] bg-ink-950/80 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden flex-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div
          className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.05] cursor-grab active:cursor-grabbing"
          style={{ WebkitAppRegion: 'drag', touchAction: 'none' } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 text-ink-400 text-[10px] tracking-[0.18em] uppercase font-bold">
            <GripHorizontal className="w-3 h-3" />
            <span>{title}</span>
            {subtitle && <span className="text-ink-500">· {subtitle}</span>}
          </div>
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={togglePin}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                pinned
                  ? 'bg-red-500/15 border-red-400/40 text-red-300'
                  : 'bg-white/[0.04] border-white/[0.10] hover:bg-white/[0.08] text-ink-400'
              }`}
              title={pinned ? 'Toujours au-dessus (activé)' : 'Toujours au-dessus (désactivé)'}
            >
              {pinned ? <Pin className="w-2.5 h-2.5" /> : <PinOff className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => api.windowMinimize()}
              className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.10] hover:bg-white/[0.08] text-ink-400 flex items-center justify-center"
              title="Réduire"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => api.windowClose()}
              className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.10] hover:bg-red-900/40 hover:border-red-700/40 text-ink-400 flex items-center justify-center"
              title="Fermer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
