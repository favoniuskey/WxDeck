import type { WxDeckApi } from '@shared/types';

declare global {
  interface Window {
    wxdeck: WxDeckApi;
  }
}

export const api = window.wxdeck;
