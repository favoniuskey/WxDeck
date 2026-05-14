import { useEffect, useState } from 'react';
import type { LiveState } from '@shared/types';
import { api } from '../lib/api';

export function useLiveData(): LiveState | null {
  const [state, setState] = useState<LiveState | null>(null);
  useEffect(() => {
    let mounted = true;
    api.getLiveState().then((s) => {
      if (mounted) setState(s);
    });
    const off = api.onLiveUpdate((s) => {
      if (mounted) setState(s);
    });
    return () => {
      mounted = false;
      off();
    };
  }, []);
  return state;
}
