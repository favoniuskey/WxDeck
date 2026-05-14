import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Plug,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FolderSearch,
  Wrench,
  Loader2,
  Copy
} from 'lucide-react';
import type { AuroraDiagnostic, AuroraFixResult } from '@shared/types';
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
          WxDeck peut diagnostiquer le problème et le réparer automatiquement.
        </span>
      </div>
      <button
        onClick={onOpenGuide}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 hover:bg-amber-500/25 text-amber-100 font-semibold tracking-wide transition-colors"
      >
        Diagnostiquer
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

type DiagState = 'ok' | 'warn' | 'error' | 'unknown';

interface DiagLine {
  state: DiagState;
  label: string;
  detail: string;
  action?: React.ReactNode;
}

interface ModalProps {
  onClose: () => void;
}

export function AuroraSetupGuide({ onClose }: ModalProps) {
  const [diag, setDiag] = useState<AuroraDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<AuroraFixResult | null>(null);

  const runDiagnose = useCallback(async () => {
    setLoading(true);
    setFixResult(null);
    try {
      const d = await api.auroraDiagnose();
      setDiag(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runDiagnose();
  }, [runDiagnose]);

  const handleAutoFix = async (scope: 'active' | 'all') => {
    setFixing(true);
    setFixResult(null);
    try {
      const res = await api.auroraAutoFix(scope);
      setFixResult(res);
      await runDiagnose();
    } finally {
      setFixing(false);
    }
  };

  const handlePickPath = async () => {
    const picked = await api.auroraPickInstallPath();
    if (picked) await runDiagnose();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  };

  const lines = diag ? buildDiagLines(diag, handlePickPath, handleCopy) : [];
  const allOk = diag ? lines.every((l) => l.state === 'ok') : false;
  const needsFix = diag && diag.auroraInstalled && !diag.auroraRunning && diag.profilesNeedingFix.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md animate-fade-in p-4">
      <div className="glass-strong rounded-3xl w-full max-w-[680px] max-h-[90vh] overflow-auto scrollbar-thin">
        <div className="sticky top-0 z-10 glass-strong border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              allOk
                ? 'bg-emerald-500/20 border-emerald-400/40'
                : 'bg-amber-500/20 border-amber-400/40'
            }`}>
              {allOk ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <Plug className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">Diagnostic Aurora</div>
              <div className="text-[11px] text-ink-400">Vérification complète de la connexion ATIS</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loading && !diag ? (
            <div className="flex items-center justify-center py-8 text-ink-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse en cours...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <DiagRow key={i} {...line} />
                ))}
              </div>

              {fixResult && (
                <FixResultBanner result={fixResult} onClose={() => setFixResult(null)} />
              )}

              {needsFix && (
                <div className="rounded-2xl p-4 border border-accent/40 bg-accent/[0.08]">
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-ink-100">
                        Réparation automatique disponible
                      </div>
                      <div className="text-xs text-ink-300 mt-1 leading-relaxed">
                        WxDeck peut activer le 3rd Party API dans tes profils Aurora.{' '}
                        <span className="text-ink-200 font-semibold">
                          Aurora doit être fermé
                        </span>{' '}
                        pour que les modifications soient prises en compte au prochain lancement.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {diag?.activeProfile && (
                          <button
                            onClick={() => handleAutoFix('active')}
                            disabled={fixing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent text-xs font-bold tracking-wide transition-colors disabled:opacity-50"
                          >
                            {fixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                            Activer pour le profil actif
                          </button>
                        )}
                        <button
                          onClick={() => handleAutoFix('all')}
                          disabled={fixing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent text-xs font-bold tracking-wide transition-colors disabled:opacity-50"
                        >
                          {fixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                          Activer pour les {diag?.profilesNeedingFix.length} profils
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {diag && diag.auroraRunning && diag.profilesNeedingFix.length > 0 && (
                <div className="rounded-xl p-3 border border-amber-400/30 bg-amber-500/[0.08] text-xs text-amber-200 leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Aurora est en cours d'exécution.</span> Ferme Aurora avant de cliquer sur la réparation automatique, sinon les modifications seront écrasées au prochain enregistrement.
                  </div>
                </div>
              )}

              <details className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-ink-300">
                <summary className="cursor-pointer font-semibold text-ink-200 select-none">
                  Procédure manuelle (si tu préfères)
                </summary>
                <div className="mt-3 space-y-2 leading-relaxed">
                  <p>Dans Aurora&nbsp;: <code className="kbd">PVD</code> ou raccourci <code className="kbd">F7</code>, puis section <code className="kbd">SOFTWARE</code>.</p>
                  <p>Coche la case <b>« 3rd Party software access »</b>.</p>
                  <p>Ferme la fenêtre de paramètres (la modification est enregistrée automatiquement). WxDeck détectera la connexion dans les secondes qui suivent.</p>
                </div>
              </details>

              <button
                onClick={() => api.openExternal('https://wiki.ivao.aero/en/home/devops/manuals/Aurora-3rd-parties-documentation')}
                className="flex items-center gap-1.5 text-[11px] text-accent hover:text-accent-warm transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Documentation officielle Aurora 3rd party (wiki IVAO)
              </button>
            </>
          )}
        </div>

        <div className="sticky bottom-0 glass-strong border-t border-white/[0.06] px-6 py-3 flex justify-between gap-2">
          <button
            onClick={runDiagnose}
            disabled={loading}
            className="glass-button flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-diagnostiquer
          </button>
          <button onClick={onClose} className="glass-button">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function buildDiagLines(diag: AuroraDiagnostic, onPickPath: () => void, onCopy: (s: string) => void): DiagLine[] {
  const out: DiagLine[] = [];

  out.push({
    state: diag.internetOk ? 'ok' : 'error',
    label: diag.internetOk ? 'Connexion Internet active' : 'Aucune connexion Internet',
    detail: diag.internetOk
      ? 'Whazzup IVAO et AVWX joignables'
      : 'Vérifie ton réseau, ton VPN ou ton pare-feu. La météo et la détection de session ATC ne fonctionneront pas sans connexion.'
  });

  out.push({
    state: diag.auroraInstalled ? 'ok' : 'warn',
    label: diag.auroraInstalled ? `Aurora détecté` : 'Aurora introuvable sur ce PC',
    detail: diag.auroraInstalled
      ? diag.auroraPath ?? ''
      : 'Aucun dossier d\'installation Aurora trouvé aux emplacements standards (C:\\Aurora, %PROGRAMFILES%, %LOCALAPPDATA%).',
    action: !diag.auroraInstalled ? (
      <button
        onClick={onPickPath}
        className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10]"
      >
        <FolderSearch className="w-3 h-3" />
        Localiser
      </button>
    ) : undefined
  });

  if (diag.auroraInstalled) {
    out.push({
      state: diag.auroraRunning ? 'ok' : 'warn',
      label: diag.auroraRunning ? 'Aurora est en cours d\'exécution' : 'Aurora n\'est pas lancé',
      detail: diag.auroraRunning
        ? 'Le processus Aurora.exe est actif'
        : 'Lance Aurora et connecte-toi à ta position ATC pour activer la lecture native de l\'ATIS.'
    });

    out.push({
      state:
        diag.thirdPartyEnabledActive === true
          ? 'ok'
          : diag.thirdPartyEnabledActive === false
            ? 'error'
            : 'unknown',
      label:
        diag.thirdPartyEnabledActive === true
          ? '3rd Party API activé sur le profil actif'
          : diag.thirdPartyEnabledActive === false
            ? '3rd Party API désactivé sur le profil actif'
            : 'Statut 3rd Party API inconnu',
      detail: diag.activeProfileName
        ? `Profil actif : ${diag.activeProfileName}${
            diag.profilesNeedingFix.length > 0
              ? ` (${diag.profilesNeedingFix.length} profil${diag.profilesNeedingFix.length > 1 ? 's' : ''} à activer au total)`
              : ''
          }`
        : 'Aucun profil actif détecté. Aurora doit avoir été lancé au moins une fois.'
    });
  }

  out.push({
    state: diag.tcpReachable ? 'ok' : diag.auroraRunning ? 'error' : 'warn',
    label: diag.tcpReachable
      ? `Port TCP ${diag.port} joignable`
      : `Port TCP ${diag.port} fermé`,
    detail: diag.tcpReachable
      ? `WxDeck peut recevoir l'ATIS depuis Aurora sur ${diag.host}:${diag.port}`
      : diag.auroraRunning
        ? 'Aurora tourne mais n\'écoute pas sur ce port. Vérifie que le 3rd Party API est activé.'
        : `Aurora doit être lancé et accepter les connexions sur ${diag.host}:${diag.port}.`,
    action: (
      <button
        onClick={() => onCopy(`${diag.host}:${diag.port}`)}
        className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] font-mono"
        title="Copier l'adresse"
      >
        <Copy className="w-3 h-3" />
        {diag.host}:{diag.port}
      </button>
    )
  });

  return out;
}

function DiagRow({ state, label, detail, action }: DiagLine) {
  const colors = {
    ok: 'bg-emerald-500/[0.06] border-emerald-400/25 text-emerald-200',
    warn: 'bg-amber-500/[0.06] border-amber-400/25 text-amber-200',
    error: 'bg-red-500/[0.06] border-red-400/25 text-red-200',
    unknown: 'bg-white/[0.03] border-white/[0.08] text-ink-200'
  }[state];

  const Icon = state === 'ok' ? CheckCircle2 : state === 'error' ? AlertCircle : state === 'warn' ? AlertCircle : Loader2;

  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-3 ${colors}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold leading-tight">{label}</div>
        <div className="text-[11px] text-ink-300 mt-0.5 leading-relaxed break-all">{detail}</div>
      </div>
      {action}
    </div>
  );
}

function FixResultBanner({ result, onClose }: { result: AuroraFixResult; onClose: () => void }) {
  if (result.blockedByRunning) {
    return (
      <div className="rounded-xl px-4 py-3 border border-amber-400/40 bg-amber-500/[0.10] flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs text-amber-100">
          <span className="font-bold">Réparation impossible :</span> Aurora est en cours d'exécution. Ferme-le complètement (icône système tray comprise), puis relance la réparation.
        </div>
        <button onClick={onClose} className="p-1 rounded text-amber-300"><X className="w-3 h-3" /></button>
      </div>
    );
  }
  if (result.succeeded.length === 0 && result.failed.length === 0) {
    return (
      <div className="rounded-xl px-4 py-3 border border-ink-700/40 bg-white/[0.04] text-xs text-ink-300">
        Aucun profil à modifier. Tout est déjà configuré.
      </div>
    );
  }
  const hasFailures = result.failed.length > 0;
  return (
    <div className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
      hasFailures ? 'border-amber-400/40 bg-amber-500/[0.08]' : 'border-emerald-400/40 bg-emerald-500/[0.08]'
    }`}>
      {hasFailures ? <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />}
      <div className="flex-1 text-xs">
        <div className="font-bold text-ink-100">
          {result.succeeded.length} profil{result.succeeded.length > 1 ? 's' : ''} mis à jour
          {hasFailures ? `, ${result.failed.length} en échec` : ''}.
        </div>
        <div className="text-ink-300 mt-1">
          Relance Aurora et reconnecte-toi à ta position ATC. WxDeck détectera la connexion ATIS automatiquement.
        </div>
      </div>
      <button onClick={onClose} className="p-1 rounded text-ink-300"><X className="w-3 h-3" /></button>
    </div>
  );
}
