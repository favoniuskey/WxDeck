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
  const windArrowRot = windDir === 'VRB' || windDir == null ? null : (windDir as number);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <div
        className="absolute pointer-events-none"
        style={{
          left: CENTER - COMPASS_R - 14,
          top: CENTER - COMPASS_R - 14,
          width: (COMPASS_R + 14) * 2,
          height: (COMPASS_R + 14) * 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 30%, rgba(96,165,250,0.10) 0%, rgba(255,255,255,0.02) 35%, transparent 65%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 4px rgba(0,0,0,0.4), 0 30px 60px -30px rgba(0,0,0,0.6)'
        }}
      />

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="absolute inset-0">
        <defs>
          <radialGradient id="compassGlass" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.025)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </radialGradient>
          <radialGradient id="compassHighlight" cx="50%" cy="20%" r="45%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="compassRim" cx="50%" cy="50%" r="50%">
            <stop offset="92%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
          </radialGradient>
          <linearGradient id="runwayAsphalt" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(70, 80, 95, 0.20)" />
            <stop offset="50%" stopColor="rgba(150, 165, 185, 0.45)" />
            <stop offset="100%" stopColor="rgba(70, 80, 95, 0.20)" />
          </linearGradient>
          <linearGradient id="windNeedle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" stopOpacity="1" />
            <stop offset="60%" stopColor="#fb923c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.85" />
          </linearGradient>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={COMPASS_R + 6} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R} fill="url(#compassGlass)" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R} fill="url(#compassRim)" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R - 4} fill="url(#compassHighlight)" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <circle cx={CENTER} cy={CENTER} r={COMPASS_R - 14} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />

        {Array.from({ length: 72 }).map((_, i) => {
          const angle = i * 5;
          const isCardinal = i % 18 === 0;
          const isMajor = i % 9 === 0;
          const inner = polar(angle, COMPASS_R - (isCardinal ? 18 : isMajor ? 12 : 6));
          const outer = polar(angle, COMPASS_R - 2);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isCardinal ? 'rgba(255,255,255,0.55)' : isMajor ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.14)'}
              strokeWidth={isCardinal ? 1.8 : isMajor ? 1.2 : 0.7}
              strokeLinecap="round"
            />
          );
        })}

        {['N', 'E', 'S', 'W'].map((label, i) => {
          const pos = polar(i * 90, COMPASS_R - 32);
          return (
            <text
              key={label}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(226,232,240,0.7)"
              fontSize="12"
              fontWeight="700"
              letterSpacing="0.12em"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.6))' }}
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
                  stroke="rgba(20,28,40,0.7)"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
                <line
                  x1={a.x + dx}
                  y1={a.y + dy}
                  x2={b.x + dx}
                  y2={b.y + dy}
                  stroke="url(#runwayAsphalt)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <line
                  x1={a.x + dx}
                  y1={a.y + dy}
                  x2={b.x + dx}
                  y2={b.y + dy}
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="1.2"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                />
              </g>
            );
          })
        )}

        {windArrowRot != null && (
          <g
            style={{
              transform: `rotate(${windArrowRot}deg)`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            filter="url(#needleGlow)"
          >
            <polygon
              points={`${CENTER},${CENTER - COMPASS_R + 8} ${CENTER - 11},${CENTER - COMPASS_R + 32} ${CENTER},${CENTER - COMPASS_R + 26} ${CENTER + 11},${CENTER - COMPASS_R + 32}`}
              fill="url(#windNeedle)"
            />
            <line
              x1={CENTER}
              y1={CENTER - COMPASS_R + 26}
              x2={CENTER}
              y2={CENTER - COMPASS_R + 78}
              stroke="rgba(252,211,77,0.45)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        <circle cx={CENTER} cy={CENTER} r={5} fill="rgba(0,0,0,0.6)" />
        <circle cx={CENTER} cy={CENTER} r={3} fill="rgba(255,255,255,0.85)" />
        <circle cx={CENTER} cy={CENTER} r={1.4} fill="rgba(252,211,77,0.9)" />
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
