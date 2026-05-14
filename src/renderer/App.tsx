import { useEffect, useState } from 'react';
import type { DockKind } from '@shared/types';
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
  const [docks, setDocks] = useState<Record<DockKind, boolean>>({ wind: false, atis: false, raw: false });

  useEffect(() => {
    let mounted = true;
    Promise.all([api.aliziaIsOpen('vent'), api.aliziaIsOpen('pression')]).then(([v, p]) => {
      if (mounted) {
        setVentOpen(v);
        setPressionOpen(p);
      }
    });
    Promise.all([api.dockIsOpen('wind'), api.dockIsOpen('atis'), api.dockIsOpen('raw')]).then(([w, a, r]) => {
      if (mounted) setDocks({ wind: w, atis: a, raw: r });
    });
    const offAlizia = api.onAliziaStateChange((mode, open) => {
      if (!mounted) return;
      if (mode === 'vent') setVentOpen(open);
      else setPressionOpen(open);
    });
    const offDock = api.onDockStateChange((kind, open) => {
      if (!mounted) return;
      setDocks((prev) => ({ ...prev, [kind]: open }));
    });
    return () => {
      mounted = false;
      offAlizia();
      offDock();
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
        onToggleDock={(kind) => api.dockToggle(kind)}
        ventActive={ventOpen}
        pressionActive={pressionOpen}
        dockWindActive={docks.wind}
        dockAtisActive={docks.atis}
        dockRawActive={docks.raw}
      />
      <Dashboard />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <UpdateToast />
    </div>
  );
}
