import { Minus, Square, X, Settings as SettingsIcon, RefreshCw, MonitorCog } from 'lucide-react';
import { api } from '../lib/api';
import iconUrl from '/icon-64.png';

interface Props {
  onOpenSettings: () => void;
  onCheckUpdates: () => void;
  onToggleAlizia: () => void;
  aliziaActive: boolean;
}

export function TitleBar({ onOpenSettings, onCheckUpdates, onToggleAlizia, aliziaActive }: Props) {
  return (
    <div className="draggable h-11 flex items-center justify-between px-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center gap-2 pl-1">
        <img src={iconUrl} alt="" className="w-6 h-6 rounded-md" draggable={false} />
        <span className="text-[13px] font-semibold tracking-wide">WxDeck</span>
        <span className="text-[11px] text-ink-400 ml-1">by FavoniusKey</span>
      </div>
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={onToggleAlizia}
          className={`relative flex items-center gap-1.5 rounded-lg transition-all duration-200 ${
            aliziaActive
              ? 'alizia-button-active px-3 py-1.5 bg-gradient-to-r from-red-500/30 via-red-500/20 to-red-600/25 text-red-100'
              : 'p-2 hover:bg-white/[0.08] text-ink-300'
          }`}
          title={aliziaActive ? 'ALIZIA 0330 - cliquer pour fermer' : 'ALIZIA 0330 - réplique Pulsonic'}
        >
          <MonitorCog
            className={`w-4 h-4 ${aliziaActive ? 'drop-shadow-[0_0_6px_rgba(255,80,50,0.8)]' : ''}`}
          />
          {aliziaActive && (
            <>
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Alizia</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 alizia-led shadow-[0_0_8px_rgba(255,60,30,0.9)]" />
            </>
          )}
        </button>
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
