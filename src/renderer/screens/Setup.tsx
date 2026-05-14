import { useState } from 'react';
import { Plane, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export function Setup({ onDone }: { onDone: () => void }) {
  const { update } = useSettings();
  const [vid, setVid] = useState('');
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);

  const valid = /^\d{4,7}$/.test(vid) && accept;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    await update({ vid, acceptedDisclaimer: true });
    onDone();
  }

  return (
    <div className="bg-app min-h-screen flex items-center justify-center p-8">
      <div className="glass-strong rounded-3xl p-10 w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/40 to-accent/10 border border-accent/40 flex items-center justify-center">
            <Plane className="w-6 h-6 text-accent" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">WxDeck</div>
            <div className="text-xs text-ink-400">Bienvenue · Configuration initiale</div>
          </div>
        </div>

        <p className="text-sm text-ink-300 leading-relaxed mb-6">
          WxDeck détecte automatiquement votre position ATC en interrogeant IVAO. Saisissez votre <b>VID</b> (votre numéro de membre IVAO) une seule fois.
        </p>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">VID IVAO</span>
          <input
            value={vid}
            onChange={(e) => setVid(e.target.value.replace(/\D/g, '').slice(0, 7))}
            placeholder="ex: 540123"
            inputMode="numeric"
            autoFocus
            className="glass-input w-full mt-2 text-lg tabular-nums tracking-wider"
          />
        </label>

        <label className="flex items-start gap-3 mt-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-1 w-4 h-4 accent-blue-500 shrink-0"
          />
          <span className="text-xs text-ink-300 leading-relaxed">
            Je comprends que WxDeck est destiné à un usage <b>simulation uniquement</b> (IVAO) et ne doit jamais être utilisé pour de l'aviation réelle.
          </span>
        </label>

        <button
          onClick={submit}
          disabled={!valid || busy}
          className="glass-button w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Configuration…' : 'Continuer'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mt-6 text-[11px] text-ink-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Votre VID est stocké localement et n'est jamais transmis à un tiers.
        </div>
      </div>
    </div>
  );
}
