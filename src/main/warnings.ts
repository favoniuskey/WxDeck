import type { AirportProfile, AtisWarning, AuroraAtis, MetarReport, RunwayConfiguration, RunwayDef } from '@shared/types';
import { computeTransitionLevel } from './airports';

function inWindArc(dir: number, from: number, to: number): boolean {
  if (from <= to) return dir >= from && dir <= to;
  return dir >= from || dir <= to;
}

function getConfigurations(profile: AirportProfile): RunwayConfiguration[] {
  return profile.configurations ?? [];
}

function getRunways(profile: AirportProfile): RunwayDef[] {
  const r = profile.runways as unknown;
  if (!Array.isArray(r) || r.length === 0) return [];
  if (typeof r[0] === 'string') return [];
  return r as RunwayDef[];
}

function activeTimeWindow(window: string | null | undefined, _tz: string | null | undefined): boolean {
  if (!window) return true;
  const m = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(window);
  if (!m) return true;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const from = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const to = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
  if (from <= to) return minutes >= from && minutes <= to;
  return minutes >= from || minutes <= to;
}

export function pickExpectedConfig(profile: AirportProfile, metar: MetarReport): RunwayConfiguration | null {
  const configs = getConfigurations(profile);
  if (configs.length === 0) return null;
  const dir = metar.wind.direction === 'VRB' ? null : metar.wind.direction;
  const spd = metar.wind.speed;

  const candidates = configs.filter((c) => {
    if (c.minSpeed && spd < c.minSpeed) return false;
    if (dir == null) return true;
    return inWindArc(dir, c.windFrom, c.windTo);
  });
  const timed = candidates.filter((c) => activeTimeWindow(c.timeWindow, c.timeWindowTz));
  const pool = timed.length > 0 ? timed : candidates;
  if (pool.length === 0) return null;
  pool.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  return pool[0];
}

function runwayHeading(profile: AirportProfile, id: string): number | null {
  const rwy = getRunways(profile).find((r) => r.id === id);
  return rwy?.heading ?? null;
}

export function computeWarnings(
  airport: AirportProfile | null,
  metar: MetarReport | null,
  atis: AuroraAtis | null
): AtisWarning[] {
  const out: AtisWarning[] = [];
  if (!airport || !metar) return out;

  if (metar.wind.gust && metar.wind.gust - metar.wind.speed >= 10) {
    out.push({
      kind: 'session',
      level: 'warn',
      message: `Rafales importantes (${Math.round(metar.wind.gust - metar.wind.speed)} kt au-dessus du vent moyen)`
    });
  }
  if (metar.wxCodes?.some((c) => c.includes('WS'))) {
    out.push({
      kind: 'session',
      level: 'error',
      message: 'Cisaillement de vent (WS) signalé au METAR'
    });
  }

  const expected = pickExpectedConfig(airport, metar);

  if (atis && expected) {
    const atisArr = atis.arrRunways.map((r) => r.toUpperCase());
    const atisDep = atis.depRunways.map((r) => r.toUpperCase());
    const expectedArr = expected.arrRunways.map((r) => r.toUpperCase());
    const expectedDep = expected.depRunways.map((r) => r.toUpperCase());

    const arrPrefix = atisArr[0]?.slice(0, 2);
    const expectedArrPrefix = expectedArr[0]?.slice(0, 2);
    if (arrPrefix && expectedArrPrefix && arrPrefix !== expectedArrPrefix) {
      out.push({
        kind: 'runway',
        level: 'warn',
        message: `Piste ARR ${atisArr.join('/')} non préférentielle selon le vent (config attendue : ${expected.name})`,
        expected: expectedArr.join('/'),
        actual: atisArr.join('/')
      });
    }
    const depPrefix = atisDep[0]?.slice(0, 2);
    const expectedDepPrefix = expectedDep[0]?.slice(0, 2);
    if (depPrefix && expectedDepPrefix && depPrefix !== expectedDepPrefix) {
      out.push({
        kind: 'runway',
        level: 'warn',
        message: `Piste DEP ${atisDep.join('/')} non préférentielle selon le vent (config attendue : ${expected.name})`,
        expected: expectedDep.join('/'),
        actual: atisDep.join('/')
      });
    }
  }

  if (atis?.transLvl) {
    const expectedTfl = computeTransitionLevel(airport, metar.altimeter.hPa);
    const actual = parseInt(atis.transLvl.replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(actual) && Number.isFinite(expectedTfl) && actual !== expectedTfl) {
      out.push({
        kind: 'tfl',
        level: 'error',
        message: 'Transition Level incohérent avec le QNH',
        expected: `FL${String(expectedTfl).padStart(3, '0')}`,
        actual: `FL${String(actual).padStart(3, '0')}`
      });
    }
  }

  return out;
}

export function windComponents(runwayHeadingDeg: number, windDir: number | 'VRB', windSpeed: number) {
  if (windDir === 'VRB') return { headwind: 0, crosswind: 0, tailwind: 0 };
  const delta = ((windDir - runwayHeadingDeg + 540) % 360) - 180;
  const rad = (delta * Math.PI) / 180;
  const along = Math.cos(rad) * windSpeed;
  const cross = Math.sin(rad) * windSpeed;
  return {
    headwind: along >= 0 ? Math.round(along * 10) / 10 : 0,
    tailwind: along < 0 ? Math.round(-along * 10) / 10 : 0,
    crosswind: Math.round(Math.abs(cross) * 10) / 10,
    crossFromLeft: cross < 0
  };
}

export function runwayHeadingForConfig(profile: AirportProfile, config: RunwayConfiguration | null): number | null {
  if (!config) return null;
  const id = config.arrRunways[0] ?? config.depRunways[0];
  if (!id) return null;
  return runwayHeading(profile, id);
}
