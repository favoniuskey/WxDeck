import { useEffect, useState } from 'react';
import { X, Save, ExternalLink } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { api } from '../lib/api';

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings();
  const [vid, setVid] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(1130);

  useEffect(() => {
    if (!settings) return;
    setVid(settings.vid ?? '');
    setHost(settings.auroraHost);
    setPort(settings.auroraPort);
  }, [settings]);

  async function save() {
    await update({ vid: vid || undefined, auroraHost: host, auroraPort: port });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="glass-strong rounded-3xl p-8 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xl font-bold tracking-tight">Paramètres</div>
            <div className="text-xs text-ink-400">Configuration de WxDeck</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="VID IVAO">
            <input
              value={vid}
              onChange={(e) => setVid(e.target.value.replace(/\D/g, '').slice(0, 7))}
              className="glass-input w-full tabular-nums"
              placeholder="ex: 540123"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Aurora - Hôte">
                <input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="glass-input w-full font-mono text-xs"
                />
              </Field>
            </div>
            <Field label="Port">
              <input
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value || '0', 10))}
                className="glass-input w-full tabular-nums"
                inputMode="numeric"
              />
            </Field>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => api.openExternal('https://github.com/favoniuskey/WxDeck')}
              className="flex items-center gap-2 text-xs text-ink-300 hover:text-ink-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir WxDeck sur GitHub
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="glass-button">Annuler</button>
          <button onClick={save} className="glass-button flex items-center gap-2 !bg-accent/20 !border-accent/40 hover:!bg-accent/30">
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
