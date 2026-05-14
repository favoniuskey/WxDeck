export function padDir(d: number | 'VRB'): string {
  if (d === 'VRB') return 'VRB';
  return String(Math.round(d)).padStart(3, '0');
}

export function padSpd(s: number): string {
  return String(Math.round(s)).padStart(2, '0');
}

export function fmtFL(n: number): string {
  return `FL${String(n).padStart(3, '0')}`;
}

export function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export function shortTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
