import { Lock } from 'lucide-react';
import { useLiveData } from '../hooks/useLiveData';
import { OpsBar } from '../components/OpsBar';
import { RunwayDiagram } from '../components/RunwayDiagram';
import { AtisStrip } from '../components/AtisStrip';
import { RawTextStrip } from '../components/RawTextStrip';
import { WindComponentsStrip } from '../components/WindComponentsStrip';

const ALLOWED_RANKS = new Set(['DEL', 'GND', 'TWR', 'APP', 'DEP']);

export function Dashboard() {
  const state = useLiveData();
  const rank = state?.session?.rank;
  const positionSupported = rank ? ALLOWED_RANKS.has(rank) : true;
  const degraded = state?.session && !positionSupported;

  return (
    <div className="bg-app flex-1 flex flex-col overflow-hidden">
      <OpsBar
        icao={state?.session?.icao ?? ''}
        airportName={state?.airport?.name ?? null}
        metar={state?.metar ?? null}
        session={state?.session ?? null}
        whazzupOk={state?.whazzupOk ?? false}
      />

      {degraded && (
        <div className="px-5 py-2 bg-amber-500/[0.08] border-b border-amber-400/20 flex items-center gap-2 text-xs text-amber-200">
          <Lock className="w-3.5 h-3.5" />
          Position {rank} non supportée - vérifications ATIS désactivées, météo affichée à titre informatif.
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-5 py-3 overflow-hidden">
        <RunwayDiagram
          airport={state?.airport ?? null}
          atis={state?.atis ?? null}
          expectedConfig={state?.expectedConfig ?? null}
          metar={state?.metar ?? null}
        />
      </div>

      <div className="px-5 pb-3 space-y-3">
        {positionSupported && (
          <WindComponentsStrip
            expectedConfig={state?.expectedConfig ?? null}
            metar={state?.metar ?? null}
          />
        )}
        {positionSupported && (
          <AtisStrip
            atis={state?.atis ?? null}
            warnings={state?.warnings ?? []}
            auroraConnected={state?.auroraConnected ?? false}
            expectedConfig={state?.expectedConfig ?? null}
          />
        )}
      </div>

      <RawTextStrip metar={state?.metar ?? null} taf={state?.taf ?? null} />
    </div>
  );
}
