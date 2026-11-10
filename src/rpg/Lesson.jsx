import { useState } from 'react';
import LessonVisual from '../components/LessonVisuals.jsx';
import { highlight } from '../components/highlight.js';
import { LESSONS, lessonSteps, byId, objectiveOf } from './course/index.js';
import { LANGUAGES } from '../core/languages.js';
import { sfx } from './assets.js';

/**
 * Lección paso a paso: cada paso explica una
 * idea con una animación y un ejemplo en tu lenguaje; la última tarjeta dice qué hay que
 * cambiar en el reto.
 */
export default function LessonBook({ id, lang, onDone, doneLabel = '¡A programar!' }) {
  const steps = lessonSteps(id, lang);
  const lesson = LESSONS[id];
  const ch = byId(id);
  const total = steps.length + 1;
  const [i, setI] = useState(0);
  const go = (n) => { sfx('move', 0.35); setI(Math.max(0, Math.min(total - 1, n))); };
  const last = i === total - 1;
  const step = steps[i];
  const L = LANGUAGES[lang];
  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {Array.from({ length: total }).map((_, k) => (
          <button key={k} type="button" onClick={() => go(k)} aria-label={`Paso ${k + 1}`} className="h-2 flex-1 rounded-full" style={{ background: k <= i ? '#f06733' : '#e2cdb2' }} />
        ))}
      </div>
      {!last ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="pixel-title text-2xl text-[#7a3b1e]">{step.title}</div>
            <p className="mt-2 text-[16px] leading-relaxed">{(step.textByLang && step.textByLang[lang]) || step.text}</p>
            {step.code && step.code[lang] && (
              <>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[#7a4a2e]">Así se escribe en {L.name}</div>
                <pre className="code-dark editor-layer mt-1 !whitespace-pre text-[13px]" dangerouslySetInnerHTML={{ __html: highlight(step.code[lang], lang) }} />
              </>
            )}
          </div>
          {step.visual ? (
            <div className="min-h-[220px] overflow-hidden rounded-lg bg-[#1d1611] p-3"><LessonVisual kind={step.visual} lang={lang} /></div>
          ) : <div className="hidden md:block" />}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="pixel-title text-2xl text-[#7a3b1e]">Tu reto</div>
          <div className="case-card p-3 text-[15px]">{objectiveOf(ch, lang)}</div>
          {lesson && lesson.mission && lesson.mission[lang] && (
            <div className="case-card case-warn p-3 text-[15px]"><b>Qué tienes que cambiar:</b> {lesson.mission[lang]}</div>
          )}
          <p className="text-sm text-[#6b4a35]">Las líneas que tienes que tocar están marcadas con ✎ en el editor. Debajo del editor, una barra te explica la línea en la que estás.</p>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className="pp-btn">◂ Anterior</button>
        <span className="text-sm font-bold text-[#7a5a45]">{i + 1} / {total}</span>
        {last
          ? <button type="button" onClick={onDone} className="act-btn act-attack px-6">{doneLabel}</button>
          : <button type="button" onClick={() => go(i + 1)} className="pp-btn">Siguiente ▸</button>}
      </div>
    </div>
  );
}
