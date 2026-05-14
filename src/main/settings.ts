import Store from 'electron-store';
import type { UserSettings } from '@shared/types';

const defaults: UserSettings = {
  auroraHost: '127.0.0.1',
  auroraPort: 1130,
  pollIntervalMs: 15000,
  weatherIntervalMs: 60000,
  acceptedDisclaimer: false,
  aliziaTutorialSeen: false,
  theme: 'mica'
};

const store = new Store<UserSettings>({
  name: 'wxdeck-settings',
  defaults
});

export function getSettings(): UserSettings {
  return store.store as UserSettings;
}

export function patchSettings(patch: Partial<UserSettings>): UserSettings {
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    (store as any).set(k, v);
  }
  return getSettings();
}
