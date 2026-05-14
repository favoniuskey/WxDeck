import { Plane, Radio, WifiOff } from 'lucide-react';
import type { AtcSession, MetarReport } from '@shared/types';

interface Props {
  icao: string;
  airportName: string | null;
  metar: MetarReport | null;
  session: AtcSession | null;
  whazzupOk: boolean;
  flightCategory?: string;
}

const RANK_PALETTE: Record<string, string> = {
  DEL: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  GND: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  TWR: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
  APP: 'bg-violet-500/20 text-violet-200 border-violet-400/30',
  DEP: 'bg-violet-500/20 text-violet-200 border-violet-400/30',
  CTR: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  OBS: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  UNKNOWN: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  FSS: 'bg-slate-500/20 text-slate-200 border-slate-400/30'
};

function windBg(speed: number | undefined): string {
  if (speed == null) return 'bg-white/[0.04] border-white/10';
  if (speed >= 25) return 'bg-red-500/25 border-red-400/40';
  if (speed >= 15) return 'bg-amber-500/25 border-amber-400/40';
  if (speed >= 4) return 'bg-emerald-500/20 border-emerald-400/30';
  return 'bg-emerald-500/10 border-emerald-400/20';
}

export function OpsBar({ icao, airportName, metar, session, whazzupOk }: Props) {
  const wind = metar?.wind;
  const windBox = windBg(wind?.speed);
  const conditions = metar?.flightRules ?? (metar?.rawText?.includes('CAVOK') ? 'CAVOK' : '---');

  return (
    <div className="glass-strong border-b border-white/10 px-5 py-3 flex items-center gap-5">
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/40 to-accent/10 border border-accent/40 flex items-center justify-center shrink-0">
          <Plane className="w-5 h-5 text-accent" strokeWidth={2.2} />
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight tabular-nums">{icao || '----'}</div>
          <div className="text-[10px] text-ink-400 uppercase tracking-wider truncate max-w-[220px]">
            {airportName ?? 'Aucune session ATC'}
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-3 px-4 border-l border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">QNH</span>
        <span className="text-3xl font-bold tabular-nums">{metar?.altimeter.hPa ?? '----'}</span>
        <span className="text-[10px] text-ink-400 uppercase">hPa</span>
      </div>

      <div className={`flex items-baseline gap-2 px-4 py-1.5 rounded-xl border ${windBox} transition-colors`}>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300 font-semibold">WIND</span>
        <span className="text-2xl font-bold tabular-nums">
          {wind ? (wind.direction === 'VRB' ? 'VRB' : String(wind.direction).padStart(3, '0')) : '---'}
        </span>
        <span className="text-ink-400 text-sm">/</span>
        <span className="text-2xl font-bold tabular-nums">{wind ? String(Math.round(wind.speed)).padStart(2, '0') : '--'}</span>
        {wind?.gust ? <span className="text-sm font-semibold text-amber-300">G{Math.round(wind.gust)}</span> : null}
        <span className="text-[10px] text-ink-400 uppercase ml-1">kt</span>
      </div>

      <div className="flex-1 flex items-center justify-end gap-3">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">Conditions</div>
          <div className="text-lg font-bold tabular-nums">{conditions}</div>
        </div>
        {!whazzupOk ? (
          <div className="glass-pill flex items-center gap-2 text-ink-300">
            <WifiOff className="w-3 h-3" />
            Whazzup HS
          </div>
        ) : session ? (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${RANK_PALETTE[session.rank] ?? RANK_PALETTE.OBS}`}>
            <Radio className="w-3.5 h-3.5" />
            <span className="font-semibold text-sm tracking-wide">{session.callsign}</span>
            {session.frequency && <span className="text-xs opacity-80 tabular-nums">· {session.frequency}</span>}
          </div>
        ) : (
          <div className="glass-pill text-ink-300">Aucune session ATC</div>
        )}
      </div>
    </div>
  );
}
