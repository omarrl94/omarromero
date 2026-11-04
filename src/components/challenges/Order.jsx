import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ArrowRight, Check } from 'lucide-react';
import { Feedback, PrimaryButton } from '../ui.jsx';

function shuffled(items) {
  const a = items.map((t, i) => ({ t, i }));
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  if (a.every((x, k) => x.i === k)) a.reverse();
  return a;
}

/** Ordenar pasos con flechas. */
export default function Order({ challenge, color, onDone }) {
  const initial = useMemo(() => shuffled(challenge.items), [challenge]);
  const [list, setList] = useState(initial);
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const solved = checked && list.every((x, k) => x.i === k);

  const move = (k, d) => {
    // Actualización funcional: con clics rápidos cada movimiento parte del estado más reciente.
    setList((cur) => {
      const j = k + d;
      if (j < 0 || j >= cur.length) return cur;
      const n = [...cur];
      [n[k], n[j]] = [n[j], n[k]];
      return n;
    });
    setChecked(false);
  };
  const check = () => {
    setChecked(true);
    if (!list.every((x, k) => x.i === k)) setMistakes((m) => m + 1);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">{challenge.prompt}</p>
      <ol className="space-y-2">
        {list.map((x, k) => {
          const good = checked && x.i === k;
          const bad = checked && x.i !== k;
          return (
            <li key={x.t} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${good ? 'border-neon-green/60 bg-neon-green/5' : bad ? 'border-neon-red/50' : 'border-void-600'}`}>
              <span className="w-5 text-center font-bold text-slate-500">{k + 1}</span>
              <span className="flex-1 text-white">{x.t}</span>
              {good && <Check size={14} className="text-neon-green" />}
              {!solved && (
                <span className="flex flex-col">
                  <button type="button" aria-label="Subir" onClick={() => move(k, -1)} className="text-slate-400 hover:text-white disabled:opacity-20" disabled={k === 0}><ChevronUp size={16} /></button>
                  <button type="button" aria-label="Bajar" onClick={() => move(k, 1)} className="text-slate-400 hover:text-white disabled:opacity-20" disabled={k === list.length - 1}><ChevronDown size={16} /></button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {checked && !solved && <Feedback kind="bad">Las marcadas en rojo no están en su sitio. Muévelas y vuelve a comprobar.</Feedback>}
      {solved ? (
        <>
          <Feedback kind="ok">✓ {challenge.explain}</Feedback>
          <PrimaryButton color={color} onClick={() => onDone({ mistakes, hints: 0 })}>Completar reto <ArrowRight size={14} /></PrimaryButton>
        </>
      ) : (
        <PrimaryButton color={color} onClick={check}>Comprobar orden</PrimaryButton>
      )}
    </div>
  );
}
