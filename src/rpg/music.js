// Banda sonora chiptune generada en tiempo real con WebAudio (sin archivos de audio).
// Cada pista es una melodía y un bajo en corcheas; «-» es silencio y «.» alarga la nota anterior.

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const freq = (n) => {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  return 440 * 2 ** ((NOTE[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12);
};

const TRACKS = {
  title: {
    bpm: 112,
    lead: 'E5 . G5 . A5 . B5 . A5 . G5 . E5 . . . D5 . E5 . G5 . A5 . G5 . E5 . D5 . . . C5 . D5 . E5 . G5 . A5 . B5 . D6 . . . B5 . A5 . G5 . A5 . . . . . . .',
    bass: 'A2 - A3 - A2 - A3 - F2 - F3 - F2 - F3 - C3 - C4 - C3 - C4 - G2 - G3 - G2 - G3 - A2 - A3 - A2 - A3 - F2 - F3 - F2 - F3 - G2 - G3 - G2 - G3 - A2 - A3 - E3 - A2 -',
  },
  town: {
    bpm: 104,
    lead: 'C5 . E5 . G5 . E5 . F5 . A5 . G5 . . . E5 . D5 . C5 . D5 . E5 . . . D5 . . . C5 . E5 . G5 . C6 . B5 . A5 . G5 . . . F5 . E5 . D5 . E5 . C5 . . . . . . .',
    bass: 'C3 - G3 - C3 - G3 - F2 - C3 - F2 - C3 - C3 - G3 - C3 - G3 - G2 - D3 - G2 - D3 - A2 - E3 - A2 - E3 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - B2 - C3 - G2 - C3 - -',
  },
  route: {
    bpm: 132,
    lead: 'G4 . B4 . D5 . G5 . F#5 . D5 . E5 . . . D5 . B4 . C5 . D5 . . . B4 . G4 . A4 . B4 . C5 . D5 . E5 . F#5 . G5 . . . F#5 . E5 . D5 . . . B4 . A4 . G4 . . . . .',
    bass: 'G2 G3 G2 G3 D2 D3 D2 D3 E2 E3 E2 E3 C2 C3 D2 D3 G2 G3 G2 G3 D2 D3 D2 D3 C2 C3 C2 C3 D2 D3 D2 D3 E2 E3 E2 E3 C2 C3 C2 C3 D2 D3 D2 D3 G2 G3 G2 -',
  },
  battle: {
    bpm: 168,
    lead: 'A4 A4 C5 A4 E5 . D5 C5 A4 A4 C5 A4 F5 . E5 D5 A4 A4 C5 A4 G5 . F5 E5 D5 . E5 . C5 . B4 . A4 A4 C5 A4 E5 . D5 C5 B4 B4 D5 B4 F5 . E5 D5 C5 . E5 . A5 . G5 . F5 . E5 . D5 . E5 .',
    bass: 'A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 F2 F3 F2 F3 F2 F3 G2 G3 G2 G3 G2 G3 G2 G3 E2 E3 E2 E3 E2 E3 E2 E3 A2 A3 A2 A3 A2 A3 A2 A3 D2 D3 D2 D3 D2 D3 D2 D3 F2 F3 F2 F3 G2 G3 G2 G3 E2 E3 E2 E3 E2 E3 G#2 G#3',
  },
  boss: {
    bpm: 176,
    lead: 'D5 . D5 F5 D5 . C5 . D5 . D5 G5 D5 . A#4 . D5 . D5 F5 D5 . C5 . A5 . G5 . F5 . E5 . D5 . D5 F5 D5 . C5 . D5 . D5 A5 D5 . A#4 . A4 . C#5 . E5 . G5 . A5 . . . . . . .',
    bass: 'D2 D2 D3 D2 D2 D3 D2 D3 A#1 A#1 A#2 A#1 A#1 A#2 A#1 A#2 C2 C2 C3 C2 C2 C3 C2 C3 A1 A1 A2 A1 A1 A2 C#2 E2 D2 D2 D3 D2 D2 D3 D2 D3 A#1 A#1 A#2 A#1 A#1 A#2 A#1 A#2 A1 A1 A2 A1 A1 A2 A1 A2 A1 A2 A1 A2 C#2 E2 G2 A2',
  },
  victory: {
    bpm: 140,
    lead: 'C5 E5 G5 C6 . . G5 . A5 . B5 . C6 . . . E5 G5 C6 E6 . . D6 . C6 . B5 . C6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .',
    bass: 'C3 - C3 - C3 - C3 - F2 - F2 - G2 - G2 - C3 - C3 - C3 - C3 - G2 - G2 - C3 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
  },
};

const parse = (s) => s.split(/\s+/).filter(Boolean);

let ctx = null;
let master = null;
let current = null;
let timer = null;
let step = 0;
let nextTime = 0;
let enabled = true;

function ensure() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.06;
  master.connect(ctx.destination);
  return ctx;
}

function voice(f, t, dur, type, vol) {
  if (!f) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function schedule() {
  const tr = TRACKS[current];
  if (!tr || !ctx) return;
  const lead = tr.leadP || (tr.leadP = parse(tr.lead));
  const bass = tr.bassP || (tr.bassP = parse(tr.bass));
  const len = Math.max(lead.length, bass.length);
  const sixteenth = 60 / tr.bpm / 2;
  while (nextTime < ctx.currentTime + 0.25) {
    const i = step % len;
    const n = lead[i % lead.length];
    if (n && n !== '-' && n !== '.') {
      let d = 1;
      while (lead[(i + d) % lead.length] === '.' && d < 8) d++;
      voice(freq(n), nextTime, sixteenth * d * 0.95, 'square', 0.32);
    }
    const b = bass[i % bass.length];
    if (b && b !== '-' && b !== '.') voice(freq(b), nextTime, sixteenth * 0.9, 'triangle', 0.55);
    nextTime += sixteenth;
    step++;
    if (current === 'victory' && step >= len) { stopMusic(); return; }
  }
}

export function playMusic(name) {
  if (name === current) return;
  current = name;
  if (!enabled || !name) { clearInterval(timer); timer = null; return; }
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  step = 0;
  nextTime = ctx.currentTime + 0.05;
  clearInterval(timer);
  timer = setInterval(schedule, 60);
  schedule();
}

export function stopMusic() {
  clearInterval(timer);
  timer = null;
  current = null;
}

export function setMusicEnabled(on) {
  enabled = on;
  if (!on) stopMusic();
}
