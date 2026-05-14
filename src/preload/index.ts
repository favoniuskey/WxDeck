import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/channels';
import type { UserSettings, LiveState, UpdateEvent, WxDeckApi, WindowKind } from '@shared/types';

const hash = typeof window !== 'undefined' ? window.location.hash : '';
const windowKind: WindowKind = hash === '#alizia' ? 'alizia' : 'main';

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
  aliziaToggle: () => ipcRenderer.invoke(IPC.ALIZIA_TOGGLE),
  aliziaIsOpen: () => ipcRenderer.invoke(IPC.ALIZIA_IS_OPEN),
  aliziaSetAlwaysOnTop: (onTop: boolean) => ipcRenderer.invoke(IPC.ALIZIA_SET_ALWAYS_ON_TOP, onTop),
  onAliziaStateChange: (cb: (open: boolean) => void) => {
    const listener = (_: unknown, open: boolean) => cb(open);
    ipcRenderer.on(IPC.ALIZIA_STATE_CHANGED, listener);
    return () => ipcRenderer.off(IPC.ALIZIA_STATE_CHANGED, listener);
  }
};

contextBridge.exposeInMainWorld('wxdeck', api);
