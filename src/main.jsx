import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initNative, isNative } from './core/native.js';

initNative();

// Web: el service worker guarda el juego para que funcione sin conexión (en la app ya va dentro).
if (import.meta.env.PROD && !isNative && 'serviceWorker' in navigator && window.isSecureContext && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then((reg) => {
      const send = () => reg.active && reg.active.postMessage({ type: 'precache', urls: [location.href.split('#')[0], ...performance.getEntriesByType('resource').map((r) => r.name)] });
      send();
      setTimeout(send, 8000); // incluye lo precargado en segundo plano (la arena)
    }).catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
