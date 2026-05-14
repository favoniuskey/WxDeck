import { BrowserWindow } from 'electron';
import type { LiveState } from '@shared/types';
import { AuroraClient } from './aurora';
import { findSessionByVid, isControllerPosition } from './whazzup';
import { fetchMetar, fetchTaf } from './avwx';
import { getAirport } from './airports';
import { computeWarnings, pickExpectedConfig, windComponents, runwayHeadingForConfig } from './warnings';
import { getSettings } from './settings';
import { IPC } from '@shared/channels';

let state: LiveState = {
  session: null,
  airport: null,
  metar: null,
  taf: null,
  atis: null,
  warnings: [],
  expectedConfig: null,
  lastUpdate: new Date().toISOString(),
  auroraConnected: false,
  whazzupOk: false
};

let aurora: AuroraClient | null = null;
let sessionTimer: NodeJS.Timeout | null = null;
let weatherTimer: NodeJS.Timeout | null = null;
let atisTimer: NodeJS.Timeout | null = null;
let lastFetchedIcao = '';

export function startOrchestrator(): void {
  const settings = getSettings();
  aurora = new AuroraClient(settings.auroraHost, settings.auroraPort);
  aurora.on('status', (ok: boolean) => {
    state.auroraConnected = ok;
    broadcast();
  });
  aurora.connect();

  scheduleTimers();
  tickSession().catch(() => undefined);
}

export function refreshTimers(): void {
  scheduleTimers();
}

export function applyAuroraEndpoint(host: string, port: number): void {
  if (aurora) aurora.setEndpoint(host, port);
}

function scheduleTimers(): void {
  const s = getSettings();
  if (sessionTimer) clearInterval(sessionTimer);
  if (weatherTimer) clearInterval(weatherTimer);
  if (atisTimer) clearInterval(atisTimer);

  sessionTimer = setInterval(() => tickSession().catch(() => undefined), Math.max(10000, s.pollIntervalMs));
  weatherTimer = setInterval(() => tickWeather().catch(() => undefined), Math.max(20000, s.weatherIntervalMs));
  atisTimer = setInterval(() => tickAtis(), 4000);
}

async function tickSession(): Promise<void> {
  const s = getSettings();
  if (!s.vid) {
    state.session = null;
    state.airport = null;
    state.whazzupOk = false;
    state.warnings = [];
    broadcast();
    return;
  }
  const session = await findSessionByVid(s.vid);
  state.whazzupOk = true;
  state.session = session;
  if (!session) {
    state.airport = null;
    state.warnings = [];
    lastFetchedIcao = '';
    broadcast();
    return;
  }
  const supported = isControllerPosition(session.rank);
  state.airport = supported ? getAirport(session.icao) : null;
  if (session.icao !== lastFetchedIcao) {
    lastFetchedIcao = session.icao;
    await tickWeather();
  }
  recomputeWarnings();
  broadcast();
}

async function tickWeather(): Promise<void> {
  const icao = state.session?.icao;
  if (!icao) {
    state.metar = null;
    state.taf = null;
    broadcast();
    return;
  }
  const [metar, taf] = await Promise.all([fetchMetar(icao), fetchTaf(icao)]);
  if (metar) state.metar = metar;
  if (taf) state.taf = taf;
  recomputeWarnings();
  state.lastUpdate = new Date().toISOString();
  broadcast();
}

function tickAtis(): void {
  if (!aurora) return;
  aurora.requestAtis();
  const parsed = aurora.parseLatestAtis();
  const sameIcao = parsed && state.session?.icao && parsed.icao === state.session.icao;
  state.atis = sameIcao ? parsed : null;
  recomputeWarnings();
  broadcast();
}

function recomputeWarnings(): void {
  state.warnings = computeWarnings(state.airport, state.metar, state.atis);
  if (state.airport && state.metar) {
    const cfg = pickExpectedConfig(state.airport, state.metar);
    const heading = runwayHeadingForConfig(state.airport, cfg);
    state.expectedConfig = cfg
      ? {
          name: cfg.name,
          arrRunways: cfg.arrRunways,
          depRunways: cfg.depRunways,
          headingDeg: heading,
          windComponents:
            heading != null
              ? windComponents(heading, state.metar.wind.direction, state.metar.wind.speed)
              : { headwind: 0, crosswind: 0, tailwind: 0 }
        }
      : null;
  } else {
    state.expectedConfig = null;
  }
}

function broadcast(): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.LIVE_UPDATE, state);
  }
}

export function getLiveState(): LiveState {
  return state;
}
