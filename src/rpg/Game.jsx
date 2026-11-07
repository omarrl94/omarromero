import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import Overworld, { TouchPad } from './Overworld.jsx';
import Battle from './Battle.jsx';
import { Title, StarterPick } from './Title.jsx';
import { PauseMenu, TeamView, DexView, BagView, CardView, OptionsView, ShopView } from './Menus.jsx';
import { DialogBox, Creature, CreatureFace, HpBar } from './ui.jsx';
import { newGame, saveSlot, makeDaemon, healAll, fmtTime } from './save.js';
import { BUGS, STARTERS, daemonSprite, daemonName, maxHpOf, creaturePaths } from './species.js';
import { TRAINERS, MEDALS, CENTERS, CHARACTERS, zoneAt, tileAt } from './world.js';
import { playMusic, unlockAudio, setAudio, sfx, preload } from './assets.js';
import { TILE_PATHS } from './art.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { appReady } from '../core/native.js';

const say = (who, look, lines) => lines.map((s) => ({ say: s, who, look }));
const PROF = ['Profesora Lambda', 'prof'];

/** Objetivo actual, para no perderse nunca. */
function objective(g) {
  const f = g.flags;
  if (!f.starter) return 'Ve al laboratorio de la Profesora Lambda (el edificio del tejado verde).';
  if (!f.rival1) return 'Vuelve al laboratorio: Kai quiere la revancha.';
  if (!f.medal1) return 'Sube por la Ruta 1 hasta Ciudad Byte y gana la Medalla Variable.';
  if (!f.medal2) return 'Cruza el Bosque Bucle y vence a Bruno en Ciudad Bucle.';
  if (!f.medal3) return 'Cruza el puente del Lago Array y vence a Ingrid en Pueblo Índice.';
  if (!f.medal4) return 'Entra en la Torre Recursiva y vence a Rémi.';
  if (!f.boss) return 'Sube a la Cumbre Algoritmo y entra en la Cueva Null.';
  const left = 32 - Object.keys(g.dex.caught).length;
  return left ? `¡Has salvado Bitlandia! Completa la Bitdex: faltan ${left} bugs por depurar.` : '¡Bitdex completa! Eres una leyenda de Bitlandia.';
}

export default function Game() {
  const [slot, setSlot] = useState(null);
  const [game, setGame] = useState(null);
  const gameRef = useRef(null);
  const update = useCallback((fn) => {
    const prev = gameRef.current;
    if (!prev) return prev;
    const next = fn(prev);
    if (next !== prev) { gameRef.current = next; setGame(next); }
    return next;
  }, []);
  const load = (s, g) => { gameRef.current = g; setGame(g); setSlot(s); setWarp((w) => w + 1); };

  const [script, setScript] = useState(null); // { queue: [...] }
  const [battle, setBattle] = useState(null);
  const [panel, setPanel] = useState(null); // pause | team | dex | bag | card | options | shop
  const [picking, setPicking] = useState(null); // pasos pendientes tras elegir daemon
  const [shopAfter, setShopAfter] = useState(null);
  const [credits, setCredits] = useState(false);
  const [warp, setWarp] = useState(0);
  const [banner, setBanner] = useState(null);
  const [toast, setToast] = useState(null);
  const controls = useRef(null);
  const lastZone = useRef(null);
  const sinceEncounter = useRef(0);

  useEffect(() => { appReady(); }, []);

  // ── precarga de gráficos
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    const paths = [
      ...TILE_PATHS, ...creaturePaths(),
      ...Object.values(CHARACTERS).flatMap((c) => [`char/${c}.png`, `char/${c}-face.png`]),
      'ui/emote-alert.png', 'ui/DialogueBoxSimple.png', 'fx/slash.png', 'fx/explosion.png', 'fx/spark.png', 'fx/smoke.png',
    ];
    preload(paths, (k) => setLoaded(Math.min(0.99, k))).then(() => setLoaded(1));
  }, []);

  // ── sonido y música
  const settings = game ? game.settings : { music: true, sound: true };
  useEffect(() => { setAudio({ music: settings.music, sound: settings.sound }); }, [settings.sound, settings.music]);
  const zone = game ? zoneAt(game.pos.y) : null;
  const track = !game ? 'title' : credits ? 'ending' : battle ? (battle.trainer === 'boss' ? 'boss' : 'battle') : zone.music;
  useEffect(() => { playMusic(track); }, [track]);
  useEffect(() => {
    const once = () => { unlockAudio(); window.removeEventListener('pointerdown', once); window.removeEventListener('keydown', once); };
    window.addEventListener('pointerdown', once);
    window.addEventListener('keydown', once);
    return () => { window.removeEventListener('pointerdown', once); window.removeEventListener('keydown', once); };
    // solo la primera vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── guardado automático y tiempo de juego
  useEffect(() => {
    if (!game || slot === null) return undefined;
    const t = setTimeout(() => saveSlot(slot, game), 700);
    return () => clearTimeout(t);
  }, [game, slot]);
  useEffect(() => {
    if (!game) return undefined;
    const id = setInterval(() => { if (document.visibilityState === 'visible') update((g) => ({ ...g, playMs: g.playMs + 15000 })); }, 15000);
    return () => clearInterval(id);
  }, [!!game, update]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text) => { setToast(text); setTimeout(() => setToast(null), 2200); };

  // ── guiones
  const run = useCallback((steps) => setScript({ queue: steps }), []);

  const afterBattleWin = (b) => {
    const tr = b.trainer ? TRAINERS[b.trainer] : null;
    if (!tr) return b.after || [];
    const steps = [...say(tr.name, tr.look, tr.win), { set: tr.flag }];
    if (tr.medal) steps.push({ medal: tr.medal }, { say: `¡Has conseguido la ${MEDALS[tr.medal - 1]}!`, sfx: 'levelup' });
    if (b.trainer === 'boss') {
      steps.push(
        { say: '...', who: PROF[0], look: PROF[1] },
        ...say(PROF[0], PROF[1], ['¡Lo has conseguido! He venido en cuanto he visto que el cielo dejaba de parpadear.', 'El Gran Compilador vuelve a funcionar. Los bugs que quedan ya no tienen quien los guíe.', 'Gracias. Bitlandia te debe una.']),
        { credits: true },
      );
    }
    return [...steps, ...(b.after || [])];
  };

  const startBattle = useCallback((desc) => {
    const g = gameRef.current;
    const tutorial = !g.flags.tutorial;
    if (tutorial) update((x) => ({ ...x, flags: { ...x.flags, tutorial: true } }));
    sfx('alert');
    setBattle({ ...desc, tutorial, key: Date.now() });
  }, [update]);

  // Ejecuta pasos automáticos (todo lo que no es diálogo).
  useEffect(() => {
    if (!script) return;
    const [head, ...rest] = script.queue;
    if (!head) { setScript(null); return; }
    if (head.say || head.choice) return; // los muestra la caja de diálogo
    const next = () => setScript(rest.length ? { queue: rest } : null);
    if (head.dyn) { setScript({ queue: [...head.dyn(gameRef.current), ...rest] }); return; }
    if (head.set) { update((g) => ({ ...g, flags: { ...g.flags, [head.set]: true } })); next(); return; }
    if (head.heal) { update(healAll); sfx('heal'); next(); return; }
    if (head.give) { update((g) => ({ ...g, bag: { ...g.bag, [head.give]: (g.bag[head.give] || 0) + head.n } })); next(); return; }
    if (head.medal) { update((g) => ({ ...g, medals: [...new Set([...(g.medals || []), head.medal])] })); next(); return; }
    if (head.battle) { setScript(null); startBattle({ trainer: head.battle, queue: TRAINERS[head.battle].team, after: rest }); return; }
    if (head.starter) { setScript(null); setPicking(rest); return; }
    if (head.shop) { setScript(null); setShopAfter(rest); setPanel('shop'); return; }
    if (head.credits) { setScript(null); setCredits(true); return; }
    next();
  }, [script, update, startBattle]);

  const advance = () => {
    const [head, ...rest] = script.queue;
    if (head && head.sfx) sfx(head.sfx);
    sfx('move', 0.35);
    setScript(rest.length ? { queue: rest } : null);
  };
  const choose = (i) => {
    const [head, ...rest] = script.queue;
    sfx('accept');
    setScript({ queue: [...head.options[i][1], ...rest] });
  };

  // ── interacciones del mapa
  const nurse = () => [
    ...say('Enfermera Ram', 'nurse', ['¡Bienvenida, bienvenido al Centro Daemon! Vamos a recargar a tu equipo...']),
    { heal: true },
    { say: '¡Listo! Tu equipo está como nuevo. Si tu equipo se debilita, volverás al Centro más cercano.', who: 'Enfermera Ram', look: 'nurse' },
    { choice: '¿Quieres comprar algo en la tienda?', who: 'Enfermera Ram', look: 'nurse', options: [['Ver la tienda', [{ shop: true }]], ['No, gracias', [{ say: '¡Hasta pronto!', who: 'Enfermera Ram', look: 'nurse' }]]] },
  ];

  const labIntro = (g) => [
    ...say(PROF[0], PROF[1], [
      `¡Hola, ${g.name}! Soy la Profesora Lambda. Te estaba esperando.`,
      'En Bitlandia viven los daemons: criaturas hechas de código que ayudan a las personas en todo.',
      'Pero desde hace semanas aparecen bugs: criaturas corruptas que rompen las funciones de todo lo que tocan.',
      'Detrás de todo está la Legión Null. Quieren corromper el Gran Compilador y llenar el mundo de errores.',
      'Un bug solo se detiene de una forma: depurándolo. Es decir, ¡arreglando la función que ha roto!',
      'Por eso necesito programadores valientes. Aquí tienes mis daemons: cada uno habla un lenguaje de programación distinto.',
      'Elige con calma: el lenguaje de tu daemon será el lenguaje en el que programarás toda la aventura.',
    ]),
    { starter: true },
    {
      dyn: (x) => {
        const s = STARTERS[x.lang];
        const rivalLang = LANG_ORDER[(LANG_ORDER.indexOf(x.lang) + 3) % LANG_ORDER.length];
        return [
          { say: `¡${s.names[0]}! Una elección estupenda. ${LANGUAGES[x.lang].name}: ${LANGUAGES[x.lang].tagline}`, who: PROF[0], look: PROF[1] },
          { say: '¡Abuela! ¡Digo... Profesora! ¡Yo también quiero un daemon!', who: 'Kai', look: 'rival' },
          { say: 'Kai, mi nieto. Siempre llega tarde... Venga, elige tú también.', who: PROF[0], look: PROF[1] },
          { say: `¡Me quedo con ${STARTERS[rivalLang].names[0]}, que habla ${LANGUAGES[rivalLang].name}! ¡Seguro que es mejor que el tuyo!`, who: 'Kai', look: 'rival' },
          ...say('Kai', 'rival', TRAINERS.rival1.intro),
          { battle: 'rival1' },
          ...say(PROF[0], PROF[1], [
            '¡Fantástico! Así se depura un bug: lees qué tiene que hacer la función, la arreglas y la pruebas.',
            'Toma, unos cafés: devuelven la energía a tus daemons.',
          ]),
          { give: 'cafe', n: 2 },
          ...say(PROF[0], PROF[1], [
            'Los bugs que depures en la hierba alta podrán unirse a tu equipo. Se registran en tu Bitdex.',
            'Tu primer objetivo: sube por la Ruta 1 hasta Ciudad Byte. Allí está el Gimnasio Variable.',
            '¡Buen viaje! Y recuerda: un error no es un fracaso. Es una pista.',
          ]),
        ];
      },
    },
  ];

  const doorScript = (door, g) => {
    if (door === 'home') return [...say('Mamá', 'mom', [g.flags.starter ? '¡Hola, cariño! Descansad un poco.' : '¡Corre al laboratorio! La profesora te espera.']), ...(g.flags.starter ? [{ heal: true }, { say: 'Tu equipo ha recuperado todas sus fuerzas.' }] : [])];
    if (door === 'lab') {
      if (!g.flags.starter) return labIntro(g);
      if (!g.flags.rival1) return [...say('Kai', 'rival', ['¡Revancha! Esta vez no tendrás tanta suerte.']), { battle: 'rival1' }];
      return [...say(PROF[0], PROF[1], [objective(g), `Tu Bitdex: ${Object.keys(g.dex.caught).length} bugs depurados de 32. ¡Sigue así!`]), { heal: true }];
    }
    if (door === 'center') return nurse();
    if (door.startsWith('gym')) {
      const tr = TRAINERS[door];
      if (g.flags[tr.flag]) return say(tr.name, tr.look, [`Ya tienes la ${MEDALS[tr.medal - 1]}. ¡Sigue tu camino!`]);
      return [...say(tr.name, tr.look, tr.intro), { battle: door }];
    }
    if (door === 'house-byte') return say('Vecino', 'elder', ['Mi nieta dice que en Python no hacen falta llaves { }, que basta con la sangría.', '¡En mis tiempos todo llevaba punto y coma!']);
    if (door === 'house-byte2') return say('Vecina', 'girl', ['¿Has probado a explicarle tu código a un pato de goma? Al contarlo en voz alta, muchas veces el error aparece solo.']);
    return [{ say: 'La puerta está cerrada.' }];
  };

  const onAction = useCallback((a) => {
    const g = gameRef.current;
    if (script || battle || panel) return;
    sfx('accept', 0.4);
    if (a.type === 'sign') return run(a.lines.map((s) => ({ say: s })));
    if (a.type === 'firewall') {
      const need = { '15,64': 1, '15,44': 2, '15,29': 3, '4,17': 4 }[`${a.x},${a.y}`];
      return run([{ say: `Un cortafuegos bloquea el paso. Mensaje: «Acceso solo con la ${MEDALS[need - 1]}».` }]);
    }
    if (a.type === 'door') return run(doorScript(a.door, g));
    if (a.type === 'npc') {
      const n = a.npc;
      if (n.trainer) {
        const tr = TRAINERS[n.trainer];
        if (g.flags[tr.flag]) return run(say(tr.name, tr.look, [tr.win[tr.win.length - 1]]));
        return run([...say(tr.name, tr.look, tr.intro), { battle: n.trainer }]);
      }
      const lines = typeof n.lines === 'function' ? n.lines(g) : n.lines;
      return run(say(n.name, n.look, lines));
    }
    return undefined;
  }, [script, battle, panel, run]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMoved = useCallback((x, y, dir) => {
    update((g) => ({ ...g, pos: { x, y, dir } }));
    const z = zoneAt(y);
    if (lastZone.current !== z.id) {
      lastZone.current = z.id;
      setBanner(z.name);
      setTimeout(() => setBanner((b) => (b === z.name ? null : b)), 2600);
    }
    const ch = tileAt(x, y);
    const g = gameRef.current;
    if ((ch === ',' || ch === 'k') && g.team.length && z.modules.length) {
      sinceEncounter.current += 1;
      if (sinceEncounter.current >= 3 && Math.random() < 0.13) {
        sinceEncounter.current = 0;
        const pool = BUGS.filter((b) => z.modules.includes(b.module));
        const fresh = pool.filter((b) => !g.dex.caught[b.id]);
        const pickFrom = fresh.length && Math.random() < 0.7 ? fresh : pool;
        const b = pickFrom[Math.floor(Math.random() * pickFrom.length)];
        startBattle({ queue: [b.id] });
      }
    }
  }, [update, startBattle]);

  const endBattle = (res) => {
    const b = battle;
    setBattle(null);
    if (res.outcome === 'win') {
      const steps = afterBattleWin(b);
      if (steps.length) run(steps);
    } else if (res.outcome === 'lose') {
      const g = gameRef.current;
      const c = CENTERS.find((k) => g.pos.y >= k.minY) || CENTERS[0];
      const lost = Math.floor(g.bits * 0.1);
      update((x) => ({ ...healAll(x), pos: { x: c.x, y: c.y, dir: 'down' }, bits: x.bits - lost }));
      setWarp((w) => w + 1);
      run([{ say: `Has vuelto corriendo al Centro Daemon${lost ? ` y se te han caído ${lost} bits por el camino` : ''}. Tu equipo está recuperado.` }, { say: 'Tu código se ha guardado: cuando vuelvas a enfrentarte a ese bug, seguirás donde lo dejaste.' }]);
    } else if (res.outcome === 'flee') {
      flash('¡Has escapado sin problemas!');
    }
  };

  const pickStarter = (lang) => {
    const rest = picking;
    setPicking(null);
    sfx('success');
    update((g) => ({ ...g, lang, team: [makeDaemon('starter', lang, 1)], flags: { ...g.flags, starter: true } }));
    run(rest);
  };

  const newSlot = (s, name) => {
    const g = newGame(name);
    gameRef.current = g;
    setGame(g);
    setSlot(s);
    setWarp((w) => w + 1);
    saveSlot(s, g);
    lastZone.current = null;
    run([
      { say: `Bitlandia. Un mundo donde todo funciona gracias al código... y a los daemons.` },
      { say: `Hoy, ${name}, empieza tu aventura como programadora o programador.` },
      { say: 'Usa las flechas (o la cruceta) para moverte y Z, Espacio o el botón A para hablar. Ve al laboratorio del tejado verde.' },
    ]);
  };

  const quit = () => { if (slot !== null && game) saveSlot(slot, game); setPanel(null); setGame(null); gameRef.current = null; setSlot(null); setScript(null); setBattle(null); };

  // ───────────────────────── render ─────────────────────────
  if (loaded < 1) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#1a120e] p-6">
        <div className="title-logo pixel-title text-5xl">Bitlandia</div>
        <div className="hp-track w-64"><div className="hp-fill" style={{ width: `${loaded * 100}%`, background: '#f0b53a' }} /></div>
        <div className="text-sm text-[#e8d5b5]">Cargando el mundo…</div>
      </div>
    );
  }

  if (!game) {
    return (
      <MotionConfig reducedMotion="user">
        <Title onLoad={(s, g) => { lastZone.current = null; load(s, g); }} onNew={newSlot} onFirstTouch={unlockAudio} />
      </MotionConfig>
    );
  }

  const head = script && script.queue[0];
  const dialog = head && (head.say || head.choice) ? head : null;
  const locked = !!(script || battle || panel || picking || credits);
  const leadMon = game.team[0];

  return (
    <MotionConfig reducedMotion="user">
      <div className="game-bg flex min-h-full flex-col">
        {battle ? (
          <div className="flex min-h-full flex-1 flex-col lg:h-screen">
            <Battle key={battle.key} game={game} update={update} battle={battle} onEnd={endBattle} />
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="pixel-title hidden text-2xl text-[#ffd98a] drop-shadow sm:inline">Bitlandia</span>
                <span className="hdr-chip truncate">{zone.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="hdr-chip">{game.bits} bits</span>
                <span className="hdr-chip">{(game.medals || []).length}/4 medallas</span>
                <button type="button" onClick={() => !locked && setPanel('pause')} className="pp-btn hidden sm:inline">Menú</button>
              </div>
            </header>
            <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-4 px-2 pb-2 sm:px-4 lg:flex-row lg:items-start">
              <div className="relative w-full lg:flex-1">
                <div className="overworld-frame">
                  <Overworld game={game} locked={locked} warp={warp} followerSprite={leadMon ? daemonSprite(leadMon) : null} onMoved={onMoved} onAction={onAction} onMenu={() => !locked && setPanel('pause')} controlsRef={controls} />
                  <AnimatePresence>
                    {banner && (
                      <motion.div key={banner} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className="zone-banner pixel-title">{banner}</motion.div>
                    )}
                    {toast && <motion.div key={toast} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pp-panel absolute bottom-3 left-1/2 -translate-x-1/2 !py-1.5 text-sm font-bold">{toast}</motion.div>}
                  </AnimatePresence>
                  {dialog && (
                    <div className="absolute inset-x-1 bottom-1 sm:inset-x-3 sm:bottom-3">
                      <DialogBox who={dialog.who} look={dialog.look} text={dialog.say || dialog.choice} onNext={advance} choices={dialog.choice ? dialog.options.map((o) => o[0]) : null} onChoice={choose} />
                    </div>
                  )}
                </div>
                <TouchPad controlsRef={controls} onMenu={() => !locked && setPanel('pause')} />
              </div>
              <aside className="hidden w-[300px] shrink-0 flex-col gap-3 lg:flex">
                <div className="pp-panel">
                  <div className="pixel-title text-lg text-[#7a3b1e]">Objetivo</div>
                  <p className="mt-0.5 text-[15px] leading-snug">{objective(game)}</p>
                </div>
                <div className="pp-panel">
                  <div className="pixel-title mb-1 text-lg text-[#7a3b1e]">Equipo · {game.lang ? LANGUAGES[game.lang].name : '—'}</div>
                  {game.team.length === 0 && <p className="text-sm">Aún no tienes daemons.</p>}
                  {game.team.slice(0, 6).map((m) => (
                    <div key={m.uid} className="mb-1.5 flex items-center gap-2">
                      <div className="face-frame shrink-0"><CreatureFace sprite={daemonSprite(m)} size={32} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between text-sm"><span className="truncate font-bold">{daemonName(m)}</span><span>Nv{m.level}</span></div>
                        <HpBar value={m.hp} max={maxHpOf(m.level)} showNumbers={false} />
                      </div>
                    </div>
                  ))}
                  {game.team.length > 6 && <p className="text-xs">+{game.team.length - 6} más</p>}
                </div>
                <div className="pp-panel text-xs leading-relaxed">
                  <b>Controles:</b> flechas/WASD · Mayús corre · Z/Espacio habla · X/Esc menú
                  <div className="mt-1">Bitdex {Object.keys(game.dex.caught).length}/32 · {fmtTime(game.playMs)}</div>
                </div>
              </aside>
            </main>
          </>
        )}

        {picking && <StarterPick onPick={pickStarter} />}
        {panel === 'pause' && <PauseMenu game={game} onClose={() => setPanel(null)} onOpen={setPanel} onSave={() => { saveSlot(slot, game); setPanel(null); flash('Partida guardada ✔'); }} onQuit={quit} />}
        {panel === 'team' && game.team.length > 0 && <TeamView game={game} update={update} onClose={() => setPanel('pause')} />}
        {panel === 'team' && game.team.length === 0 && <BagView game={game} onClose={() => setPanel('pause')} />}
        {panel === 'dex' && <DexView game={game} onClose={() => setPanel('pause')} />}
        {panel === 'bag' && <BagView game={game} onClose={() => setPanel('pause')} />}
        {panel === 'card' && game.lang && <CardView game={game} onClose={() => setPanel('pause')} />}
        {panel === 'card' && !game.lang && <BagView game={game} onClose={() => setPanel('pause')} />}
        {panel === 'options' && <OptionsView game={game} update={update} onClose={() => setPanel('pause')} />}
        {panel === 'shop' && <ShopView game={game} update={update} onClose={() => { setPanel(null); const r = shopAfter; setShopAfter(null); if (r && r.length) run(r); }} />}
        {credits && <Credits game={game} onClose={() => { setCredits(false); }} />}
      </div>
    </MotionConfig>
  );
}

function Credits({ game, onClose }) {
  const lead = game.team[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1a120e]/95 p-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="max-w-lg text-center">
        <div className="pixel-title text-xl text-[#ffe2b0]">Fin... ¿o no?</div>
        <h2 className="pixel-title title-logo mt-2 text-5xl sm:text-6xl">¡Bitlandia a salvo!</h2>
        {lead && <div className="my-4 flex justify-center"><div className="creature-stage"><Creature sprite={daemonSprite(lead)} size={150} /></div></div>}
        <p className="text-lg text-[#fff3dc]">{game.name} y {lead ? daemonName(lead) : 'su equipo'} han derrotado a la Legión Null programando en {LANGUAGES[game.lang].name}.</p>
        <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2 text-sm">
          <div className="pp-panel !p-2">Funciones arregladas<br /><b className="text-[#b5651d]">{Object.keys(game.solved || {}).length}</b></div>
          <div className="pp-panel !p-2">Bitdex<br /><b className="text-[#b5651d]">{Object.keys(game.dex.caught).length}/32</b></div>
          <div className="pp-panel !p-2">Ataques<br /><b className="text-[#b5651d]">{game.stats.attacks || 0}</b></div>
          <div className="pp-panel !p-2">Tiempo<br /><b className="text-[#b5651d]">{fmtTime(game.playMs)}</b></div>
        </div>
        <p className="mt-4 text-sm text-[#e8d5b5]">La aventura continúa: aún quedan bugs salvajes por depurar. ¿Completarás la Bitdex? ¿Y si empiezas otra partida con un lenguaje distinto?</p>
        <button type="button" onClick={onClose} className="act-btn act-attack mt-5 px-8">Seguir explorando</button>
      </motion.div>
    </div>
  );
}
