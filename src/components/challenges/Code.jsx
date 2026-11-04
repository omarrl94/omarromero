import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Feedback, PrimaryButton } from '../ui.jsx';

/** Revisión de código: elegir la línea problemática y después la explicación o la corrección. */
export default function Code({ challenge, color, onDone }) {
  const [line, setLine] = useState(null);
  const [wrongLines, setWrongLines] = useState([]);
  const [opt, setOpt] = useState(null);
  const [wrongOpts, setWrongOpts] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const lineOk = line !== null && challenge.bad.includes(line);
  const solved = opt !== null && challenge.options[opt].correct;

  const pickLine = (k) => {
    if (lineOk) return;
    setLine(k);
    if (!challenge.bad.includes(k)) {
      setWrongLines((w) => [...w, k]);
      setMistakes((m) => m + 1);
    }
  };
  const pickOpt = (k) => {
    if (solved) return;
    setOpt(k);
    if (!challenge.options[k].correct) {
      setWrongOpts((w) => [...w, k]);
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">{challenge.prompt}</p>
      <div className="overflow-x-auto rounded-xl border border-void-600 bg-void-950 py-2 font-mono text-[13px]">
        {challenge.code.map((l, k) => {
          const sel = lineOk && challenge.bad.includes(k);
          const bad = wrongLines.includes(k);
          return (
            <button key={k} type="button" onClick={() => pickLine(k)}
              className={`flex w-full gap-3 px-3 text-left ${sel ? 'bg-neon-amber/15' : bad ? 'bg-neon-red/10' : 'hover:bg-white/5'}`}>
              <span className="w-6 shrink-0 select-none text-right text-slate-600">{k + 1}</span>
              <span className={`whitespace-pre ${sel ? 'text-amber-100' : 'text-slate-200'}`}>{l || ' '}</span>
            </button>
          );
        })}
      </div>
      {line !== null && !lineOk && <Feedback kind="bad">Esa línea no es el problema. Sigue el dato que introduce el usuario.</Feedback>}
      {lineOk && (
        <div className="space-y-2">
          <Feedback kind="ok">✓ Bien visto: el problema está ahí.</Feedback>
          <p className="font-bold text-white">{challenge.question}</p>
          {challenge.options.map((o, k) => {
            const right = solved && o.correct;
            const wrong = wrongOpts.includes(k);
            return (
              <button key={k} type="button" disabled={wrong || solved} onClick={() => pickOpt(k)}
                className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${right ? 'border-neon-green bg-neon-green/10 text-white' : wrong ? 'border-neon-red/50 text-slate-500' : 'border-void-600 text-slate-200 hover:border-slate-400'}`}>
                <span className={o.text.includes('(') && o.text.includes(')') && /[=;]/.test(o.text) ? 'font-mono text-[12px]' : ''}>{o.text}</span>
                {(right || wrong) && <span className={`mt-1 block text-xs ${right ? 'text-green-200' : 'text-red-200'}`}>{o.explain}</span>}
              </button>
            );
          })}
        </div>
      )}
      {solved && <PrimaryButton color={color} onClick={() => onDone({ mistakes, hints: 0 })}>Completar reto <ArrowRight size={14} /></PrimaryButton>}
    </div>
  );
}
