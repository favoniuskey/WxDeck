import net from 'node:net';
import { EventEmitter } from 'node:events';
import type { AuroraAtis } from '@shared/types';

export class AuroraClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;
  private buffer = '';
  private lastAtisLine = '';
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private destroyed = false;

  constructor(host: string, port: number) {
    super();
    this.host = host;
    this.port = port;
  }

  setEndpoint(host: string, port: number): void {
    const changed = host !== this.host || port !== this.port;
    this.host = host;
    this.port = port;
    if (changed) this.reconnect();
  }

  isConnected(): boolean {
    return this.connected;
  }

  connect(): void {
    if (this.destroyed || this.socket) return;
    const s = new net.Socket();
    this.socket = s;
    s.setKeepAlive(true, 5000);

    s.on('connect', () => {
      this.connected = true;
      this.emit('status', true);
    });

    s.on('data', (chunk) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split(/\r?\n/);
      this.buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('#ATIS')) this.lastAtisLine = line;
      }
    });

    s.on('error', () => {
      this.connected = false;
    });

    s.on('close', () => {
      const wasConnected = this.connected;
      this.connected = false;
      this.socket = null;
      if (wasConnected) this.emit('status', false);
      if (!this.destroyed) this.scheduleReconnect();
    });

    try {
      s.connect(this.port, this.host);
    } catch {
      this.socket = null;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.destroyed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  private reconnect(): void {
    if (this.socket) {
      try { this.socket.destroy(); } catch { /* noop */ }
      this.socket = null;
    }
    this.connect();
  }

  requestAtis(): void {
    if (!this.connected || !this.socket) return;
    try {
      this.socket.write('#ATIS\n');
    } catch {
      // socket gone
    }
  }

  parseLatestAtis(): AuroraAtis | null {
    return parseAtisLine(this.lastAtisLine);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try { this.socket.destroy(); } catch { /* noop */ }
    }
  }
}

export function parseAtisLine(raw: string): AuroraAtis | null {
  if (!raw || !raw.startsWith('#ATIS')) return null;
  const parts = raw.split(';');
  if (parts.length < 5) return null;
  const letter = (parts[1] ?? '').trim();
  if (!letter) return null;
  return {
    infoLetter: letter,
    icao: (parts[2] ?? '').trim().toUpperCase(),
    arrRunways: (parts[3] ?? '').trim().split(/\s+/).filter(Boolean),
    depRunways: (parts[4] ?? '').trim().split(/\s+/).filter(Boolean),
    transAlt: (parts[5] ?? '').trim() || undefined,
    transLvl: (parts[6] ?? '').trim() || undefined
  };
}
