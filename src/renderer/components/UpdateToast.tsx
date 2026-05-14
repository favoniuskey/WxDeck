import { useEffect, useState } from 'react';
import { Download, CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { UpdateEvent } from '@shared/types';
import { api } from '../lib/api';

export function UpdateToast() {
  const [evt, setEvt] = useState<UpdateEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    return api.onUpdateEvent((e) => {
      if (e.type === 'not-available') return;
      setEvt(e);
      setDismissed(false);
    });
  }, []);

  if (!evt || dismissed) return null;

  const message = renderMessage(evt);
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 glass-strong rounded-2xl px-4 py-3 max-w-sm animate-fade-in flex items-start gap-3">
      <div className="mt-0.5">{message.icon}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{message.title}</div>
        <div className="text-xs text-ink-300 mt-0.5">{message.subtitle}</div>
        {evt.type === 'downloaded' && (
          <button onClick={() => api.installUpdate()} className="glass-button mt-3 !py-1.5 !text-xs">
            Installer et redémarrer
          </button>
        )}
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/[0.08] rounded-md">
        <X className="w-3.5 h-3.5 text-ink-300" />
      </button>
    </div>
  );
}

function renderMessage(evt: UpdateEvent): { icon: React.ReactNode; title: string; subtitle: string } | null {
  switch (evt.type) {
    case 'checking':
      return null;
    case 'available':
      return {
        icon: <Download className="w-4 h-4 text-accent" />,
        title: `Mise à jour disponible - v${evt.version}`,
        subtitle: 'Téléchargement en cours en arrière-plan…'
      };
    case 'progress':
      return {
        icon: <Download className="w-4 h-4 text-accent" />,
        title: 'Téléchargement…',
        subtitle: `${Math.round(evt.percent)} %`
      };
    case 'downloaded':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-accent-ok" />,
        title: `WxDeck v${evt.version} prêt à installer`,
        subtitle: 'Redémarrez l\'application pour appliquer.'
      };
    case 'error':
      return {
        icon: <AlertCircle className="w-4 h-4 text-accent-danger" />,
        title: 'Erreur de mise à jour',
        subtitle: evt.message
      };
    default:
      return null;
  }
}
