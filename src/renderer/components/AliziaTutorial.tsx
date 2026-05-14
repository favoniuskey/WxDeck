import { Sparkles } from 'lucide-react';

export function AliziaTutorial({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto animate-fade-in">
      <div className="glass-strong rounded-2xl p-5 max-w-[400px] mx-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/40 to-red-700/10 border border-red-400/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-red-300" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">Mode ALIZIA 0330</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wider">Première activation</div>
          </div>
        </div>
        <p className="text-xs text-ink-300 leading-relaxed mb-3">
          Cette fenêtre flottante reproduit le boîtier Pulsonic ALIZIA 0330 utilisé en vrai par les contrôleurs en Martinique, Guadeloupe, Réunion et plusieurs aérodromes métropolitains.
        </p>
        <ul className="text-xs text-ink-300 leading-relaxed space-y-1.5 mb-4">
          <li className="flex gap-2">
            <span className="text-accent">›</span>
            <span><b>Déplaçable partout sur ton écran</b>, indépendamment de WxDeck, via sa barre supérieure.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">›</span>
            <span>Le bouton <b>épingle</b> active/désactive « toujours au-dessus » (rester visible par-dessus les autres fenêtres).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">›</span>
            <span><b>Mode Vent</b> : MIN/MOY/MAX vitesse + direction (issus du METAR live).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">›</span>
            <span><b>Mode Pression</b> : QNH + QFE calculé avec l'élévation du terrain.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">›</span>
            <span>Le <b>QFU</b> en bas indique le cap de la piste préférentielle (ex: L320 pour piste 32L).</span>
          </li>
        </ul>
        <button onClick={onDismiss} className="glass-button w-full !bg-accent/20 !border-accent/40 hover:!bg-accent/30 text-sm">
          C'est compris
        </button>
      </div>
    </div>
  );
}
