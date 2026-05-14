import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Wind, Megaphone, FileText, ChevronDown } from 'lucide-react';
import type { DockKind } from '@shared/types';

interface Props {
  windActive: boolean;
  atisActive: boolean;
  rawActive: boolean;
  onToggle: (kind: DockKind) => void;
}

const PANEL_WIDTH = 380;

export function DockMenu({ windActive, atisActive, rawActive, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const anyActive = windActive || atisActive || rawActive;
  const activeCount = (windActive ? 1 : 0) + (atisActive ? 1 : 0) + (rawActive ? 1 : 0);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const updatePos = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-1.5 rounded-lg transition-all duration-200 ${
          anyActive
            ? 'px-2.5 py-1.5 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-600/20 text-sky-100 ring-1 ring-sky-400/30 shadow-[0_0_12px_-2px_rgba(56,189,248,0.35)]'
            : 'px-2.5 py-1.5 hover:bg-white/[0.08] text-ink-200'
        }`}
        title="Détacher les barres d'information (Vent / ATIS / Brut)"
      >
        <Layers className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Inserts</span>
        {anyActive && (
          <span className="text-[9px] tabular-nums opacity-80 font-semibold">{activeCount}</span>
        )}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[999] glass-strong rounded-2xl border border-white/10 shadow-2xl p-3 animate-fade-in"
            style={{ top: pos.top, right: pos.right, width: PANEL_WIDTH }}
          >
            <div className="px-2 py-2 mb-1.5">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-100 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Inserts détachables
              </div>
              <div className="text-[11px] text-ink-400 mt-1 leading-relaxed">
                Sors une ou plusieurs barres d'info de WxDeck dans des petites fenêtres flottantes, déplaçables sur ton écran et toujours visibles par-dessus Aurora ou n'importe quelle autre application.
              </div>
            </div>

            <div className="space-y-2">
              <DockItem
                icon={<Wind className="w-5 h-5 text-sky-300" />}
                title="Composantes vent"
                description="Face, arrière, traversier et vent total sur la piste préférentielle"
                active={windActive}
                onClick={() => {
                  onToggle('wind');
                  setOpen(false);
                }}
              />
              <DockItem
                icon={<Megaphone className="w-5 h-5 text-emerald-300" />}
                title="ATIS"
                description="Information letter, pistes ARR/DEP, TFL et alertes de cohérence"
                active={atisActive}
                onClick={() => {
                  onToggle('atis');
                  setOpen(false);
                }}
              />
              <DockItem
                icon={<FileText className="w-5 h-5 text-violet-300" />}
                title="METAR / TAF brut"
                description="Texte brut du METAR et du TAF tels que reçus d'AVWX"
                active={rawActive}
                onClick={() => {
                  onToggle('raw');
                  setOpen(false);
                }}
              />
            </div>

            <div className="mt-3 pt-2 border-t border-white/[0.06] px-2 text-[10px] text-ink-400 leading-relaxed">
              Chaque fenêtre détachée a son propre bouton « toujours au-dessus » dans sa barre supérieure. Elles se synchronisent en temps réel avec WxDeck.
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function DockItem({
  icon,
  title,
  description,
  active,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all p-3 flex items-center gap-3 group ${
        active
          ? 'bg-sky-500/[0.08] border-sky-400/30 hover:bg-sky-500/[0.12] hover:border-sky-400/45'
          : 'bg-white/[0.025] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${
          active ? 'bg-sky-500/10 border-sky-400/30' : 'bg-white/[0.04] border-white/[0.08]'
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold tracking-wide text-ink-100">{title}</span>
          {active && (
            <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Détaché
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-400 leading-relaxed">{description}</div>
      </div>

      <div
        className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold tracking-[0.15em] uppercase transition-colors ${
          active
            ? 'bg-sky-500/20 border border-sky-400/40 text-sky-100 group-hover:bg-sky-500/30'
            : 'bg-accent/15 border border-accent/30 text-accent group-hover:bg-accent/25 group-hover:text-white'
        }`}
      >
        {active ? 'Fermer' : 'Détacher'}
      </div>
    </button>
  );
}
