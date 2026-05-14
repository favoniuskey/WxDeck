import type { AirportProfile, MetarReport } from '@shared/types';

export interface AliziaWindReading {
  vitesse: { min: number | null; moy: number | null; max: number | null };
  direction: { min: number | null; moy: number | 'VRB' | null; max: number | null };
  vrb: boolean;
  unitSpeed: 'kt' | 'm/s';
  unitDir: '°';
}

export interface AliziaPressureReading {
  qnh: number | null;
  qfe: number | null;
}

const MIN_SPEED_DELTA = 3;
const DEFAULT_VAR = 30;

export function extractWind(metar: MetarReport | null): AliziaWindReading {
  if (!metar) {
    return {
      vitesse: { min: null, moy: null, max: null },
      direction: { min: null, moy: null, max: null },
      vrb: false,
      unitSpeed: 'kt',
      unitDir: '°'
    };
  }
  const moySpd = Math.round(metar.wind.speed);
  const gust = metar.wind.gust ? Math.round(metar.wind.gust) : null;
  const maxSpd = gust ?? moySpd;
  const minSpd = Math.max(0, moySpd - MIN_SPEED_DELTA);

  const vrb = metar.wind.direction === 'VRB';
  const moyDir = vrb ? null : (metar.wind.direction as number);
  let minDir: number | null = null;
  let maxDir: number | null = null;
  const varMatch = metar.rawText.match(/\b(\d{3})V(\d{3})\b/);
  if (varMatch) {
    minDir = parseInt(varMatch[1], 10);
    maxDir = parseInt(varMatch[2], 10);
  } else if (moyDir != null) {
    const half = Math.round(DEFAULT_VAR / 2);
    minDir = (moyDir - half + 360) % 360;
    maxDir = (moyDir + half) % 360;
  }

  return {
    vitesse: { min: minSpd, moy: moySpd, max: maxSpd },
    direction: { min: minDir, moy: vrb ? 'VRB' : moyDir, max: maxDir },
    vrb,
    unitSpeed: 'kt',
    unitDir: '°'
  };
}

export function extractPressure(metar: MetarReport | null, airport: AirportProfile | null): AliziaPressureReading {
  if (!metar) return { qnh: null, qfe: null };
  const qnh = Math.round(metar.altimeter.hPa);
  const elevFt = approxElevationFt(airport);
  const qfe = elevFt != null ? Math.round(qnh - (elevFt / 27.3)) : null;
  return { qnh, qfe };
}

function approxElevationFt(airport: AirportProfile | null): number | null {
  if (!airport) return null;
  const map: Record<string, number> = {
    LFPG: 392, LFPO: 291, LFPB: 218, LFBO: 499, LFBD: 162,
    LFML: 74, LFMN: 12, LFLL: 821, LFLB: 779, LFRS: 90, LFSB: 885, LFST: 505,
    LFKJ: 18, LFKB: 25, LFQQ: 157, LFOB: 359, LFMT: 17, LFLC: 1090, LFBZ: 245,
    TFFF: 16, TFFR: 36, TFFJ: 49, FMEE: 66, FMCZ: 50, SOCA: 26,
    NWWW: 52
  };
  return map[airport.icao] ?? null;
}

export function activeQfuFromConfig(arrRunway: string | undefined, airport: AirportProfile | null): string | null {
  if (!arrRunway) return null;
  const m = arrRunway.match(/^(\d{1,2})([LRC]?)$/);
  if (!m) return null;
  const suffix = m[2] || '';
  let heading: number | null = null;
  if (airport && Array.isArray(airport.runways) && airport.runways.length > 0 && typeof airport.runways[0] !== 'string') {
    const found = (airport.runways as Array<{ id: string; heading: number }>).find((r) => r.id.toUpperCase() === arrRunway.toUpperCase());
    if (found) heading = found.heading;
  }
  if (heading == null) {
    const num = parseInt(m[1], 10);
    heading = num * 10;
  }
  return `${suffix}${String(heading).padStart(3, '0')}`;
}
