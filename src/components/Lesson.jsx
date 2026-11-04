// Lecciones «Aprende»: diapositivas con idea clave, términos resaltados, ejemplos de terminal
// y resumen; y el panel de Apuntes, que se puede abrir en cualquier momento durante los retos.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, KeyRound, TerminalSquare, X, NotebookPen, ChevronDown, ListChecks, Sparkles } from 'lucide-react';
import { persp } from '../core/teams.js';
import { HELP } from '../core/shell.js';
import { LessonVisual } from './fx.jsx';
import { PrimaryButton } from './ui.jsx';

const TYPE_LABEL = { quiz: 'Test', classify: 'Clasificar', order: 'Ordenar', code: 'Revisión de código', logs: 'Análisis de registros', terminal: 'Terminal' };

/** Separa la primera frase (idea clave) del resto del texto. */
export function splitKey(text) {
  const m = String(text).match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  return m ? { key: m[1], rest: m[3] } : { key: text, rest: '' };
}

const ACRONYMS = new Set(['HTTP', 'HTTPS', 'MITRE', 'OWASP', 'NIST', 'RGPD', 'AEPD', 'CVSS', 'SIEM', 'DMARC', 'DKIM', 'WHOIS', 'CISA', 'IDOR', 'JSON', 'HTML', 'ASCII', 'NTLM', 'SMTP', 'DNSSEC', 'SAST']);

/** Texto enriquecido: «orden» → código; PALABRAS EN MAYÚSCULAS → resaltadas. */
export function Rich({ text, color }) {
  const parts = String(text).split(/(«[^»]+»|(?<!\p{L})\p{Lu}{4,}(?!\p{L}))/gu);
  return parts.map((p, i) => {
    if (p.startsWith('«') && p.endsWith('»') && !HELP[p.slice(1).split(/[\s»]/)[0]]) return <span key={i} className="text-white">{p}</span>;
    if (p.startsWith('«') && p.endsWith('»')) return <code key={i} className="rounded bg-void-950 px-1.5 py-0.5 font-mono text-[0.9em] text-green-200 ring-1 ring-neon-green/20">{p.slice(1, -1)}</code>;
    if (/^\p{Lu}{4,}$/u.test(p) && !ACRONYMS.has(p)) {
      return <strong key={i} className="font-extrabold" style={{ color }}>{p}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

function CodeBlock({ code, label = 'Así se ve en la terminal' }) {
  return (
    <div className="crt relative mt-4 overflow-hidden rounded-xl border border-neon-green/25 bg-[#020604]">
      <div className="relative z-30 flex items-center gap-2 border-b border-neon-green/15 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-300/60">
        <TerminalSquare size={12} /> {label}
      </div>
      <pre className="term relative z-10 overflow-x-auto p-4 text-[13px]">
        {code.split('\n').map((l, i) => (
          <div key={i} className={l.startsWith('$ ') ? 'text-neon-green' : 'text-green-100/80'}>{l || ' '}</div>
        ))}
      </pre>
    </div>
  );
}

function LessonStep({ step, team, color, compact = false }) {
  const { key, rest } = splitKey(persp(step.text, team));
  return (
    <div>
      <div className={`rounded-xl border-l-4 px-4 py-3 ${compact ? 'text-sm' : 'text-base sm:text-lg'}`} style={{ borderColor: color, background: `${color}12` }}>
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color }}><KeyRound size={11} /> Idea clave</div>
        <p className="font-semibold leading-relaxed text-white"><Rich text={key} color={color} /></p>
      </div>
      {rest && <p className={`mt-3 leading-relaxed text-slate-200 ${compact ? 'text-sm' : ''}`}><Rich text={rest} color={color} /></p>}
      {step.code && <CodeBlock code={step.code} />}
      {step.visual && <LessonVisual kind={step.visual} color={color} />}
    </div>
  );
}

/** Lección en diapositivas, con resumen final. Teclas ← y → para navegar. */
export function LessonDeck({ mission, challenges, team, color, onFinish }) {
  const lesson = mission.lesson;
  const total = lesson.length + 1; // + resumen
  const [i, setI] = useState(0);
  const summary = i === lesson.length;

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') setI((n) => Math.min(total - 1, n + 1));
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      {/* barra segmentada */}
      <div className="flex gap-1 p-3" role="tablist" aria-label="Pasos de la lección">
        {Array.from({ length: total }, (_, k) => (
          <button key={k} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} title={k < lesson.length ? lesson[k].title : 'Resumen'}
            className="h-1.5 flex-1 rounded-full transition-all" style={{ background: k <= i ? color : '#252c45', boxShadow: k === i ? `0 0 10px ${color}` : 'none' }} />
        ))}
      </div>
      <div className="grid md:grid-cols-[230px_1fr]">
        <ol className="hidden border-r border-white/5 p-3 md:block">
          {lesson.map((l, k) => (
            <li key={l.title}>
              <button type="button" onClick={() => setI(k)} className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm ${k === i ? 'bg-white/10 font-bold text-white' : 'text-slate-400 hover:text-white'}`}>
                <span className="font-mono text-xs" style={{ color }}>{String(k + 1).padStart(2, '0')}</span>{l.title}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setI(lesson.length)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${summary ? 'bg-white/10 font-bold text-white' : 'text-slate-400 hover:text-white'}`}>
              <Sparkles size={13} style={{ color }} /> Resumen
            </button>
          </li>
        </ol>
        <div className="relative min-h-[360px] p-6 sm:p-8">
          <span className="pointer-events-none absolute right-6 top-2 select-none font-mono text-[96px] font-extrabold leading-none opacity-[0.06]" style={{ color }} aria-hidden="true">
            {summary ? '✓' : String(i + 1).padStart(2, '0')}
          </span>
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color }}>
                <BookOpen size={14} /> {summary ? 'Resumen de la lección' : `Aprende · ${i + 1} de ${lesson.length}`}
              </div>
              {!summary ? (
                <>
                  <h2 className="mb-4 mt-2 text-2xl font-extrabold text-white sm:text-3xl">{lesson[i].title}</h2>
                  <LessonStep step={lesson[i]} team={team} color={color} />
                </>
              ) : (
                <>
                  <h2 className="mb-4 mt-2 text-2xl font-extrabold text-white sm:text-3xl">Lo esencial antes de jugar</h2>
                  <ul className="space-y-2">
                    {lesson.map((l, k) => (
                      <li key={l.title} className="flex gap-3 rounded-xl border border-void-600 bg-void-950/50 p-3 text-sm">
                        <span className="font-mono text-xs font-bold" style={{ color }}>{String(k + 1).padStart(2, '0')}</span>
                        <span><span className="font-bold text-white">{l.title}.</span> <span className="text-slate-300"><Rich text={splitKey(persp(l.text, team)).key} color={color} /></span></span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><ListChecks size={14} /> Lo que vas a practicar</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {challenges.map((c, k) => <span key={k} className="rounded-lg border border-void-600 px-2.5 py-1 text-xs text-slate-300">{k + 1}. <span className="font-bold text-white">{c.title}</span> · {TYPE_LABEL[c.type]}</span>)}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-slate-400"><NotebookPen size={14} className="mr-1.5 inline align-[-2px]" style={{ color }} />Durante los retos tendrás esta lección en <span className="font-bold text-white">Apuntes</span> (botón abajo a la derecha o tecla <kbd className="rounded border border-void-600 px-1">A</kbd>). Consultarlos no cuesta estrellas.</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="btn-neon border border-void-600 text-slate-300"><ArrowLeft size={14} /> Anterior</button>}
            {!summary
              ? <PrimaryButton color={color} onClick={() => setI(i + 1)}>Siguiente <ArrowRight size={14} /></PrimaryButton>
              : <PrimaryButton color={color} onClick={onFinish}>¡A por los retos! <ArrowRight size={14} /></PrimaryButton>}
            <span className="ml-auto hidden text-[11px] text-slate-500 sm:block">← → para navegar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Comandos que aparecen en los ejemplos de la lección, con su explicación. */
function cheatsheet(lesson) {
  const seen = new Map();
  for (const l of lesson) {
    for (const line of (l.code || '').split('\n')) {
      if (!line.startsWith('$ ')) continue;
      const cmd = line.slice(2).trim();
      const name = cmd.split(/\s+/)[0] === 'sudo' ? cmd.split(/\s+/)[1] : cmd.split(/\s+/)[0];
      if (!seen.has(cmd)) seen.set(cmd, HELP[name] || '');
    }
  }
  return [...seen.entries()];
}

/** Botón flotante + panel lateral con la lección completa y la chuleta. */
export function NotesDrawer({ mission, team, color }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('lesson');
  const [expanded, setExpanded] = useState(() => new Set(mission.lesson.map((_, k) => k)));
  const sheet = cheatsheet(mission.lesson);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'a' || e.key === 'A') setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (k) => setExpanded((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return createPortal(
    <>
      <motion.button type="button" onClick={() => setOpen(true)} initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-void-950"
        style={{ background: color, boxShadow: `0 0 28px -4px ${color}` }} aria-haspopup="dialog" aria-expanded={open}>
        <NotebookPen size={16} /> Apuntes <kbd className="rounded bg-black/20 px-1.5 text-[10px]">A</kbd>
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside role="dialog" aria-label="Apuntes de la lección" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-[460px] flex-col border-l bg-void-900/95 backdrop-blur-xl" style={{ borderColor: `${color}55` }}>
              <div className="flex items-center gap-2 border-b border-white/5 p-4">
                <NotebookPen size={18} style={{ color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Apuntes · sin coste de estrellas</div>
                  <div className="truncate font-bold text-white">{mission.title}</div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar apuntes"><X size={18} /></button>
              </div>
              <div className="flex gap-1 p-2">
                {[['lesson', 'Lección', BookOpen], ...(sheet.length ? [['sheet', 'Chuleta de comandos', TerminalSquare]] : [])].map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider ${tab === id ? 'text-void-950' : 'text-slate-400 hover:text-white'}`} style={tab === id ? { background: color } : {}}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-2">
                {tab === 'lesson' && mission.lesson.map((l, k) => (
                  <div key={l.title} className="rounded-xl border border-void-600 bg-void-950/50">
                    <button type="button" onClick={() => toggle(k)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-bold text-white" aria-expanded={expanded.has(k)}>
                      <span className="font-mono text-xs" style={{ color }}>{String(k + 1).padStart(2, '0')}</span> {l.title}
                      <ChevronDown size={14} className={`ml-auto transition-transform ${expanded.has(k) ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded.has(k) && <div className="px-3 pb-3"><LessonStep step={l} team={team} color={color} compact /></div>}
                  </div>
                ))}
                {tab === 'sheet' && (
                  <>
                    <p className="text-xs text-slate-400">Comandos vistos en la lección. En la terminal, «help» los lista todos y «help comando» explica uno.</p>
                    {sheet.map(([cmd, desc]) => (
                      <div key={cmd} className="rounded-xl border border-void-600 bg-void-950/60 p-3">
                        <code className="font-mono text-sm text-neon-green">$ {cmd}</code>
                        {desc && <p className="mt-1 text-xs text-slate-400">{desc}</p>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
