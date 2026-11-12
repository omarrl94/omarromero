import { h, $, starsEl, beep, toggleSound, toast, confetti, modal, say, hideNeo } from './ui.js';
import * as S from './store.js';
import { LESSONS, widget } from './lessons.js';
import { CODEX } from './codex.js';
import m1 from './games/m1-classify.js';
import m2 from './games/m2-clean.js';
import m3 from './games/m3-kmeans.js';
import m4 from './games/m4-knn.js';
import m5 from './games/m5-gradient.js';
import m6 from './games/m6-neuron.js';
import m7 from './games/m7-overfit.js';
import m8 from './games/m8-llm.js';
import m9 from './games/m9-bias.js';
import m10 from './games/m10-play.js';
import boss from './games/boss.js';

const MISSIONS = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10];
const ALL = [...MISSIONS, boss];
const app = $('#app');
let cleanup = null;

const academyDone = () => LESSONS.every((l) => S.lessonDone(l.id));
const missionsDone = () => MISSIONS.every((m) => S.missionDone(m.id, m.levels.length));
const missionUnlocked = (m) => (m.boss ? academyDone() && missionsDone() : S.lessonDone(m.lesson));

/* ---------- logros ---------- */
const ACH = [
  ['first', '📖 Primera lección', () => LESSONS.some((l) => S.lessonDone(l.id))],
  ['acad', '🎓 Academia completada', academyDone],
  ['star3', '⭐ Tres estrellas', () => Object.values(S.state().stars).includes(3)],
  ['half', '🧪 5 misiones superadas', () => MISSIONS.filter((m) => S.missionDone(m.id, m.levels.length)).length >= 5],
  ['all', '🚀 Todas las misiones', missionsDone],
  ['boss', '☠️ SKYNET-18 derrotada', () => S.starsOf(11, 0) > 0],
  ['streak3', '🔥 Racha de 3 días', () => S.state().streak >= 3],
];
function checkAch() {
  ACH.forEach(([id, label, test]) => { if (!S.state().ach[id] && test()) { S.state().ach[id] = 1; S.save(); toast(`🏆 Logro: ${label}`); } });
}

/* ---------- cabecera ---------- */
function header() {
  const st = S.state(), rk = S.rank();
  const pct = rk.to ? ((st.xp - rk.from) / (rk.to - rk.from)) * 100 : 100;
  return h('header.top', h('div.in',
    h('button.logo', { onclick: () => (location.hash = '#/'), 'aria-label': 'Inicio' }, h('span', { html: '<svg width="26" height="26" viewBox="0 0 64 64"><g stroke="#22e4ff" stroke-width="4" fill="none"><path d="M14 20 32 32 14 44M50 18 32 32 50 46"/></g><circle cx="14" cy="20" r="6" fill="#a3ff3d"/><circle cx="14" cy="44" r="6" fill="#a3ff3d"/><circle cx="50" cy="18" r="6" fill="#ffb534"/><circle cx="50" cy="46" r="6" fill="#ffb534"/><circle cx="32" cy="32" r="9" fill="#ff3df0"/></svg>' }), h('span', 'NEURO', h('b', 'FORGE'))),
    h('div.xpbox', h('div.xpl', h('span', `${rk.icon} ${rk.name}`), h('span', `${st.xp}${rk.to ? ' / ' + rk.to : ''} XP`)), h('div.xpbar', h('i', { style: { width: pct + '%' } }))),
    st.streak ? h('span.chip', `🔥 ${st.streak}`) : '',
    h('button.ibtn', { onclick: () => (location.hash = '#/codex'), title: 'Codex (glosario)' }, '📚'),
    h('button.ibtn', { onclick: (e) => { toggleSound(); e.currentTarget.textContent = S.state().sound ? '🔊' : '🔇'; }, title: 'Sonido' }, S.state().sound ? '🔊' : '🔇')));
}

function giveXP(n, label) {
  const up = S.addXP(n);
  toast(`+${n} XP ${label || ''}`);
  if (up) { beep('lvl'); confetti(); setTimeout(() => toast(`🎖 ¡Nuevo rango: ${up.icon} ${up.name}!`, 4500), 700); }
}

/* ---------- pantallas ---------- */
function intro() {
  let name = '';
  const inp = h('input.txt', { placeholder: 'Tu nombre o apodo', maxlength: 20, oninput: (e) => { name = e.target.value.trim(); }, onkeydown: (e) => { if (e.key === 'Enter') go(); } });
  const go = () => { S.state().name = name || 'Piloto'; S.save(); touch(); location.hash = '#/'; render(); };
  return h('div.wrap', h('div.hero', h('div', { style: { fontSize: '64px' } }, '🧠'), h('h1', h('span.grad', 'NeuroForge')), h('p', 'Aprende ', h('b', 'Inteligencia Artificial'), ' jugando: primero la Academia con todos los fundamentos y después 10 misiones interactivas para entrenar redes, domar LLMs y derrotar a SKYNET-18.'),
    h('p.sm.mut', 'Para el módulo optativo de IA · sin registro · tu progreso se guarda en este navegador.'), h('div', { style: { margin: '20px 0 12px' } }, inp), h('button.btn.big', { onclick: go }, '▶ Empezar')));
}
function touch() { S.touchStreak(); }

function home() {
  const st = S.state();
  const lessonsDone = LESSONS.filter((l) => S.lessonDone(l.id)).length;
  const mDone = MISSIONS.filter((m) => S.missionDone(m.id, m.levels.length)).length;
  const next = LESSONS.find((l) => !S.lessonDone(l.id));
  const lessonCards = LESSONS.map((l, i) => {
    const unlocked = i === 0 || S.lessonDone(LESSONS[i - 1].id) || S.lessonDone(l.id);
    return h('button.card', { class: (S.lessonDone(l.id) ? 'done ' : '') + (unlocked ? '' : 'lock'), style: { '--cc': l.color }, disabled: !unlocked, onclick: () => unlocked && (location.hash = `#/leccion/${l.id}`), 'aria-label': `Lección ${l.id}: ${l.title}` },
      h('span.n', `LECCIÓN ${l.id}`), h('span.ic', l.icon), h('b', l.title), h('span.sm.mut', l.sub), !unlocked ? h('span.sm.am', '🔒 Completa la anterior') : '');
  });
  const missionCards = ALL.map((m) => {
    const un = missionUnlocked(m), total = m.levels.length * 3;
    const got = m.levels.reduce((a, _, i) => a + S.starsOf(m.id, i), 0);
    return h('button.card', { class: (m.boss ? 'boss ' : '') + (S.missionDone(m.id, m.levels.length) ? 'done ' : '') + (un ? '' : 'lock'), style: { '--cc': m.color }, disabled: !un, onclick: () => un && (location.hash = `#/mision/${m.id}`) },
      m.boss ? [h('span.ic', { style: { fontSize: '48px' } }, m.icon), h('div', h('b', { style: { fontSize: '18px' } }, 'JEFE FINAL · ' + m.title), h('div.sm.mut', m.blurb), un ? starsEl(got, 3) : h('span.sm.am', '🔒 Completa la Academia y las 10 misiones'))]
        : [h('span.n', `MISIÓN ${m.id}`), h('span.ic', m.icon), h('b', m.title), h('span.sm.mut', m.blurb), un ? h('span.stars', '★'.repeat(got), h('span.off', '★'.repeat(total - got))) : h('span.sm.am', `🔒 Requiere la lección ${m.lesson}`)]);
  });
  return h('div.wrap',
    h('div.hero', h('h1', 'Hola, ', h('span.grad', st.name || 'Piloto'), ' 👋'), h('p', next ? ['Siguiente parada: ', h('b', `Lección ${next.id} · ${next.title}`), '. Cada lección desbloquea su misión.'] : academyDone() ? (missionsDone() ? '¡Solo queda el jefe final!' : 'Academia superada. ¡A las misiones!') : ''),
      next ? h('button.btn.big', { onclick: () => (location.hash = `#/leccion/${next.id}`) }, `▶ ${lessonsDone ? 'Continuar' : 'Empezar'} la Academia`) : ''),
    h('section.part', h('h2', '📘 Parte 1 · Academia', h('span.tag', `${lessonsDone}/${LESSONS.length} lecciones`)), h('p.mut.sm', 'Todos los fundamentos de la IA, de cero. Cada lección trae ejemplos, mini-demos y un test.'), h('div.grid', lessonCards)),
    h('section.part', h('h2', '🎮 Parte 2 · Misiones', h('span.tag', `${mDone}/${MISSIONS.length} superadas`)), h('p.mut.sm', 'Aquí se juega. Cada misión se desbloquea al terminar su lección y trae 3 niveles con estrellas.'), h('div.grid', missionCards)),
    S.starsOf(11, 0) > 0 ? h('div.glass.c', { style: { marginTop: '26px' } }, h('h2', '🏆 ¡Lo has conseguido!'), h('button.btn.big', { onclick: () => (location.hash = '#/certificado') }, '📜 Ver mi certificado')) : '',
    h('div.row', { style: { marginTop: '26px', justifyContent: 'space-between' } }, h('span.sm.mut', `🏅 Logros: ${Object.keys(st.ach).length}/${ACH.length}`), h('button.btn.g.sm', { onclick: () => { if (confirm('¿Borrar todo tu progreso?')) { S.reset(); location.hash = '#/'; render(); } } }, 'Reiniciar progreso')));
}

function lesson(id) {
  const L = LESSONS.find((l) => l.id === +id);
  if (!L) return notFound();
  let i = 0, firstTry = 0, answeredFirst = new Set();
  const body = h('div'), prog = h('div.prog'), nav = h('div.nav-bottom');
  const wrap = h('div.wrap', h('div.crumb', h('button.btn.g', { onclick: () => (location.hash = '#/') }, '← Mapa'), h('span.mut.sm', `LECCIÓN ${L.id} / ${LESSONS.length}`)), h('h1', { style: { fontSize: 'clamp(22px,4vw,34px)' } }, L.icon + ' ' + L.title), h('p.mut', L.sub), prog, body, nav);
  const draw = () => {
    prog.replaceChildren(...L.steps.map((_, k) => h('i', { class: k < i ? 'on' : k === i ? 'cur' : '' })));
    const s = L.steps[i];
    body.replaceChildren(); nav.replaceChildren();
    const next = h('button.btn', { onclick: () => { if (i < L.steps.length - 1) { i++; draw(); scrollTo({ top: 0 }); } else finish(); } }, i < L.steps.length - 1 ? 'Siguiente ▶' : '🏁 Terminar lección');
    const prev = h('button.btn.g', { disabled: i === 0, onclick: () => { i--; draw(); } }, '◀ Atrás');
    if (s.t === 'text') {
      body.append(h('div.glass.step', h('h2', s.title), h('div', { html: s.html.replace('<!--W-->', '') }), s.widget ? widget(s.widget) : ''));
      nav.append(prev, next);
      if (i === 0) say(`¡Hola! Soy NEO 🤖. Lee con calma: al final hay test.`, 3500);
    } else {
      const box = h('div.glass.step.quiz', h('p.mut.sm', 'Test rápido'), h('h3', s.q)); let done = false;
      s.opts.forEach((o, k) => {
        const b = h('button.opt', { onclick: () => {
          if (done) return;
          const ok = k === s.a;
          if (!answeredFirst.has(i)) { answeredFirst.add(i); if (ok) firstTry++; }
          b.classList.add(ok ? 'ok' : 'bad'); beep(ok ? 'ok' : 'bad');
          if (ok) { done = true; box.append(h('div.why', h('b.li', '✔ ¡Correcto! '), s.why)); next.disabled = false; box.querySelectorAll('.opt').forEach((x) => (x.disabled = true)); }
          else { say('Casi. Piénsalo otra vez 🤔', 3000); b.disabled = true; }
        } }, o);
        box.append(b);
      });
      next.disabled = true; body.append(box); nav.append(prev, next);
    }
  };
  function finish() {
    const first = !S.lessonDone(L.id);
    S.state().lessons[L.id] = true; S.save(); touch();
    if (first) giveXP(60 + firstTry * 10, `por la lección ${L.id}`);
    beep('win'); confetti(); checkAch();
    const mis = MISSIONS.find((m) => m.lesson === L.id), nextL = LESSONS.find((l) => l.id === L.id + 1);
    const m = modal([h('div', { style: { fontSize: '52px' } }, '🎓'), h('h2', '¡Lección completada!'), h('p.mut', `Primer intento correcto en ${firstTry} preguntas.`),
      mis ? h('p', 'Misión desbloqueada: ', h('b', mis.icon + ' ' + mis.title)) : '',
      h('div.row', { style: { justifyContent: 'center' } }, mis ? h('button.btn.l', { onclick: () => { m.remove(); location.hash = `#/mision/${mis.id}`; } }, '🎮 Jugar misión') : '', nextL ? h('button.btn', { onclick: () => { m.remove(); location.hash = `#/leccion/${nextL.id}`; } }, 'Siguiente lección ▶') : h('button.btn', { onclick: () => { m.remove(); location.hash = '#/'; } }, 'Al mapa'))]);
  }
  draw();
  return wrap;
}

function mission(id, startLevel) {
  const M = ALL.find((m) => m.id === +id);
  if (!M || !missionUnlocked(M)) return notFound();
  let cur = startLevel ?? Math.max(0, M.levels.findIndex((_, i) => S.starsOf(M.id, i) === 0));
  if (cur < 0) cur = 0;
  const arena = h('div.arena'), lv = h('div.lvls');
  const wrap = h('div.wrap', h('div.crumb', h('button.btn.g', { onclick: () => (location.hash = '#/') }, '← Mapa'), h('span.mut.sm', M.boss ? 'JEFE FINAL' : `MISIÓN ${M.id}`), M.lesson ? h('button.btn.g', { onclick: () => (location.hash = `#/leccion/${M.lesson}`) }, '📘 Repasar lección') : ''),
    h('h1', { style: { fontSize: 'clamp(22px,4vw,34px)' } }, M.icon + ' ' + M.title), h('p.mut', M.blurb), lv, arena);
  function drawLevels() {
    lv.replaceChildren(...M.levels.map((l, i) => {
      const open = i === 0 || S.starsOf(M.id, i - 1) > 0 || S.starsOf(M.id, i) > 0;
      return h('button.lv', { class: i === cur ? 'cur' : '', disabled: !open, onclick: () => { cur = i; start(); } }, h('div', h('b', `${i + 1}. ${l.name}`)), h('div.sm.mut', l.desc), starsEl(S.starsOf(M.id, i)));
    }));
  }
  function start() {
    if (cleanup) { try { cleanup(); } catch { /* */ } cleanup = null; }
    hideNeo(); drawLevels(); arena.replaceChildren();
    let ended = false;
    const api = {
      sfx: beep,
      lose(msg) { if (ended) return; ended = true; beep('bad'); if (cleanup) { try { cleanup(); } catch { /* */ } cleanup = null; } const m = modal([h('div', { style: { fontSize: '48px' } }, '💥'), h('h2', 'Misión fallida'), h('p.mut', msg || ''), h('button.btn', { onclick: () => { m.remove(); start(); } }, '↺ Reintentar')]); },
      win(stars, msg) {
        if (ended) return;
        if (stars < 1) return api.lose('Demasiados fallos. ' + (msg || ''));
        ended = true; beep('win'); confetti();
        const gain = S.setStars(M.id, cur, stars); if (gain) giveXP(gain + (M.boss ? 150 : 0), 'misión');
        touch(); drawLevels(); checkAch();
        const hasNext = cur < M.levels.length - 1;
        const m = modal([h('div', { style: { fontSize: '48px' } }, M.boss ? '🏆' : '✅'), h('h2', M.boss ? '¡SKYNET-18 desconectada!' : '¡Nivel superado!'), h('div', { style: { fontSize: '30px' } }, starsEl(stars)), h('p.mut', msg || ''),
          h('div.row', { style: { justifyContent: 'center' } },
            hasNext ? h('button.btn.l', { onclick: () => { m.remove(); cur++; start(); } }, 'Siguiente nivel ▶') : M.boss ? h('button.btn.l', { onclick: () => { m.remove(); location.hash = '#/certificado'; } }, '📜 Mi certificado') : h('button.btn.l', { onclick: () => { m.remove(); location.hash = '#/'; } }, 'Al mapa'),
            h('button.btn.g', { onclick: () => { m.remove(); start(); } }, '↺ Repetir'))]);
      },
      say,
    };
    const lvInfo = M.levels[cur];
    arena.append(h('h3', `Nivel ${cur + 1} · ${lvInfo.name}`));
    const box = h('div'); arena.append(box);
    cleanup = M.mount(box, cur, api) || null;
  }
  setTimeout(start, 0);
  return wrap;
}

function codex() {
  const list = h('div'); let q = '';
  const draw = () => list.replaceChildren(...CODEX.filter(([t, d]) => (t + d).toLowerCase().includes(q)).sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([t, d]) => h('div.codex-term', h('b', t), ' — ', d)));
  draw();
  return h('div.wrap', h('div.crumb', h('button.btn.g', { onclick: () => (location.hash = '#/') }, '← Mapa')), h('h1', '📚 Codex de IA'), h('p.mut', 'Glosario con todos los términos del curso.'),
    h('input.txt', { style: { maxWidth: '100%', textAlign: 'left', margin: '10px 0' }, placeholder: 'Buscar…', oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } }), h('div.glass', list));
}

function certificate() {
  const st = S.state(), rk = S.rank();
  return h('div.wrap', h('div.crumb.noprint', h('button.btn.g', { onclick: () => (location.hash = '#/') }, '← Mapa')),
    h('div.certificate', h('div', { style: { fontSize: '54px' } }, '🏅'), h('h1', 'Certificado de Aprendiz de IA'), h('p', 'Se certifica que'), h('h2.grad', { style: { fontSize: '34px' } }, st.name || 'Piloto'),
      h('p', 'ha completado la Academia de fundamentos, superado las 10 misiones de NeuroForge y desactivado a SKYNET-18.'),
      h('p.mut', `Rango: ${rk.icon} ${rk.name} · ${st.xp} XP · ${S.totalStars()} ★ · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`)),
    h('div.c.noprint', { style: { marginTop: '16px' } }, h('button.btn.big', { onclick: () => print() }, '🖨 Imprimir / guardar PDF')));
}
const notFound = () => h('div.wrap', h('div.glass.c', { style: { marginTop: '30px' } }, h('h2', 'Esto aún está bloqueado 🔒'), h('p.mut', 'Completa antes la lección correspondiente.'), h('button.btn', { onclick: () => (location.hash = '#/') }, 'Volver al mapa')));

/* ---------- router ---------- */
function render() {
  if (cleanup) { try { cleanup(); } catch { /* */ } cleanup = null; }
  hideNeo();
  document.querySelectorAll('.modal').forEach((m) => m.remove());
  const [, route, arg] = location.hash.split('/');
  app.replaceChildren();
  let view;
  if (!S.state().name) view = intro();
  else if (route === 'leccion') view = lesson(arg);
  else if (route === 'mision') view = mission(arg);
  else if (route === 'codex') view = codex();
  else if (route === 'certificado') view = certificate();
  else view = home();
  if (S.state().name) app.append(header());
  app.append(view);
  if (!(route === 'mision')) scrollTo({ top: 0 });
}
addEventListener('hashchange', render);
render();
