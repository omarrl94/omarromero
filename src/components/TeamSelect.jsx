import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldAlert, ArrowRight } from 'lucide-react';
import { TEAMS, TEAM_ORDER } from '../core/teams.js';
import { TEAM_ICONS } from './ui.jsx';
import { GlitchText } from './fx.jsx';

const OATH = [
  'Solo pondré a prueba sistemas cuando tenga permiso por escrito de su responsable.',
  'Respetaré el alcance acordado y la privacidad de las personas.',
  'Si descubro un fallo, lo comunicaré de forma responsable.',
  'Usaré lo que aprenda para proteger, nunca para causar daño.',
];

/** Tarjeta con inclinación 3D siguiendo al ratón. */
function TiltCard({ children, color, active, onClick }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    setRot({ x: ((e.clientY - r.top) / r.height - 0.5) * -12, y: ((e.clientX - r.left) / r.width - 0.5) * 12 });
  };
  return (
    <motion.button ref={ref} type="button" onClick={onClick} onMouseMove={move} onMouseLeave={() => setRot({ x: 0, y: 0 })}
      animate={{ rotateX: rot.x, rotateY: rot.y, scale: active ? 1.03 : 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ transformPerspective: 900, borderColor: active ? color : `${color}40`, boxShadow: active ? `0 0 50px -10px ${color}` : 'none' }}
      className="relative overflow-hidden rounded-3xl border bg-void-900/80 p-5 text-left backdrop-blur" role="radio" aria-checked={active}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `${color}30` }} />
      {children}
    </motion.button>
  );
}

/** Elección de equipo + juramento ético. */
export default function TeamSelect({ current, onChoose, onCancel }) {
  const [team, setTeam] = useState(current || null);
  const [oath, setOath] = useState(!!current);
  const T = team ? TEAMS[team] : null;

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Asignación de equipo</div>
        <GlitchText text="¿De qué lado estás?" className="mt-2 text-4xl font-extrabold text-white sm:text-5xl" />
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">Los diez módulos son los mismos para todos, pero cada equipo los vive desde su perspectiva y con misiones propias. Puedes cambiar más adelante: cada equipo guarda su propio progreso.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Equipo">
        {TEAM_ORDER.map((id) => {
          const t = TEAMS[id];
          const Icon = TEAM_ICONS[id];
          const active = team === id;
          return (
            <TiltCard key={id} color={t.color} active={active} onClick={() => setTeam(id)}>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: t.soft, color: t.color }}><Icon size={26} /></span>
                {active && <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: t.color }}><Check size={16} className="text-void-950" /></span>}
              </div>
              <h3 className="mt-4 text-2xl font-extrabold" style={{ color: t.color }}>{t.name}</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.role}</p>
              <p className="mt-3 text-sm italic text-slate-200">«{t.motto}»</p>
              <p className="mt-3 text-sm text-slate-400">{t.desc}</p>
              <ul className="mt-4 space-y-1">
                {t.learns.map((l) => <li key={l} className="flex items-center gap-2 text-xs text-slate-300"><span className="h-1 w-1 rounded-full" style={{ background: t.color }} />{l}</li>)}
              </ul>
              <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">Rango inicial: <span style={{ color: t.color }}>{t.ranks[0]}</span> · Rango final: <span style={{ color: t.color }}>{t.ranks[7]}</span></div>
            </TiltCard>
          );
        })}
      </div>

      <AnimatePresence>
        {T && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass mx-auto mt-8 max-w-2xl rounded-2xl p-5" style={{ boxShadow: `0 0 0 1px ${T.color}40` }}>
            <div className="flex items-center gap-2 text-sm font-bold text-white"><ShieldAlert size={18} style={{ color: T.color }} /> Juramento del agente</div>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              {OATH.map((o) => <li key={o} className="flex gap-2"><span style={{ color: T.color }}>▸</span>{o}</li>)}
            </ul>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={oath} onChange={(e) => setOath(e.target.checked)} className="h-4 w-4" style={{ accentColor: T.color }} />
              Lo juro. Sé que acceder sin permiso a un sistema es delito.
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={!oath} onClick={() => onChoose(team)} className="btn-neon px-5 py-2.5 text-sm text-void-950" style={{ background: T.color, boxShadow: `0 0 24px -6px ${T.color}` }}>
                Unirme al {T.name} <ArrowRight size={15} />
              </button>
              {onCancel && <button type="button" onClick={onCancel} className="btn-neon border border-void-600 text-slate-300">Cancelar</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
