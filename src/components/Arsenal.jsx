import { motion } from 'framer-motion';
import { Lock, ExternalLink, ShieldAlert, Wrench } from 'lucide-react';
import { TOOLS } from '../campaign/tools.js';
import { MODULES } from '../campaign/index.js';
import { TEAMS } from '../core/teams.js';
import { moduleUnlocked } from '../core/progress.js';
import { GlitchText } from './fx.jsx';

/** Arsenal: las 15 herramientas profesionales, desbloqueadas al llegar a su tema. */
export default function Arsenal({ progress }) {
  const team = progress.team;
  const T = TEAMS[team];
  const unlocked = TOOLS.filter((t) => moduleUnlocked(progress, team, MODULES.findIndex((m) => m.id === t.module))).length;
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <Wrench style={{ color: T.color }} />
        <GlitchText text="Arsenal" className="text-3xl font-extrabold text-white" />
        <span className="ml-auto rounded-full px-3 py-1 text-xs font-bold" style={{ background: T.soft, color: T.color }}>{unlocked}/{TOOLS.length} herramientas desbloqueadas</span>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-slate-400">Las 15 herramientas gratuitas y de código abierto que todo profesional de la ciberseguridad debe conocer. Cada una se presenta en la lección de su tema y se practica analizando su salida en el laboratorio.</p>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-neon-amber/40 bg-neon-amber/10 px-3 py-2 text-xs text-amber-100">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        Úsalas solo en tus propios equipos o con autorización por escrito. Escanear, capturar tráfico o auditar sistemas ajenos sin permiso es delito (art. 197 bis CP).
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t, i) => {
          const mod = MODULES.find((m) => m.id === t.module);
          const open = moduleUnlocked(progress, team, MODULES.indexOf(mod));
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`relative overflow-hidden rounded-2xl border p-4 ${open ? 'bg-void-900/80' : 'bg-void-950/60 opacity-70'}`} style={{ borderColor: open ? `${T.color}55` : '#252c45' }}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-extrabold" style={{ background: open ? T.soft : '#121624', color: open ? T.color : '#4b5375' }}>{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <div className="font-extrabold text-white">{t.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{t.category} · Tema {mod.num}</div>
                </div>
                {!open && <Lock size={16} className="ml-auto text-slate-600" />}
              </div>
              {open ? (
                <>
                  <p className="mt-3 text-sm text-slate-200">{t.what}</p>
                  <p className="mt-2 rounded-lg px-2.5 py-1.5 text-xs" style={{ background: T.soft, color: '#e2e8f0' }}><span className="font-bold" style={{ color: T.color }}>{T.name}: </span>{t[team]}</p>
                  <a href={t.url} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ExternalLink size={12} /> Web oficial</a>
                </>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Se desbloquea al llegar al tema {mod.num}: {mod.title}.</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
