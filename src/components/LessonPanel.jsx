import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, GraduationCap, Target, X } from 'lucide-react';
import LessonVisual from './LessonVisuals.jsx';
import { highlight } from './highlight.js';
import { LESSONS, lessonSteps } from '../curriculum/lessons.js';
import { LANGUAGES } from '../core/languages.js';
import { objectiveOf } from '../curriculum/index.js';
import { play } from '../core/sound.js';

/** «Aprende primero»: lección visual paso a paso antes de cada misión. */
export default function LessonPanel({ ch, lang, open, onClose }) {
  const steps = lessonSteps(ch.id, lang);
  const lesson = LESSONS[ch.id];
  const total = steps.length + 1; // + la tarjeta «Tu misión»
  const [i, setI] = useState(0);
  const go = (n) => { setI(Math.max(0, Math.min(total - 1, n))); play('click'); };
  const last = i === total - 1;
  const step = steps[i];
  const L = LANGUAGES[lang];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-void-950/80 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="glass flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl neon-border"
            role="dialog"
            aria-label={`Lección: ${ch.concept.title}`}
          >
            <div className="flex items-center gap-3 border-b border-void-600/50 px-5 py-3">
              <GraduationCap className="text-neon-lime" size={20} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-neon-lime">Aprende primero · {ch.concept.title}</div>
                <div className="truncate text-sm text-slate-300">Antes de «{ch.title}», lo que necesitas saber en {L.name}</div>
              </div>
              <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white" aria-label="Cerrar lección"><X size={18} /></button>
            </div>
            <div className="flex gap-1.5 px-5 pt-3">
              {Array.from({ length: total }).map((_, k) => (
                <button key={k} type="button" onClick={() => go(k)} aria-label={`Paso ${k + 1}`} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: k <= i ? '#a3ff3d' : '#252c45' }} />
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {!last ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-extrabold text-white" style={{ textWrap: 'balance' }}>{step.title}</h2>
                      <div className="rounded-xl border border-void-600/60 bg-void-950/50 p-4">
                        <LessonVisual kind={step.visual} lang={lang} />
                      </div>
                      <p className="text-[14px] leading-relaxed text-slate-300">{(step.textByLang && step.textByLang[lang]) || step.text}</p>
                      {step.code && step.code[lang] && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: L.color }}>Así se escribe en {L.name}</div>
                          <pre className="editor-layer overflow-x-auto rounded-xl border border-void-600/60 bg-void-950 p-3" dangerouslySetInnerHTML={{ __html: highlight(step.code[lang], lang) }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-neon-amber"><Target size={20} /><h2 className="text-xl font-extrabold text-white">Tu misión</h2></div>
                      <p className="rounded-xl border-l-2 border-neon-lime bg-neon-lime/5 px-4 py-3 text-[14px] text-lime-100">{objectiveOf(ch, lang)}</p>
                      <div className="rounded-xl border border-neon-amber/40 bg-neon-amber/5 p-4">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neon-amber">Qué tienes que cambiar</div>
                        <p className="text-[14px] leading-relaxed text-amber-50">{lesson && lesson.mission[lang]}</p>
                      </div>
                      <ul className="space-y-1.5 text-[13px] text-slate-400">
                        <li>• El código ya está escrito casi entero: busca las líneas marcadas con <span className="text-neon-amber">TODO</span> o <span className="text-neon-amber">⚠</span>.</li>
                        <li>• Mientras escribes, la barra de debajo del editor te explica la línea en la que estás.</li>
                        <li>• Si algo falla, el mundo hace «glitch» y la consola te dice qué pasó en palabras sencillas.</li>
                        <li>• ¿Atascado? El pato 🦆 te hace preguntas para guiarte. Y siempre puedes volver a esta lección.</li>
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between border-t border-void-600/50 px-5 py-3">
              <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="btn-neon text-slate-300 hover:text-white">
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="text-[11px] text-slate-500">{i + 1} / {total}</span>
              {last ? (
                <button type="button" onClick={() => { play('run'); onClose(); }} className="btn-neon bg-neon-lime text-void-950 shadow-neon-l">¡A programar! <ChevronRight size={14} /></button>
              ) : (
                <button type="button" onClick={() => go(i + 1)} className="btn-neon bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30">Siguiente <ChevronRight size={14} /></button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
