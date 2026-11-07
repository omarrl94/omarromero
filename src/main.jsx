import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from './rpg/Game.jsx';
import './index.css';
import { initNative } from './core/native.js';

initNative();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
);
