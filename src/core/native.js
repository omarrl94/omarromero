// Capa nativa (app de Android con Capacitor). En la web todo esto no hace nada:
// el mismo código sirve para la página de Netlify y para la app de Google Play.
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

// ───────────── Botón «atrás» de Android ─────────────
// Cada pantalla o ventana registra qué hacer al pulsar «atrás». Gana el manejador activo
// de mayor prioridad (ventanas > pantallas) y, a igual prioridad, el último registrado.
// Si ninguno está activo, la app se minimiza como cualquier juego.
export const BACK = { screen: 1, modal: 2 };
const handlers = [];
let seq = 0;

function runBack() {
  const live = handlers.filter((h) => h.ref.current.active);
  if (!live.length) { App.minimizeApp(); return; }
  live.sort((a, b) => b.priority - a.priority || b.order - a.order);
  live[0].ref.current.fn();
}

/** Registra qué hacer al pulsar «atrás» mientras `active` sea true. */
export function useBackHandler(fn, active = true, priority = BACK.modal) {
  const ref = useRef({ fn, active });
  ref.current = { fn, active };
  useEffect(() => {
    const entry = { ref, priority, order: ++seq };
    handlers.push(entry);
    return () => { const i = handlers.indexOf(entry); if (i >= 0) handlers.splice(i, 1); };
  }, [priority]);
}

// ───────────── Teclado en pantalla ─────────────
// Con el teclado abierto se esconden las barras inferiores para dejar sitio al código.
function setKeyboard(open) {
  document.documentElement.classList.toggle('kb-open', open);
}

function watchWebKeyboard() {
  const vv = window.visualViewport;
  if (!vv) return;
  const check = () => {
    const el = document.activeElement;
    const typing = el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
    setKeyboard(!!typing && window.innerHeight - vv.height > 150);
  };
  vv.addEventListener('resize', check);
  window.addEventListener('focusout', () => setTimeout(check, 50));
}

// ───────────── Vibración ─────────────
const HAPTIC = {
  pass: () => Haptics.notification({ type: NotificationType.Success }),
  rankup: () => Haptics.notification({ type: NotificationType.Success }),
  error: () => Haptics.notification({ type: NotificationType.Error }),
  xp: () => Haptics.impact({ style: ImpactStyle.Medium }),
  run: () => Haptics.impact({ style: ImpactStyle.Light }),
};

/** Vibración corta para los momentos clave del juego (solo en la app). */
export function haptic(name) {
  if (!isNative || !HAPTIC[name]) return;
  HAPTIC[name]().catch(() => {});
}

/** Arranque de la parte nativa: barra de estado, «atrás», teclado y pantalla de inicio. */
export function initNative() {
  if (!isNative) {
    watchWebKeyboard();
    return;
  }
  document.documentElement.classList.add('native');
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#05060a' }).catch(() => {});
  App.addListener('backButton', runBack);
  Keyboard.addListener('keyboardWillShow', () => setKeyboard(true));
  Keyboard.addListener('keyboardWillHide', () => setKeyboard(false));
}

/** Se llama cuando la interfaz ya está pintada: oculta la pantalla de arranque. */
export function appReady() {
  if (isNative) SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
}
