import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SLOTS, loadSlot, deleteSlot, fmtTime } from './save.js';
import { STARTERS, daemonSprite, daemonName } from './species.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { Creature, CreatureFace } from './ui.jsx';
import { buildGround, buildObjects, T } from './art.js';
import { W, H } from './world.js';
import { drawCreatureSprite, sfx } from './assets.js';

/** Fondo del título: un paseo lento por Bitlandia con los daemons iniciales caminando. */
function WorldBackdrop() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const ground = buildGround();
    const objects = buildObjects();
    const VW = 26;
    const VH = 15;
    let raf = 0;
    const t0 = performance.now();
    const walkers = LANG_ORDER.map((l, i) => ({ sprite: STARTERS[l].sprites[0], x: -20 - i * 34, y: 0 }));
    const loop = (now) => {
      const t = (now - t0) / 1000;
      // recorre el mapa de sur a norte y vuelta
      const span = (H - VH) * T;
      const k = (Math.sin(t * 0.025 - Math.PI / 2) + 1) / 2;
      const camY = Math.round(span * (1 - k));
      const camX = Math.round(((W - VW) * T) / 2);
      g.drawImage(ground, camX, camY, VW * T, VH * T, 0, 0, VW * T, VH * T);
      const vis = objects.filter((o) => o.y >= camY / T - 3 && o.y <= camY / T + VH + 2).sort((a, b) => a.base - b.base);
      for (const o of vis) o.draw(g, camX, camY, t, {});
      // desfile de daemons
      for (const w of walkers) {
        w.x += 0.35;
        if (w.x > VW * T + 20) w.x = -20 - 10 * 34 + VW * T;
        drawCreatureSprite(g, w.sprite, w.x, VH * T - 10, 1, { t: t + w.x, dir: 'right' });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={26 * 16} height={15 * 16} className="pixelated absolute inset-0 h-full w-full object-cover" aria-hidden="true" />;
}

/** Pantalla de título: ranuras de guardado y nueva partida. */
export function Title({ onLoad, onNew, onFirstTouch }) {
  const [slots, setSlots] = useState(() => SLOTS.map(loadSlot));
  const [naming, setNaming] = useState(null);
  const [name, setName] = useState('');
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-8" onPointerDown={onFirstTouch} onKeyDown={onFirstTouch}>
      <WorldBackdrop />
      <div className="absolute inset-0 bg-gradient-to-b from-[#120c08]/55 via-[#120c08]/25 to-[#120c08]/70" />
      <div className="relative z-10 flex w-full flex-col items-center">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 110 }} className="text-center">
          <div className="pixel-title text-lg tracking-[0.35em] text-[#ffe2b0] drop-shadow">CODEFORGE II</div>
          <h1 className="title-logo pixel-title mt-1 text-6xl sm:text-8xl">Bitlandia</h1>
          <div className="mt-2 text-lg font-bold text-[#fff3dc] drop-shadow sm:text-xl">Aprende a programar · Depura bugs · Salva el mundo</div>
        </motion.div>

        <div className="mt-8 w-full max-w-md space-y-2.5">
          {SLOTS.map((s) => {
            const g = slots[s];
            if (naming === s) {
              return (
                <form key={s} className="pp-panel" onSubmit={(e) => { e.preventDefault(); sfx('accept'); onNew(s, name.trim() || 'Ada'); }}>
                  <label className="pixel-title block text-xl text-[#7a3b1e]" htmlFor="hero-name">¿Cómo te llamas?</label>
                  <input id="hero-name" autoFocus maxLength={12} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada" className="pp-input mt-2 w-full" />
                  <div className="mt-3 flex gap-2">
                    <button type="submit" className="act-btn act-attack flex-1">¡Empezar la aventura!</button>
                    <button type="button" onClick={() => setNaming(null)} className="act-btn act-grey">Cancelar</button>
                  </div>
                </form>
              );
            }
            return g ? (
              <div key={s} className="pp-panel flex items-center gap-3 !py-2">
                <button type="button" onClick={() => { sfx('accept'); onLoad(s, g); }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="face-frame shrink-0">{g.team[0] ? <CreatureFace sprite={daemonSprite(g.team[0])} size={40} /> : <div style={{ width: 40, height: 40 }} />}</div>
                  <div className="min-w-0">
                    <div className="text-lg font-bold">▸ Continuar · {g.name}</div>
                    <div className="truncate text-xs text-[#6b4a35]">
                      {g.lang ? `${LANGUAGES[g.lang].name} · ${g.team[0] ? `${daemonName(g.team[0])} Nv${g.team[0].level}` : ''} · ` : 'Sin daemon · '}
                      {(g.medals || []).length} medallas · {fmtTime(g.playMs)}
                    </div>
                  </div>
                </button>
                <button type="button" title="Borrar partida" onClick={() => { if (window.confirm(`¿Borrar la partida de ${g.name}? No se puede deshacer.`)) { deleteSlot(s); setSlots(SLOTS.map(loadSlot)); } }} className="pp-btn !px-2 !py-1 text-sm">Borrar</button>
              </div>
            ) : (
              <button key={s} type="button" onClick={() => { sfx('accept'); setNaming(s); setName(''); }} className="pp-panel block w-full text-left text-lg font-bold hover:brightness-105">
                ✚ Nueva partida <span className="text-sm font-normal text-[#7a5a45]">(ranura {s + 1})</span>
              </button>
            );
          })}
        </div>
        <p className="mt-6 max-w-md text-center text-sm font-bold text-[#fff3dc] drop-shadow">
          Un RPG de criaturas donde cada combate es un reto de programación real en Python, JavaScript, Java, C#, Kotlin, Swift, C, C++, Go o Rust.
        </p>
      </div>
    </div>
  );
}

/** Elección del daemon inicial (que es también tu lenguaje de programación). */
export function StarterPick({ onPick }) {
  const [sel, setSel] = useState('python');
  const s = STARTERS[sel];
  const sprites = useMemo(() => Object.fromEntries(LANG_ORDER.map((l) => [l, STARTERS[l].sprites])), []);
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#1a120e]/85 p-3 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="pp-panel">
          <h2 className="pixel-title text-center text-3xl text-[#7a3b1e]">Elige tu daemon</h2>
          <p className="mx-auto mt-1 max-w-xl text-center text-sm">Cada daemon habla un lenguaje de programación. El que elijas será el lenguaje en el que programarás toda la aventura.</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {LANG_ORDER.map((l) => (
              <button key={l} type="button" onClick={() => { sfx('move'); setSel(l); }} className={`menu-tile flex flex-col items-center !p-1.5 ${sel === l ? 'menu-tile-on' : ''}`}>
                <CreatureFace sprite={sprites[l][0]} size={44} />
                <span className="mt-0.5 text-[11px] font-bold sm:text-xs">{LANGUAGES[l].name}</span>
              </button>
            ))}
          </div>
        </div>
        <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pp-panel mt-3 flex flex-col items-center gap-4 sm:flex-row">
          <div className="creature-stage"><Creature sprite={sprites[sel][0]} size={150} /></div>
          <div className="flex-1">
            <div className="pixel-title text-4xl text-[#7a3b1e]">{s.names[0]}</div>
            <div className="text-sm text-[#6b4a35]">Daemon tipo {s.type} · lenguaje <b>{LANGUAGES[sel].name}</b></div>
            <p className="mt-2 text-[15px]">{s.blurb}</p>
            <p className="mt-1 text-sm text-[#6b4a35]">{LANGUAGES[sel].tagline}</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7a5a45]">Evoluciones</span>
              {sprites[sel].slice(1).map((sp, i) => (
                <div key={sp.key} className="flex flex-col items-center"><CreatureFace sprite={sp} size={38} /><span className="text-[11px]">{s.names[i + 1]}</span></div>
              ))}
            </div>
            <button type="button" onClick={() => onPick(sel)} className="act-btn act-attack mt-4 w-full sm:w-auto sm:px-8">¡Elijo a {s.names[0]}!</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
