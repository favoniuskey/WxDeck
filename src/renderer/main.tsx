import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AliziaApp } from './AliziaApp';
import './index.css';

const kind = window.wxdeck?.windowKind ?? 'main';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {kind === 'alizia' ? <AliziaApp /> : <App />}
  </StrictMode>
);
