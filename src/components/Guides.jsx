import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, MonitorPlay, ListChecks, Terminal, ChevronRight, X, Eye } from 'lucide-react';
import { highlight } from './highlight.js';
import { LESSONS } from '../curriculum/lessons.js';
import { LANGUAGES } from '../core/languages.js';
import { play } from '../core/sound.js';

/** Barra de confirmación dentro de la página (los diálogos del navegador no siempre están disponibles). */
export function ConfirmBar({ text, confirm, onConfirm, onCancel }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neon-amber/30 bg-neon-amber/10 px-3 py-2 text-xs text-amber-100" role="alertdialog">
      <span className="flex-1">{text}</span>
      <button type="button" onClick={onCancel} className="rounded px-2 py-1 text-slate-300 hover:text-white">Cancelar</button>
      <button type="button" onClick={onConfirm} className="rounded bg-neon-amber px-2 py-1 font-bold text-void-950">{confirm}</button>
    </div>
  );
}

const TOUR = [
  { icon: Code2, color: '#22e4ff', title: 'El editor', text: 'A la izquierda escribes el código. Las líneas con ✎ son las que tienes que cambiar. Debajo, una barra te explica en castellano la línea donde está el cursor.' },
  { icon: MonitorPlay, color: '#a3ff3d', title: 'El mundo en vivo', text: 'A la derecha, tu código se ejecuta solo cada vez que paras de escribir. Si funciona, el mundo reacciona; si hay un fallo, se «rompe» (glitch). Pulsa los fragmentos rotos para saltar a la línea culpable.' },
  { icon: ListChecks, color: '#ffb534', title: 'Los checks', text: 'Debajo del editor tienes la lista de objetivos. Cuando todos están en verde, superas la misión. Si uno falla, pulsa «¿Cómo?» para ver qué hacer.' },
  { icon: Terminal, color: '#ff3df0', title: 'Consola y variables', text: 'Abajo a la derecha ves lo que imprime tu programa, los errores explicados en palabras sencillas y tus variables dibujadas como cajas.' },
];

/** Tour de 4 pasos la primera vez que se entra en la arena. */
export function ArenaTour({ open, onClose }) {
  const [i, setI] = useState(0);
  const step = TOUR[i];
  const Icon = step.icon;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-void-950/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass w-full max-w-md rounded-2xl p-5" role="dialog" aria-label="Cómo funciona la arena">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Cómo funciona · {i + 1}/{TOUR.length}</span>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Saltar tour"><X size={16} /></button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `${step.color}1f`, color: step.color }}><Icon size={24} /></div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{step.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{step.text}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex justify-end">
              {i < TOUR.length - 1 ? (
                <button type="button" onClick={() => { setI(i + 1); play('click'); }} className="btn-neon bg-neon-cyan/20 text-neon-cyan">Siguiente <ChevronRight size={14} /></button>
              ) : (
                <button type="button" onClick={() => { setI(0); onClose(); play('run'); }} className="btn-neon bg-neon-lime text-void-950">Entendido</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Solución explicada (último recurso; cuenta como pista y cuesta la estrella de autonomía). */
export function SolutionPanel({ ch, lang, open, onClose, onReveal, onLoad }) {
  const [revealed, setRevealed] = useState(false);
  const L = LANGUAGES[lang];
  const sol = ch.solution[lang].trim();
  const close = () => { setRevealed(false); onClose(); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-void-950/80 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl" role="dialog" aria-label="Solución explicada">
            <div className="flex items-center justify-between border-b border-void-600/50 px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white"><Eye size={16} className="text-neon-violet" /> Solución explicada · {L.name}</div>
              <button type="button" onClick={close} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!revealed ? (
                <div className="space-y-3 text-[13px] leading-relaxed text-slate-300">
                  <p>Ver la solución está bien cuando de verdad te has atascado: también se aprende leyendo código que funciona.</p>
                  <p className="rounded-lg border border-neon-amber/40 bg-neon-amber/5 px-3 py-2 text-amber-100">Cuenta como pista: en esta misión perderás la estrella de autonomía (★ sin pistas). Las otras dos siguen en juego.</p>
                  <p className="text-slate-400">Antes, prueba a repasar la lección o a preguntar al pato.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-neon-lime/40 bg-neon-lime/5 p-3 text-[13px] leading-relaxed text-lime-50">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neon-lime">Qué cambia y por qué</div>
                    {LESSONS[ch.id] && LESSONS[ch.id].mission[lang]}
                  </div>
                  <pre className="editor-layer max-h-[45vh] overflow-auto rounded-xl border border-void-600/60 bg-void-950 p-3" dangerouslySetInnerHTML={{ __html: highlight(sol, lang) }} />
                  <p className="text-[12px] text-slate-400">Consejo: en vez de cargarla, intenta escribir tú los cambios mirándola. Se retiene mucho mejor.</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-void-600/50 px-5 py-3">
              {!revealed ? (
                <>
                  <button type="button" onClick={close} className="btn-neon text-slate-300">Lo intento otra vez</button>
                  <button type="button" onClick={() => { setRevealed(true); onReveal(); play('duck'); }} className="btn-neon bg-neon-violet/25 text-violet-100">Mostrar solución</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={close} className="btn-neon text-slate-300">La escribo yo</button>
                  <button type="button" onClick={() => { onLoad(ch.solution[lang]); setRevealed(false); }} className="btn-neon bg-neon-cyan/20 text-neon-cyan">Cargar en el editor</button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
