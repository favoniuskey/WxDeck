import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import net from 'node:net';

const execFileP = promisify(execFile);

export interface AuroraDiagnostic {
  internetOk: boolean;
  auroraInstalled: boolean;
  auroraPath: string | null;
  auroraRunning: boolean;
  activeProfile: string | null;
  activeProfileName: string | null;
  activeProfileElevationFt: number | null;
  thirdPartyEnabledActive: boolean | null;
  profilesNeedingFix: string[];
  totalProfiles: number;
  tcpReachable: boolean;
  host: string;
  port: number;
}

function commonAuroraPaths(): string[] {
  const list = [
    'C:\\Aurora',
    process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, 'Aurora') : null,
    process.env['PROGRAMFILES(X86)'] ? join(process.env['PROGRAMFILES(X86)']!, 'Aurora') : null,
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Programs', 'Aurora') : null,
    process.env.USERPROFILE ? join(process.env.USERPROFILE, 'Aurora') : null
  ].filter(Boolean) as string[];
  return Array.from(new Set(list));
}

export function detectAuroraPath(hint?: string | null): string | null {
  const candidates = hint ? [hint, ...commonAuroraPaths()] : commonAuroraPaths();
  for (const p of candidates) {
    try {
      if (existsSync(join(p, 'Aurora.exe'))) return p;
    } catch {
      /* skip */
    }
  }
  return null;
}

export async function isAuroraRunning(): Promise<boolean> {
  if (process.platform !== 'win32') return false;
  try {
    const { stdout } = await execFileP('tasklist', ['/FI', 'IMAGENAME eq Aurora.exe', '/NH', '/FO', 'CSV'], {
      timeout: 5000,
      windowsHide: true
    });
    return /aurora\.exe/i.test(stdout);
  } catch {
    return false;
  }
}

export function getActiveProfile(auroraPath: string): { file: string; name: string } | null {
  const lastIni = join(auroraPath, 'Settings', 'last.ini');
  if (!existsSync(lastIni)) return null;
  try {
    const content = readFileSync(lastIni, 'utf-8').trim();
    const firstLine = content.split(/\r?\n/)[0].trim();
    if (!firstLine) return null;
    const normalised = firstLine.replace(/\//g, '\\');
    if (!existsSync(normalised)) return null;
    const name = normalised.split('\\').pop()?.replace(/\.cpr$/i, '') ?? 'profile';
    return { file: normalised, name };
  } catch {
    return null;
  }
}

function parseIni(text: string): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  let current = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      current = line.slice(1, -1).trim().toUpperCase();
      if (!out.has(current)) out.set(current, new Map());
      continue;
    }
    if (!current) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().toUpperCase();
    const value = line.slice(eq + 1).trim();
    out.get(current)?.set(key, value);
  }
  return out;
}

export function isThirdPartyEnabledInProfile(cprPath: string): boolean | null {
  if (!existsSync(cprPath)) return null;
  try {
    const ini = parseIni(readFileSync(cprPath, 'utf-8'));
    const value = ini.get('3RD PARTY')?.get('ENABLE_TCP_SERVER');
    if (value == null) return false;
    return value === '1' || value.toLowerCase() === 'true';
  } catch {
    return null;
  }
}

export function getProfileElevationFt(cprPath: string): number | null {
  if (!existsSync(cprPath)) return null;
  try {
    const ini = parseIni(readFileSync(cprPath, 'utf-8'));
    const value = ini.get('CONNECTION')?.get('ELEVATION');
    if (value == null) return null;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function listProfiles(auroraPath: string): string[] {
  const profilesDir = join(auroraPath, 'Profiles');
  if (!existsSync(profilesDir)) return [];
  try {
    return readdirSync(profilesDir)
      .filter((n) => n.toLowerCase().endsWith('.cpr'))
      .map((n) => join(profilesDir, n));
  } catch {
    return [];
  }
}

export function findProfilesNeedingFix(auroraPath: string): string[] {
  return listProfiles(auroraPath).filter((p) => isThirdPartyEnabledInProfile(p) === false);
}

export function enableThirdPartyInProfile(cprPath: string): boolean {
  if (!existsSync(cprPath)) return false;
  try {
    const raw = readFileSync(cprPath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    let inSection = false;
    let updated = false;
    let sectionLineIndex = -1;
    let sectionEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const isHeader = trimmed.startsWith('[') && trimmed.endsWith(']');
      if (isHeader) {
        if (inSection) {
          sectionEndIndex = i;
          break;
        }
        if (trimmed.toUpperCase() === '[3RD PARTY]') {
          inSection = true;
          sectionLineIndex = i;
        }
        continue;
      }
      if (inSection && /^ENABLE_TCP_SERVER\s*=/i.test(trimmed)) {
        lines[i] = 'ENABLE_TCP_SERVER=1';
        updated = true;
        break;
      }
    }

    if (!updated && sectionLineIndex !== -1) {
      const insertAt = sectionEndIndex === -1 ? lines.length : sectionEndIndex;
      lines.splice(insertAt, 0, 'ENABLE_TCP_SERVER=1');
      updated = true;
    }

    if (!updated) {
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
      lines.push('', '[3RD PARTY]', 'ENABLE_TCP_SERVER=1', '');
      updated = true;
    }

    const useCrlf = raw.includes('\r\n');
    writeFileSync(cprPath, lines.join(useCrlf ? '\r\n' : '\n'), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export async function checkInternet(): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch('https://api.ivao.aero/v2/tracker/whazzup', {
      method: 'HEAD',
      signal: ctrl.signal
    });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export function checkTcpReachable(host: string, port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try {
        sock.destroy();
      } catch {
        /* noop */
      }
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => finish(true));
    sock.once('error', () => finish(false));
    sock.once('timeout', () => finish(false));
    try {
      sock.connect(port, host);
    } catch {
      finish(false);
    }
  });
}

export async function diagnose(host: string, port: number, pathHint?: string | null): Promise<AuroraDiagnostic> {
  const [internetOk, auroraRunning, tcpReachable] = await Promise.all([
    checkInternet(),
    isAuroraRunning(),
    checkTcpReachable(host, port)
  ]);
  const auroraPath = detectAuroraPath(pathHint);
  const active = auroraPath ? getActiveProfile(auroraPath) : null;
  const thirdPartyEnabledActive = active ? isThirdPartyEnabledInProfile(active.file) : null;
  const profilesNeedingFix = auroraPath ? findProfilesNeedingFix(auroraPath) : [];
  const totalProfiles = auroraPath ? listProfiles(auroraPath).length : 0;
  const activeProfileElevationFt = active ? getProfileElevationFt(active.file) : null;
  return {
    internetOk,
    auroraInstalled: !!auroraPath,
    auroraPath,
    auroraRunning,
    activeProfile: active?.file ?? null,
    activeProfileName: active?.name ?? null,
    activeProfileElevationFt,
    thirdPartyEnabledActive,
    profilesNeedingFix,
    totalProfiles,
    tcpReachable,
    host,
    port
  };
}

export interface FixResult {
  attempted: number;
  succeeded: string[];
  failed: string[];
  blockedByRunning: boolean;
}

export async function autoFixThirdParty(auroraPath: string, scope: 'active' | 'all'): Promise<FixResult> {
  const running = await isAuroraRunning();
  if (running) {
    return { attempted: 0, succeeded: [], failed: [], blockedByRunning: true };
  }
  const targets =
    scope === 'all'
      ? listProfiles(auroraPath)
      : (() => {
          const active = getActiveProfile(auroraPath);
          return active ? [active.file] : [];
        })();
  const succeeded: string[] = [];
  const failed: string[] = [];
  for (const file of targets) {
    if (isThirdPartyEnabledInProfile(file)) continue;
    const ok = enableThirdPartyInProfile(file);
    if (ok) succeeded.push(file);
    else failed.push(file);
  }
  return { attempted: targets.length, succeeded, failed, blockedByRunning: false };
}
