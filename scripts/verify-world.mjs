// Comprueba el mundo de Bitlandia: que todo sea alcanzable siguiendo la historia y que
// cada entrenador, bug y zona apunte a datos que existen.
import { W, H, MAP, walkable, NPCS, DOORS, SIGNS, TRAINERS, ZONES, START, CENTERS, FIREWALLS, tileAt } from '../src/rpg/world.js';
import { BUGS, BUG } from '../src/rpg/species.js';
import { COURSE as CHALLENGES } from '../src/rpg/course/index.js';
import { CHAPTERS, ORDER, wildPool } from '../src/rpg/curriculum.js';

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log(`✗ ${msg}`); } };

ok(MAP.length === H && MAP.every((r) => r.length === W), 'el mapa tiene el tamaño correcto');
ok(BUGS.length === CHALLENGES.length, `${CHALLENGES.length} bugs, uno por reto del temario`);
for (const [id, t] of Object.entries(TRAINERS)) for (const b of t.team) ok(BUG[b], `${id}: el bug ${b} existe`);
// Temario: los 32 niveles, cada uno una sola vez, y cada capítulo en una zona con hierba alta.
ok(ORDER.length === CHALLENGES.length && new Set(ORDER).size === ORDER.length && CHALLENGES.every((c) => ORDER.includes(c.id)), 'el temario cubre todos los retos una vez');
ok(ORDER[0] === 'p-ficha', 'el temario empieza por las variables');
for (const ch of CHAPTERS) {
  const z = ZONES.find((k) => k.id === ch.zone);
  if (ch.lessons.length) ok(z && z.wild && MAP.slice(z.y0, z.y1 + 1).some((r) => /[,k]/.test(r)), `capítulo ${ch.n}: su zona tiene hierba alta`);
  ok(TRAINERS[ch.exam.trainer], `capítulo ${ch.n}: el examen tiene entrenador`);
  ok(JSON.stringify(TRAINERS[ch.exam.trainer].team) === JSON.stringify(ch.exam.drills), `capítulo ${ch.n}: el examen usa sus retos`);
  // Los bugs salvajes salen en el orden del temario.
  const g = { solved: {}, flags: {} };
  for (const id of ch.lessons) { const p = wildPool(g, ch.zone); ok(p.length === 1 && p[0] === id, `capítulo ${ch.n}: la siguiente lección salvaje es ${id}`); g.solved[id] = true; }
}
// Ningún entrenador usa un reto de un capítulo posterior al de su zona.
const zoneChapter = (y) => CHAPTERS.findIndex((c) => { const z = ZONES.find((k) => k.id === c.zone); return y >= z.y0 && y <= z.y1; });
for (const n of NPCS.filter((k) => k.trainer)) {
  const ci = zoneChapter(n.y);
  if (ci < 0) continue;
  const limit = ORDER.indexOf(CHAPTERS[ci].exam.drills[CHAPTERS[ci].exam.drills.length - 1]);
  for (const id of TRAINERS[n.trainer].team) ok(ORDER.indexOf(id) <= limit, `${n.trainer}: ${id} pertenece a su capítulo o anteriores`);
}
for (const n of NPCS) {
  ok(walkable(n.x, n.y, Object.fromEntries(Object.values(FIREWALLS).map((f) => [f, true]))) || tileAt(n.x, n.y) === 'X', `NPC ${n.id} está sobre una casilla transitable (${tileAt(n.x, n.y)})`);
  if (n.trainer) ok(TRAINERS[n.trainer], `NPC ${n.id}: el entrenador existe`);
}
ok(walkable(START.x, START.y, {}), 'la casilla de inicio es transitable');
for (const c of CENTERS) ok(walkable(c.x, c.y, {}), `centro ${c.x},${c.y} transitable`);

// Simula la historia: con las banderas de cada fase, ¿se llega a lo necesario?
function reach(flags) {
  const block = new Set(NPCS.filter((n) => (!n.hideIf || !flags[n.hideIf]) && (!n.showIf || flags[n.showIf]) && !(n.trainer && flags[TRAINERS[n.trainer].flag] && false)).map((n) => `${n.x},${n.y}`));
  const seen = new Set([`${START.x},${START.y}`]);
  const q = [[START.x, START.y]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`;
      if (seen.has(k) || !walkable(x + dx, y + dy, flags)) continue;
      // un entrenador derrotado sigue bloqueando su casilla: no se puede pasar por encima
      if (block.has(k)) continue;
      seen.add(k);
      q.push([x + dx, y + dy]);
    }
  }
  return seen;
}
const adj = (set, key) => { const [x, y] = key.split(',').map(Number); return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => set.has(`${x + dx},${y + dy}`)); };
const npcPos = (id) => { const n = NPCS.find((k) => k.id === id); return `${n.x},${n.y}`; };
const doorOf = (name) => Object.entries(DOORS).find(([, d]) => d === name)[0];

const base = { starter: true, rival1: true };
const P = [
  [{}, ['door:lab', 'door:home']],
  [base, ['door:gym1', 'npc:coder1']],
  [{ medal1: true }, ['npc:grunt1', 'npc:grunt2']],
  [{ grunt2: true }, ['npc:rival2']],
  [{ rival2: true }, ['door:gym2']],
  [{ medal2: true }, ['npc:grunt3']],
  [{ grunt3: true }, ['door:gym3', 'npc:grunt4']],
  [{ medal3: true }, ['door:gym4', 'npc:grunt8']],
  [{ medal4: true }, ['door:gym5', 'npc:grunt9']],
  [{ medal5: true }, ['door:gym6', 'npc:grunt5']],
  [{ medal6: true, grunt5: true }, ['npc:rival3', 'npc:grunt6', 'npc:grunt7']],
  [{ rival3: true }, ['npc:boss']],
];
const phases = [];
let acc = {};
for (const [f, t] of P) { acc = { ...acc, ...f }; phases.push([acc, t]); }
// Los entrenadores que bloquean el camino desaparecen del bloqueo una vez vencidos.
const blocking = { grunt2: true, rival2: true, grunt3: true, grunt4: true, grunt5: true, rival3: true, grunt8: true, grunt9: true };
for (const [flags, targets] of phases) {
  const f = { ...flags };
  // simula que los entrenadores vencidos se apartan (en el juego se habla con ellos, pero sus casillas no son paso obligado salvo estos)
  const saved = NPCS.map((n) => ({ n, hide: n.hideIf }));
  for (const n of NPCS) if (n.trainer && blocking[n.trainer] && f[TRAINERS[n.trainer].flag]) n.hideIf = TRAINERS[n.trainer].flag;
  const r = reach(f);
  saved.forEach(({ n, hide }) => { n.hideIf = hide; });
  for (const t of targets) {
    const [kind, id] = t.split(':');
    const key = kind === 'door' ? doorOf(id) : npcPos(id);
    ok(adj(r, key), `con ${Object.keys(flags).join(', ') || 'nada'} se alcanza ${t}`);
  }
}
for (const k of Object.keys(SIGNS)) ok(tileAt(...k.split(',').map(Number)) === 'S', `cartel en ${k}`);
for (const k of Object.keys(DOORS)) ok(tileAt(...k.split(',').map(Number)) === 'D', `puerta en ${k}`);

if (process.argv.includes('--map')) console.log(MAP.map((r, i) => `${String(i).padStart(2)} ${r}`).join('\n'));
console.log(fails ? `\n${fails} problemas en el mundo` : '✓ Mundo de Bitlandia verificado');
process.exit(fails ? 1 : 0);
