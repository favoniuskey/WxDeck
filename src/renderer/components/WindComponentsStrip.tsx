import { ArrowDown, ArrowUp, MoveHorizontal } from 'lucide-react';
import type { ExpectedConfig, MetarReport } from '@shared/types';

interface Props {
  expectedConfig: ExpectedConfig | null;
  metar: MetarReport | null;
}

export function WindComponentsStrip({ expectedConfig, metar }: Props) {
  if (!expectedConfig || expectedConfig.headingDeg == null || !metar) return null;
  const wc = expectedConfig.windComponents;
  const totalKt = Math.round(metar.wind.speed);
  const rwy = expectedConfig.arrRunways[0] ?? expectedConfig.depRunways[0] ?? '';

  const tailWarn = wc.tailwind >= 5;
  const crossWarn = wc.crosswind >= 15;

  return (
    <div className="glass rounded-2xl px-5 py-2.5 flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">Composantes vent</span>
        <span className="text-ink-200 font-semibold">RWY {rwy}</span>
      </div>

      <Stat
        icon={<ArrowDown className="w-3.5 h-3.5" />}
        label="Face"
        value={wc.headwind}
        color={wc.headwind > 0 ? 'text-emerald-300' : 'text-ink-500'}
        muted={wc.headwind === 0}
      />
      <Stat
        icon={<ArrowUp className="w-3.5 h-3.5" />}
        label="Arrière"
        value={wc.tailwind}
        color={tailWarn ? 'text-red-300' : wc.tailwind > 0 ? 'text-amber-300' : 'text-ink-500'}
        muted={wc.tailwind === 0}
      />
      <Stat
        icon={<MoveHorizontal className="w-3.5 h-3.5" />}
        label={wc.crossFromLeft ? 'Travers G' : 'Travers D'}
        value={wc.crosswind}
        color={crossWarn ? 'text-red-300' : wc.crosswind > 5 ? 'text-amber-300' : 'text-ink-300'}
        muted={wc.crosswind === 0}
      />

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-ink-400 text-xs">
        <span>Vent total</span>
        <span className="text-ink-200 font-semibold tabular-nums">{totalKt} kt</span>
      </div>

      {(tailWarn || crossWarn) && (
        <div className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300 text-[11px] font-semibold">
          {tailWarn ? 'Vent arrière > 5 kt' : 'Travers > 15 kt'}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color, muted }: { icon: React.ReactNode; label: string; value: number; color: string; muted: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${muted ? 'opacity-50' : ''}`}>
      <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${color}`}>
        {icon}
        {label}
      </span>
      <span className={`text-base font-bold tabular-nums ${color}`}>{value.toFixed(1)}</span>
      <span className="text-[10px] text-ink-400">kt</span>
    </div>
  );
}
