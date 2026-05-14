import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import { IPC } from '@shared/channels';
import type { UpdateEvent } from '@shared/types';

export function initUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (evt: UpdateEvent) => {
    for (const w of BrowserWindow.getAllWindows()) {
      if (!w.isDestroyed()) w.webContents.send(IPC.UPDATE_EVENT, evt);
    }
  };

  autoUpdater.on('checking-for-update', () => send({ type: 'checking' }));
  autoUpdater.on('update-available', (info) => send({ type: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => send({ type: 'not-available' }));
  autoUpdater.on('download-progress', (p) =>
    send({ type: 'progress', percent: p.percent, bytesPerSecond: p.bytesPerSecond })
  );
  autoUpdater.on('update-downloaded', (info) => send({ type: 'downloaded', version: info.version }));
  autoUpdater.on('error', (err) => send({ type: 'error', message: err?.message ?? 'unknown error' }));
}

export async function checkForUpdates(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates();
  } catch {
    // network or no release
  }
}

export function installUpdateNow(): void {
  autoUpdater.quitAndInstall(false, true);
}
