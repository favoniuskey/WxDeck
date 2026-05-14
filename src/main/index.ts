import { app, BrowserWindow, ipcMain, shell, nativeImage } from 'electron';
import { release } from 'node:os';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IPC } from '@shared/channels';
import type { AliziaMode } from '@shared/types';
import { getSettings, patchSettings } from './settings';
import { initUpdater, checkForUpdates, installUpdateNow } from './updater';
import { startOrchestrator, getLiveState, applyAuroraEndpoint, refreshTimers } from './orchestrator';

if (release().startsWith('6.1')) app.disableHardwareAcceleration();
if (process.platform === 'win32') app.setAppUserModelId('io.favoniuskey.wxdeck');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;
const aliziaWindows: Record<AliziaMode, BrowserWindow | null> = {
  vent: null,
  pression: null
};

function preloadPath(): string {
  return join(__dirname, '..', 'preload', 'index.cjs');
}

function rendererEntry(): { url?: string; file?: string } {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) return { url: devUrl };
  return { file: join(__dirname, '..', 'renderer', 'index.html') };
}

function supportsMica(): boolean {
  if (process.platform !== 'win32') return false;
  const m = /^10\.0\.(\d+)/.exec(release());
  if (!m) return false;
  const build = parseInt(m[1], 10);
  return build >= 22000;
}

function resolveIcon(): Electron.NativeImage | undefined {
  const candidates = [
    join(process.resourcesPath ?? '', 'icon.png'),
    join(__dirname, '..', '..', 'resources', 'icon.png'),
    join(__dirname, '..', '..', 'build', 'icon.png')
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    }
  }
  return undefined;
}

async function createMainWindow(): Promise<void> {
  const mica = supportsMica();
  const icon = resolveIcon();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    icon,
    backgroundColor: mica ? '#00000000' : '#0a0e15',
    backgroundMaterial: mica ? 'mica' : undefined,
    transparent: mica,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  const entry = rendererEntry();
  if (entry.url) await mainWindow.loadURL(entry.url);
  else if (entry.file) await mainWindow.loadFile(entry.file);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const ALIZIA_SIZE = { width: 460, height: 520 };

function defaultPositionFor(mode: AliziaMode): { x: number; y: number } | undefined {
  if (!mainWindow || mainWindow.isDestroyed()) return undefined;
  const bounds = mainWindow.getBounds();
  const cx = Math.round(bounds.x + bounds.width / 2 - ALIZIA_SIZE.width / 2);
  const cy = Math.round(bounds.y + bounds.height / 2 - ALIZIA_SIZE.height / 2);
  const offset = mode === 'pression' ? 40 : -40;
  return { x: cx + offset, y: cy + offset };
}

async function createAliziaWindow(mode: AliziaMode): Promise<void> {
  const existing = aliziaWindows[mode];
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return;
  }

  const icon = resolveIcon();
  const pos = defaultPositionFor(mode);

  const win = new BrowserWindow({
    width: ALIZIA_SIZE.width,
    height: ALIZIA_SIZE.height,
    minWidth: ALIZIA_SIZE.width,
    minHeight: ALIZIA_SIZE.height,
    maxWidth: ALIZIA_SIZE.width,
    maxHeight: ALIZIA_SIZE.height,
    x: pos?.x,
    y: pos?.y,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: false,
    icon,
    title: mode === 'vent' ? 'ALIZIA 0330 Vent - WxDeck' : 'ALIZIA 0330 Pression - WxDeck',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  win.setMenuBarVisibility(false);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  aliziaWindows[mode] = win;

  win.once('ready-to-show', () => {
    win.show();
    win.setAlwaysOnTop(true, 'screen-saver');
  });

  const entry = rendererEntry();
  const hashFragment = mode === 'vent' ? '#alizia-vent' : '#alizia-pression';
  if (entry.url) {
    await win.loadURL(entry.url + hashFragment);
  } else if (entry.file) {
    await win.loadFile(entry.file, { hash: hashFragment.slice(1) });
  }

  win.on('closed', () => {
    aliziaWindows[mode] = null;
    broadcastAliziaState(mode, false);
  });
}

function broadcastAliziaState(mode: AliziaMode, open: boolean): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.ALIZIA_STATE_CHANGED, mode, open);
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());
  ipcMain.handle(IPC.SET_SETTINGS, (_e, patch) => {
    const next = patchSettings(patch);
    applyAuroraEndpoint(next.auroraHost, next.auroraPort);
    refreshTimers();
    return next;
  });
  ipcMain.handle(IPC.GET_LIVE_STATE, () => getLiveState());
  ipcMain.handle(IPC.TRIGGER_UPDATE_CHECK, () => checkForUpdates());
  ipcMain.handle(IPC.INSTALL_UPDATE, () => installUpdateNow());
  ipcMain.handle(IPC.OPEN_EXTERNAL, (_e, url: string) => shell.openExternal(url));

  ipcMain.on(IPC.QUIT, () => app.quit());

  ipcMain.on(IPC.WINDOW_MIN, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });
  ipcMain.on(IPC.WINDOW_MAX, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on(IPC.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  ipcMain.handle(IPC.ALIZIA_TOGGLE, async (_e, mode: AliziaMode) => {
    const existing = aliziaWindows[mode];
    if (existing && !existing.isDestroyed()) {
      existing.close();
      return false;
    }
    await createAliziaWindow(mode);
    broadcastAliziaState(mode, true);
    return true;
  });
  ipcMain.handle(IPC.ALIZIA_IS_OPEN, (_e, mode: AliziaMode) => {
    const w = aliziaWindows[mode];
    return !!(w && !w.isDestroyed());
  });
  ipcMain.handle(IPC.ALIZIA_SET_ALWAYS_ON_TOP, (_e, mode: AliziaMode, onTop: boolean) => {
    const w = aliziaWindows[mode];
    if (!w || w.isDestroyed()) return false;
    w.setAlwaysOnTop(onTop, onTop ? 'screen-saver' : 'normal');
    return w.isAlwaysOnTop();
  });
  ipcMain.handle(IPC.ALIZIA_GET_ALWAYS_ON_TOP, (_e, mode: AliziaMode) => {
    const w = aliziaWindows[mode];
    if (!w || w.isDestroyed()) return false;
    return w.isAlwaysOnTop();
  });
}

app.whenReady().then(async () => {
  registerIpc();
  await createMainWindow();
  startOrchestrator();
  initUpdater();
  if (!process.env.VITE_DEV_SERVER_URL) {
    setTimeout(() => checkForUpdates(), 10000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

void fileURLToPath;
