import { Minus, Square, X, Settings as SettingsIcon, RefreshCw, Wind, Gauge } from 'lucide-react';
import type { AliziaMode } from '@shared/types';
import { api } from '../lib/api';
import iconUrl from '/icon-64.png';

interface Props {
  onOpenSettings: () => void;
  onCheckUpdates: () => void;
  onToggleAlizia: (mode: AliziaMode) => void;
  ventActive: boolean;
  pressionActive: boolean;
}

export function TitleBar({ onOpenSettings, onCheckUpdates, onToggleAlizia, ventActive, pressionActive }: Props) {
  return (
    <div className="draggable h-11 flex items-center justify-between px-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center gap-2 pl-1">
        <img src={iconUrl} alt="" className="w-6 h-6 rounded-md" draggable={false} />
        <span className="text-[13px] font-semibold tracking-wide">WxDeck</span>
        <span className="text-[11px] text-ink-400 ml-1">by FavoniusKey</span>
      </div>
      <div className="no-drag flex items-center gap-1">
        <AliziaButton
          icon={<Wind className="w-4 h-4" />}
          label="Vent"
          active={ventActive}
          onClick={() => onToggleAlizia('vent')}
        />
        <AliziaButton
          icon={<Gauge className="w-4 h-4" />}
          label="Press"
          active={pressionActive}
          onClick={() => onToggleAlizia('pression')}
        />
        <div className="w-px h-5 bg-white/[0.08] mx-1" />
        <button onClick={onCheckUpdates} className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors" title="Vérifier les mises à jour">
          <RefreshCw className="w-4 h-4 text-ink-300" />
        </button>
        <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors" title="Paramètres">
          <SettingsIcon className="w-4 h-4 text-ink-300" />
        </button>
        <div className="w-px h-5 bg-white/[0.08] mx-1" />
        <button onClick={() => api.windowMinimize()} className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors">
          <Minus className="w-4 h-4 text-ink-300" />
        </button>
        <button onClick={() => api.windowMaximizeToggle()} className="p-2 rounded-lg hover:bg-white/[0.08] transition-colors">
          <Square className="w-3.5 h-3.5 text-ink-300" />
        </button>
        <button onClick={() => api.windowClose()} className="p-2 rounded-lg hover:bg-red-500/30 transition-colors">
          <X className="w-4 h-4 text-ink-200" />
        </button>
      </div>
    </div>
  );
}

function AliziaButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-lg transition-all duration-200 ${
        active
          ? 'alizia-button-active px-2.5 py-1.5 bg-gradient-to-r from-red-500/30 via-red-500/20 to-red-600/25 text-red-100'
          : 'px-2 py-1.5 hover:bg-white/[0.08] text-ink-300'
      }`}
      title={active ? `ALIZIA ${label} - cliquer pour fermer` : `Ouvrir ALIZIA ${label}`}
    >
      <span className={active ? 'drop-shadow-[0_0_6px_rgba(255,80,50,0.8)]' : ''}>{icon}</span>
      <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${active ? '' : 'text-ink-300'}`}>
        {label}
      </span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-red-400 alizia-led shadow-[0_0_8px_rgba(255,60,30,0.9)]" />}
    </button>
  );
}
