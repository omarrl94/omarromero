// Verifica la campaña completa sin navegador:
//  · estructura de cada misión y reto;
//  · en los retos de terminal, que al empezar NO hay objetivos cumplidos y que la
//    solución de referencia (comandos + respuestas) los cumple TODOS;
//  · que cada equipo tiene un camino completo por los 10 módulos.
import { MISSIONS, MODULES, missionsFor } from '../src/campaign/index.js';
import { createShell, run } from '../src/core/shell.js';
import { objectiveDone } from '../src/campaign/helpers.js';
import { TEAM_ORDER } from '../src/core/teams.js';

let checks = 0;
const errors = [];
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); };

const ids = new Set();
for (const m of MISSIONS) {
  const where = `[${m.id}]`;
  ok(!ids.has(m.id), `${where} id repetido`);
  ids.add(m.id);
  ok(MODULES.some((x) => x.id === m.module), `${where} módulo desconocido`);
  ok(m.teams.length && m.teams.every((t) => TEAM_ORDER.includes(t)), `${where} equipos no válidos`);
  ok(m.title && m.story && m.lesson?.length && m.challenges?.length && m.learned?.length && m.tip, `${where} faltan campos`);
  m.challenges.forEach((c, ci) => {
    const w = `${where} reto ${ci + 1} (${c.type})`;
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
  });
}

for (const team of TEAM_ORDER) {
  for (const mod of MODULES) {
    const list = missionsFor(team, mod.id);
    ok(list.length >= 2, `equipo ${team}: el módulo ${mod.id} tiene ${list.length} misiones`);
  }
}

const perTeam = TEAM_ORDER.map((t) => `${t}: ${missionsFor(t).length}`).join(' · ');
if (errors.length) {
  console.log(errors.map((e) => `✗ ${e}`).join('\n'));
  console.log(`\n${checks - errors.length}/${checks} comprobaciones correctas`);
  process.exit(1);
}
console.log(`✓ ${MISSIONS.length} misiones en ${MODULES.length} módulos (${perTeam})`);
console.log(`✓ ${checks} comprobaciones correctas`);
