import { useMemo } from 'react';
import type { AirportProfile, AuroraAtis, ExpectedConfig, MetarReport, RunwayDef } from '@shared/types';

interface Props {
  airport: AirportProfile | null;
  atis: AuroraAtis | null;
  expectedConfig: ExpectedConfig | null;
  metar: MetarReport | null;
}

const SIZE = 480;
const CENTER = SIZE / 2;
const COMPASS_R = 168;
const RUNWAY_R = 130;
const TILE_R = 218;
const BANDE_SPREAD_PX = 72;

type TileState = 'active-ok' | 'active-wrong' | 'expected' | 'idle';

function getRunwayDefs(profile: AirportProfile): RunwayDef[] {
  const r = profile.runways as unknown;
  if (!Array.isArray(r) || r.length === 0) return [];
  if (typeof r[0] === 'string') return [];
  return r as RunwayDef[];
}

function polar(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(a), y: CENTER + radius * Math.sin(a) };
}

function pairId(rwyId: string): string {
  const m = rwyId.match(/^(\d{1,2})([LRC]?)$/);
  if (!m) return rwyId;
  const num = parseInt(m[1], 10);
  const suffix = m[2];
  const oppositeNum = ((num + 17) % 36) + 1;
  const oppositeSuffix = suffix === 'L' ? 'R' : suffix === 'R' ? 'L' : suffix;
  return `${String(oppositeNum).padStart(2, '0')}${oppositeSuffix}`;
}

function bandeKey(rwyId: string): string {
  const p = pairId(rwyId);
  return rwyId < p ? rwyId : p;
}

interface BandeLayout {
  baseHeading: number;
  bandeOffsetPx: Map<string, number>;
  perpDx: number;
  perpDy: number;
}

function buildLayouts(runways: RunwayDef[]): Map<number, BandeLayout> {
  const baseGroups = new Map<number, RunwayDef[]>();
  for (const r of runways) {
    const base = r.heading % 180;
    if (!baseGroups.has(base)) baseGroups.set(base, []);
    baseGroups.get(base)!.push(r);
  }

  const out = new Map<number, BandeLayout>();
  for (const [base, group] of baseGroups) {
    const bandes = Array.from(new Set(group.map((r) => bandeKey(r.id)))).sort();
    const n = bandes.length;
    const offsets = new Map<string, number>();
    bandes.forEach((bk, idx) => {
      offsets.set(bk, n === 1 ? 0 : (idx - (n - 1) / 2) * BANDE_SPREAD_PX);
    });
    const perpBearing = (base + 90) % 360;
    const perpRad = ((perpBearing - 90) * Math.PI) / 180;
    out.set(base, {
      baseHeading: base,
      bandeOffsetPx: offsets,
      perpDx: Math.cos(perpRad),
      perpDy: Math.sin(perpRad)
    });
  }
  return out;
}

function tilePosFor(rwy: RunwayDef, layout: BandeLayout) {
  const oppositeBearing = (rwy.heading + 180) % 360;
  const base = polar(oppositeBearing, TILE_R);
  const off = layout.bandeOffsetPx.get(bandeKey(rwy.id)) ?? 0;
  return {
    x: base.x + off * layout.perpDx,
    y: base.y + off * layout.perpDy
  };
}

function tileStateFor(
  rwyId: string,
  atisArr: Set<string>,
  atisDep: Set<string>,
  expectedArr: Set<string>,
  expectedDep: Set<string>,
  hasAtis: boolean
): TileState {
  const inAtis = atisArr.has(rwyId) || atisDep.has(rwyId);
  const inExpected = expectedArr.has(rwyId) || expectedDep.has(rwyId);
  if (!hasAtis) return inExpected ? 'expected' : 'idle';
  if (inAtis && inExpected) return 'active-ok';
  if (inAtis && !inExpected) return 'active-wrong';
  if (!inAtis && inExpected) return 'expected';
  return 'idle';
}

const TILE_PALETTE: Record<TileState, string> = {
  'active-ok': 'bg-emerald-500/30 border-emerald-400/55 text-emerald-100 shadow-[0_0_24px_-8px_rgba(74,222,128,0.55)]',
  'active-wrong': 'bg-red-500/25 border-red-400/55 text-red-100 shadow-[0_0_24px_-8px_rgba(248,113,113,0.55)]',
  'expected': 'bg-emerald-500/[0.06] border-emerald-400/50 border-dashed text-emerald-200/90',
  'idle': 'bg-white/[0.05] border-white/[0.10] text-ink-300'
};

function roleLabel(rwyId: string, atisArr: Set<string>, atisDep: Set<string>, state: TileState): string | null {
  if (state === 'expected') return 'ATTENDU';
  if (state === 'idle') return null;
  const arr = atisArr.has(rwyId);
  const dep = atisDep.has(rwyId);
  if (arr && dep) return 'ARR + DEP';
  if (arr) return 'ARR';
  if (dep) return 'DEP';
  return null;
}

export function RunwayDiagram({ airport, atis, expectedConfig, metar }: Props) {
  const runways = airport ? getRunwayDefs(airport) : [];
  const layouts = useMemo(() => buildLayouts(runways), [runways]);

  const atisArr = new Set(atis?.arrRunways.map((r) => r.toUpperCase()) ?? []);
  const atisDep = new Set(atis?.depRunways.map((r) => r.toUpperCase()) ?? []);
  const expectedArr = new Set(expectedConfig?.arrRunways.map((r) => r.toUpperCase()) ?? []);
  const expectedDep = new Set(expectedConfig?.depRunways.map((r) => r.toUpperCase()) ?? []);
  const hasAtis = !!atis;

  const windDir = metar?.wind.direction;
  const windSpd = metar?.wind.speed ?? 0;
  const windArrowRot = windDir === 'VRB' || windDir == null ? null : (windDir as number);
  const needleStrength = Math.min(1, Math.max(0.35, windSpd / 20));

  const needleLength = COMPASS_R - 22;
  const tailLength = COMPASS_R - 70;

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <div
        className="absolute pointer-events-none"
        style={{
          left: CENTER - COMPASS_R - 16,
          top: CENTER - COMPASS_R - 16,
          width: (COMPASS_R + 16) * 2,
          height: (COMPASS_R + 16) * 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 30%, rgba(96,165,250,0.10) 0%, rgba(255,255,255,0.02) 35%, transparent 65%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 6px rgba(0,0,0,0.5), 0 30px 60px -30px rgba(0,0,0,0.7)'
        }}
      />

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="absolute inset-0">
        <defs>
          <radialGradient id="compassGlass" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.025)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.20)" />
          </radialGradient>
          <radialGradient id="compassHighlight" cx="50%" cy="18%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="compassRim" cx="50%" cy="50%" r="50%">
            <stop offset="92%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.22)" />
          </radialGradient>
          <radialGradient id="centerHub" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="55%" stopColor="#1a202c" />
            <stop offset="100%" stopColor="#0a0e15" />
          </radialGradient>
          <radialGradient id="centerHubInner" cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>
          <linearGradient id="needlePointer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#fcd34d" stopOpacity="1" />
            <stop offset="65%" stopColor="#f97316" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="needlePointerEdge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </linearGradient>
          <linearGradient id="needleTail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(120, 130, 150, 0.65)" />
            <stop offset="50%" stopColor="rgba(100, 110, 130, 0.5)" />
            <stop offset="100%" stopColor="rgba(75, 85, 100, 0.35)" />
          </linearGradient>
          <linearGradient id="runwayAsphalt" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(50, 60, 75, 0.85)" />
            <stop offset="8%" stopColor="rgba(100, 115, 135, 0.55)" />
            <stop offset="50%" stopColor="rgba(170, 185, 205, 0.45)" />
            <stop offset="92%" stopColor="rgba(100, 115, 135, 0.55)" />
            <stop offset="100%" stopColor="rgba(50, 60, 75, 0.85)" />
          </linearGradient>
          <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hubShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="1.5" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={COMPASS_R + 6} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R} fill="url(#compassGlass)" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R} fill="url(#compassRim)" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R - 4} fill="url(#compassHighlight)" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R - 16} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {Array.from({ length: 72 }).map((_, i) => {
          const angle = i * 5;
          const isCardinal = i % 18 === 0;
          const isMajor = i % 9 === 0;
          const inner = polar(angle, COMPASS_R - (isCardinal ? 20 : isMajor ? 14 : 6));
          const outer = polar(angle, COMPASS_R - 2);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isCardinal ? 'rgba(255,255,255,0.65)' : isMajor ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.14)'}
              strokeWidth={isCardinal ? 2 : isMajor ? 1.3 : 0.7}
              strokeLinecap="round"
            />
          );
        })}

        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((bearing) => {
          if (bearing % 90 === 0) return null;
          const pos = polar(bearing, COMPASS_R - 36);
          return (
            <text
              key={bearing}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(226,232,240,0.30)"
              fontSize="9"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {String(bearing / 10).padStart(2, '0')}
            </text>
          );
        })}

        {['N', 'E', 'S', 'W'].map((label, i) => {
          const pos = polar(i * 90, COMPASS_R - 36);
          return (
            <text
              key={label}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={i === 0 ? 'rgba(252,211,77,0.85)' : 'rgba(226,232,240,0.75)'}
              fontSize="13"
              fontWeight="800"
              letterSpacing="0.1em"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.7))' }}
            >
              {label}
            </text>
          );
        })}

        {Array.from(layouts.values()).flatMap((layout) =>
          Array.from(layout.bandeOffsetPx.entries()).map(([key, off]) => {
            const a = polar(layout.baseHeading, RUNWAY_R);
            const b = polar((layout.baseHeading + 180) % 360, RUNWAY_R);
            const dx = off * layout.perpDx;
            const dy = off * layout.perpDy;
            return (
              <g key={`line-${layout.baseHeading}-${key}`}>
                <line
                  x1={a.x + dx}
                  y1={a.y + dy}
                  x2={b.x + dx}
                  y2={b.y + dy}
                  stroke="rgba(8,12,18,0.85)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <line
                  x1={a.x + dx}
                  y1={a.y + dy}
                  x2={b.x + dx}
                  y2={b.y + dy}
                  stroke="url(#runwayAsphalt)"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <line
                  x1={a.x + dx}
                  y1={a.y + dy}
                  x2={b.x + dx}
                  y2={b.y + dy}
                  stroke="rgba(255,255,255,0.70)"
                  strokeWidth="1.2"
                  strokeDasharray="7 6"
                  strokeLinecap="round"
                />
                <ThresholdMarks ax={a.x + dx} ay={a.y + dy} bx={b.x + dx} by={b.y + dy} perpDx={layout.perpDx} perpDy={layout.perpDy} />
              </g>
            );
          })
        )}

        {windArrowRot != null && (
          <g
            style={{
              transform: `rotate(${windArrowRot}deg)`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transition: 'transform 1100ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            filter="url(#needleGlow)"
            opacity={needleStrength}
          >
            <path
              d={`M ${CENTER} ${CENTER - needleLength}
                  L ${CENTER - 9} ${CENTER - 26}
                  L ${CENTER - 4} ${CENTER}
                  L ${CENTER + 4} ${CENTER}
                  L ${CENTER + 9} ${CENTER - 26}
                  Z`}
              fill="url(#needlePointer)"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth="0.6"
            />
            <path
              d={`M ${CENTER} ${CENTER - needleLength + 4}
                  L ${CENTER - 3} ${CENTER - 28}
                  L ${CENTER - 1.5} ${CENTER - 4}
                  L ${CENTER + 1.5} ${CENTER - 4}
                  L ${CENTER + 3} ${CENTER - 28}
                  Z`}
              fill="rgba(255,255,255,0.45)"
            />
            <path
              d={`M ${CENTER} ${CENTER + tailLength}
                  L ${CENTER - 6} ${CENTER + 22}
                  L ${CENTER - 3} ${CENTER}
                  L ${CENTER + 3} ${CENTER}
                  L ${CENTER + 6} ${CENTER + 22}
                  Z`}
              fill="url(#needleTail)"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.5"
            />
            <ellipse
              cx={CENTER}
              cy={CENTER + tailLength + 4}
              rx="5"
              ry="3"
              fill="rgba(60, 70, 90, 0.7)"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.5"
            />
          </g>
        )}

        <g filter="url(#hubShadow)">
          <circle cx={CENTER} cy={CENTER} r="11" fill="#050810" />
          <circle cx={CENTER} cy={CENTER} r="9" fill="url(#centerHub)" />
          <circle cx={CENTER} cy={CENTER} r="6" fill="url(#centerHubInner)" />
          <circle cx={CENTER} cy={CENTER} r="3" fill="#fcd34d" opacity="0.8" />
          <circle cx={CENTER - 1} cy={CENTER - 1} r="1.2" fill="#fffbe6" />
        </g>
      </svg>

      {runways.map((rwy) => {
        const layout = layouts.get(rwy.heading % 180);
        if (!layout) return null;
        const state = tileStateFor(rwy.id, atisArr, atisDep, expectedArr, expectedDep, hasAtis);
        const tilePos = tilePosFor(rwy, layout);
        const role = roleLabel(rwy.id, atisArr, atisDep, state);
        return (
          <div
            key={rwy.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border backdrop-blur-md px-2.5 py-1.5 min-w-[60px] text-center transition-all ${TILE_PALETTE[state]}`}
            style={{ left: tilePos.x, top: tilePos.y }}
          >
            <div className="text-lg font-bold tabular-nums leading-tight">{rwy.id}</div>
            {role && <div className="text-[9px] uppercase tracking-wider mt-0.5 opacity-90">{role}</div>}
          </div>
        );
      })}
    </div>
  );
}

function ThresholdMarks({
  ax,
  ay,
  bx,
  by,
  perpDx,
  perpDy
}: {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  perpDx: number;
  perpDy: number;
}) {
  const stripeLength = 4;
  const stripeOffset = 3;
  const distFromEnd = 12;
  const dxRunway = bx - ax;
  const dyRunway = by - ay;
  const runwayLen = Math.hypot(dxRunway, dyRunway);
  const ux = dxRunway / runwayLen;
  const uy = dyRunway / runwayLen;
  const aTip = { x: ax + ux * distFromEnd, y: ay + uy * distFromEnd };
  const bTip = { x: bx - ux * distFromEnd, y: by - uy * distFromEnd };

  const stripes = ([-2, -1, 0, 1, 2] as const).map((i) => {
    const px = i * stripeOffset * perpDx;
    const py = i * stripeOffset * perpDy;
    return { px, py };
  });

  return (
    <g opacity="0.85">
      {stripes.map(({ px, py }, i) => (
        <line
          key={`a-${i}`}
          x1={aTip.x + px - ux * stripeLength}
          y1={aTip.y + py - uy * stripeLength}
          x2={aTip.x + px + ux * stripeLength}
          y2={aTip.y + py + uy * stripeLength}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
      {stripes.map(({ px, py }, i) => (
        <line
          key={`b-${i}`}
          x1={bTip.x + px - ux * stripeLength}
          y1={bTip.y + py - uy * stripeLength}
          x2={bTip.x + px + ux * stripeLength}
          y2={bTip.y + py + uy * stripeLength}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
