import { useState } from 'react';
import { X, Plug, ChevronRight, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { api } from '../lib/api';

interface BannerProps {
  onOpenGuide: () => void;
  onDismiss: () => void;
}

export function AuroraGuideBanner({ onOpenGuide, onDismiss }: BannerProps) {
  return (
    <div className="px-5 py-2.5 bg-amber-500/[0.08] border-b border-amber-400/20 flex items-center gap-3 text-xs animate-fade-in">
      <Plug className="w-4 h-4 text-amber-300 shrink-0" />
      <div className="flex-1 text-amber-200">
        <span className="font-semibold">Aurora indisponible.</span>
        <span className="text-amber-200/80 ml-1">
          Le 3rd Party API n'est probablement pas activé dans tes paramètres Aurora.
        </span>
      </div>
      <button
        onClick={onOpenGuide}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 hover:bg-amber-500/25 text-amber-100 font-semibold tracking-wide transition-colors"
      >
        Aide à la configuration
        <ChevronRight className="w-3 h-3" />
      </button>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md hover:bg-white/[0.06] text-amber-300/70"
        title="Masquer cette alerte"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface ModalProps {
  port: number;
  onClose: () => void;
  onRetry: () => void;
  isConnected: boolean;
}

export function AuroraSetupGuide({ port, onClose, onRetry, isConnected }: ModalProps) {
  const [copiedPort, setCopiedPort] = useState(false);

  const copyPort = async () => {
    try {
      await navigator.clipboard.writeText(String(port));
      setCopiedPort(true);
      setTimeout(() => setCopiedPort(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md animate-fade-in p-4">
      <div className="glass-strong rounded-3xl w-full max-w-[640px] max-h-[90vh] overflow-auto scrollbar-thin">
        <div className="sticky top-0 z-10 glass-strong border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 border border-amber-400/40 flex items-center justify-center">
              <Plug className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">Activer Aurora 3rd Party API</div>
              <div className="text-[11px] text-ink-400">Lecture ATIS en temps réel via WxDeck</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-400/30 text-amber-200'
          }`}>
            {isConnected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <div className="flex-1 text-sm font-semibold">
              {isConnected ? 'Connexion Aurora active.' : `WxDeck tente de joindre Aurora sur 127.0.0.1:${port}.`}
            </div>
            <button onClick={onRetry} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.10]">
              <RefreshCw className="w-3 h-3" />
              Tester
            </button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold mb-3">Procédure</div>
            <div className="space-y-3">
              <Step n={1} title="Lance Aurora et connecte-toi à IVAO" />
              <Step n={2} title="Ouvre les paramètres système">
                Menu <code className="kbd">Options</code> dans la barre supérieure d'Aurora, puis <code className="kbd">System Settings</code> (ou <code className="kbd">ATC Settings</code> selon la version).
              </Step>
              <Step n={3} title="Trouve la section 3rd Party API">
                Cherche un onglet ou une section nommée <b>«&nbsp;3rd Party API&nbsp;»</b>, <b>«&nbsp;Network&nbsp;»</b> ou <b>«&nbsp;External Connections&nbsp;»</b>. Aurora ne l'expose pas toujours au même endroit selon la version.
              </Step>
              <Step n={4} title="Active l'API">
                Coche la case <b>«&nbsp;Enable 3rd Party API&nbsp;»</b> (ou similaire).
              </Step>
              <Step n={5} title="Vérifie le port">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Le port doit être réglé sur</span>
                  <button
                    onClick={copyPort}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] font-mono text-xs"
                    title="Copier le port"
                  >
                    <span>{port}</span>
                    <Copy className="w-3 h-3 opacity-60" />
                    {copiedPort && <span className="text-emerald-300 text-[10px]">copié</span>}
                  </button>
                  <span>(c'est ce que WxDeck écoute par défaut, modifiable dans les paramètres si besoin).</span>
                </div>
              </Step>
              <Step n={6} title="Sauvegarde et redémarre Aurora">
                Clique <code className="kbd">Save</code> / <code className="kbd">Apply</code>, puis ferme et relance Aurora pour appliquer les changements.
              </Step>
              <Step n={7} title="Re-connecte-toi à ta position ATC" final>
                Reconnecte-toi sur IVAO. WxDeck devrait afficher l'ATIS dans la zone basse en quelques secondes.
              </Step>
            </div>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-xs text-ink-300 space-y-1.5">
            <div className="font-semibold text-ink-200">Tu ne trouves pas l'option dans Aurora&#160;?</div>
            <div>
              Consulte la documentation officielle IVAO 3rd party. La position exacte du paramètre dépend de la version Aurora installée.
            </div>
            <button
              onClick={() => api.openExternal('https://wiki.ivao.aero/en/home/devops/manuals/Aurora-3rd-parties-documentation')}
              className="flex items-center gap-1.5 text-accent hover:text-accent-warm transition-colors mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              Documentation Aurora 3rd party (wiki IVAO)
            </button>
          </div>

          <div className="text-[11px] text-ink-400 leading-relaxed">
            <b className="text-ink-200">Sans cette configuration</b>, WxDeck fonctionne quand même : météo, vent, TFL attendu, alertes ATIS via Whazzup. Seule la lecture native de l'ATIS depuis Aurora reste inactive.
          </div>
        </div>

        <div className="sticky bottom-0 glass-strong border-t border-white/[0.06] px-6 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="glass-button">Fermer</button>
          <button onClick={onRetry} className="glass-button !bg-accent/20 !border-accent/40 hover:!bg-accent/30 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-tester la connexion
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children, final }: { n: number; title: string; children?: React.ReactNode; final?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        final ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200' : 'bg-white/[0.06] border border-white/[0.12] text-ink-200'
      }`}>
        {n}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[13px] font-semibold text-ink-100">{title}</div>
        {children && <div className="text-xs text-ink-300 mt-1 leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
