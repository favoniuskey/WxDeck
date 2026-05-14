import type { DockKind } from '@shared/types';
import { useLiveData } from './hooks/useLiveData';
import { api } from './lib/api';
import { DockShell } from './components/DockShell';
import { WindComponentsStrip } from './components/WindComponentsStrip';
import { AtisStrip } from './components/AtisStrip';
import { RawTextStrip } from './components/RawTextStrip';

function resolveKind(): DockKind {
  switch (api.windowKind) {
    case 'dock-atis': return 'atis';
    case 'dock-raw': return 'raw';
    default: return 'wind';
  }
}

const TITLES: Record<DockKind, string> = {
  wind: 'Composantes vent',
  atis: 'ATIS',
  raw: 'METAR / TAF'
};

export function DockApp() {
  const kind = resolveKind();
  const state = useLiveData();
  const icao = state?.session?.icao ?? state?.metar?.station ?? null;

  return (
    <DockShell kind={kind} title={TITLES[kind]} subtitle={icao}>
      {kind === 'wind' && (
        <WindComponentsStrip
          expectedConfig={state?.expectedConfig ?? null}
          metar={state?.metar ?? null}
        />
      )}
      {kind === 'atis' && (
        <AtisStrip
          atis={state?.atis ?? null}
          warnings={state?.warnings ?? []}
          auroraConnected={state?.auroraConnected ?? false}
          expectedConfig={state?.expectedConfig ?? null}
        />
      )}
      {kind === 'raw' && (
        <RawTextStrip metar={state?.metar ?? null} taf={state?.taf ?? null} />
      )}
    </DockShell>
  );
}
