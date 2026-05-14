import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AliziaApp } from './AliziaApp';
import './index.css';

const kind = window.wxdeck?.windowKind ?? 'main';
const isAlizia = kind === 'alizia-vent' || kind === 'alizia-pression';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAlizia ? <AliziaApp /> : <App />}
  </StrictMode>
);
