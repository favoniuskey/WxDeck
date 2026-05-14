import { useCallback, useEffect, useState } from 'react';
import type { UserSettings } from '@shared/types';
import { api } from '../lib/api';

export function useSettings(): {
  settings: UserSettings | null;
  update: (patch: Partial<UserSettings>) => Promise<void>;
  reload: () => Promise<void>;
} {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const reload = useCallback(async () => {
    const s = await api.getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = useCallback(async (patch: Partial<UserSettings>) => {
    const next = await api.setSettings(patch);
    setSettings(next);
  }, []);

  return { settings, update, reload };
}
