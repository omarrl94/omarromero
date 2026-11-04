import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, RotateCcw, Terminal, ListChecks, Shapes, ArrowUpDown, Code2, ScrollText, CheckCircle2, GraduationCap, Dices, Calculator } from 'lucide-react';
import { MODULES, missionsFor, challengesOf } from '../campaign/index.js';
import { TEAMS, persp, rankOf } from '../core/teams.js';
import { moduleUnlocked, moduleDone, teamXp, teamStars, completedCount, moduleGrade, missionScore, formatNota, GRADE_SCALE, courseGrade } from '../core/progress.js';
import { MODULE_ICONS, Stars } from './ui.jsx';
import { GlitchText } from './fx.jsx';

const TYPE_ICON = { terminal: [Terminal, 'Terminal'], quiz: [ListChecks, 'Test'], classify: [Shapes, 'Clasificar'], order: [ArrowUpDown, 'Ordenar'], code: [Code2, 'Código'], logs: [ScrollText, 'Registros'] };

const HEX = 'M30 2 L56 17 L56 47 L30 62 L4 47 L4 17 Z';

function ModuleNode({ mod, color, pct, locked, done }) {
  const Icon = MODULE_ICONS[mod.icon];
  const len = 170;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 60 64" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={HEX} fill={locked ? '#0d1019' : `${color}18`} stroke="#252c45" strokeWidth="2" />
        {!locked && <path d={HEX} fill="none" stroke={color} strokeWidth="3" strokeDasharray={len} strokeDashoffset={len * (1 - pct)} style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset .8s' }} />}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: locked ? '#4b5375' : color }}>
        {locked ? <Lock size={20} /> : done ? <CheckCircle2 size={24} /> : <Icon size={22} />}
      </div>
    </div>
  );
}

/** Traductor de puntos a nota académica de un tema. */
function GradeTranslator({ g, color }) {
  const pct = g.max ? g.points / g.max : 0;
  return (
    <div className="rounded-2xl border border-void-600 bg-void-950/70 p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300"><Calculator size={14} style={{ color }} /> Traductor de puntos a nota</div>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Puntos</div>
          <div className="font-mono text-xl font-extrabold text-white">{g.points}<span className="text-sm text-slate-500"> / {g.max}</span></div>
        </div>
        <div className="pb-1 text-2xl text-slate-600">→</div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Nota del tema</div>
          <div className="text-3xl font-extrabold leading-none" style={{ color: g.color, textShadow: `0 0 18px ${g.color}66` }}>{formatNota(g.nota)}</div>
        </div>
        <div className="pb-1">
          <span className="rounded-full px-2.5 py-1 text-xs font-extrabold text-void-950" style={{ background: g.color }}>{g.label}</span>
        </div>
      </div>
      {/* Escala con marcador */}
      <div className="relative mt-4">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {GRADE_SCALE.map((b) => <div key={b.label} style={{ width: `${((b.to - b.from + 0.01) / 10) * 100}%`, background: { Insuficiente: '#ff476755', Suficiente: '#ffb53555', Bien: '#9d7bff55', Notable: '#22e4ff55', Sobresaliente: '#2bff8855' }[b.label] }} />)}
        </div>
        <div className="absolute -top-1 w-1 rounded-full bg-white shadow-[0_0_8px_#fff]" style={{ left: `calc(${Math.min(100, pct * 100)}% - 2px)`, height: 18 }} />
        <div className="mt-1 flex justify-between text-[9px] text-slate-500">{['0', '5', '6', '7', '9', '10'].map((x) => <span key={x}>{x}</span>)}</div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Nota = puntos ÷ {g.max} × 10. Cada misión vale 100 puntos (errores −10 %, pistas −15 % por reto) y cuenta tu mejor marca.
        {g.nextLabel && g.pointsToNext > 0 && <> Te faltan <span className="font-bold text-white">{g.pointsToNext} puntos</span> para <span className="font-bold text-white">{g.nextLabel}</span>.</>}
        {g.perfect && <> ¡Todas las misiones a 100: <span className="font-bold text-white">Matrícula de honor</span>!</>}
      </p>
    </div>
  );
}

/** Mapa de operaciones: línea vertical con los 10 módulos y sus misiones. */
export default function CampaignMap({ progress, onPlay }) {
  const team = progress.team;
  const T = TEAMS[team];
  const firstOpen = MODULES.findIndex((m, i) => moduleUnlocked(progress, team, i) && !moduleDone(progress, team, m.id));
  const [open, setOpen] = useState(MODULES[Math.max(0, firstOpen)]?.id);
  const xp = teamXp(progress, team);
  const rank = rankOf(team, xp);
  const total = missionsFor(team).length;
  const done = completedCount(progress, team);

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-6">
      <div className="glass hud-corner mb-8 grid items-start gap-4 rounded-2xl p-5" style={{ '--team': T.color }}>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: T.color }}>{T.name} · {T.role}</div>
          <GlitchText as="h1" text="Mapa de operaciones" className="mt-1 text-3xl font-extrabold text-white sm:text-4xl" />
          <p className="mt-1 text-sm text-slate-400">De la ética a la operación final. Cada módulo se desbloquea al completar el anterior.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[['Rango', rank.name], ['Misiones', `${done}/${total}`], ['Estrellas', `${teamStars(progress, team)}/${total * 3}`], ['Nota media', `${formatNota(courseGrade(progress, team).media)} · ${courseGrade(progress, team).short}`]].map(([k, v]) => (
            <div key={k} className="min-w-[110px] rounded-xl border border-void-600 bg-void-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">{k}</div>
              <div className="mt-0.5 text-sm font-extrabold" style={{ color: T.color }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Eje luminoso */}
        <svg className="absolute left-8 top-0 h-full w-2 -translate-x-1/2" preserveAspectRatio="none" viewBox="0 0 2 100" aria-hidden="true">
          <line x1="1" y1="0" x2="1" y2="100" stroke="#252c45" strokeWidth="2" />
          <line x1="1" y1="0" x2="1" y2={Math.max(2, (done / total) * 100)} stroke={T.color} strokeWidth="2" className="flow" style={{ filter: `drop-shadow(0 0 3px ${T.color})` }} />
        </svg>

        <ol className="space-y-4">
          {MODULES.map((mod, i) => {
            const list = missionsFor(team, mod.id);
            const nDone = list.filter((m) => progress.teams[team]?.[m.id]).length;
            const locked = !moduleUnlocked(progress, team, i);
            const isOpen = open === mod.id && !locked;
            return (
              <motion.li key={mod.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative">
                <button type="button" onClick={() => !locked && setOpen(isOpen ? null : mod.id)} disabled={locked}
                  className={`flex w-full items-center gap-4 text-left ${locked ? 'cursor-not-allowed opacity-60' : ''}`} aria-expanded={isOpen}>
                  <ModuleNode mod={mod} color={T.color} pct={nDone / list.length} locked={locked} done={nDone === list.length} />
                  <div className={`flex-1 rounded-2xl border px-4 py-3 transition-colors ${isOpen ? 'bg-white/5' : 'border-void-600 bg-void-900/60 hover:border-slate-500'}`} style={isOpen ? { borderColor: `${T.color}80`, boxShadow: `0 0 30px -12px ${T.color}` } : {}}>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      <span style={{ color: locked ? '#64748b' : T.color }}>Módulo {mod.num}</span>
                      <span className="text-slate-500">· {mod.level}</span>
                      {!locked && nDone > 0 && <span className="ml-auto rounded-md px-1.5 py-0.5 text-void-950" style={{ background: moduleGrade(progress, team, mod.id).color }}>Nota {formatNota(moduleGrade(progress, team, mod.id).nota)}</span>}
                      <span className={nDone > 0 && !locked ? 'text-slate-500' : 'ml-auto text-slate-500'}>{nDone}/{list.length}</span>
                    </div>
                    <div className="mt-0.5 text-lg font-extrabold text-white">{mod.title}</div>
                    <div className="text-xs text-slate-400">{locked ? 'Completa el módulo anterior para desbloquearlo.' : mod.subtitle}</div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="ml-6 mt-3 sm:ml-20"><GradeTranslator g={moduleGrade(progress, team, mod.id)} color={T.color} /></div>
                      <div className="ml-6 mt-3 grid gap-3 sm:ml-20 sm:grid-cols-2">
                        {list.map((m) => {
                          const rec = progress.teams[team]?.[m.id];
                          const own = m.teams.length === 1;
                          const kindBadge = m.kind === 'exam' ? ['Examen', '#ffb534', GraduationCap] : m.kind === 'training' ? ['Entrenamiento', '#2bff88', Dices] : null;
                          return (
                            <motion.div key={m.id} whileHover={{ y: -3 }} className="group relative overflow-hidden rounded-2xl border border-void-600 bg-void-900/80 p-4" style={{ borderColor: rec ? `${T.color}66` : undefined }}>
                              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100" style={{ background: `${T.color}40` }} />
                              <div className="flex items-center gap-2">
                                {kindBadge ? (
                                  <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ background: `${kindBadge[1]}1f`, color: kindBadge[1] }}>{(() => { const I = kindBadge[2]; return <I size={10} />; })()} {kindBadge[0]}</span>
                                ) : (
                                  <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={own ? { background: T.soft, color: T.color } : { background: 'rgba(255,255,255,.06)', color: '#94a3b8' }}>
                                    {own ? `Misión ${T.short}` : 'Misión común'}
                                  </span>
                                )}
                                {rec && <span className="ml-auto flex items-center gap-2"><span className="font-mono text-[10px] text-slate-400">{missionScore(rec)} pts</span><Stars n={rec.stars} size={12} /></span>}
                              </div>
                              <h3 className="mt-2 font-bold text-white">{m.title}</h3>
                              <p className="mt-1 line-clamp-3 text-xs text-slate-400">{persp(m.story, team)}</p>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {challengesOf(m, 1).map((c, k) => {
                                  const [Icon, label] = TYPE_ICON[c.type];
                                  return <span key={k} title={label} className="flex items-center gap-1 rounded-md bg-void-950 px-1.5 py-0.5 text-[10px] text-slate-400"><Icon size={11} /> {label}</span>;
                                })}
                              </div>
                              <button type="button" onClick={() => onPlay(m.id)} className="btn-neon mt-3 text-void-950" style={{ background: T.color }}>
                                {rec ? <><RotateCcw size={13} /> Repetir</> : <><Play size={13} /> Jugar</>}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
