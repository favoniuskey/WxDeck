import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MonitorCog, Wind, Gauge, ChevronDown } from 'lucide-react';
import type { AliziaMode } from '@shared/types';

interface Props {
  ventActive: boolean;
  pressionActive: boolean;
  onToggle: (mode: AliziaMode) => void;
}

const PANEL_WIDTH = 380;

export function AliziaMenu({ ventActive, pressionActive, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const anyActive = ventActive || pressionActive;
  const activeCount = (ventActive ? 1 : 0) + (pressionActive ? 1 : 0);

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
            ? 'alizia-button-active px-2.5 py-1.5 bg-gradient-to-r from-red-500/30 via-red-500/20 to-red-600/25 text-red-100'
            : 'px-2.5 py-1.5 hover:bg-white/[0.08] text-ink-200'
        }`}
        title="ALIZIA - boitier Pulsonic répliqué (Vent + Pression)"
      >
        <MonitorCog className={`w-4 h-4 ${anyActive ? 'drop-shadow-[0_0_6px_rgba(255,80,50,0.8)]' : ''}`} />
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase">ALIZIA</span>
        {anyActive && (
          <span className="text-[9px] tabular-nums opacity-80 font-semibold">{activeCount}</span>
        )}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
        {anyActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 alizia-led shadow-[0_0_8px_rgba(255,60,30,0.9)]" />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[999] glass-strong rounded-2xl border border-white/10 shadow-2xl p-3 animate-fade-in"
            style={{
              top: pos.top,
              right: pos.right,
              width: PANEL_WIDTH
            }}
          >
            <div className="px-2 py-2 mb-1.5">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-100 flex items-center gap-2">
                <MonitorCog className="w-3.5 h-3.5" />
                Boitier ALIZIA 0330
              </div>
              <div className="text-[11px] text-ink-400 mt-1 leading-relaxed">
                Réplique fidèle du système Pulsonic utilisé par les contrôleurs réels. Fenêtre flottante, déplaçable partout sur l'écran, peut rester toujours au-dessus de tes autres applications.
              </div>
            </div>

            <div className="space-y-2">
              <MenuItem
                icon={<Wind className="w-5 h-5 text-sky-300" />}
                title="ALIZIA Vent"
                description="Vitesse et direction du vent (MIN / MOY / MAX) avec affichage du QFU actif"
                active={ventActive}
                onClick={() => {
                  onToggle('vent');
                  setOpen(false);
                }}
              />
              <MenuItem
                icon={<Gauge className="w-5 h-5 text-amber-300" />}
                title="ALIZIA Pression"
                description="QNH et QFE calculé avec l'élévation du terrain"
                active={pressionActive}
                onClick={() => {
                  onToggle('pression');
                  setOpen(false);
                }}
              />
            </div>

            <div className="mt-3 pt-2 border-t border-white/[0.06] px-2 text-[10px] text-ink-400 leading-relaxed">
              Tu peux ouvrir les deux boitiers en même temps. Chacun a son propre bouton « toujours au-dessus » dans sa barre de titre, pour rester visible par-dessus Aurora, navigateur, etc.
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function MenuItem({
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
          ? 'bg-red-500/[0.08] border-red-400/30 hover:bg-red-500/[0.12] hover:border-red-400/45'
          : 'bg-white/[0.025] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${
          active ? 'bg-red-500/10 border-red-400/30' : 'bg-white/[0.04] border-white/[0.08]'
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold tracking-wide text-ink-100">{title}</span>
          {active && (
            <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 rounded-md bg-red-500/15 border border-red-400/30 text-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 alizia-led" />
              En cours
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-400 leading-relaxed">{description}</div>
      </div>

      <div
        className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold tracking-[0.15em] uppercase transition-colors ${
          active
            ? 'bg-red-500/20 border border-red-400/40 text-red-100 group-hover:bg-red-500/30'
            : 'bg-accent/15 border border-accent/30 text-accent group-hover:bg-accent/25 group-hover:text-white'
        }`}
      >
        {active ? 'Fermer' : 'Ouvrir'}
      </div>
    </button>
  );
}
