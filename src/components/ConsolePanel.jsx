import { useState } from 'react';
import { Terminal, Paintbrush, Languages, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { highlight } from './highlight.js';

const TABS = [
  { id: 'out', label: 'Consola', icon: Terminal },
  { id: 'style', label: 'Estilo', icon: Paintbrush },
  { id: 'poly', label: 'Polyglot', icon: Languages },
];

export function Checks({ checks }) {
  if (!checks || !checks.length) return null;
  return (
    <ul className="space-y-1">
      {checks.map((c) => (
        <li key={c.id} className="flex items-start gap-2 text-xs">
          {c.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-neon-lime" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-neon-red/80" />}
          <div className="min-w-0">
            <span className={c.ok ? 'text-lime-200' : 'text-slate-300'}>{c.label}</span>
            {!c.ok && c.detail && <div className="truncate text-[11px] text-slate-500" title={c.detail}>{c.detail}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ConsolePanel({ evaluation, lang, ch, solved, onSwitchLang, onJumpLine }) {
  const [tab, setTab] = useState('out');
  const ev = evaluation;
  const lint = ev ? ev.lint : [];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-void-600/50 px-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const badge = t.id === 'style' && lint.length ? lint.length : t.id === 'out' && ev && ev.error ? '!' : null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${tab === t.id ? 'text-neon-cyan' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon size={13} /> {t.label}
              {badge && <span className={`rounded px-1 text-[9px] ${t.id === 'out' ? 'bg-neon-red text-void-950' : 'bg-neon-amber text-void-950'}`}>{badge}</span>}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-px bg-neon-cyan shadow-neon" />}
            </button>
          );
        })}
        {ev && <span className="ml-auto pr-2 text-[10px] text-slate-500">{ev.stats.ms.toFixed(1)} ms · {ev.stats.ticks.toLocaleString('es-ES')} ops</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 text-xs leading-relaxed">
        {tab === 'out' && (
          <div className="space-y-2">
            {!ev && <div className="text-slate-500">Escribe código: el motor compila y ejecuta en tiempo real.</div>}
            {ev && ev.output.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap text-slate-200"><span className="select-none text-void-600">› </span>{l}</div>
            ))}
            {ev && ev.error && (
              <div className="rounded-lg border border-neon-red/30 bg-neon-red/5 p-2">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neon-red">
                  {ev.error.kind === 'runtime' ? 'Error de ejecución' : 'Error de compilación'}
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11.5px] text-red-200">{ev.error.trace || ev.error.message}</pre>
                {ev.error.line && (
                  <button type="button" onClick={() => onJumpLine(ev.error.line)} className="mt-1 text-[11px] text-neon-cyan underline-offset-2 hover:underline">
                    → ir a la línea {ev.error.line}
                  </button>
                )}
                {ev.error.hint && <div className="mt-1 text-[11px] text-amber-200/80">💡 {ev.error.hint}</div>}
              </div>
            )}
            {ev && !ev.error && !ev.output.length && <div className="text-slate-500">(sin salida estándar) · ejecución correcta</div>}
          </div>
        )}
        {tab === 'style' && (
          <div className="space-y-1.5">
            {!lint.length && <div className="text-lime-300">✓ Estilo impecable según las convenciones de {LANGUAGES[lang].name}. (★ estilo)</div>}
            {lint.map((w, i) => (
              <button key={i} type="button" onClick={() => onJumpLine(w.line)} className="block w-full rounded px-2 py-1 text-left text-amber-200 hover:bg-amber-400/5">
                <span className="text-neon-amber">L{w.line}</span> · {w.msg}
              </button>
            ))}
          </div>
        )}
        {tab === 'poly' && (
          <div className="space-y-3">
            <p className="text-slate-400">El mismo problema de ingeniería, cinco paradigmas.</p>
            {LANG_ORDER.map((l) => {
              const L = LANGUAGES[l];
              const sol = ch.solution[l];
              return (
                <div key={l} className={`rounded-lg border p-2 ${l === lang ? 'border-neon-cyan/40 bg-neon-cyan/5' : 'border-void-600/60'}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold" style={{ color: L.color }}>{L.name}</span>
                    {l !== lang && (
                      <button type="button" onClick={() => onSwitchLang(l)} className="text-[10px] uppercase tracking-wider text-neon-cyan hover:underline">Forjar en {L.name} →</button>
                    )}
                  </div>
                  <p className="text-slate-300">{ch.polyglot[l]}</p>
                  {l !== lang && solved && (
                    <pre className="editor-layer mt-2 max-h-48 overflow-auto rounded bg-void-950 p-2 !text-[11px] !leading-[16px]" dangerouslySetInnerHTML={{ __html: highlight(sol.trim(), l) }} />
                  )}
                  {l !== lang && !solved && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500"><Lock size={11} /> Supera la misión para desbloquear esta solución en el Codex.</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
