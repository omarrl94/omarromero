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
