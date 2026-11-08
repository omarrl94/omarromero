import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor.jsx';
import LiveCanvas from '../components/LiveCanvas.jsx';
import { byId, objectiveOf, sceneOf } from '../curriculum/index.js';
import { LESSONS, CHECK_HELP } from '../curriculum/lessons.js';
import LessonBook from './Lesson.jsx';
import { evaluate } from '../core/engine.js';
import { plainError } from '../core/explain.js';
import { LANGUAGES } from '../core/languages.js';
import { sfx } from './assets.js';
import BattleScene from './BattleScene.jsx';
import { useMedia, PHONE } from '../core/useMedia.js';
import { BUG, daemonSprite, daemonName, maxHpOf, xpToNext } from './species.js';
import { gainXp, makeDaemon, bugLevel, ITEMS } from './save.js';
import { TRAINERS } from './world.js';
import { LESSON_NO, chapterOf, guideLevel, linesToWrite, lessonLabel } from './curriculum.js';
import { HpBar, Face, TypeChip, Modal } from './ui.jsx';

/** Ayuda «¿cómo lo arreglo?» de una comprobación, en el lenguaje del jugador. */
const helpOf = (c, lang) => {
  const h = CHECK_HELP[c.id];
  if (typeof h === 'string') return h;
  if (h) return h[lang] || h.default || c.help;
  return c.help;
};

/**
 * Puntuación de un ataque. En los niveles de práctica cuenta cada caso de prueba (y cada
 * «escudo»: usar un bucle, recursión...); en las misiones de historia, cada objetivo.
 */
function scoreOf(res) {
  const cases = (res.scene && res.scene.cases) || null;
  const others = res.checks.filter((c) => c.id !== 'tests');
  if (cases && cases.length) {
    const okCases = cases.filter((c) => c.ok).length;
    return { n: cases.length + others.length, ok: okCases + others.filter((c) => c.ok).length, unit: 'casos', cases: true };
  }
  return { n: Math.max(1, res.checks.length), ok: res.checks.filter((c) => c.ok).length, unit: 'objetivos', cases: false };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Quita la sangría común para mostrar unas líneas de código sueltas. */
const dedent = (lines) => {
  const ind = Math.min(...lines.map((l) => l.match(/^\s*/)[0].length));
  return lines.map((l) => l.slice(ind)).join('\n');
};

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
  const ch = byId(bugId);
  const lesson = LESSONS[bugId];
  const objective = objectiveOf(ch, lang);
  const hintText = (lesson && lesson.mission && lesson.mission[lang]) || ch.polyglot[lang] || '';
  const [runId, setRunId] = useState(0);
  const chap = chapterOf(bugId);
  const isExam = !!chap && chap.exam.drills.includes(bugId);

  const [code, setCode] = useState(() => game.drafts[bugId] || ch.starter[lang]);
  const [enemyHp, setEnemyHp] = useState(100);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('fight'); // fight | purified | capture | done | lost
  const [evalRes, setEvalRes] = useState(null);
  const [fx, setFx] = useState({ enemy: 0, me: 0, purify: false });
  const [modal, setModal] = useState(null); // lesson | newlesson | hint | bag | tutorial
  const modalQueue = useRef([]);
  const [guide] = useState(() => guideLevel(game));
  const closeModal = useCallback(() => {
    if (modal === 'newlesson') update((g) => ({ ...g, learned: { ...(g.learned || {}), [bugId]: true } }));
    const nextModal = modalQueue.current.shift();
    setModal(nextModal || null);
  }, [modal, bugId, update]);
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
    setFx((f) => ({ ...f, purify: false }));
    setPhase('fight');
    setEvalRes(null);
    setFails(0);
    setUsed({ hint: false, solution: false });
    setCode(gameRef.current.drafts[bugId] || byId(bugId).starter[lang]);
    setMsg(trainer
      ? (index === 0 ? `¡${trainer.name} te reta! Lanza a ${BUG[bugId].name}.` : `¡${trainer.name} lanza a ${BUG[bugId].name}!`)
      : `¡Un ${BUG[bugId].name} salvaje apareció! Ha corrompido una función.`);
    update((g) => ({ ...g, dex: { ...g.dex, seen: { ...g.dex.seen, [bugId]: true } } }));
    // Antes de luchar: cómo funciona un combate (la primera vez) y la lección de cada concepto nuevo.
    const q = [];
    if (battle.tutorial && index === 0) q.push('tutorial');
    if (!(gameRef.current.learned && gameRef.current.learned[bugId])) q.push('newlesson');
    modalQueue.current = q;
    setModal(modalQueue.current.shift() || null);
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
    sfx('magic', 0.5);
    const res = evaluate(ch, code, lang);
    setEvalRes(res);
    setRunId((k) => k + 1);
    update((g) => ({ ...g, stats: { ...g.stats, attacks: (g.stats.attacks || 0) + 1 } }));
    const me = daemonName(active);
    const { n, ok: okCount, unit, cases: isDrill } = scoreOf(res);
    const firstFail = res.checks.find((c) => !c.ok);

    if (res.error) {
      sfx('cancel');
      setMsg(`¡${me} intenta atacar, pero el código ${res.error.kind === 'syntax' ? 'no compila' : 'se detiene'}!`);
      if (phone) setTab('code');
      if (res.error.line) setFocus({ line: res.error.line, t: Date.now() });
      await wait(1100);
    } else {
      setMsg(isDrill ? `¡${me} ejecuta la función con sus casos de prueba!` : `¡${me} ejecuta tu programa!`);
      await wait(700);
      if (okCount) {
        setFx((f) => ({ ...f, enemy: f.enemy + 1 }));
        sfx('impact');
        setEnemyHp(res.passed ? 0 : Math.max(Math.round(((n - okCount) / n) * 100), 6));
        setMsg(okCount === n ? `¡Golpe crítico! Cumple los ${n} ${unit}.` : `¡Golpe! Cumple ${okCount} de ${n} ${unit}.`);
        await wait(1000);
      } else {
        setMsg(`El ataque no cumple ningún ${unit === 'casos' ? 'caso de prueba' : 'objetivo'}...`);
        await wait(900);
      }
    }

    if (res.passed) {
      setFx((f) => ({ ...f, purify: true }));
      setMsg(`¡${bug.name} ha sido depurado! Su código vuelve a funcionar.`);
      sfx('explosion');
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
        if (m.kind === 'level') { sfx('levelup'); setMsg(`¡${gotName} sube al nivel ${m.level}!`); await wait(1300); }
        if (m.kind === 'evolve') { setMsg(`¿Qué? ¡${m.from} está evolucionando!`); await wait(1400); sfx('levelup'); setMsg(`¡${m.from} ha evolucionado en ${m.to}!`); gotName = m.to; await wait(1700); }
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
    if (!res.error && firstFail) {
      setMsg(`Falla: ${firstFail.label}${firstFail.detail ? ` — ${firstFail.detail}` : ''}.`);
      await wait(1800);
    }
    setMsg(`¡${bug.name} contraataca y causa ${dmg} de daño!`);
    sfx('hit');
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
    if (!fainted || next) setMsg(res.error ? 'Arregla el error y vuelve a atacar.' : `Revisa los ${unit} que fallan y vuelve a atacar.`);
    setBusy(false);
  }, [busy, phase, ch, code, lang, update, active, phone, bug, bugId, trainer, used, index, battle.queue.length, hitMe]);

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
      sfx('success');
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
    sfx('heal');
    setMsg(`${daemonName(active)} se toma un ${ITEMS[item].name.toLowerCase()} y recupera fuerzas.`);
    setModal(null);
  };

  const err = evalRes && evalRes.error;
  const pe = err ? plainError(err) : null;
  const cases = (evalRes && evalRes.scene && evalRes.scene.cases) || null;
  const bossFight = battle.trainer === 'boss';


  // ── Escena
  const enemyLevel = bug.module * 2 + 1;
  const scene = (
    <div className="battle-frame relative h-full overflow-hidden">
      <BattleScene enemy={bug.sprite} mine={{ ...daemonSprite(active), uid: active.uid }} fx={fx} boss={bossFight} />
      <div className="hud-card absolute left-2 top-2 w-[48%] max-w-[250px]">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-bold">{bug.name}</span>
          <span className="text-xs font-bold text-[#7a4a2e]">Nv{enemyLevel}</span>
        </div>
        <div className="my-0.5 flex items-center gap-1"><TypeChip type={bug.type} />{game.dex.caught[bugId] && <span title="Ya en tu Bitdex" className="text-xs text-[#2f7d32]">● Bitdex</span>}</div>
        <HpBar value={enemyHp} max={100} showNumbers={false} />
      </div>
      {trainer && <div className="absolute right-2 top-2 max-sm:hidden"><Face look={trainer.look} size={40} /></div>}
      <div className="hud-card absolute bottom-2 right-2 w-[50%] max-w-[260px]">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-bold">{daemonName(active)}</span>
          <span className="text-xs font-bold text-[#7a4a2e]">Nv{active.level}</span>
        </div>
        <HpBar value={active.hp} max={maxHpOf(active.level)} />
        <div className="xp-track mt-1"><div className="xp-fill" style={{ width: `${(active.xp / xpToNext(active.level)) * 100}%` }} /></div>
      </div>
    </div>
  );

  const actions = phase === 'fight' ? (
    <div className="grid grid-cols-4 gap-2">
      <button type="button" disabled={busy} onClick={attack} className="act-btn act-attack col-span-2" title="Ctrl + Enter">⚔ ¡Atacar!<span className="block text-[11px] font-normal opacity-90">ejecuta tu código</span></button>
      <button type="button" disabled={busy} onClick={() => setModal('lesson')} className="act-btn act-blue">Lección</button>
      <button type="button" disabled={busy} onClick={() => { setUsed((u) => ({ ...u, hint: true })); setModal('hint'); }} className="act-btn act-yellow">Pista</button>
      <button type="button" disabled={busy} onClick={() => setModal('bag')} className="act-btn act-green col-span-2">Mochila</button>
      {trainer
        ? <button type="button" disabled className="act-btn act-grey col-span-2" title="No se puede huir de un combate contra un entrenador">No puedes huir</button>
        : <button type="button" disabled={busy} onClick={() => { sfx('cancel'); onEnd({ outcome: 'flee' }); }} className="act-btn act-grey col-span-2">Huir</button>}
    </div>
  ) : phase === 'capture' ? (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => capture(true)} className="act-btn act-green">¡Únete al equipo!</button>
      <button type="button" onClick={() => capture(false)} className="act-btn act-grey">Solo registrarlo</button>
    </div>
  ) : phase === 'purified' ? (
    <button type="button" onClick={() => setIndex((i) => i + 1)} className="act-btn act-attack w-full">Siguiente bug ▸</button>
  ) : phase === 'lost' ? (
    <button type="button" onClick={() => onEnd({ outcome: 'lose' })} className="act-btn act-grey w-full">Volver al Centro Daemon</button>
  ) : (
    <button type="button" onClick={() => onEnd({ outcome: 'win' })} className="act-btn act-green w-full">Continuar ▸</button>
  );

  const isMission = !ch.drill;
  const casesPanel = (
    <div className="space-y-1.5">
      {isMission && (
        <div className="visor">
          <div className="visor-label">Simulación en vivo · lo que hace tu código</div>
          <div className="h-[190px] sm:h-[220px]">
            <LiveCanvas sceneName={sceneOf(ch, lang)} data={{ ...(evalRes ? evalRes.scene : {}), passed: !!(evalRes && evalRes.passed) }} error={err} lang={lang} runId={runId} onJumpLine={(line) => setFocus({ line, t: Date.now() })} />
          </div>
        </div>
      )}
      {!evalRes && <p className="pp-note">Pulsa <b>¡Atacar!</b> para ejecutar tu código. {isMission ? 'Cada objetivo que cumpla es un golpe.' : 'Cada caso de prueba que pase es un golpe.'}</p>}
      {pe && (
        <div className="case-card case-bad p-3 text-sm">
          <div className="font-bold text-[#b3261e]">{pe.title}</div>
          <p className="mt-1">{pe.what}</p>
          <p className="mt-1 font-bold text-[#7a4a2e]">→ {pe.fix}</p>
          <pre className="code-dark mt-2 whitespace-pre-wrap text-[11px]">{err.trace || err.message}</pre>
        </div>
      )}
      {cases && !err && cases.map((c, i) => (
        <div key={i} className={`case-card flex items-center gap-2 px-2.5 py-1.5 text-[13px] ${c.ok ? 'case-ok' : 'case-bad'}`}>
          <span className="font-bold">{c.ok ? '✔' : '✘'}</span>
          <code className="min-w-0 flex-1 truncate font-mono text-[12px]">{evalRes.scene.fnName}({c.input})</code>
          <span className="shrink-0">espera <b>{c.expected}</b></span>
          {!c.ok && <span className="shrink-0 text-[#b3261e]">da <b>{c.got}</b></span>}
        </div>
      ))}
      {evalRes && evalRes.checks.filter((c) => !(cases && c.id === 'tests')).map((c) => (
        <div key={c.id} className={`case-card px-2.5 py-1.5 text-[13px] ${c.ok ? 'case-ok' : 'case-warn'}`}>
          <div className="flex items-start gap-2"><span className="font-bold">{c.ok ? '✔' : '✘'}</span><span className="flex-1"><b>{c.label}</b>{c.detail && !c.ok ? <span className="block text-[12px]">{c.detail}</span> : null}</span></div>
          {!c.ok && helpOf(c, lang) && <div className="mt-1 pl-5 text-[12.5px] text-[#7a4a2e]">¿Cómo? {helpOf(c, lang)}</div>}
        </div>
      ))}
      {evalRes && evalRes.output && evalRes.output.length > 0 && (
        <pre className="code-dark max-h-28 overflow-auto text-[11px]">{evalRes.output.slice(0, 20).join('\n')}</pre>
      )}
    </div>
  );

  const mission = (
    <div className="pp-panel !py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="pixel-title text-lg text-[#7a3b1e]">{isExam ? 'Examen' : 'Lección'} {LESSON_NO[bugId]} · {lessonLabel(bugId)}</span>
        <span className="lang-chip" style={{ background: LANGUAGES[lang].color }}>{LANGUAGES[lang].name}</span>
      </div>
      <p className="mt-0.5 text-[14px] leading-snug">{objective}</p>
      {fnSig && <code className="mt-1 block truncate font-mono text-[12.5px] text-[#2a5d8f]">{fnSig}</code>}
    </div>
  );

  const solvedBefore = !!(game.solved && game.solved[bugId]);
  const toWrite = guide === 2 && !solvedBefore ? linesToWrite(ch.starter[lang], ch.solution[lang]) : [];
  const guideBox = !solvedBefore && guide > 0 && phase === 'fight' ? (
    <div className="guide-box p-2.5 text-[14px] leading-snug">
      <div className="pixel-title text-lg text-[#c0561f]">{guide === 2 ? 'Modo guiado · paso a paso' : 'Ayuda para empezar'}</div>
      {guide === 2 ? (
        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
          <li>Lee arriba qué tiene que hacer tu código.</li>
          <li>Qué cambiar: {hintText}</li>
          {toWrite.length > 0 && toWrite.length <= 6 && (
            <li>Estas son las líneas que faltan (escríbelas tú, así se aprende; las marcadas con ✎ son las que hay que cambiar):
              <pre className="code-dark mt-1 text-[13px]">{dedent(toWrite)}</pre>
            </li>
          )}
          <li>Pulsa <b>⚔ ¡Atacar!</b> para probarlo.</li>
        </ol>
      ) : (
        <p className="mt-1">{hintText}</p>
      )}
    </div>
  ) : null;

  const editor = (
    <div className="editor-shell flex min-h-0 flex-1 flex-col">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1 text-[12px] text-[#f3e3c8]">
        <span>✎ Las líneas marcadas son las que tienes que cambiar</span>
        <button type="button" className="shrink-0 rounded bg-[#5a3a28] px-2 py-0.5 hover:bg-[#6d4732]" onClick={() => { if (window.confirm('¿Volver al código inicial? Perderás tus cambios.')) setCode(ch.starter[lang]); }}>↺ Reiniciar</button>
      </div>
      <div className={`min-h-0 flex-1 ${phone ? 'h-[46vh]' : ''}`}>
        <CodeEditor code={code} onChange={setCode} lang={lang} errorLine={err ? err.line : null} lintLines={[]} focus={focus} onRun={attack} keypad={phone} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 p-2 sm:p-3 lg:h-full lg:flex-row">
      <div className="flex flex-col gap-2.5 lg:w-[46%] lg:min-w-[440px]">
        <div className="aspect-[256/150] w-full">{scene}</div>
        <div className="pp-panel battle-text">{msg}</div>
        {actions}
        {!phone && <div className="min-h-0 flex-1 overflow-y-auto pr-1">{casesPanel}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5">
        {mission}
        {guideBox}
        {phone ? (
          <>
            <div className="tabbar flex gap-1 p-1 text-sm">
              {[['code', 'Código'], ['cases', `${isMission ? 'Resultado' : 'Casos'}${evalRes ? ` (${scoreOf(evalRes).ok}/${scoreOf(evalRes).n})` : ''}`]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`flex-1 rounded-md py-1.5 font-bold ${tab === id ? 'tab-on' : 'tab-off'}`}>{label}{id === 'cases' && err ? ' ⚠' : ''}</button>
              ))}
            </div>
            {tab === 'code' ? editor : casesPanel}
          </>
        ) : editor}
      </div>

      {modal === 'lesson' && (
        <Modal title={`Lección ${LESSON_NO[bugId]} · ${lessonLabel(bugId)}`} onClose={() => setModal(null)} wide>
          <LessonBook id={bugId} lang={lang} onDone={() => setModal(null)} doneLabel="Volver al combate" />
        </Modal>
      )}
      {modal === 'hint' && (
        <Modal title="Pista" onClose={() => setModal(null)}>
          <p className="text-[15px]">{hintText}</p>
          {ch.polyglot[lang] && ch.polyglot[lang] !== hintText && <p className="mt-2 text-sm text-[#6b4a35]">{ch.polyglot[lang]}</p>}
          <p className="mt-3 text-xs text-[#8a6a55]">Usar la pista reduce un poco la experiencia que ganas.</p>
          {fails >= 2 ? (
            <div className="case-card mt-4 p-3">
              <p className="text-sm">¿Te has atascado? Puedes ver la solución. Ganarás mucha menos experiencia, pero aprenderás cómo se hace.</p>
              <button type="button" className="pp-btn mt-2" onClick={() => { setUsed((u) => ({ ...u, solution: true })); setCode(ch.solution[lang]); setModal(null); setMsg('Has cargado la solución. Léela con calma y luego ataca.'); }}>Ver la solución</button>
            </div>
          ) : <p className="mt-4 text-xs text-[#8a6a55]">Si fallas dos ataques, aquí podrás ver la solución.</p>}
        </Modal>
      )}
      {modal === 'bag' && (
        <Modal title="Mochila" onClose={() => setModal(null)}>
          {Object.entries(ITEMS).map(([id, it]) => (
            <div key={id} className="case-card mb-2 flex items-center justify-between gap-3 p-3">
              <div><div className="font-bold">{it.name} ×{game.bag[id] || 0}</div><div className="text-xs text-[#6b4a35]">{it.desc}</div></div>
              <button type="button" disabled={!game.bag[id] || active.hp >= maxHpOf(active.level)} onClick={() => useItem(id)} className="pp-btn">Usar</button>
            </div>
          ))}
        </Modal>
      )}
      {modal === 'newlesson' && (
        <Modal title={`Nuevo concepto · ${isExam ? 'Examen' : 'Lección'} ${LESSON_NO[bugId]}`} onClose={closeModal} wide>
          {chap && <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#b5651d]">Capítulo {chap.n} · {chap.title} · {lessonLabel(bugId)}</div>}
          <LessonBook id={bugId} lang={lang} onDone={closeModal} />
        </Modal>
      )}
      {modal === 'tutorial' && (
        <Modal title="¡Tu primer combate!" onClose={closeModal}>
          <ol className="space-y-2.5 text-[15px] leading-relaxed">
            <li><b className="text-[#c0561f]">1.</b> Este bug ha corrompido un programa. Arriba a la derecha tienes lo que tiene que hacer.</li>
            <li><b className="text-[#c0561f]">2.</b> Escribe el código en el editor. Las líneas con ✎ son las que tienes que cambiar.</li>
            <li><b className="text-[#c0561f]">3.</b> Pulsa <b>⚔ ¡Atacar!</b> Tu código se ejecuta y se comprueba: cada objetivo que cumple es un golpe.</li>
            <li><b className="text-[#c0561f]">4.</b> Si algo falla, el bug contraataca. Debajo verás qué objetivo falla y cómo arreglarlo. Vuelve a intentarlo.</li>
            <li><b className="text-[#c0561f]">5.</b> ¿No sabes por dónde empezar? <b>Lección</b> te lo explica con un ejemplo.</li>
          </ol>
          <button type="button" onClick={closeModal} className="act-btn act-attack mt-4 w-full">¡Entendido!</button>
        </Modal>
      )}
    </div>
  );
}
