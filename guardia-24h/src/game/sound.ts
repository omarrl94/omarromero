// Sonidos sintetizados discretos (sin ficheros). Se pueden silenciar; la preferencia se guarda en el dispositivo.
let ctx: AudioContext | null = null;
const KEY = 'g24-mute';
export const estaSilenciado = (): boolean => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export function silenciar(v: boolean) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sin almacenamiento */ } }
function tono(freq: number, dur: number, inicio = 0, tipo: OscillatorType = 'sine', vol = 0.04) {
  if (estaSilenciado() || typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.value = freq;
  const t = ctx.currentTime + inicio;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur);
}
export const sonidoOk = () => { tono(660, 0.1); tono(880, 0.14, 0.09); };
export const sonidoFallo = () => tono(180, 0.25, 0, 'triangle');
export const sonidoClick = () => tono(500, 0.04, 0, 'sine', 0.025);
export const sonidoVictoria = () => [523, 659, 784].forEach((f, i) => tono(f, 0.18, i * 0.1));
