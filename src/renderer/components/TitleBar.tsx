import { Minus, Square, X, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import type { AliziaMode } from '@shared/types';
import { api } from '../lib/api';
import { AliziaMenu } from './AliziaMenu';
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
        <AliziaMenu ventActive={ventActive} pressionActive={pressionActive} onToggle={onToggleAlizia} />
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
