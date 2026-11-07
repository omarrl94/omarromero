import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SLOTS, loadSlot, deleteSlot, fmtTime } from './save.js';
import { STARTERS, daemonLook, daemonName } from './species.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { Creature } from './ui.jsx';

/** Pantalla de título: ranuras de guardado y nueva partida. */
export function Title({ onLoad, onNew, onFirstTouch }) {
  const [slots, setSlots] = useState(() => SLOTS.map(loadSlot));
  const [naming, setNaming] = useState(null); // ranura
  const [name, setName] = useState('');
  const [hero, setHero] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHero((h) => (h + 1) % LANG_ORDER.length), 2200);
    return () => clearInterval(id);
  }, []);
  const look = STARTERS[LANG_ORDER[hero]].look;

  return (
    <div className="title-bg flex min-h-full flex-col items-center justify-center px-4 py-8" onPointerDown={onFirstTouch}>
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }} className="text-center">
        <div className="pixel-font text-[11px] tracking-[0.3em] text-sky-300">CODEFORGE II</div>
        <h1 className="pixel-font title-logo mt-3 text-3xl leading-tight sm:text-5xl">BITLANDIA</h1>
        <div className="mt-2 text-sm text-slate-300 sm:text-base">Aprende a programar. Depura bugs. Salva el mundo.</div>
      </motion.div>

      <div className="my-6 flex flex-col items-center">
      <div className="flex h-40 items-end justify-center sm:h-44">
        <motion.div key={hero} initial={{ scale: 0.4, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>
          <Creature look={look} size={160} />
        </motion.div>
      </div>
        <div className="mt-2 text-center">
          <span className="pixel-font text-[9px]" style={{ color: LANGUAGES[LANG_ORDER[hero]].color }}>{STARTERS[LANG_ORDER[hero]].names[0]} · {LANGUAGES[LANG_ORDER[hero]].name}</span>
        </div>
      </div>

      <div className="w-full max-w-md space-y-2">
        {SLOTS.map((s) => {
          const g = slots[s];
          if (naming === s) {
            return (
              <form key={s} className="panel p-3" onSubmit={(e) => { e.preventDefault(); onNew(s, name.trim() || 'Ada'); }}>
                <label className="pixel-font block text-[9px] text-amber-300" htmlFor="hero-name">¿Cómo te llamas?</label>
                <input id="hero-name" autoFocus maxLength={12} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada" className="mt-2 w-full rounded-lg border-2 border-slate-600 bg-slate-900 px-3 py-2 text-lg text-white outline-none focus:border-amber-300" />
                <div className="mt-2 flex gap-2">
                  <button type="submit" className="btn-action flex-1 bg-rose-500">¡Empezar aventura!</button>
                  <button type="button" onClick={() => setNaming(null)} className="btn-action bg-slate-700">Cancelar</button>
                </div>
              </form>
            );
          }
          return g ? (
            <div key={s} className="panel flex items-center gap-3 p-2.5">
              <button type="button" onClick={() => onLoad(s, g)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                {g.team[0] ? <Creature look={daemonLook(g.team[0])} size={52} still /> : <div className="h-[52px] w-[52px] rounded-lg bg-slate-800" />}
                <div className="min-w-0">
                  <div className="font-bold text-white">▶ Continuar · {g.name}</div>
                  <div className="truncate text-xs text-slate-400">
                    {g.lang ? `${LANGUAGES[g.lang].name} · ${g.team[0] ? `${daemonName(g.team[0])} Nv${g.team[0].level}` : ''} · ` : 'Sin daemon · '}
                    {(g.medals || []).length} medallas · {fmtTime(g.playMs)}
                  </div>
                </div>
              </button>
              <button type="button" title="Borrar partida" onClick={() => { if (window.confirm(`¿Borrar la partida de ${g.name}? No se puede deshacer.`)) { deleteSlot(s); setSlots(SLOTS.map(loadSlot)); } }} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400">🗑</button>
            </div>
          ) : (
            <button key={s} type="button" onClick={() => { setNaming(s); setName(''); }} className="panel w-full p-3 text-left font-bold text-slate-200 hover:border-amber-300">
              ✚ Nueva partida <span className="text-xs font-normal text-slate-500">(ranura {s + 1})</span>
            </button>
          );
        })}
      </div>
      <p className="mt-6 max-w-md text-center text-xs leading-relaxed text-slate-500">
        Un RPG de criaturas donde cada combate es un reto de programación real en Python, JavaScript, Java, C#, Kotlin, Swift, C, C++, Go o Rust.
      </p>
    </div>
  );
}

/** Elección del daemon inicial (que es también tu lenguaje de programación). */
export function StarterPick({ onPick }) {
  const [sel, setSel] = useState('python');
  const s = STARTERS[sel];
  const looks = useMemo(() => Object.fromEntries(LANG_ORDER.map((l) => [l, { ...STARTERS[l].look, stage: 0 }])), []);
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/95 p-3 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="pixel-font text-center text-sm text-amber-300 sm:text-base">Elige tu daemon</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-300">Cada daemon habla un lenguaje de programación. El que elijas será el lenguaje en el que programarás toda la aventura.</p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {LANG_ORDER.map((l) => (
            <button key={l} type="button" onClick={() => setSel(l)} className={`flex flex-col items-center rounded-xl border-2 p-1.5 transition ${sel === l ? 'scale-105 border-amber-300 bg-slate-800' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
              <Creature look={looks[l]} size={56} still={sel !== l} />
              <span className="text-[10px] font-bold sm:text-xs" style={{ color: LANGUAGES[l].color }}>{LANGUAGES[l].name}</span>
            </button>
          ))}
        </div>
        <motion.div key={sel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel mt-4 flex flex-col items-center gap-4 p-4 sm:flex-row">
          <Creature look={looks[sel]} size={150} />
          <div className="flex-1">
            <div className="text-2xl font-extrabold">{s.names[0]}</div>
            <div className="text-sm text-slate-400">Daemon tipo {s.type} · evoluciona en {s.names[1]} y {s.names[2]}</div>
            <p className="mt-2 text-[15px] text-slate-100">{s.blurb}</p>
            <p className="mt-2 text-sm text-slate-300"><b style={{ color: LANGUAGES[sel].color }}>{LANGUAGES[sel].name}:</b> {LANGUAGES[sel].tagline}</p>
            <button type="button" onClick={() => onPick(sel)} className="btn-action mt-4 w-full bg-rose-500 sm:w-auto sm:px-8">¡Elijo a {s.names[0]}!</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
