import { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { UpdateToast } from './components/UpdateToast';
import { Setup } from './screens/Setup';
import { Settings } from './screens/Settings';
import { Dashboard } from './screens/Dashboard';
import { useSettings } from './hooks/useSettings';
import { api } from './lib/api';

export function App() {
  const { settings, reload } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [ventOpen, setVentOpen] = useState(false);
  const [pressionOpen, setPressionOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.aliziaIsOpen('vent'), api.aliziaIsOpen('pression')]).then(([v, p]) => {
      if (mounted) {
        setVentOpen(v);
        setPressionOpen(p);
      }
    });
    const off = api.onAliziaStateChange((mode, open) => {
      if (!mounted) return;
      if (mode === 'vent') setVentOpen(open);
      else setPressionOpen(open);
    });
    return () => {
      mounted = false;
      off();
    };
  }, []);

  useEffect(() => {
    const off = api.onUpdateEvent(() => undefined);
    return off;
  }, []);

  if (!settings) {
    return <div className="bg-app min-h-screen" />;
  }

  const needsSetup = !settings.vid || !settings.acceptedDisclaimer;

  if (needsSetup) {
    return <Setup onDone={reload} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <TitleBar
        onOpenSettings={() => setShowSettings(true)}
        onCheckUpdates={() => api.triggerUpdateCheck()}
        onToggleAlizia={(mode) => api.aliziaToggle(mode)}
        ventActive={ventOpen}
        pressionActive={pressionOpen}
      />
      <Dashboard />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <UpdateToast />
    </div>
  );
}
