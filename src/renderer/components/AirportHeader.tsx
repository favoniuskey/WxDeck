import { MapPin } from 'lucide-react';
import type { AirportProfile, AtcSession } from '@shared/types';

interface Props {
  airport: AirportProfile | null;
  session: AtcSession | null;
}

export function AirportHeader({ airport, session }: Props) {
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <MapPin className="w-6 h-6 text-ink-400" />
        </div>
        <div>
          <div className="text-3xl font-bold tracking-tight text-ink-300">- - - -</div>
          <div className="text-xs text-ink-400 mt-0.5">Connectez-vous à une position ATC sur IVAO</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/5 border border-accent/30 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-accent" />
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight">{session.icao}</div>
        <div className="text-xs text-ink-300 mt-0.5">
          {airport?.name ?? 'Aéroport non répertorié - météo uniquement'}
        </div>
      </div>
    </div>
  );
}
