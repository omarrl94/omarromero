// Sonidos táctiles sintetizados con WebAudio (sin archivos): opcionales y discretos.
let ctx = null;
let enabled = true;
let keysEnabled = false;

export function configureSound({ sound, keys }) {
  enabled = !!sound;
  keysEnabled = !!keys;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.05, at = 0, slide = 0 } = {}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const SOUNDS = {
  key: () => tone(1800 + Math.random() * 400, 0.025, { type: 'square', vol: 0.008 }),
  click: () => tone(900, 0.05, { type: 'triangle', vol: 0.03 }),
  run: () => { tone(420, 0.09, { type: 'triangle', vol: 0.03, slide: 380 }); },
  error: () => { tone(140, 0.22, { type: 'sawtooth', vol: 0.03, slide: -60 }); tone(95, 0.25, { type: 'square', vol: 0.015, at: 0.05 }); },
  pass: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.035, at: i * 0.07 })); },
  xp: () => { [880, 1175].forEach((f, i) => tone(f, 0.09, { type: 'square', vol: 0.02, at: i * 0.06 })); },
  rankup: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.04, at: i * 0.09 })); },
  duck: () => { tone(620, 0.08, { type: 'square', vol: 0.02, slide: -200 }); tone(560, 0.1, { type: 'square', vol: 0.02, at: 0.09, slide: -220 }); },
  glitch: () => tone(60 + Math.random() * 80, 0.12, { type: 'sawtooth', vol: 0.02, slide: 300 }),
};

export function play(name) {
  if (!enabled) return;
  if (name === 'key' && !keysEnabled) return;
  try {
    SOUNDS[name] && SOUNDS[name]();
  } catch {
    /* audio no disponible */
  }
}
