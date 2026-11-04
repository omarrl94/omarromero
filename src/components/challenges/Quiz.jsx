import { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { Feedback, PrimaryButton } from '../ui.jsx';

/** Preguntas tipo test: se repite hasta acertar; cada fallo cuenta como error. */
export default function Quiz({ challenge, color, onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const q = challenge.questions[i];
  const solved = picked === q.correct;

  const choose = (k) => {
    if (solved) return;
    setPicked(k);
    if (k !== q.correct) {
      setWrong((w) => [...w, k]);
      setMistakes((m) => m + 1);
    }
  };
  const next = () => {
    if (i + 1 < challenge.questions.length) {
      setI(i + 1);
      setPicked(null);
      setWrong([]);
    } else onDone({ mistakes, hints: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Pregunta {i + 1} de {challenge.questions.length}</div>
      <p className="text-lg font-bold text-white">{q.q}</p>
      <div className="grid gap-2">
        {q.options.map((o, k) => {
          const isRight = solved && k === q.correct;
          const isWrong = wrong.includes(k);
          const reveal = !solved && wrong.length >= 2 && k === q.correct;
          return (
            <button key={k} type="button" onClick={() => choose(k)} disabled={isWrong || solved}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${isRight ? 'border-neon-green bg-neon-green/10 text-white' : isWrong ? 'border-neon-red/50 bg-neon-red/5 text-slate-400 line-through' : reveal ? 'border-neon-amber bg-neon-amber/10 text-white' : 'border-void-600 hover:border-slate-400 text-slate-200'}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                {isRight ? <Check size={12} /> : isWrong ? <X size={12} /> : String.fromCharCode(65 + k)}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (solved
        ? <Feedback kind="ok">✓ {q.explain}</Feedback>
        : wrong.length >= 2
          ? <Feedback kind="warn">Te lo explico: {q.explain} La respuesta correcta está marcada en ámbar; selecciónala para seguir.</Feedback>
          : <Feedback kind="bad">No es correcto. Piénsalo de nuevo o repasa los Apuntes (tecla A).</Feedback>)}
      {solved && <PrimaryButton color={color} onClick={next}>{i + 1 < challenge.questions.length ? 'Siguiente' : 'Completar reto'} <ArrowRight size={14} /></PrimaryButton>}
    </div>
  );
}
