/** Sonidos opcionales (WebAudio). Nunca fallan si el navegador no los permite. */
let ctx: AudioContext | null = null;
export function beep(freq = 880, ms = 120, type: OscillatorType = 'square', vol = 0.05) {
  try {
    ctx ??= new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + ms / 1000);
  } catch { /* sin audio */ }
}

/** Estallido: ráfaga de ruido con caída rápida y golpe grave. */
export function boomSound() {
  try {
    ctx ??= new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const dur = 0.7, n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = ctx.createBufferSource(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1800; g.gain.value = 0.5;
    src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start();
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.setValueAtTime(140, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.4);
    og.gain.setValueAtTime(0.35, ctx.currentTime); og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    o.connect(og); og.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.5);
  } catch { /* sin audio */ }
}
