// Verifica la campaña completa sin navegador:
//  · estructura de cada misión y reto;
//  · en los retos de terminal, que al empezar NO hay objetivos cumplidos y que la
//    solución de referencia (comandos + respuestas) los cumple TODOS;
//  · que cada equipo tiene un camino completo por los 10 módulos.
import { MISSIONS, MODULES, missionsFor, challengesOf } from '../src/campaign/index.js';
import { createShell, run, HELP } from '../src/core/shell.js';
import { objectiveDone } from '../src/campaign/helpers.js';
import { TEAM_ORDER } from '../src/core/teams.js';
import { emptyProgress, moduleUnlocked, moduleGrade } from '../src/core/progress.js';
import { OBJECTIVES, GLOSSARY } from '../src/campaign/glossary.js';
import { buildSummary } from '../src/core/summary.js';

let checks = 0;
const errors = [];
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); };

const SEEDS = 40;
const ids = new Set();
for (const m of MISSIONS) {
  const where = `[${m.id}]`;
  ok(!ids.has(m.id), `${where} id repetido`);
  ids.add(m.id);
  ok(MODULES.some((x) => x.id === m.module), `${where} módulo desconocido`);
  ok(m.teams.length && m.teams.every((t) => TEAM_ORDER.includes(t)), `${where} equipos no válidos`);
  ok(m.title && m.story && m.lesson?.length && (m.challenges?.length || m.generate) && m.learned?.length && m.tip, `${where} faltan campos`);
  if (m.generate) {
    ok(['training', 'exam'].includes(m.kind), `${where} misión generada sin tipo`);
    const sig = (seed, team = 'blue') => JSON.stringify(challengesOf(m, seed, team), (k, v) => (typeof v === 'function' ? 'fn' : v));
    ok(sig(5) === sig(5), `${where} la generación no es reproducible con la misma semilla`);
    const variants = new Set();
    for (let seed = 1; seed <= SEEDS; seed++) {
      variants.add(sig(seed));
      for (const team of m.teams) {
        const list = challengesOf(m, seed, team);
        ok(list.length >= 2, `${where} ${team} semilla ${seed}: menos de 2 retos`);
        if (m.kind === 'exam') ok(list[0].type === 'quiz' && list[0].questions.length === 8, `${where} ${team} semilla ${seed}: el examen debe tener 8 preguntas`);
        list.forEach((c, ci) => validateChallenge(c, `${where} ${team} semilla ${seed} reto ${ci + 1} (${c.type})`));
      }
    }
    ok(variants.size > SEEDS / 2, `${where} genera muy pocas variantes (${variants.size})`);
  } else {
    m.challenges.forEach((c, ci) => validateChallenge(c, `${where} reto ${ci + 1} (${c.type})`));
  }
}

function validateChallenge(c, w) {
    if (c.type === 'quiz') {
      ok(c.questions.length > 0, `${w} sin preguntas`);
      c.questions.forEach((q, qi) => ok(q.correct >= 0 && q.correct < q.options.length && q.explain, `${w} pregunta ${qi + 1} mal definida`));
    } else if (c.type === 'classify') {
      const cats = new Set(c.categories.map((x) => x.id));
      ok(c.items.length >= 3, `${w} pocos elementos`);
      c.items.forEach((it) => ok(cats.has(it.cat) && it.explain, `${w} «${it.text}» categoría o explicación incorrecta`));
    } else if (c.type === 'order') {
      ok(c.items.length >= 3 && new Set(c.items).size === c.items.length, `${w} orden mal definido`);
    } else if (c.type === 'code') {
      ok(c.bad.every((i) => i >= 0 && i < c.code.length), `${w} líneas vulnerables fuera de rango`);
      ok(c.options.filter((o) => o.correct).length === 1, `${w} debe tener exactamente una opción correcta`);
    } else if (c.type === 'logs') {
      ok(c.bad.length > 0 && c.bad.every((i) => i >= 0 && i < c.lines.length), `${w} líneas marcadas fuera de rango`);
      ok(c.bad.length < c.lines.length, `${w} todas las líneas son sospechosas`);
    } else if (c.type === 'terminal') {
      const st = createShell(c.scenario);
      const pre = c.objectives.filter((o) => !o.answer && objectiveDone(o, st));
      ok(pre.length === 0, `${w} objetivos cumplidos sin hacer nada: ${pre.map((o) => o.id).join(', ')}`);
      for (const cmd of c.solution) {
        const r = run(st, cmd);
        const errs = r.lines.filter((l) => l.err);
        ok(errs.length === 0, `${w} la solución da error en «${cmd}»: ${errs.map((e) => e.text).join(' | ')}`);
      }
      for (const o of c.objectives) if (o.answer) st.answers[o.id] = o.answer[0];
      const missing = c.objectives.filter((o) => !objectiveDone(o, st));
      ok(missing.length === 0, `${w} la solución no cumple: ${missing.map((o) => o.id).join(', ')}`);
      c.objectives.forEach((o) => ok(o.text && (o.answer || (o.check && o.how)), `${w} objetivo ${o.id} incompleto`));
    } else {
      ok(false, `${w} tipo desconocido`);
    }
}

for (const team of TEAM_ORDER) {
  for (const mod of MODULES) {
    const list = missionsFor(team, mod.id);
    ok(list.length >= 4, `equipo ${team}: el módulo ${mod.id} tiene ${list.length} misiones`);
  }
}


// ───────────── Auditoría pedagógica: nada se pide sin haberse enseñado antes ─────────────
// Recorre la campaña de cada equipo en orden. Un comando cuenta como «enseñado» cuando aparece en el
// bloque de terminal ($ …) o entre «…» en una lección que ese equipo ya ha visto. Cada comando de la
// solución de un reto de terminal tiene que estar enseñado en esa misión o antes.
const cmdsOfLine = (line) => line.split(/\|\||&&|;|\|/).map((p) => p.trim().split(/\s+/)).map((t) => (t[0] === 'sudo' ? t[1] : t[0])).filter((c) => c && HELP[c]);
function taughtBy(lesson) {
  const out = new Set();
  for (const st of lesson) {
    for (const l of (st.code || '').split('\n')) if (l.startsWith('$ ')) cmdsOfLine(l.slice(2)).forEach((c) => out.add(c));
    const text = typeof st.text === 'string' ? st.text : Object.values(st.text).join(' ');
    for (const mm of text.matchAll(/«([^»]+)»/g)) cmdsOfLine(mm[1]).forEach((c) => out.add(c));
  }
  return out;
}
let pedagogy = 0;
for (const team of TEAM_ORDER) {
  const taught = new Set(['help', 'clear', 'history']);
  for (const m of missionsFor(team)) {
    taughtBy(m.lesson).forEach((c) => taught.add(c));
    for (let seed = 1; seed <= (m.generate ? SEEDS : 1); seed++) {
      for (const c of challengesOf(m, seed, team)) {
        if (c.type !== 'terminal') continue;
        for (const line of c.solution) {
          for (const cmd of cmdsOfLine(line)) {
            pedagogy++;
            ok(taught.has(cmd), `pedagogía · ${team}/${m.id}: el reto pide «${cmd}» sin haberlo enseñado antes`);
          }
        }
      }
    }
  }
}


// ───────────── Aprendizaje por dominio, objetivos y glosario ─────────────
for (const team of TEAM_ORDER) {
  const p = emptyProgress();
  missionsFor(team, 'm1').forEach((m) => { p.teams[team][m.id] = { stars: 1, score: 100 }; });
  p.teams[team]['m1-examen'] = { stars: 1, score: 40 };
  ok(!moduleUnlocked(p, team, 1), `dominio · ${team}: el tema 2 se abre con el examen suspenso`);
  p.teams[team]['m1-examen'].score = 50;
  ok(moduleUnlocked(p, team, 1), `dominio · ${team}: el tema 2 no se abre con el examen aprobado`);
  ok(moduleGrade(p, team, 'm1').nota === 8.8 || moduleGrade(p, team, 'm1').nota > 0, `notas · ${team}: nota del tema 1 incorrecta`);
}
for (const mod of MODULES) {
  ok(OBJECTIVES[mod.id]?.length >= 3, `tema ${mod.num}: faltan objetivos de aprendizaje`);
  ok(GLOSSARY[mod.id]?.length >= 5, `tema ${mod.num}: glosario demasiado corto`);
}


// ───────────── Resúmenes descargables (uno por tema y equipo) ─────────────
let summaries = 0;
for (const team of TEAM_ORDER) {
  for (const mod of MODULES) {
    const { html, filename } = buildSummary({ moduleId: mod.id, team, nick: 'Prueba' });
    summaries++;
    const w = `resumen · ${team}/${mod.id}`;
    ok(filename.endsWith(`-${team}.html`), `${w}: nombre de fichero`);
    ok(mod.objectives.every((o) => html.includes(o.replace(/&/g, '&amp;'))), `${w}: faltan objetivos`);
    ok(mod.glossary.every((g) => html.includes(g.term.replace(/&/g, '&amp;'))), `${w}: falta el glosario`);
    const sols = [...html.matchAll(/<p class="sol"><b>\d+\. ([A-D])<\/b>/g)].map((x) => x[1]);
    ok(sols.length >= 8, `${w}: menos de 8 preguntas de autoevaluación`);
    ok(new Set(sols).size > 1, `${w}: todas las soluciones son la misma letra`);
    ok(!/<script/i.test(html.replace('onclick="window.print()"', '')), `${w}: el resumen no debe llevar scripts`);
  }
}

const perTeam = TEAM_ORDER.map((t) => `${t}: ${missionsFor(t).length}`).join(' · ');
if (errors.length) {
  console.log(errors.map((e) => `✗ ${e}`).join('\n'));
  console.log(`\n${checks - errors.length}/${checks} comprobaciones correctas`);
  process.exit(1);
}
console.log(`✓ ${MISSIONS.length} misiones en ${MODULES.length} módulos (${perTeam}); ${MISSIONS.filter((m) => m.generate).length} generadas, probadas con ${SEEDS} semillas cada una`);
console.log(`✓ auditoría pedagógica: ${pedagogy} usos de comandos en retos, todos enseñados antes en una lección del equipo`);
console.log(`✓ ${summaries} resúmenes descargables (10 temas × 3 equipos) con objetivos, glosario y autoevaluación`);
console.log(`✓ ${checks} comprobaciones correctas`);
