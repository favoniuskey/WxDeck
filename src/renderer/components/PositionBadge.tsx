import { Radio, WifiOff, Headphones } from 'lucide-react';
import type { AtcSession } from '@shared/types';

interface Props {
  session: AtcSession | null;
  whazzupOk: boolean;
}

const RANK_COLORS: Record<string, string> = {
  DEL: 'from-emerald-500/30 to-emerald-400/10 text-emerald-200 border-emerald-400/30',
  GND: 'from-emerald-500/30 to-emerald-400/10 text-emerald-200 border-emerald-400/30',
  TWR: 'from-blue-500/30 to-blue-400/10 text-blue-200 border-blue-400/30',
  APP: 'from-violet-500/30 to-violet-400/10 text-violet-200 border-violet-400/30',
  DEP: 'from-violet-500/30 to-violet-400/10 text-violet-200 border-violet-400/30',
  CTR: 'from-amber-500/30 to-amber-400/10 text-amber-200 border-amber-400/30',
  OBS: 'from-slate-500/30 to-slate-400/10 text-slate-200 border-slate-400/30'
};

export function PositionBadge({ session, whazzupOk }: Props) {
  if (!whazzupOk) {
    return (
      <div className="glass-pill flex items-center gap-2 text-ink-300">
        <WifiOff className="w-3 h-3" />
        IVAO Whazzup indisponible
      </div>
    );
  }
  if (!session) {
    return (
      <div className="glass-pill flex items-center gap-2 text-ink-300">
        <Headphones className="w-3 h-3" />
        Aucune session ATC détectée
      </div>
    );
  }
  const palette = RANK_COLORS[session.rank] ?? RANK_COLORS.OBS;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${palette} border backdrop-blur-xl`}>
      <Radio className="w-3.5 h-3.5" />
      <span className="font-semibold text-sm tracking-wide">{session.callsign}</span>
      {session.frequency && <span className="text-xs opacity-80 tabular-nums">· {session.frequency}</span>}
    </div>
  );
}
