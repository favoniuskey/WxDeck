import type { MetarReport, TafReport } from '@shared/types';
import { shortTime } from '../lib/format';

interface Props {
  metar: MetarReport | null;
  taf: TafReport | null;
}

export function RawTextStrip({ metar, taf }: Props) {
  return (
    <div className="glass border-t border-white/[0.08] px-5 py-3 space-y-1 font-mono text-[12px] leading-relaxed">
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400 mt-0.5 shrink-0 w-12">METAR</span>
        <span className="text-accent flex-1 break-words">{metar?.rawText ?? 'En attente…'}</span>
        {metar && <span className="text-[10px] text-ink-400 tabular-nums shrink-0">{shortTime(metar.time)}Z</span>}
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400 mt-0.5 shrink-0 w-12">TAF</span>
        <span className="text-ink-200/80 flex-1 break-words">{taf?.rawText ?? 'En attente…'}</span>
        {taf && <span className="text-[10px] text-ink-400 tabular-nums shrink-0">{shortTime(taf.time)}Z</span>}
      </div>
    </div>
  );
}
