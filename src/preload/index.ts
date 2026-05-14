import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/channels';
import type { UserSettings, LiveState, UpdateEvent, WxDeckApi, WindowKind, AliziaMode } from '@shared/types';

const hash = typeof window !== 'undefined' ? window.location.hash : '';
const windowKind: WindowKind =
  hash === '#alizia-vent' ? 'alizia-vent' : hash === '#alizia-pression' ? 'alizia-pression' : 'main';

const api: WxDeckApi = {
  windowKind,
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  setSettings: (patch: Partial<UserSettings>) => ipcRenderer.invoke(IPC.SET_SETTINGS, patch),
  getLiveState: () => ipcRenderer.invoke(IPC.GET_LIVE_STATE),
  onLiveUpdate: (cb: (s: LiveState) => void) => {
    const listener = (_: unknown, payload: LiveState) => cb(payload);
    ipcRenderer.on(IPC.LIVE_UPDATE, listener);
    return () => ipcRenderer.off(IPC.LIVE_UPDATE, listener);
  },
  onUpdateEvent: (cb: (evt: UpdateEvent) => void) => {
    const listener = (_: unknown, payload: UpdateEvent) => cb(payload);
    ipcRenderer.on(IPC.UPDATE_EVENT, listener);
    return () => ipcRenderer.off(IPC.UPDATE_EVENT, listener);
  },
  triggerUpdateCheck: () => ipcRenderer.invoke(IPC.TRIGGER_UPDATE_CHECK),
  installUpdate: () => ipcRenderer.invoke(IPC.INSTALL_UPDATE),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  quit: () => ipcRenderer.send(IPC.QUIT),
  windowMinimize: () => ipcRenderer.send(IPC.WINDOW_MIN),
  windowMaximizeToggle: () => ipcRenderer.send(IPC.WINDOW_MAX),
  windowClose: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
  aliziaToggle: (mode: AliziaMode) => ipcRenderer.invoke(IPC.ALIZIA_TOGGLE, mode),
  aliziaIsOpen: (mode: AliziaMode) => ipcRenderer.invoke(IPC.ALIZIA_IS_OPEN, mode),
  aliziaSetAlwaysOnTop: (mode: AliziaMode, onTop: boolean) =>
    ipcRenderer.invoke(IPC.ALIZIA_SET_ALWAYS_ON_TOP, mode, onTop),
  aliziaGetAlwaysOnTop: (mode: AliziaMode) => ipcRenderer.invoke(IPC.ALIZIA_GET_ALWAYS_ON_TOP, mode),
  onAliziaStateChange: (cb: (mode: AliziaMode, open: boolean) => void) => {
    const listener = (_: unknown, mode: AliziaMode, open: boolean) => cb(mode, open);
    ipcRenderer.on(IPC.ALIZIA_STATE_CHANGED, listener);
    return () => ipcRenderer.off(IPC.ALIZIA_STATE_CHANGED, listener);
  },
  auroraDiagnose: () => ipcRenderer.invoke(IPC.AURORA_DIAGNOSE),
  auroraAutoFix: (scope: 'active' | 'all') => ipcRenderer.invoke(IPC.AURORA_AUTO_FIX, scope),
  auroraPickInstallPath: () => ipcRenderer.invoke(IPC.AURORA_PICK_PATH)
};

contextBridge.exposeInMainWorld('wxdeck', api);
