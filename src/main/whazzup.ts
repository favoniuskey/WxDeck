import type { AtcRank, AtcSession } from '@shared/types';

const WHAZZUP_URL = 'https://api.ivao.aero/v2/tracker/whazzup';

interface RawAtc {
  id: number;
  userId: number;
  callsign: string;
  connectionType?: string;
  rating?: number;
  serverId?: string;
  softwareName?: string;
  time?: number;
  atcSession?: {
    frequency?: number;
    position?: string;
  };
}

interface WhazzupResponse {
  clients?: { atcs?: RawAtc[] };
}

function rankFromCallsign(cs: string): AtcRank {
  const suffix = cs.split('_').pop()?.toUpperCase() ?? '';
  switch (suffix) {
    case 'DEL': return 'DEL';
    case 'GND': return 'GND';
    case 'TWR': return 'TWR';
    case 'APP': return 'APP';
    case 'DEP': return 'DEP';
    case 'CTR': return 'CTR';
    case 'FSS': return 'FSS';
    case 'OBS': return 'OBS';
    default: return 'UNKNOWN';
  }
}

function icaoFromCallsign(cs: string): string {
  const head = cs.split('_')[0]?.toUpperCase() ?? '';
  return head.length === 4 ? head : '';
}

export async function findSessionByVid(vid: string): Promise<AtcSession | null> {
  const numericVid = Number(vid);
  if (!Number.isFinite(numericVid)) return null;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(WHAZZUP_URL, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'WxDeck/0.1 (+https://github.com/favoniuskey/WxDeck)' }
    });
    if (!res.ok) return null;
    const json = (await res.json()) as WhazzupResponse;
    const atcs = json.clients?.atcs ?? [];
    const match = atcs.find((a) => a.userId === numericVid);
    if (!match) return null;
    const cs = match.callsign;
    const icao = icaoFromCallsign(cs);
    if (!icao) return null;
    return {
      callsign: cs,
      icao,
      rank: rankFromCallsign(cs),
      frequency: formatFrequency(match.atcSession?.frequency),
      online: true,
      connectedAt: match.time ? new Date(match.time * 1000).toISOString() : undefined
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function formatFrequency(raw?: number): string | undefined {
  if (raw == null) return undefined;
  if (raw > 1000) return (raw / 1000).toFixed(3);
  return raw.toFixed(3);
}

export function isControllerPosition(rank: AtcRank): boolean {
  return rank === 'DEL' || rank === 'GND' || rank === 'TWR' || rank === 'APP' || rank === 'DEP';
}
