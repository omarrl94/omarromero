// Misión 5 · Descenso de gradiente: una bola rueda por el paisaje del error.
import { h, makeCanvas, slider } from '../ui.js';
import { LANDSCAPES, gdRun } from '../ml.js';

const W = 600, H = 300;
const LV = [
  { land: 0, goal: 'Llega al fondo (|x| < 0.05)', ok: (x) => Math.abs(x) < 0.05, star: [8, 16, 40], max: 60 },
  { land: 1, goal: 'Valle estrecho: llega al fondo SIN divergir', ok: (x) => Math.abs(x) < 0.05, star: [8, 18, 40], max: 60 },
  { land: 2, goal: 'Escapa del valle falso y llega al mínimo GLOBAL (x ≈ −1.7)', ok: (x) => Math.abs(x + 1.7) < 0.15, star: [30, 55, 90], max: 120, mom: true },
];

export default {
  id: 5, title: 'La bola y el valle', icon: '⛰️', lesson: 5, color: '#9d7bff',
  blurb: 'Ajusta la tasa de aprendizaje y el momentum para que la bola llegue al mínimo del error sin explotar.',
  levels: [{ name: 'Valle liso', desc: 'Tasa de aprendizaje' }, { name: 'Valle estrecho', desc: 'Cuidado: divergencia' }, { name: 'Montañas con trampa', desc: 'Momentum' }],
  mount(root, li, api) {
    const L = LV[li], land = LANDSCAPES[L.land];
    const { cv, c } = makeCanvas(W, H);
    let lr = 0.02, mom = 0, anim = null;
    const sx = (x) => ((x - land.xmin) / (land.xmax - land.xmin)) * W;
    const ymax = Math.max(...Array.from({ length: 100 }, (_, i) => land.f(land.xmin + ((land.xmax - land.xmin) * i) / 99)));
    const ymin = Math.min(...Array.from({ length: 100 }, (_, i) => land.f(land.xmin + ((land.xmax - land.xmin) * i) / 99)));
    const sy = (v) => H - 24 - ((Math.min(Math.max(v, ymin - 1), ymax + 3) - ymin) / (ymax + 3 - ymin)) * (H - 56);
    const info = h('div.stat'), msg = h('div');
    function base(path, upto) {
      c.clearRect(0, 0, W, H);
      c.beginPath(); for (let i = 0; i <= 200; i++) { const x = land.xmin + ((land.xmax - land.xmin) * i) / 200; i ? c.lineTo(sx(x), sy(land.f(x))) : c.moveTo(sx(x), sy(land.f(x))); }
      c.strokeStyle = '#22e4ff'; c.lineWidth = 3; c.stroke();
      c.lineTo(W, H); c.lineTo(0, H); c.fillStyle = 'rgba(34,228,255,.07)'; c.fill();
      if (L.land === 2) { c.fillStyle = '#a3ff3d'; c.fillText('★ global', sx(-1.7) - 20, sy(land.f(-1.7)) + 22); c.fillStyle = '#ff4767'; c.fillText('valle falso', sx(1.6) - 28, sy(land.f(1.6)) + 22); }
      if (path) {
        c.strokeStyle = 'rgba(255,61,240,.5)'; c.lineWidth = 1.5; c.beginPath();
        for (let i = 0; i <= upto; i++) { const x = Math.max(land.xmin, Math.min(land.xmax, path[i])); i ? c.lineTo(sx(x), sy(land.f(x))) : c.moveTo(sx(x), sy(land.f(x))); } c.stroke();
        const x = Math.max(land.xmin, Math.min(land.xmax, path[upto]));
        c.fillStyle = '#ff3df0'; c.shadowColor = '#ff3df0'; c.shadowBlur = 14; c.beginPath(); c.arc(sx(x), sy(land.f(x)) - 8, 9, 0, 7); c.fill(); c.shadowBlur = 0;
      } else { c.fillStyle = '#ff3df0'; c.beginPath(); c.arc(sx(land.start), sy(land.f(land.start)) - 8, 9, 0, 7); c.fill(); }
    }
    base();
    const run = () => {
      cancelAnimationFrame(anim); msg.replaceChildren();
      const path = gdRun(land, lr, L.max, mom);
      let i = 0, last = 0;
      const tick = (t) => {
        if (t - last > 70) { last = t; base(path, i); info.replaceChildren(h('div', h('b', i), 'pasos'), h('div', h('b', Math.abs(path[i]) > 1e5 ? '💥' : land.f(path[i]).toFixed(3)), 'error (pérdida)'), h('div', h('b', Math.abs(path[i]) > 1e5 ? '∞' : path[i].toFixed(2)), 'posición x')); if (i >= path.length - 1) return end(path); i++; }
        anim = requestAnimationFrame(tick);
      };
      anim = requestAnimationFrame(tick);
    };
    function end(path) {
      const diverged = Math.abs(path.at(-1)) > 1e5 || (path.length > 8 && Math.abs(path.at(-1)) > Math.abs(path[0]) * 3);
      const first = path.findIndex((x) => L.ok(x));
      if (diverged) { msg.replaceChildren(h('p.rd', '💥 ¡Divergió! La tasa de aprendizaje es tan grande que cada paso se pasa del fondo y aterriza más arriba. Bájala.')); return api.sfx('bad'); }
      if (first < 0) { msg.replaceChildren(h('p.am', L.land === 2 ? 'Se quedó en un valle falso (mínimo local) o no llegó a tiempo. ¡Prueba con momentum!' : `No llegó en ${L.max} pasos. Sube la tasa de aprendizaje (pero sin pasarte).`)); return api.sfx('bad'); }
      const s = first <= L.star[0] ? 3 : first <= L.star[1] ? 2 : 1;
      api.win(s, `Llegaste en ${first} pasos (tasa ${lr.toFixed(3)}${mom ? `, momentum ${mom.toFixed(2)}` : ''}).`);
    }
    const s1 = slider('Tasa de aprendizaje', 0.01, 1.2, 0.01, lr, (v) => { lr = v; }, (v) => v.toFixed(2));
    const s2 = slider('Momentum', 0, 0.95, 0.05, mom, (v) => { mom = v; }, (v) => v.toFixed(2));
    root.append(h('div.two', h('div', cv), h('div', h('div.goal', h('b', 'Objetivo: '), L.goal, h('br'), h('span.sm.mut', `Más rápido = más estrellas. Máx. ${L.max} pasos.`)), s1.el, L.mom ? s2.el : h('p.sm.mut', 'El momentum se desbloquea en el nivel 3.'), info, h('button.btn.l', { onclick: run }, '⚽ ¡Rodar!'), msg)));
    return () => cancelAnimationFrame(anim);
  },
};
