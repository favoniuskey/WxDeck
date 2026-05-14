export type AtcRank =
  | 'DEL'
  | 'GND'
  | 'TWR'
  | 'APP'
  | 'DEP'
  | 'CTR'
  | 'FSS'
  | 'OBS'
  | 'UNKNOWN';

export interface AtcSession {
  callsign: string;
  icao: string;
  rank: AtcRank;
  frequency?: string;
  online: boolean;
  connectedAt?: string;
}

export interface MetarReport {
  station: string;
  rawText: string;
  time: string;
  wind: {
    direction: number | 'VRB';
    speed: number;
    gust?: number;
    unit: string;
  };
  visibility?: { value: number; unit: string; repr: string };
  altimeter: { hPa: number; inHg: number; repr: string };
  temperature?: number;
  dewpoint?: number;
  flightRules?: string;
  clouds?: Array<{ type: string; altitude: number | null; repr: string }>;
  wxCodes?: string[];
}

export interface TafReport {
  station: string;
  rawText: string;
  time: string;
}

export interface AuroraAtis {
  infoLetter: string;
  icao: string;
  arrRunways: string[];
  depRunways: string[];
  transAlt?: string;
  transLvl?: string;
}

export interface RunwayDef {
  id: string;
  heading: number;
  lengthFt?: number;
  surface?: 'asphalt' | 'concrete' | 'grass' | 'other';
  ils?: boolean;
}

export interface RunwayConfiguration {
  name: string;
  arrRunways: string[];
  depRunways: string[];
  windFrom: number;
  windTo: number;
  minSpeed?: number;
  priority?: number;
  timeWindow?: string | null;
  timeWindowTz?: string | null;
  conditions?: string[];
  notes?: string;
}

export interface AirportProfile {
  icao: string;
  name: string;
  region: 'metro' | 'dom-tom';
  transitionAltitude: number;
  transitionLevels: Array<{ minQnh: number; maxQnh: number; flightLevel: number }>;
  runways: RunwayDef[] | string[];
  configurations?: RunwayConfiguration[];
  specialNotes?: string[];
  sources?: string[];
  preferredRunwaySets?: Array<{
    name: string;
    runways: string[];
    windFrom: number;
    windTo: number;
    minSpeed?: number;
  }>;
}

export interface UserSettings {
  vid?: string;
  auroraHost: string;
  auroraPort: number;
  pollIntervalMs: number;
  weatherIntervalMs: number;
  acceptedDisclaimer: boolean;
  aliziaTutorialSeen: boolean;
  auroraGuideDismissed: boolean;
  theme: 'mica' | 'acrylic' | 'flat';
}

export interface ExpectedConfig {
  name: string;
  arrRunways: string[];
  depRunways: string[];
  headingDeg: number | null;
  windComponents: { headwind: number; crosswind: number; tailwind: number; crossFromLeft?: boolean };
}

export interface LiveState {
  session: AtcSession | null;
  airport: AirportProfile | null;
  metar: MetarReport | null;
  taf: TafReport | null;
  atis: AuroraAtis | null;
  warnings: AtisWarning[];
  expectedConfig: ExpectedConfig | null;
  lastUpdate: string;
  auroraConnected: boolean;
  whazzupOk: boolean;
}

export interface AtisWarning {
  kind: 'runway' | 'tfl' | 'session';
  level: 'info' | 'warn' | 'error';
  message: string;
  expected?: string;
  actual?: string;
}

export type AliziaMode = 'vent' | 'pression';
export type WindowKind = 'main' | 'alizia-vent' | 'alizia-pression';

export interface WxDeckApi {
  windowKind: WindowKind;
  getSettings: () => Promise<UserSettings>;
  setSettings: (patch: Partial<UserSettings>) => Promise<UserSettings>;
  getLiveState: () => Promise<LiveState>;
  onLiveUpdate: (cb: (state: LiveState) => void) => () => void;
  onUpdateEvent: (cb: (evt: UpdateEvent) => void) => () => void;
  triggerUpdateCheck: () => Promise<void>;
  installUpdate: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  quit: () => void;
  windowMinimize: () => void;
  windowMaximizeToggle: () => void;
  windowClose: () => void;
  aliziaToggle: (mode: AliziaMode) => Promise<boolean>;
  aliziaIsOpen: (mode: AliziaMode) => Promise<boolean>;
  aliziaSetAlwaysOnTop: (mode: AliziaMode, onTop: boolean) => Promise<boolean>;
  aliziaGetAlwaysOnTop: (mode: AliziaMode) => Promise<boolean>;
  onAliziaStateChange: (cb: (mode: AliziaMode, open: boolean) => void) => () => void;
}

export type UpdateEvent =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available' }
  | { type: 'progress'; percent: number; bytesPerSecond: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string };
