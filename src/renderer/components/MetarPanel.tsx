import { Cloud, Thermometer, Eye, Gauge } from 'lucide-react';
import type { MetarReport } from '@shared/types';
import { GlassCard } from './GlassCard';
import { shortTime } from '../lib/format';

interface Props {
  metar: MetarReport | null;
}

export function MetarPanel({ metar }: Props) {
  return (
    <GlassCard
      title="METAR"
      icon={<Cloud className="w-3.5 h-3.5" />}
      right={metar && <span className="text-[10px] text-ink-400 tabular-nums">{shortTime(metar.time)} UTC</span>}
    >
      {!metar ? (
        <div className="text-ink-400 text-sm">En attente de données…</div>
      ) : (
        <div className="space-y-3">
          <div className="font-mono text-[12px] leading-relaxed text-accent break-words">
            {metar.rawText}
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
            <Stat icon={<Gauge className="w-3 h-3" />} label="QNH" value={`${metar.altimeter.hPa}`} unit="hPa" />
            <Stat icon={<Thermometer className="w-3 h-3" />} label="Temp" value={metar.temperature != null ? `${Math.round(metar.temperature)}` : '-'} unit="°C" />
            <Stat icon={<Thermometer className="w-3 h-3" />} label="Dew" value={metar.dewpoint != null ? `${Math.round(metar.dewpoint)}` : '-'} unit="°C" />
            <Stat icon={<Eye className="w-3 h-3" />} label="Vis" value={metar.visibility?.value != null ? `${metar.visibility.value}` : '-'} unit={metar.visibility?.unit ?? ''} />
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Stat({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-ink-400 text-[10px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums mt-0.5">
        {value} <span className="text-ink-400 text-xs font-normal">{unit}</span>
      </div>
    </div>
  );
}
