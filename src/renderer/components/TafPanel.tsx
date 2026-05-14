import { FileText } from 'lucide-react';
import type { TafReport } from '@shared/types';
import { GlassCard } from './GlassCard';
import { shortTime } from '../lib/format';

interface Props {
  taf: TafReport | null;
}

export function TafPanel({ taf }: Props) {
  return (
    <GlassCard
      title="TAF"
      icon={<FileText className="w-3.5 h-3.5" />}
      right={taf && <span className="text-[10px] text-ink-400 tabular-nums">{shortTime(taf.time)} UTC</span>}
    >
      {!taf ? (
        <div className="text-ink-400 text-sm">En attente de données…</div>
      ) : (
        <div className="font-mono text-[12px] leading-relaxed text-ink-200/80 break-words">
          {taf.rawText}
        </div>
      )}
    </GlassCard>
  );
}
