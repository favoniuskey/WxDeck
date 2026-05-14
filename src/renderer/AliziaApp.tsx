import { useLiveData } from './hooks/useLiveData';
import { useSettings } from './hooks/useSettings';
import { AliziaUnit } from './components/AliziaUnit';
import { AliziaTutorial } from './components/AliziaTutorial';
import { api } from './lib/api';

export function AliziaApp() {
  const state = useLiveData();
  const { settings, update } = useSettings();

  if (!settings) return <div className="min-h-screen bg-transparent" />;

  const showTutorial = !settings.aliziaTutorialSeen;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-2 select-none">
      <AliziaUnit
        metar={state?.metar ?? null}
        airport={state?.airport ?? null}
        expectedConfig={state?.expectedConfig ?? null}
        onClose={() => api.windowClose()}
        onMinimize={() => api.windowMinimize()}
      />
      {showTutorial && <AliziaTutorial onDismiss={() => update({ aliziaTutorialSeen: true })} />}
    </div>
  );
}
