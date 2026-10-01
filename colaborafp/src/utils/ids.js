import { PIN_LENGTH } from './constants';

export const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/** PIN numérico de 6 dígitos, sin ceros a la izquierda para leerlo fácil en la pizarra. */
export const generatePin = () => {
  const min = 10 ** (PIN_LENGTH - 1);
  return String(Math.floor(min + Math.random() * 9 * min));
};

export const normalizePin = (raw) => String(raw ?? '').replace(/\D/g, '').slice(0, PIN_LENGTH);

export const formatPin = (pin) => (pin ? `${pin.slice(0, 3)} ${pin.slice(3)}` : '');
