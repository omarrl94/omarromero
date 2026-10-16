import { PIN_ALPHABET, PIN_LENGTH } from './constants';

export const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/** PIN alfanumérico de 6 caracteres con generador criptográfico (no enumerable en la práctica). */
export const generatePin = () => {
  const bytes = new Uint8Array(PIN_LENGTH * 2);
  globalThis.crypto.getRandomValues(bytes);
  let pin = '';
  for (const b of bytes) {
    if (b >= 248) continue; // 248 = 8 × 31: evita sesgo de módulo
    pin += PIN_ALPHABET[b % PIN_ALPHABET.length];
    if (pin.length === PIN_LENGTH) return pin;
  }
  return generatePin();
};

/** Acepta minúsculas, espacios y guiones: solo conserva caracteres del alfabeto del PIN. */
export const normalizePin = (raw) =>
  String(raw ?? '')
    .toUpperCase()
    .split('')
    .filter((c) => PIN_ALPHABET.includes(c))
    .join('')
    .slice(0, PIN_LENGTH);

export const formatPin = (pin) => (pin ? `${pin.slice(0, 3)} ${pin.slice(3)}` : '');
