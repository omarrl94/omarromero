import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeEditor from '../components/CodeEditor.jsx';
import LessonVisual from '../components/LessonVisuals.jsx';
import { DRILL_CHALLENGES, DRILL_LESSONS } from '../curriculum/drill-challenges.js';
import { DRILLS } from '../curriculum/drills.js';
import { evaluate } from '../core/engine.js';
import { plainError } from '../core/explain.js';
import { LANGUAGES } from '../core/languages.js';
import { play } from '../core/sound.js';
import { useMedia, PHONE } from '../core/useMedia.js';
import { BUG, daemonLook, daemonName, maxHpOf, xpToNext } from './species.js';
import { gainXp, makeDaemon, bugLevel, ITEMS } from './save.js';
import { TRAINERS } from './world.js';
import { Creature, HpBar, Person, TypeChip, Modal } from './ui.jsx';

const CH = Object.fromEntries(DRILL_CHALLENGES.map((c) => [c.id, c]));
const SPEC = Object.fromEntries(DRILLS.map((d) => [d.id, d]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Batalla contra un bug: el ataque es tu código. Cada caso de prueba que pasa le quita vida;
 * si algo falla, el bug contraataca. Si pasa todo, el bug queda depurado.
 */
export default function Battle({ game, update, battle, onEnd }) {
  const lang = game.lang;
  const phone = useMedia(PHONE);
  const trainer = battle.trainer ? TRAINERS[battle.trainer] : null;
  const [index, setIndex] = useState(0);
  const bugId = battle.queue[index];
  const bug = BUG[bugId];
  const ch = CH[bugId];
  const spec = SPEC[bugId];
  const lesson = DRILL_LESSONS[bugId];

  const [code, setCode] = useState(() => game.drafts[bugId] || ch.starter[lang]);
  const [enemyHp, setEnemyHp] = useState(100);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('fight'); // fight | purified | capture | done | lost
  const [evalRes, setEvalRes] = useState(null);
  const [fx, setFx] = useState({ enemy: 0, me: 0, purify: false });
  const [modal, setModal] = useState(battle.tutorial ? 'tutorial' : null); // lesson | hint | bag | tutorial
  const [fails, setFails] = useState(0);
  const [used, setUsed] = useState({ hint: false, solution: false });
  const [tab, setTab] = useState('code');
  const [focus, setFocus] = useState(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const active = game.team.find((m) => m.hp > 0) || game.team[0];

  // Presentación del bug.
  useEffect(() => {
    setEnemyHp(100);
    setPhase('fight');
    setEvalRes(null);
    setFails(0);
    setUsed({ hint: false, solution: false });
    setCode(gameRef.current.drafts[bugId] || CH[bugId].starter[lang]);
    setMsg(trainer
      ? (index === 0 ? `¡${trainer.name} te reta! Lanza a ${BUG[bugId].name}.` : `¡${trainer.name} lanza a ${BUG[bugId].name}!`)
      : `¡Un ${BUG[bugId].name} salvaje apareció! Ha corrompido una función.`);
    update((g) => ({ ...g, dex: { ...g.dex, seen: { ...g.dex.seen, [bugId]: true } } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bugId]);

  // Guarda el borrador del código.
  useEffect(() => {
    const t = setTimeout(() => update((g) => (g.drafts[bugId] === code ? g : { ...g, drafts: { ...g.drafts, [bugId]: code } })), 400);
    return () => clearTimeout(t);
  }, [code, bugId, update]);

  const fnSig = useMemo(() => {
    const m = /Firma en [^:]+: (.*?)\. /.exec(ch.polyglot[lang] || '');
    return m ? m[1] : '';
  }, [ch, lang]);

  const hitMe = useCallback((dmg) => {
    let fainted = null;
    let next = null;
    update((g) => {
      const team = g.team.map((m) => ({ ...m }));
      const i = team.findIndex((m) => m.hp > 0);
      if (i < 0) return g;
      team[i].hp = Math.max(0, team[i].hp - dmg);
      if (team[i].hp === 0) {
        fainted = daemonName(team[i]);
        const j = team.findIndex((m) => m.hp > 0);
        if (j >= 0) {
          next = daemonName(team[j]);
          const [m] = team.splice(j, 1);
          team.unshift(m);
        }
      }
      return { ...g, team };
    });
    return { fainted, next };
  }, [update]);

  const attack = useCallback(async () => {
    if (busy || phase !== 'fight') return;
    setBusy(true);
    play('run');
    const res = evaluate(ch, code, lang);
    setEvalRes(res);
    update((g) => ({ ...g, stats: { ...g.stats, attacks: (g.stats.attacks || 0) + 1 } }));
    const me = daemonName(active);
    const cases = (res.scene && res.scene.cases) || [];
    const n = spec.tests.length;
    const okCount = cases.filter((c) => c.ok).length;
    const testsCheck = res.checks.find((c) => c.id === 'tests');
    const shields = res.checks.filter((c) => c.id !== 'tests' && !c.ok);

    if (res.error) {
      play('error');
      setMsg(`¡${me} intenta atacar, pero el código ${res.error.kind === 'syntax' ? 'no compila' : 'se detiene'}!`);
      if (phone) setTab('code');
      if (res.error.line) setFocus({ line: res.error.line, t: Date.now() });
      await wait(1100);
    } else {
      setMsg(`¡${me} ejecuta ${cases[0] ? `${cases[0].input ? `la función con ${n} casos de prueba` : 'su código'}` : 'su código'}!`);
      await wait(700);
      if (okCount) {
        setFx((f) => ({ ...f, enemy: f.enemy + 1 }));
        play('pass');
        const target = Math.round(((n - okCount) / n) * 85 + (shields.length ? 15 : 0));
        setEnemyHp(res.passed ? 0 : Math.max(target, 4));
        setMsg(okCount === n ? `¡Golpe crítico! Pasa los ${n} casos de prueba.` : `¡Golpe! Pasa ${okCount} de ${n} casos.`);
        await wait(1000);
      } else {
        setMsg('El ataque no pasa ningún caso de prueba...');
        await wait(900);
      }
    }

    if (res.passed) {
      setFx((f) => ({ ...f, purify: true }));
      setMsg(`¡${bug.name} ha sido depurado! Su código vuelve a funcionar.`);
      play('xp');
      await wait(1300);
      // experiencia
      const g0 = gameRef.current;
      const solvedBefore = !!(g0.solved && g0.solved[bugId]);
      let xp = bug.xp * (trainer ? 1.25 : 1);
      if (used.solution) xp *= 0.3;
      else if (used.hint) xp *= 0.8;
      if (solvedBefore) xp *= 0.4;
      xp = Math.max(10, Math.round(xp));
      let lvlMsgs = [];
      let gotName = '';
      update((g) => {
        const team = g.team.map((m) => ({ ...m }));
        const i = Math.max(0, team.findIndex((m) => m.hp > 0));
        gotName = daemonName(team[i]);
        lvlMsgs = gainXp(team[i], xp);
        return { ...g, team, solved: { ...(g.solved || {}), [bugId]: true }, stats: { ...g.stats, solved: (g.stats.solved || 0) + (solvedBefore ? 0 : 1) } };
      });
      setMsg(`${gotName} gana ${xp} puntos de experiencia.`);
      await wait(1200);
      for (const m of lvlMsgs) {
        if (m.kind === 'level') { play('rankup'); setMsg(`¡${gotName} sube al nivel ${m.level}!`); await wait(1300); }
        if (m.kind === 'evolve') { setMsg(`¿Qué? ¡${m.from} está evolucionando!`); await wait(1400); play('rankup'); setMsg(`¡${m.from} ha evolucionado en ${m.to}!`); gotName = m.to; await wait(1700); }
      }
      setBusy(false);
      if (!trainer) {
        if (gameRef.current.dex.caught[bugId]) {
          setMsg(`Ya tenías un ${bug.name} en tu Bitdex. Se aleja feliz por la hierba.`);
          setPhase('done');
        } else {
          setMsg(`El ${bug.name} depurado te mira con curiosidad. ¿Quieres que se una a tu equipo?`);
          setPhase('capture');
        }
      } else if (index < battle.queue.length - 1) {
        setPhase('purified');
      } else {
        setMsg(`¡Has vencido a ${trainer.name}! Recibes ${trainer.bits} bits.`);
        update((g) => ({ ...g, bits: g.bits + trainer.bits, stats: { ...g.stats, wins: (g.stats.wins || 0) + 1 } }));
        setPhase('done');
      }
      return;
    }

    // Contraataque del bug
    setFails((k) => k + 1);
    const failCount = res.error ? 0 : n - okCount;
    const dmg = res.error ? 3 + bug.module : 2 + bug.module + Math.min(failCount, 4) + (trainer ? 1 : 0);
    if (!res.error && shields.length && okCount === n) {
      setMsg(`¡${bug.name} resiste con un escudo! Falta: ${shields.map((s) => s.label.toLowerCase()).join(', ')}.`);
      await wait(1400);
    } else if (!res.error && testsCheck && testsCheck.detail) {
      setMsg(`Pista del fallo: ${testsCheck.detail}.`);
      await wait(1600);
    }
    setMsg(`¡${bug.name} contraataca y causa ${dmg} de daño!`);
    play('glitch');
    setFx((f) => ({ ...f, me: f.me + 1 }));
    const { fainted, next } = hitMe(dmg);
    await wait(1000);
    if (fainted) {
      setMsg(`¡${fainted} se ha debilitado!`);
      await wait(1300);
      if (next) {
        setMsg(`¡Adelante, ${next}!`);
        await wait(1000);
      } else {
        setMsg('No te quedan daemons en pie... Volvéis corriendo al último Centro Daemon. Tu código se ha guardado.');
        setPhase('lost');
      }
    }
    if (!fainted || next) setMsg(res.error ? 'Arregla el error y vuelve a atacar.' : 'Revisa los casos que fallan y vuelve a atacar.');
    setBusy(false);
  }, [busy, phase, ch, code, lang, update, active, spec, phone, bug, bugId, trainer, used, index, battle.queue.length, hitMe]);

  // Ctrl+Enter ataca
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); attack(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attack]);

  const capture = (yes) => {
    if (yes) {
      update((g) => {
        const d = makeDaemon('bug', bugId, bugLevel(bugId));
        return { ...g, team: [...g.team, d], dex: { ...g.dex, caught: { ...g.dex.caught, [bugId]: true } } };
      });
      play('rankup');
      setMsg(`¡${bug.name} se une a tu equipo! Datos registrados en la Bitdex.`);
    } else {
      update((g) => ({ ...g, dex: { ...g.dex, caught: { ...g.dex.caught, [bugId]: true } } }));
      setMsg(`${bug.name} queda registrado en la Bitdex y vuelve a la hierba.`);
    }
    setPhase('done');
  };

  const useItem = (item) => {
    update((g) => {
      if (!g.bag[item]) return g;
      const team = g.team.map((m) => ({ ...m }));
      const i = Math.max(0, team.findIndex((m) => m.hp > 0));
      team[i].hp = Math.min(maxHpOf(team[i].level), team[i].hp + ITEMS[item].heal);
      return { ...g, team, bag: { ...g.bag, [item]: g.bag[item] - 1 } };
    });
    play('xp');
    setMsg(`${daemonName(active)} se toma un ${ITEMS[item].name.toLowerCase()} y recupera fuerzas.`);
    setModal(null);
  };

  const err = evalRes && evalRes.error;
  const pe = err ? plainError(err) : null;
  const cases = (evalRes && evalRes.scene && evalRes.scene.cases) || null;
  const bossFight = battle.trainer === 'boss';

  // ── Escena
  const scene = (
    <div className={`battle-scene ${bossFight ? 'battle-boss' : ''} relative overflow-hidden rounded-xl`}>
      {/* rival */}
      <div className="absolute left-3 top-3 w-[46%] max-w-[260px] rounded-lg border-2 border-slate-800 bg-slate-50/95 px-3 py-2 text-slate-900 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-extrabold">{bug.name}</span>
          <span className="text-[11px] font-bold">Nv{bug.module * 2 + 1}</span>
        </div>
        <div className="mb-1 mt-0.5 flex items-center gap-1"><TypeChip type={bug.type} />{game.dex.caught[bugId] && <span title="Ya en tu Bitdex" className="text-xs">◓</span>}</div>
        <div className="battle-hp"><HpBar value={enemyHp} max={100} showNumbers={false} light /></div>
      </div>
      <div className="absolute right-[6%] top-[12%] flex flex-col items-center">
        <motion.div key={`e${fx.enemy}`} animate={fx.enemy ? { x: [0, -8, 8, -5, 5, 0], opacity: [1, 0.3, 1, 0.3, 1] } : {}} transition={{ duration: 0.5 }}>
          <Creature look={{ ...bug.look, fangs: !fx.purify }} size={phone ? 104 : 136} glitch={fx.purify ? 0 : 1} />
        </motion.div>
        <div className="platform -mt-4" />
      </div>
      {trainer && (
        <div className="absolute right-[34%] top-[8%] opacity-80 max-sm:hidden"><Person look={trainer.look} size={44} /></div>
      )}
      {/* tu daemon */}
      <div className="absolute bottom-[6%] left-[6%] flex flex-col items-center">
        <motion.div key={`m${fx.me}-${active.uid}`} initial={{ x: -30, opacity: 0 }} animate={fx.me ? { x: [0, 6, -6, 4, 0], opacity: [1, 0.4, 1, 0.4, 1] } : { x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Creature look={daemonLook(active)} size={phone ? 112 : 150} flip />
        </motion.div>
        <div className="platform -mt-5" />
      </div>
      <div className="absolute bottom-3 right-3 w-[48%] max-w-[270px] rounded-lg border-2 border-slate-800 bg-slate-50/95 px-3 py-2 text-slate-900 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-extrabold">{daemonName(active)}</span>
          <span className="text-[11px] font-bold">Nv{active.level}</span>
        </div>
        <div className="battle-hp mt-1"><HpBar value={active.hp} max={maxHpOf(active.level)} light /></div>
        <div className="mt-1 h-1 overflow-hidden rounded bg-slate-300"><div className="h-full bg-sky-500" style={{ width: `${(active.xp / xpToNext(active.level)) * 100}%` }} /></div>
      </div>
      <AnimatePresence>
        {fx.purify && <motion.div key="flash" className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.9 }} />}
      </AnimatePresence>
    </div>
  );

  const actions = phase === 'fight' ? (
    <div className="grid grid-cols-4 gap-2">
      <button type="button" disabled={busy} onClick={attack} className="btn-action col-span-2 bg-rose-500 hover:bg-rose-400" title="Ctrl + Enter">⚔ ¡Atacar!<span className="block text-[10px] font-normal opacity-80">ejecuta tu código</span></button>
      <button type="button" disabled={busy} onClick={() => setModal('lesson')} className="btn-action bg-sky-600 hover:bg-sky-500">📖<span className="block text-[11px]">Lección</span></button>
      <button type="button" disabled={busy} onClick={() => { setUsed((u) => ({ ...u, hint: true })); setModal('hint'); }} className="btn-action bg-amber-500 text-slate-900 hover:bg-amber-400">💡<span className="block text-[11px]">Pista</span></button>
      <button type="button" disabled={busy} onClick={() => setModal('bag')} className="btn-action col-span-2 bg-emerald-600 hover:bg-emerald-500">🎒 Mochila</button>
      {trainer
        ? <button type="button" disabled className="btn-action col-span-2 bg-slate-700 opacity-50" title="No se puede huir de un combate contra un entrenador">🚫 No puedes huir</button>
        : <button type="button" disabled={busy} onClick={() => onEnd({ outcome: 'flee' })} className="btn-action col-span-2 bg-slate-600 hover:bg-slate-500">🏃 Huir</button>}
    </div>
  ) : phase === 'capture' ? (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => capture(true)} className="btn-action bg-emerald-600 hover:bg-emerald-500">◓ ¡Únete al equipo!</button>
      <button type="button" onClick={() => capture(false)} className="btn-action bg-slate-600 hover:bg-slate-500">Solo registrarlo</button>
    </div>
  ) : phase === 'purified' ? (
    <button type="button" onClick={() => setIndex((i) => i + 1)} className="btn-action w-full bg-rose-500 hover:bg-rose-400">Siguiente bug ▶</button>
  ) : phase === 'lost' ? (
    <button type="button" onClick={() => onEnd({ outcome: 'lose' })} className="btn-action w-full bg-slate-600 hover:bg-slate-500">Volver al Centro Daemon</button>
  ) : (
    <button type="button" onClick={() => onEnd({ outcome: 'win' })} className="btn-action w-full bg-emerald-600 hover:bg-emerald-500">Continuar ▶</button>
  );

  const casesPanel = (
    <div className="space-y-1.5">
      {!cases && !err && <p className="text-sm text-slate-400">Pulsa <b className="text-rose-300">¡Atacar!</b> para ejecutar tu función con los casos de prueba. Cada caso que pase es un golpe.</p>}
      {pe && (
        <div className="rounded-lg border border-rose-500/50 bg-rose-950/40 p-3 text-sm">
          <div className="font-bold text-rose-300">{pe.title}</div>
          <p className="mt-1 text-slate-200">{pe.what}</p>
          <p className="mt-1 text-amber-200">→ {pe.fix}</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-black/40 p-2 text-[11px] text-rose-200/80">{err.trace || err.message}</pre>
        </div>
      )}
      {cases && !err && cases.map((c, i) => (
        <div key={i} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] ${c.ok ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-rose-500/40 bg-rose-950/30'}`}>
          <span className={c.ok ? 'text-emerald-400' : 'text-rose-400'}>{c.ok ? '✔' : '✘'}</span>
          <code className="min-w-0 flex-1 truncate text-slate-200">{evalRes.scene.fnName}({c.input})</code>
          <span className="shrink-0 text-slate-400">espera <b className="text-slate-100">{c.expected}</b></span>
          {!c.ok && <span className="shrink-0 text-rose-300">da <b>{c.got}</b></span>}
        </div>
      ))}
      {evalRes && evalRes.checks.filter((c) => c.id !== 'tests').map((c) => (
        <div key={c.id} className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] ${c.ok ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/50 text-amber-200'}`}>{c.ok ? '🛡 Escudo roto: ' : '🛡 Escudo activo: '}{c.label}{!c.ok && c.help ? ` — ${c.help}` : ''}</div>
      ))}
      {evalRes && evalRes.output && evalRes.output.length > 0 && (
        <pre className="max-h-28 overflow-auto rounded bg-black/40 p-2 text-[11px] text-slate-300">{evalRes.output.slice(0, 20).join('\n')}</pre>
      )}
    </div>
  );

  const mission = (
    <div className="rounded-xl border-2 border-slate-700 bg-slate-900/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="pixel-font text-[9px] text-amber-300">Función corrupta</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300" style={{ color: LANGUAGES[lang].color }}>{LANGUAGES[lang].name}</span>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-snug text-slate-100">{spec.objective}</p>
      {fnSig && <code className="mt-1.5 block truncate text-[12px] text-sky-300">{fnSig}</code>}
    </div>
  );

  const editor = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <span>✎ Las líneas marcadas son las que tienes que cambiar</span>
        <button type="button" className="rounded bg-slate-800 px-2 py-0.5 hover:bg-slate-700" onClick={() => { if (window.confirm('¿Volver al código inicial? Perderás tus cambios.')) setCode(ch.starter[lang]); }}>↺ Reiniciar</button>
      </div>
      <div className={`min-h-0 flex-1 ${phone ? 'h-[46vh]' : ''}`}>
        <CodeEditor code={code} onChange={setCode} lang={lang} errorLine={err ? err.line : null} lintLines={[]} focus={focus} onRun={attack} keypad={phone} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 p-2 sm:p-3 lg:h-full lg:flex-row">
      <div className="flex flex-col gap-3 lg:w-[46%] lg:min-w-[420px]">
        <div className="h-[230px] sm:h-[300px]">{scene}</div>
        <div className="battle-msg">{msg}</div>
        {actions}
        {!phone && <div className="min-h-0 flex-1 overflow-y-auto">{casesPanel}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {mission}
        {phone ? (
          <>
            <div className="flex gap-1 rounded-lg bg-slate-900 p-1 text-sm">
              {[['code', 'Código'], ['cases', `Casos${cases ? ` (${cases.filter((c) => c.ok).length}/${cases.length})` : ''}`]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`flex-1 rounded-md py-1.5 font-bold ${tab === id ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>{label}{id === 'cases' && err ? ' ⚠' : ''}</button>
              ))}
            </div>
            {tab === 'code' ? editor : casesPanel}
          </>
        ) : editor}
      </div>

      {modal === 'lesson' && (
        <Modal title={`Lección · ${lesson.steps[0].title}`} onClose={() => setModal(null)} wide>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[15px] leading-relaxed text-slate-100">{lesson.steps[0].text}</p>
              {lesson.steps[0].code && lesson.steps[0].code[lang] && (
                <>
                  <div className="mt-3 text-[11px] uppercase tracking-wider text-slate-400">Ejemplo en {LANGUAGES[lang].name}</div>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-black/50 p-3 text-[13px] text-sky-200">{lesson.steps[0].code[lang]}</pre>
                </>
              )}
              <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-950/30 p-3 text-sm text-amber-100"><b>Tu misión:</b> {lesson.mission[lang]}</div>
            </div>
            <div className="min-h-[220px] overflow-hidden rounded-xl bg-slate-950/70"><LessonVisual kind={lesson.steps[0].visual} lang={lang} /></div>
          </div>
        </Modal>
      )}
      {modal === 'hint' && (
        <Modal title="Pista" onClose={() => setModal(null)}>
          <p className="text-[15px] text-slate-100">{spec.hint}</p>
          <p className="mt-2 text-sm text-slate-300">{ch.polyglot[lang]}</p>
          <p className="mt-3 text-xs text-slate-500">Usar la pista reduce un poco la experiencia que ganas.</p>
          {fails >= 2 ? (
            <div className="mt-4 rounded-lg border border-slate-700 p-3">
              <p className="text-sm text-slate-300">¿Atascada, atascado? Puedes ver la solución explicada. Ganarás mucha menos experiencia, pero aprenderás cómo se hace.</p>
              <button type="button" className="mt-2 rounded-md bg-slate-700 px-3 py-1.5 text-sm font-bold hover:bg-slate-600" onClick={() => { setUsed((u) => ({ ...u, solution: true })); setCode(ch.solution[lang]); setModal(null); setMsg('Has cargado la solución. Léela con calma y luego ataca.'); }}>Ver la solución</button>
            </div>
          ) : <p className="mt-4 text-xs text-slate-500">Si fallas dos ataques, aquí podrás ver la solución.</p>}
        </Modal>
      )}
      {modal === 'bag' && (
        <Modal title="Mochila" onClose={() => setModal(null)}>
          {Object.entries(ITEMS).map(([id, it]) => (
            <div key={id} className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-slate-800/70 p-3">
              <div><div className="font-bold">{it.name} ×{game.bag[id] || 0}</div><div className="text-xs text-slate-400">{it.desc}</div></div>
              <button type="button" disabled={!game.bag[id] || active.hp >= maxHpOf(active.level)} onClick={() => useItem(id)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-bold disabled:opacity-40">Usar</button>
            </div>
          ))}
        </Modal>
      )}
      {modal === 'tutorial' && (
        <Modal title="¡Tu primera batalla!" onClose={() => setModal(null)}>
          <ol className="space-y-3 text-[15px] leading-relaxed text-slate-100">
            <li><b className="text-amber-300">1.</b> Este bug ha corrompido una función. Arriba a la derecha tienes qué debe hacer.</li>
            <li><b className="text-amber-300">2.</b> Escribe el código en el editor. Las líneas con <span className="text-amber-300">✎</span> son las que tienes que cambiar.</li>
            <li><b className="text-amber-300">3.</b> Pulsa <b className="text-rose-300">⚔ ¡Atacar!</b> Tu función se ejecuta con varios casos de prueba: cada uno que pasa es un golpe.</li>
            <li><b className="text-amber-300">4.</b> Si algo falla, el bug contraataca. Mira qué esperaba y qué ha dado tu función, y vuelve a intentarlo.</li>
            <li><b className="text-amber-300">5.</b> ¿No sabes por dónde empezar? <b className="text-sky-300">📖 Lección</b> te lo explica con un ejemplo.</li>
          </ol>
          <button type="button" onClick={() => setModal(null)} className="btn-action mt-4 w-full bg-rose-500">¡Entendido!</button>
        </Modal>
      )}
    </div>
  );
}
