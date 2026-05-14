import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useLiveData } from '../hooks/useLiveData';
import { useSettings } from '../hooks/useSettings';
import { OpsBar } from '../components/OpsBar';
import { RunwayDiagram } from '../components/RunwayDiagram';
import { AtisStrip } from '../components/AtisStrip';
import { RawTextStrip } from '../components/RawTextStrip';
import { WindComponentsStrip } from '../components/WindComponentsStrip';
import { AuroraGuideBanner, AuroraSetupGuide } from '../components/AuroraSetupGuide';

const ALLOWED_RANKS = new Set(['DEL', 'GND', 'TWR', 'APP', 'DEP']);
const AURORA_HINT_DELAY_MS = 20000;

export function Dashboard() {
  const state = useLiveData();
  const { settings, update } = useSettings();
  const [showAuroraGuide, setShowAuroraGuide] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const rank = state?.session?.rank;
  const positionSupported = rank ? ALLOWED_RANKS.has(rank) : true;
  const degraded = state?.session && !positionSupported;
  const hasSession = !!state?.session && positionSupported;
  const auroraOnline = !!state?.auroraConnected;

  useEffect(() => {
    if (!hasSession) {
      setHintVisible(false);
      return;
    }
    if (auroraOnline) {
      setHintVisible(false);
      return;
    }
    if (settings?.auroraGuideDismissed) {
      setHintVisible(false);
      return;
    }
    const t = setTimeout(() => setHintVisible(true), AURORA_HINT_DELAY_MS);
    return () => clearTimeout(t);
  }, [hasSession, auroraOnline, settings?.auroraGuideDismissed]);

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
          Position {rank} non supportée. Vérifications ATIS désactivées, météo affichée à titre informatif.
        </div>
      )}

      {hintVisible && (
        <AuroraGuideBanner
          onOpenGuide={() => setShowAuroraGuide(true)}
          onDismiss={() => {
            setHintVisible(false);
            update({ auroraGuideDismissed: true });
          }}
        />
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
            auroraConnected={auroraOnline}
            expectedConfig={state?.expectedConfig ?? null}
            onAuroraHelp={() => setShowAuroraGuide(true)}
          />
        )}
      </div>

      <RawTextStrip metar={state?.metar ?? null} taf={state?.taf ?? null} />

      {showAuroraGuide && (
        <AuroraSetupGuide onClose={() => setShowAuroraGuide(false)} />
      )}
    </div>
  );
}
