// Resumen descargable de un tema: documento de estudio autónomo (HTML imprimible / PDF).
import { MODULES, MISSIONS } from '../campaign/index.js';
import { examBank } from '../campaign/generators.js';
import { mulberry32, shuffleQuestion } from '../campaign/random.js';
import { TEAMS, persp } from './teams.js';
import { HELP } from './shell.js';
import { moduleGrade, formatNota } from './progress.js';

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Texto de lección → HTML: «comando» en código, PALABRAS CLAVE en negrita. */
function rich(text) {
  return esc(text)
    .replace(/«([^»]+)»/g, (m, inner) => (HELP[inner.split(/\s/)[0]] ? `<code>${inner}</code>` : `«${inner}»`))
    .replace(/(?<!\p{L})(\p{Lu}{4,})(?!\p{L})/gu, (w) => (['HTTP', 'HTTPS', 'MITRE', 'OWASP', 'NIST', 'RGPD', 'AEPD', 'CVSS', 'SIEM', 'DMARC', 'DKIM', 'WHOIS', 'CISA', 'IDOR', 'JSON', 'HTML', 'ASCII', 'SMTP', 'JROTERO', 'SAST'].includes(w) ? w : `<strong>${w}</strong>`));
}

function splitKey(text) {
  const m = String(text).match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  return m ? { key: m[1], rest: m[3] } : { key: text, rest: '' };
}

function commandsOf(lessons) {
  const seen = new Map();
  for (const l of lessons) {
    for (const line of (l.code || '').split('\n')) {
      if (!line.startsWith('$ ')) continue;
      const cmd = line.slice(2).trim();
      const t = cmd.split(/\s+/);
      const name = t[0] === 'sudo' ? t[1] : t[0];
      if (!seen.has(cmd)) seen.set(cmd, HELP[name] || '');
    }
  }
  return [...seen.entries()];
}

/** Lecciones del tema que ve este equipo, sin repetir (la común y la de su equipo). */
function lessonsFor(moduleId, team) {
  const out = [];
  const titles = new Set();
  for (const m of MISSIONS.filter((x) => x.module === moduleId && x.teams.includes(team) && !x.generate)) {
    const steps = m.lesson.filter((st) => !titles.has(st.title));
    steps.forEach((st) => titles.add(st.title));
    if (steps.length) out.push({ mission: m, steps });
  }
  return out;
}

export function buildSummary({ moduleId, team, nick = '', progress = null }) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const T = TEAMS[team];
  const own = MISSIONS.filter((x) => x.module === moduleId && !x.generate);
  const blocks = lessonsFor(moduleId, team);
  const allSteps = blocks.flatMap((b) => b.steps);
  const cmds = commandsOf(allSteps);
  const learned = [...new Set(own.filter((m) => m.teams.includes(team)).flatMap((m) => m.learned))];
  const tips = own.filter((m) => m.teams.includes(team)).map((m) => persp(m.tip, team));
  // Opciones barajadas (semilla fija por tema): la correcta no siempre es la A.
  const rng = mulberry32(mod.num * 97 + team.length);
  const questions = rng.pickN(examBank(moduleId, own, team), 10).map((q) => shuffleQuestion(rng, q));
  const g = progress ? moduleGrade(progress, team, moduleId) : null;
  const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Resumen del tema ${mod.num} · ${esc(mod.title)} · CyberOps</title>
<style>
  :root { --c: ${T.color}; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f6fb; color: #1b2033; font: 15px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 820px; margin: 0 auto; padding: 32px 24px 48px; background: #fff; }
  header { border-bottom: 4px solid var(--c); padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #5b6380; }
  h1 { margin: 6px 0 4px; font-size: 28px; line-height: 1.2; }
  .meta { color: #5b6380; font-size: 13px; }
  .team { display: inline-block; padding: 2px 10px; border-radius: 99px; background: var(--c); color: #fff; font-weight: 700; font-size: 12px; }
  .grade { margin-top: 12px; padding: 10px 14px; border: 1px solid #dfe3ee; border-radius: 10px; display: flex; gap: 18px; flex-wrap: wrap; align-items: baseline; }
  .grade b { font-size: 22px; color: var(--c); }
  h2 { margin: 32px 0 10px; font-size: 19px; border-left: 5px solid var(--c); padding-left: 10px; }
  h3 { margin: 18px 0 6px; font-size: 16px; }
  .key { background: #f1f4ff; border-left: 4px solid var(--c); padding: 8px 12px; border-radius: 6px; font-weight: 600; }
  code, pre { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 13px; }
  code { background: #eef1f7; padding: 1px 5px; border-radius: 4px; }
  pre { background: #0d1117; color: #b9ffcf; padding: 12px 14px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; }
  ul.check { list-style: none; padding-left: 0; } ul.check li::before { content: "☐  "; color: var(--c); font-weight: 700; }
  table { width: 100%; border-collapse: collapse; } td, th { border-bottom: 1px solid #e6e9f2; padding: 7px 6px; vertical-align: top; text-align: left; }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #5b6380; }
  .q { margin: 12px 0; } .q ol { margin: 4px 0 0; } .sol { font-size: 14px; }
  .tip { background: #fff8e8; border: 1px solid #ffe2a8; border-radius: 8px; padding: 8px 12px; margin: 6px 0; }
  .tools { position: sticky; top: 0; background: #fff; padding: 8px 0; text-align: right; }
  .tools button { background: var(--c); color: #fff; border: 0; border-radius: 8px; padding: 8px 14px; font-weight: 700; cursor: pointer; }
  footer { margin-top: 36px; font-size: 12px; color: #7b8299; border-top: 1px solid #e6e9f2; padding-top: 10px; }
  @media print { body { background: #fff; } main { padding: 0; } .tools { display: none; } h2 { break-after: avoid; } .q, pre, .key { break-inside: avoid; } .pb { break-before: page; } }
</style></head>
<body><main>
<div class="tools"><button onclick="window.print()">Imprimir o guardar como PDF</button></div>
<header>
  <div class="brand">CyberOps · Operación Otero · JROTERO Ciberseguridad</div>
  <h1>Resumen del tema ${mod.num}: ${esc(mod.title)}</h1>
  <div class="meta"><span class="team">${esc(T.name)}</span> &nbsp;${esc(mod.subtitle)} · Nivel ${esc(mod.level)}${nick ? ` · Agente: <b>${esc(nick)}</b>` : ''} · ${esc(date)}</div>
  ${g ? `<div class="grade"><span>Puntos: <b>${g.points}</b> / ${g.max}</span><span>Nota del tema: <b>${formatNota(g.nota)}</b></span><span>${esc(g.label)}</span><span>Misiones: ${g.played}/${g.total}</span></div>` : ''}
</header>

<h2>1. Objetivos: al terminar el tema sabrás…</h2>
<p>Marca cada objetivo cuando seas capaz de hacerlo sin mirar.</p>
<ul class="check">${mod.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>

<h2>2. Lecciones</h2>
${blocks.map((b) => `<h3>${esc(b.mission.title)}${b.mission.teams.length === 1 ? ` <small>(misión ${esc(T.short)})</small>` : ''}</h3>
${b.steps.map((st) => { const { key, rest } = splitKey(persp(st.text, team)); return `<p><b>${esc(st.title)}.</b></p><p class="key">${rich(key)}</p>${rest ? `<p>${rich(rest)}</p>` : ''}${st.code ? `<pre>${esc(st.code)}</pre>` : ''}`; }).join('\n')}`).join('\n')}

${cmds.length ? `<h2>3. Chuleta de comandos</h2>
<table><tr><th>Comando</th><th>Para qué sirve</th></tr>${cmds.map(([c, d]) => `<tr><td><code>${esc(c)}</code></td><td>${esc(d)}</td></tr>`).join('')}</table>` : ''}

<h2>${cmds.length ? 4 : 3}. Glosario</h2>
<table><tr><th>Término</th><th>Definición</th></tr>${mod.glossary.map((x) => `<tr><td><b>${esc(x.term)}</b></td><td>${esc(x.def)}</td></tr>`).join('')}</table>

<h2>${cmds.length ? 5 : 4}. Lo que te llevas y consejos del ${esc(T.name)}</h2>
<ul>${learned.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
${tips.map((t) => `<div class="tip">💡 ${esc(t)}</div>`).join('')}

<h2 class="pb">${cmds.length ? 6 : 5}. Autoevaluación</h2>
<p>Responde sin mirar el resumen; después comprueba las soluciones.</p>
${questions.map((q, i) => `<div class="q"><b>${i + 1}. ${esc(q.q)}</b><ol type="A">${q.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></div>`).join('')}
<h3>Soluciones</h3>
${questions.map((q, i) => `<p class="sol"><b>${i + 1}. ${String.fromCharCode(65 + q.correct)}</b>: ${esc(q.options[q.correct])}. ${esc(q.explain)}</p>`).join('')}

<footer>CyberOps · Operación Otero · Laboratorio simulado con fines formativos: empresas, dominios e IPs ficticios. Practica siempre con permiso.</footer>
</main></body></html>`;
  return { html, filename: `resumen-tema-${String(mod.num).padStart(2, '0')}-${mod.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}-${team}.html` };
}

/** Descarga el resumen como fichero HTML. */
export function downloadSummary(opts) {
  const { html, filename } = buildSummary(opts);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Abre el resumen en una ventana nueva lista para imprimir o guardar en PDF. */
export function printSummary(opts) {
  const { html } = buildSummary(opts);
  const w = window.open('', '_blank');
  if (!w) { downloadSummary(opts); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* el usuario puede imprimir desde la ventana */ } }, 400);
}
