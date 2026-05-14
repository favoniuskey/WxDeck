import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import type { AirportProfile } from '@shared/types';

let cache = new Map<string, AirportProfile>();
let loaded = false;

function resolveAirportsDir(): string {
  const packaged = join(process.resourcesPath ?? '', 'airports');
  if (existsSync(packaged)) return packaged;
  return join(app.getAppPath(), 'airports');
}

function loadAll(): void {
  if (loaded) return;
  const dir = resolveAirportsDir();
  if (!existsSync(dir)) {
    loaded = true;
    return;
  }
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    if (file.startsWith('_')) continue;
    try {
      const raw = readFileSync(join(dir, file), 'utf-8');
      const profile = JSON.parse(raw) as AirportProfile;
      cache.set(profile.icao.toUpperCase(), profile);
    } catch {
      // skip malformed file
    }
  }
  loaded = true;
}

export function getAirport(icao: string): AirportProfile | null {
  loadAll();
  return cache.get(icao.toUpperCase()) ?? null;
}

export function listAirports(): AirportProfile[] {
  loadAll();
  return Array.from(cache.values());
}

export function computeTransitionLevel(profile: AirportProfile, qnhHpa: number): number {
  const rounded = Math.round(qnhHpa);
  for (const band of profile.transitionLevels) {
    if (rounded >= band.minQnh && rounded <= band.maxQnh) return band.flightLevel;
  }
  return profile.transitionLevels[0]?.flightLevel ?? 0;
}
