export const IPC = {
  GET_SETTINGS: 'wxdeck:get-settings',
  SET_SETTINGS: 'wxdeck:set-settings',
  GET_LIVE_STATE: 'wxdeck:get-live-state',
  LIVE_UPDATE: 'wxdeck:live-update',
  UPDATE_EVENT: 'wxdeck:update-event',
  TRIGGER_UPDATE_CHECK: 'wxdeck:trigger-update-check',
  INSTALL_UPDATE: 'wxdeck:install-update',
  OPEN_EXTERNAL: 'wxdeck:open-external',
  QUIT: 'wxdeck:quit',
  WINDOW_MIN: 'wxdeck:win-min',
  WINDOW_MAX: 'wxdeck:win-max',
  WINDOW_CLOSE: 'wxdeck:win-close',
  ALIZIA_TOGGLE: 'wxdeck:alizia-toggle',
  ALIZIA_STATE_CHANGED: 'wxdeck:alizia-state-changed',
  ALIZIA_IS_OPEN: 'wxdeck:alizia-is-open',
  ALIZIA_SET_ALWAYS_ON_TOP: 'wxdeck:alizia-set-on-top'
} as const;
