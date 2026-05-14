import type { MetarReport, TafReport } from '@shared/types';
import { getAvwxToken } from './token';

const BASE = 'https://avwx.rest/api';

interface AvwxMetar {
  raw: string;
  time: { dt: string };
  station: string;
  wind_direction: { repr: string; value: number | null };
  wind_speed: { repr: string; value: number };
  wind_gust?: { value: number };
  visibility?: { value: number; repr: string };
  altimeter: { value: number; repr: string };
  temperature?: { value: number };
  dewpoint?: { value: number };
  flight_rules?: string;
  clouds?: Array<{ type: string; altitude: number | null; repr: string }>;
  wx_codes?: Array<{ repr: string }>;
  units?: { altimeter: string; wind_speed: string };
}

interface AvwxTaf {
  raw: string;
  time: { dt: string };
  station: string;
}

async function call<T>(path: string): Promise<T | null> {
  const token = getAvwxToken();
  if (!token) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function hpaFrom(altimeter: { value: number; repr: string }, unit?: string): { hPa: number; inHg: number } {
  const u = unit ?? '';
  if (u.toLowerCase().includes('hpa') || altimeter.repr.toUpperCase().startsWith('Q')) {
    const hPa = altimeter.value;
    return { hPa, inHg: +(hPa * 0.02953).toFixed(2) };
  }
  const inHg = altimeter.value;
  return { hPa: Math.round(inHg * 33.8639), inHg };
}

export async function fetchMetar(icao: string): Promise<MetarReport | null> {
  const data = await call<AvwxMetar>(`/metar/${icao}?options=&airport=true&reporting=true&format=json&onfail=cache`);
  if (!data) return null;
  const alt = hpaFrom(data.altimeter, data.units?.altimeter);
  const dirVal = data.wind_direction?.value;
  const direction =
    data.wind_direction?.repr?.toUpperCase() === 'VRB' || dirVal == null
      ? 'VRB'
      : dirVal;
  return {
    station: data.station,
    rawText: data.raw,
    time: data.time?.dt ?? new Date().toISOString(),
    wind: {
      direction,
      speed: data.wind_speed?.value ?? 0,
      gust: data.wind_gust?.value,
      unit: data.units?.wind_speed ?? 'kt'
    },
    visibility: data.visibility ? { value: data.visibility.value, unit: 'm', repr: data.visibility.repr } : undefined,
    altimeter: { hPa: alt.hPa, inHg: alt.inHg, repr: data.altimeter.repr },
    temperature: data.temperature?.value,
    dewpoint: data.dewpoint?.value,
    flightRules: data.flight_rules,
    clouds: data.clouds,
    wxCodes: data.wx_codes?.map((c) => c.repr)
  };
}

export async function fetchTaf(icao: string): Promise<TafReport | null> {
  const data = await call<AvwxTaf>(`/taf/${icao}?format=json&onfail=cache`);
  if (!data) return null;
  return {
    station: data.station,
    rawText: data.raw,
    time: data.time?.dt ?? new Date().toISOString()
  };
}
