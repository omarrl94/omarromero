import { useState } from 'react';
import { Terminal, Paintbrush, BookMarked, CheckCircle2, XCircle, Lock, Boxes, HelpCircle, Lightbulb } from 'lucide-react';
import { LANGUAGES } from '../core/languages.js';
import { highlight } from './highlight.js';
import { CHECK_HELP } from '../curriculum/lessons.js';
import { plainError } from '../core/explain.js';

const TABS = [
  { id: 'out', label: 'Consola', icon: Terminal },
  { id: 'vars', label: 'Variables', icon: Boxes },
  { id: 'style', label: 'Estilo', icon: Paintbrush },
  { id: 'poly', label: 'Codex', icon: BookMarked },
];

export function Checks({ checks, lang }) {
  const [openId, setOpenId] = useState(null);
  if (!checks || !checks.length) return null;
  return (
    <ul className="space-y-1">
      {checks.map((c) => {
        const h = CHECK_HELP[c.id];
        const help = c.help || (h && typeof h === 'object' ? h[lang] || h.default : h);
        const open = openId === c.id;
        return (
          <li key={c.id} className="text-xs">
            <div className="flex items-start gap-2">
              {c.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-neon-lime" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-neon-red/80" />}
              <div className="min-w-0 flex-1">
                <span className={c.ok ? 'text-lime-200' : 'text-slate-300'}>{c.label}</span>
                {!c.ok && c.detail && <div className="text-[11px] text-slate-500">{c.detail}</div>}
              </div>
              {!c.ok && help && (
                <button type="button" onClick={() => setOpenId(open ? null : c.id)} className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-neon-cyan hover:bg-neon-cyan/10" aria-expanded={open}>
                  <HelpCircle size={12} /> ¿Cómo?
                </button>
              )}
            </div>
            {open && help && !c.ok && <div className="ml-6 mt-1 rounded-md border-l-2 border-neon-cyan bg-neon-cyan/5 px-2 py-1.5 text-[12px] leading-snug text-cyan-50">{help}</div>}
          </li>
        );
      })}
    </ul>
  );
}

const KIND_COLOR = { int: '#ffb534', float: '#22e4ff', bool: '#a3ff3d', str: '#ff3df0', char: '#ff3df0', list: '#9d7bff', map: '#9d7bff', set: '#9d7bff', ptr: '#ff4767' };
const KIND_LABEL = { int: 'entero', float: 'decimal', bool: 'sí / no', str: 'texto', char: 'carácter', list: 'lista', map: 'diccionario', set: 'conjunto', ptr: 'puntero' };

/** Las variables del programa dibujadas como cajas: nombre, tipo y valor. */
function VarInspector({ vars, mode, onJumpLine }) {
  if (mode === 'static') return <div className="text-slate-500">En esta misión el motor analiza la estructura del código (clases o tareas) en lugar de ejecutarlo: mira el canvas para ver tus clases o tareas cobrar vida.</div>;
  if (!vars.length) return <div className="text-slate-500">Aquí aparecerán tus variables como cajas en cuanto el programa declare alguna.</div>;
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">Cada variable es una caja: etiqueta (nombre), tipo (qué cabe) y valor (qué hay dentro). Pulsa una para ir a su línea.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {vars.map((v) => {
          const col = KIND_COLOR[v.kind] || '#7a83ad';
          const bad = v.flags.includes('overflow') || v.flags.includes('promotion') || v.flags.includes('truncated');
          return (
            <button key={`${v.name}-${v.line}`} type="button" onClick={() => onJumpLine(v.line)} className="min-w-0 rounded-lg border p-2 text-left transition-transform hover:-translate-y-0.5" style={{ borderColor: bad ? '#ff4767' : `${col}66`, background: `${col}0d` }}>
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-bold" style={{ color: col }}>{v.name}</span>
                <span className="shrink-0 rounded bg-white/5 px-1 text-[9px] text-slate-400">{v.type}</span>
              </div>
              <div className="mt-1 truncate text-[13px] text-slate-100" title={v.value}>{v.value}</div>
              <div className="text-[10px] text-slate-500">{KIND_LABEL[v.kind] || 'valor'} · L{v.line}</div>
              {bad && <div className="mt-0.5 text-[10px] text-neon-red">{v.flags.includes('truncated') ? 'decimales perdidos' : 'desbordado: dio la vuelta'}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PlainError({ error }) {
  const p = plainError(error);
  if (!p) return null;
  return (
    <div className="rounded-lg border border-neon-amber/40 bg-neon-amber/5 p-2.5">
      <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-200"><Lightbulb size={14} /> {p.title}</div>
      <p className="mt-1 text-[12px] leading-snug text-slate-200"><span className="text-slate-400">Qué ha pasado: </span>{p.what}</p>
      <p className="mt-1 text-[12px] leading-snug text-lime-100"><span className="text-slate-400">Cómo arreglarlo: </span>{p.fix}</p>
    </div>
  );
}

export default function ConsolePanel({ evaluation, lang, ch, solved, onJumpLine }) {
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
              className={`relative flex items-center gap-1.5 px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors sm:px-3 sm:py-2 ${tab === t.id ? 'text-neon-cyan' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon size={13} className="hidden sm:block" /> {t.label}
              {badge && <span className={`rounded px-1 text-[9px] ${t.id === 'out' ? 'bg-neon-red text-void-950' : 'bg-neon-amber text-void-950'}`}>{badge}</span>}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-px bg-neon-cyan shadow-neon" />}
            </button>
          );
        })}
        {ev && <span className="ml-auto hidden pr-2 text-[10px] text-slate-500 sm:inline">{ev.stats.ms.toFixed(1)} ms · {ev.stats.ticks.toLocaleString('es-ES')} ops</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 text-xs leading-relaxed">
        {tab === 'out' && (
          <div className="space-y-2">
            {!ev && <div className="text-slate-500">Escribe código: el motor compila y ejecuta en tiempo real.</div>}
            {ev && ev.output.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap text-slate-200"><span className="select-none text-void-600">› </span>{l}</div>
            ))}
            {ev && ev.error && <PlainError error={ev.error} />}
            {ev && ev.error && (
              <div className="rounded-lg border border-neon-red/30 bg-neon-red/5 p-2">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neon-red">
                  Mensaje técnico · {ev.error.kind === 'runtime' ? 'error de ejecución' : 'error de compilación'}
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11.5px] text-red-200">{ev.error.trace || ev.error.message}</pre>
                {ev.error.line && (
                  <button type="button" onClick={() => onJumpLine(ev.error.line)} className="mt-1 text-[11px] text-neon-cyan underline-offset-2 hover:underline">
                    → ir a la línea {ev.error.line}
                  </button>
                )}
              </div>
            )}
            {ev && !ev.error && !ev.output.length && <div className="text-slate-500">(sin salida estándar) · ejecución correcta</div>}
          </div>
        )}
        {tab === 'vars' && <VarInspector vars={ev ? ev.vars || [] : []} mode={ev ? ev.stats.mode : 'run'} onJumpLine={onJumpLine} />}
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
            <div className="rounded-lg border p-3" style={{ borderColor: `${LANGUAGES[lang].color}55`, background: `${LANGUAGES[lang].color}0d` }}>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: LANGUAGES[lang].color }}>Así se hace en {LANGUAGES[lang].name}</div>
              <p className="text-[13px] leading-relaxed text-slate-200">{ch.polyglot[lang]}</p>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Solución de referencia</div>
              {solved ? (
                <pre className="editor-layer max-h-72 overflow-auto rounded-lg border border-void-600/60 bg-void-950 p-2 !text-[11px] !leading-[16px]" dangerouslySetInnerHTML={{ __html: highlight(ch.solution[lang].trim(), lang) }} />
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><Lock size={12} /> Supera la misión para comparar tu código con la solución de referencia.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
