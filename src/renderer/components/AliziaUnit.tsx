import { useEffect, useState } from 'react';
import { X, ArrowUpLeft, ArrowLeft, ArrowRight, CornerDownLeft, GripHorizontal, Minus, Pin, PinOff } from 'lucide-react';
import type { AirportProfile, AliziaMode, ExpectedConfig, MetarReport } from '@shared/types';
import { extractWind, extractPressure, activeQfuFromConfig } from '../lib/alizia';
import { api } from '../lib/api';

interface Props {
  mode: AliziaMode;
  metar: MetarReport | null;
  airport: AirportProfile | null;
  expectedConfig: ExpectedConfig | null;
  onClose: () => void;
  onMinimize: () => void;
}

export function AliziaUnit({ mode, metar, airport, expectedConfig, onClose, onMinimize }: Props) {
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.aliziaGetAlwaysOnTop(mode).then((v) => {
      if (mounted) setPinned(v);
    });
    return () => {
      mounted = false;
    };
  }, [mode]);

  const wind = extractWind(metar);
  const pressure = extractPressure(metar, airport);
  const qfu = activeQfuFromConfig(expectedConfig?.arrRunways[0] ?? expectedConfig?.depRunways[0], airport);
  const stationIcao = airport?.icao ?? metar?.station ?? null;

  const togglePin = async () => {
    const next = !pinned;
    const actual = await api.aliziaSetAlwaysOnTop(mode, next);
    setPinned(actual);
  };

  const modeLabel = mode === 'vent' ? 'VENT' : 'PRESSION';

  return (
    <div className="alizia-bezel rounded-lg p-2.5 w-full max-w-[440px]">
      <div className="flex items-center justify-between mb-2">
        <div
          className="flex-1 flex items-center gap-2 text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-semibold px-1 py-1 cursor-grab active:cursor-grabbing"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <GripHorizontal className="w-3.5 h-3.5" />
          <span>ALIZIA 0330</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{modeLabel}</span>
          {stationIcao && <span className="text-zinc-600">· {stationIcao}</span>}
        </div>
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={togglePin}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
              pinned
                ? 'bg-red-500/15 border-red-400/40 text-red-300'
                : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-400'
            }`}
            title={pinned ? 'Toujours au-dessus (activé)' : 'Toujours au-dessus (désactivé)'}
          >
            {pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
          </button>
          <button
            onClick={onMinimize}
            className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 active:bg-zinc-900 flex items-center justify-center transition-colors"
            title="Réduire"
          >
            <Minus className="w-3 h-3 text-zinc-400" />
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-red-900/40 hover:border-red-700/50 active:bg-zinc-900 flex items-center justify-center transition-colors"
            title="Fermer"
          >
            <X className="w-3 h-3 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="alizia-screen rounded-sm border border-black px-4 py-4 relative overflow-hidden">
        {mode === 'vent' ? <VentScreen wind={wind} /> : <PressionScreen pressure={pressure} />}
        <div
          className="pointer-events-none absolute inset-0 rounded-sm"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 6%, transparent 94%, rgba(0,0,0,0.4) 100%)'
          }}
        />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 px-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="alizia-sticker mt-1">ALIZIA 0330</div>
        <QfuMiniDisplay qfu={qfu} mode={mode} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 px-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-center gap-1.5">
          <DeviceButton icon={<ArrowUpLeft className="w-3.5 h-3.5" />} />
          <DeviceButton icon={<ArrowLeft className="w-3.5 h-3.5" />} />
          <DeviceButton icon={<ArrowRight className="w-3.5 h-3.5" />} />
          <DeviceButton icon={<CornerDownLeft className="w-3.5 h-3.5" />} />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-black/80 border border-zinc-700/40 shadow-inner" />
          <PulsonicLogo />
        </div>
      </div>
    </div>
  );
}

function VentScreen({ wind }: { wind: ReturnType<typeof extractWind> }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[36px_1fr_1fr] items-center mb-1">
        <div className="text-[9px] text-zinc-300/70 tracking-[0.18em] uppercase font-bold">VENT</div>
        <div className="text-center text-[9px] text-zinc-300/70 tracking-[0.18em] uppercase font-bold">Vitesse</div>
        <div className="text-center">
          <div className="text-[9px] text-zinc-300/70 tracking-[0.18em] uppercase font-bold">Direction</div>
          <div className="flex justify-center gap-0.5 mt-0.5 opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-red-500/40" />
            ))}
          </div>
        </div>
      </div>
      <ScreenRow label="MAX" valueA={wind.vitesse.max} digitsA={2} valueB={wind.direction.max} digitsB={3} />
      <ScreenRow
        label="MOY"
        valueA={wind.vitesse.moy}
        digitsA={2}
        valueB={wind.direction.moy === 'VRB' ? null : wind.direction.moy}
        digitsB={3}
        vrbB={wind.direction.moy === 'VRB'}
      />
      <ScreenRow label="MIN" valueA={wind.vitesse.min} digitsA={2} valueB={wind.direction.min} digitsB={3} />
    </div>
  );
}

function PressionScreen({ pressure }: { pressure: ReturnType<typeof extractPressure> }) {
  return (
    <div className="space-y-3 py-2">
      <div className="text-center text-[9px] text-zinc-300/70 tracking-[0.2em] uppercase font-bold">PRESSION</div>
      <PressionRow label="QNH" value={pressure.qnh} />
      <PressionRow label="QFE" value={pressure.qfe} />
    </div>
  );
}

function PressionRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="grid grid-cols-[36px_1fr_36px] items-center gap-2">
      <div className="text-[10px] text-zinc-300/70 tracking-[0.18em] uppercase font-bold">{label}</div>
      <DigitGroup value={value} digits={4} />
      <div className="text-[10px] text-zinc-300/70 tracking-[0.18em] uppercase font-bold text-right">hPa</div>
    </div>
  );
}

function ScreenRow({
  label,
  valueA,
  digitsA,
  valueB,
  digitsB,
  vrbB
}: {
  label: string;
  valueA: number | null;
  digitsA: number;
  valueB?: number | null;
  digitsB?: number;
  vrbB?: boolean;
}) {
  return (
    <div className="grid grid-cols-[36px_1fr_1fr] items-center gap-2">
      <div className="text-[10px] text-zinc-300/70 tracking-[0.18em] uppercase font-bold">{label}</div>
      <div className="flex justify-center">
        <DigitGroup value={valueA} digits={digitsA} />
      </div>
      <div className="flex justify-center">
        {vrbB ? (
          <div className="seg14 alizia-glow text-[28px] leading-none tracking-wider">VRB</div>
        ) : (
          <DigitGroup value={valueB ?? null} digits={digitsB ?? 3} />
        )}
      </div>
    </div>
  );
}

function DigitGroup({ value, digits }: { value: number | null; digits: number }) {
  const display = value == null ? null : String(value).padStart(digits, '0');
  return (
    <div className="inline-flex alizia-cell-group rounded-[2px] p-px gap-px">
      {Array.from({ length: digits }).map((_, i) => {
        const char = display?.[i] ?? null;
        return <DigitCell key={i} char={char} />;
      })}
    </div>
  );
}

function DigitCell({ char }: { char: string | null }) {
  return (
    <div className="alizia-cell relative" style={{ width: 22, height: 36 }}>
      <span className="seg7 alizia-glow-dim absolute inset-0 flex items-center justify-center text-[28px] leading-none">8</span>
      {char != null && (
        <span className="seg7 alizia-glow absolute inset-0 flex items-center justify-center text-[28px] leading-none">{char}</span>
      )}
    </div>
  );
}

function QfuMiniDisplay({ qfu, mode }: { qfu: string | null; mode: AliziaMode }) {
  const text = mode === 'pression' ? 'R018' : qfu ?? '----';
  return (
    <div className="alizia-screen rounded-sm border border-black px-1.5 py-1">
      <div className="inline-flex alizia-cell-group rounded-[2px] p-px gap-px">
        {Array.from(text.padStart(4, ' ')).map((c, i) => (
          <div key={i} className="alizia-cell relative" style={{ width: 14, height: 20 }}>
            <span className="seg7 alizia-glow-dim absolute inset-0 flex items-center justify-center text-[15px] leading-none">8</span>
            {c.trim() !== '' && (
              <span className={`${/[A-Z]/.test(c) ? 'seg14' : 'seg7'} alizia-glow absolute inset-0 flex items-center justify-center text-[15px] leading-none`}>{c}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeviceButton({ icon }: { icon: React.ReactNode }) {
  return (
    <div
      className="w-9 h-7 rounded-sm border border-zinc-700 flex items-center justify-center text-zinc-500"
      style={{
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.6)'
      }}
    >
      {icon}
    </div>
  );
}

function PulsonicLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
        <polygon points="2,4 17,4 22,12 17,20 2,20 7,12" fill="#cc2020" />
        <polygon points="6,7 14,7 17,12 14,17 6,17 9,12" fill="#1a1a1a" />
      </svg>
      <span className="text-zinc-400 text-[9px] uppercase tracking-[0.25em] font-bold">Pulsonic</span>
    </div>
  );
}
