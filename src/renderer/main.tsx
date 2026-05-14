import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AliziaApp } from './AliziaApp';
import { DockApp } from './DockApp';
import './index.css';

const kind = window.wxdeck?.windowKind ?? 'main';
const isAlizia = kind === 'alizia-vent' || kind === 'alizia-pression';
const isDock = kind === 'dock-wind' || kind === 'dock-atis' || kind === 'dock-raw';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAlizia ? <AliziaApp /> : isDock ? <DockApp /> : <App />}
  </StrictMode>
);
