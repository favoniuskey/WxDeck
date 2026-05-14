import { Megaphone, AlertTriangle, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Layers } from 'lucide-react';
import type { AuroraAtis, AtisWarning } from '@shared/types';
import { GlassCard } from './GlassCard';

interface Props {
  atis: AuroraAtis | null;
  warnings: AtisWarning[];
  auroraConnected: boolean;
}

export function AtisPanel({ atis, warnings, auroraConnected }: Props) {
  const runwayWarn = warnings.find((w) => w.kind === 'runway');
  const tflWarn = warnings.find((w) => w.kind === 'tfl');

  return (
    <GlassCard
      title="ATIS Aurora"
      icon={<Megaphone className="w-3.5 h-3.5" />}
      right={
        <span className={`text-[10px] tabular-nums ${auroraConnected ? 'text-accent-ok' : 'text-ink-400'}`}>
          {auroraConnected ? '● Connecté' : '○ Hors-ligne'}
        </span>
      }
    >
      {!atis ? (
        <div className="text-ink-400 text-sm">
          {auroraConnected ? 'Aucun ATIS publié pour cette station.' : "En attente d'Aurora…"}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-accent/5 border border-accent/30 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">{atis.infoLetter}</span>
            </div>
            <div className="text-xs text-ink-300 uppercase tracking-[0.2em]">
              Information
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <RwyTile icon={<ArrowDownToLine className="w-3 h-3" />} label="ARR" rwys={atis.arrRunways} warn={runwayWarn} />
            <RwyTile icon={<ArrowUpFromLine className="w-3 h-3" />} label="DEP" rwys={atis.depRunways} warn={runwayWarn} />
            <TflTile icon={<Layers className="w-3 h-3" />} label="TFL" actual={atis.transLvl} warn={tflWarn} />
          </div>
          {warnings.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              {warnings.map((w, i) => (
                <WarningRow key={i} warning={w} />
              ))}
            </div>
          )}
          {warnings.length === 0 && (
            <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-xs text-accent-ok">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ATIS cohérent avec le METAR.
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

function RwyTile({ icon, label, rwys, warn }: { icon: React.ReactNode; label: string; rwys: string[]; warn?: AtisWarning }) {
  const flag = warn && rwys.length > 0;
  return (
    <div className={`rounded-xl px-3 py-2 border ${flag ? 'bg-amber-500/10 border-amber-400/30' : 'bg-white/[0.03] border-white/[0.08]'}`}>
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${flag ? 'text-amber-300' : 'text-ink-400'}`}>
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums mt-0.5">
        {rwys.length > 0 ? rwys.join(' ') : '-'}
      </div>
    </div>
  );
}

function TflTile({ icon, label, actual, warn }: { icon: React.ReactNode; label: string; actual?: string; warn?: AtisWarning }) {
  const bad = !!warn;
  return (
    <div className={`rounded-xl px-3 py-2 border ${bad ? 'bg-red-500/10 border-red-400/30' : 'bg-white/[0.03] border-white/[0.08]'}`}>
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${bad ? 'text-red-300' : 'text-ink-400'}`}>
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums mt-0.5">
        {actual ? (actual.startsWith('FL') ? actual : `FL${actual}`) : '-'}
        {bad && warn?.expected && (
          <span className="text-red-300 text-xs ml-2 font-normal">→ {warn.expected}</span>
        )}
      </div>
    </div>
  );
}

function WarningRow({ warning }: { warning: AtisWarning }) {
  const palette =
    warning.level === 'error'
      ? 'text-red-300'
      : warning.level === 'warn'
        ? 'text-amber-300'
        : 'text-ink-300';
  return (
    <div className={`flex items-start gap-2 text-xs ${palette}`}>
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>
        {warning.message}
        {warning.actual && warning.expected && (
          <span className="opacity-70"> (attendu {warning.expected}, ATIS {warning.actual})</span>
        )}
      </span>
    </div>
  );
}
