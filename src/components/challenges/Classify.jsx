import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Feedback, PrimaryButton } from '../ui.jsx';

/** Clasificar cada elemento en una categoría. Se repite hasta acertar. */
export default function Classify({ challenge, color, onDone }) {
  const [done, setDone] = useState({}); // índice → true
  const [fail, setFail] = useState({}); // índice → id de categoría fallada
  const [mistakes, setMistakes] = useState(0);
  const all = challenge.items.every((_, i) => done[i]);

  const pick = (i, cat) => {
    if (done[i]) return;
    if (challenge.items[i].cat === cat) {
      setDone((d) => ({ ...d, [i]: true }));
      setFail((f) => ({ ...f, [i]: null }));
    } else {
      setFail((f) => ({ ...f, [i]: cat }));
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="space-y-3">
      {challenge.prompt && <p className="text-sm text-slate-300">{challenge.prompt}</p>}
      {challenge.items.map((it, i) => (
        <div key={i} className={`rounded-xl border p-3 ${done[i] ? 'border-neon-green/50 bg-neon-green/5' : 'border-void-600'}`}>
          <div className="flex items-start gap-2 text-sm text-white">
            {done[i] && <Check size={16} className="mt-0.5 shrink-0 text-neon-green" />}
            <span>{it.text}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {challenge.categories.map((c) => {
              const chosen = done[i] && it.cat === c.id;
              const failed = fail[i] === c.id;
              return (
                <button key={c.id} type="button" onClick={() => pick(i, c.id)} disabled={done[i]}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${chosen ? 'border-neon-green bg-neon-green/15 text-neon-green' : failed ? 'border-neon-red/60 bg-neon-red/10 text-red-200' : done[i] ? 'border-void-700 text-slate-600' : 'border-void-600 text-slate-300 hover:border-slate-400'}`}>
                  {c.label}
                </button>
              );
            })}
          </div>
          {done[i] && <p className="mt-2 text-xs text-green-200/90">{it.explain}</p>}
          {!done[i] && fail[i] && <p className="mt-2 text-xs text-red-200">No encaja ahí. Vuelve a pensarlo.</p>}
        </div>
      ))}
      {all && (
        <>
          <Feedback kind="ok">¡Todo clasificado! {mistakes === 0 ? 'Sin un solo error.' : `Errores: ${mistakes}.`}</Feedback>
          <PrimaryButton color={color} onClick={() => onDone({ mistakes, hints: 0 })}>Completar reto <ArrowRight size={14} /></PrimaryButton>
        </>
      )}
    </div>
  );
}
