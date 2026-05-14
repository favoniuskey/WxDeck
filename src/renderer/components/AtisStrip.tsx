import { Megaphone, AlertTriangle, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Layers, Clock, HelpCircle } from 'lucide-react';
import type { AtisWarning, AuroraAtis, ExpectedConfig } from '@shared/types';

interface Props {
  atis: AuroraAtis | null;
  warnings: AtisWarning[];
  auroraConnected: boolean;
  expectedConfig: ExpectedConfig | null;
  onAuroraHelp?: () => void;
}

export function AtisStrip({ atis, warnings, auroraConnected, expectedConfig, onAuroraHelp }: Props) {
  const runwayWarns = warnings.filter((w) => w.kind === 'runway');
  const tflWarn = warnings.find((w) => w.kind === 'tfl');
  const sessionWarns = warnings.filter((w) => w.kind === 'session');
  const allOk = warnings.length === 0;

  if (!atis) {
    return (
      <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3 text-sm">
        <Megaphone className="w-4 h-4 text-ink-400" />
        <span className="text-ink-300">
          {auroraConnected ? 'Aucun ATIS publié pour cette station.' : "En attente d'Aurora…"}
        </span>
        {!auroraConnected && onAuroraHelp && (
          <button
            onClick={onAuroraHelp}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-400/25 hover:bg-amber-500/20 text-amber-200 transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
            Aide configuration
          </button>
        )}
        {expectedConfig && (
          <span className="ml-auto flex items-center gap-2 text-xs text-ink-400">
            <Clock className="w-3 h-3" />
            Config recommandée : <span className="text-ink-200 font-semibold">{expectedConfig.name}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl px-5 py-3 flex items-center gap-5 text-sm flex-wrap">
      <div className="flex items-center gap-3">
        <Megaphone className="w-4 h-4 text-accent" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">ATIS</span>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/30 to-accent/5 border border-accent/40 flex items-center justify-center">
          <span className="text-lg font-bold text-accent">{atis.infoLetter}</span>
        </div>
      </div>

      <Pill
        icon={<ArrowDownToLine className="w-3.5 h-3.5" />}
        label="ARR"
        value={atis.arrRunways.join(' / ') || '-'}
        warn={runwayWarns.some((w) => w.message.startsWith('Piste ARR'))}
      />
      <Pill
        icon={<ArrowUpFromLine className="w-3.5 h-3.5" />}
        label="DEP"
        value={atis.depRunways.join(' / ') || '-'}
        warn={runwayWarns.some((w) => w.message.startsWith('Piste DEP'))}
      />
      <Pill
        icon={<Layers className="w-3.5 h-3.5" />}
        label="TFL"
        value={atis.transLvl ? (atis.transLvl.startsWith('FL') ? atis.transLvl : `FL${atis.transLvl}`) : '-'}
        warn={!!tflWarn}
        warnSuffix={tflWarn?.expected}
        warnTone="error"
      />

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {allOk && (
          <span className="flex items-center gap-1.5 text-xs text-accent-ok">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ATIS cohérent
          </span>
        )}
        {runwayWarns.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-amber-300" title={runwayWarns.map((w) => w.message).join(' · ')}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Piste non préférentielle · attendu {expectedConfig?.name ?? 'n/c'}
          </span>
        )}
        {tflWarn && (
          <span className="flex items-center gap-1.5 text-xs text-red-300" title={tflWarn.message}>
            <AlertTriangle className="w-3.5 h-3.5" />
            TFL incohérent (QNH)
          </span>
        )}
        {sessionWarns.map((w, i) => (
          <span
            key={i}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
              w.level === 'error' ? 'bg-red-500/15 text-red-200' : 'bg-amber-500/15 text-amber-200'
            }`}
            title={w.message}
          >
            <AlertTriangle className="w-3 h-3" />
            {w.message}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pill({
  icon,
  label,
  value,
  warn,
  warnSuffix,
  warnTone = 'warn'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warn?: boolean;
  warnSuffix?: string;
  warnTone?: 'warn' | 'error';
}) {
  const palette = !warn
    ? 'bg-white/[0.04] border-white/[0.08]'
    : warnTone === 'error'
      ? 'bg-red-500/15 border-red-400/40'
      : 'bg-amber-500/15 border-amber-400/40';
  const labelTone = !warn
    ? 'text-ink-400'
    : warnTone === 'error'
      ? 'text-red-300'
      : 'text-amber-300';
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${palette}`}>
      <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${labelTone}`}>
        {icon}
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
      {warn && warnSuffix && <span className={`${labelTone} text-xs`}>→ {warnSuffix}</span>}
    </div>
  );
}
