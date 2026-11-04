import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Feedback, PrimaryButton } from '../ui.jsx';

/** Marcar líneas sospechosas de un registro. */
export default function Logs({ challenge, color, onDone }) {
  const [sel, setSel] = useState(new Set());
  const [result, setResult] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const bad = new Set(challenge.bad);

  const toggle = (k) => {
    if (result?.ok) return;
    const n = new Set(sel);
    if (n.has(k)) n.delete(k); else n.add(k);
    setSel(n);
    setResult((r) => (r ? { ...r, stale: true } : r));
  };
  const check = () => {
    const missing = [...bad].filter((k) => !sel.has(k)).length;
    const extra = [...sel].filter((k) => !bad.has(k)).length;
    const ok = missing === 0 && extra === 0;
    if (!ok) setMistakes((m) => m + 1);
    setResult({ ok, missing, extra, attempt: (result?.attempt || 0) + 1 });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">{challenge.prompt}</p>
      <div className="overflow-x-auto rounded-xl border border-void-600 bg-void-950 py-1 font-mono text-[12px]">
        {challenge.lines.map((l, k) => {
          const on = sel.has(k);
          const reveal = result?.ok && bad.has(k);
          const coach = result && !result.ok && result.attempt >= 2;
          const missed = coach && bad.has(k) && !on;
          const wrongOn = coach && on && !bad.has(k);
          return (
            <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={on}
              className={`flex w-full gap-2 px-3 py-0.5 text-left ${reveal ? 'bg-neon-red/15 text-red-100' : wrongOn ? 'bg-slate-500/20 text-slate-400 line-through' : missed ? 'ring-1 ring-inset ring-neon-amber/70 text-amber-100' : on ? 'bg-neon-amber/15 text-amber-100' : 'text-slate-300 hover:bg-white/5'}`}>
              <span className="w-4 shrink-0">{on ? '●' : '○'}</span>
              <span className="whitespace-pre">{l}</span>
            </button>
          );
        })}
      </div>
      {result && !result.ok && (
        <Feedback kind={result.attempt >= 2 ? 'warn' : 'bad'}>
          {result.missing > 0 && `Te faltan ${result.missing} línea(s) sospechosa(s). `}
          {result.extra > 0 && `Has marcado ${result.extra} línea(s) normal(es) (falsos positivos). `}
          {result.attempt >= 2 ? 'Te las señalo: las que faltan tienen borde ámbar y las que sobran están tachadas. Fíjate en qué tienen en común (IP de origen, ritmo, caracteres extraños).' : 'Repasa los Apuntes (tecla A) si dudas.'}
        </Feedback>
      )}
      {result?.ok ? (
        <>
          <Feedback kind="ok">✓ {challenge.explain}</Feedback>
          <PrimaryButton color={color} onClick={() => onDone({ mistakes, hints: 0 })}>Completar reto <ArrowRight size={14} /></PrimaryButton>
        </>
      ) : (
        <PrimaryButton color={color} onClick={check} disabled={sel.size === 0}>Comprobar ({sel.size} marcadas)</PrimaryButton>
      )}
    </div>
  );
}
