import { motion } from 'framer-motion';
import { GraduationCap, Lock, Check, Briefcase, Compass, ChevronRight, Sparkles } from 'lucide-react';
import { MODULES, CHALLENGES } from '../curriculum/index.js';
import { REAL_WORLD, DEGREES, SPECIALIZATIONS, JOBS } from '../curriculum/future.js';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { useProgress, moduleDone, worldDone } from '../core/progress.js';
import { play } from '../core/sound.js';

/**
 * «Tu futuro»: lo que ya sabes hacer (se desbloquea al terminar cada módulo),
 * dónde se usa en el mundo real y qué puedes estudiar después del grado medio.
 */
export default function Future({ onEnter, onMap }) {
  const { state } = useProgress();
  // Un módulo cuenta como aprendido si está completo en cualquiera de los mundos.
  const learned = (id) => LANG_ORDER.some((l) => moduleDone(state, id, l));
  const count = MODULES.filter((m) => learned(m.id)).length;
  const best = Math.max(...LANG_ORDER.map((l) => worldDone(state, l)));
  const graduated = best === CHALLENGES.length;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3 pb-24 lg:px-4">
      <section className="glass relative mb-5 overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-neon-lime/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-neon-lime"><Compass size={14} /> Tu futuro</div>
          <h1 className="mt-2 max-w-3xl text-2xl font-extrabold text-white md:text-3xl" style={{ textWrap: 'balance' }}>
            Lo que haces aquí no es un juego de mentira: <span className="text-neon-lime neon-text">es programar de verdad.</span>
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            El código que escribes en las misiones es el mismo que se escribe en las empresas. Cada módulo que terminas es una habilidad real. Y si te está gustando, hay un camino para dedicarte a esto.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="h-2.5 min-w-[180px] flex-1 overflow-hidden rounded-full bg-void-700">
              <motion.div className="h-full rounded-full bg-neon-lime" initial={{ width: 0 }} animate={{ width: `${(count / MODULES.length) * 100}%` }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} />
            </div>
            <span className="text-xs font-bold text-neon-lime">{count} de {MODULES.length} habilidades conseguidas</span>
          </div>
        </div>
      </section>

      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Lo que ya sabes hacer</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {MODULES.map((m, i) => {
          const ok = learned(m.id);
          const info = REAL_WORLD[m.id];
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass relative overflow-hidden rounded-2xl p-4 ${ok ? '' : 'opacity-70'}`}
              style={{ boxShadow: ok ? `0 0 0 1px ${m.color}66, 0 0 26px -14px ${m.color}` : undefined }}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: ok ? `${m.color}22` : '#141a2e', color: ok ? m.color : '#4a5275' }}>
                  {ok ? <Check size={18} /> : <Lock size={15} />}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: ok ? m.color : '#6b7399' }}>{m.boss ? 'Reto final' : `Módulo ${m.id} · ${m.name}`}</div>
                  <div className="mt-0.5 text-sm font-bold text-white">{info.skill}</div>
                  {ok
                    ? <p className="mt-1 text-[13px] leading-snug text-slate-300">{info.real}</p>
                    : <p className="mt-1 text-[12px] leading-snug text-slate-500">Termina este módulo en cualquier mundo para descubrir dónde se usa en la vida real.</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <h2 className="mb-1 mt-9 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400"><GraduationCap size={14} /> Y después del grado medio, ¿qué?</h2>
      <p className="mb-3 max-w-3xl text-sm text-slate-400">
        Con tu título de Técnico puedes seguir estudiando un <strong className="text-slate-200">grado superior</strong>. En informática hay tres, cada uno de dos cursos. En DAM y en DAW, programar es lo más importante:
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {DEGREES.map((d) => (
          <div key={d.id} className="glass flex flex-col rounded-2xl p-4" style={{ boxShadow: `0 0 0 1px ${d.color}44` }}>
            <div className="text-2xl font-extrabold" style={{ color: d.color }}>{d.short}</div>
            <div className="text-xs font-bold text-slate-200">{d.name}</div>
            <p className="mt-2 text-[13px] leading-snug text-slate-300">{d.what}</p>
            <p className="mt-2 text-[12px] leading-snug text-slate-400">{d.like}</p>
            <button
              type="button"
              onClick={() => { play('run'); onEnter(d.world); }}
              className="mt-3 flex items-center gap-1 self-start rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
              style={{ borderColor: `${LANGUAGES[d.world].color}66`, color: LANGUAGES[d.world].color }}
            >
              Practica con el mundo {LANGUAGES[d.world].name} <ChevronRight size={13} />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 max-w-3xl text-[12px] leading-snug text-slate-500">
        Después de un grado superior existen además cursos de especialización, como {SPECIALIZATIONS.slice(0, -1).join(', ')} o {SPECIALIZATIONS[SPECIALIZATIONS.length - 1]}. Las plazas y los plazos cambian según tu comunidad: pregunta a tu tutor o tutora, o en el departamento de orientación de tu centro.
      </p>

      <h2 className="mb-3 mt-9 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400"><Briefcase size={14} /> Trabajos en los que se programa cada día</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {JOBS.map((j) => (
          <div key={j.name} className="rounded-xl border border-void-600/60 bg-void-900/40 p-3">
            <div className="text-sm font-bold text-white">{j.name}</div>
            <p className="mt-1 text-[12px] leading-snug text-slate-400">{j.text}</p>
          </div>
        ))}
      </div>

      <section className="glass mt-9 rounded-2xl p-5 text-center" style={{ boxShadow: graduated ? '0 0 0 1px #ffd34d88, 0 0 40px -16px #ffd34d' : undefined }}>
        <Sparkles className="mx-auto text-[#ffd34d]" size={22} />
        {graduated ? (
          <>
            <h2 className="mt-2 text-xl font-extrabold text-white">Has conquistado un mundo entero.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300">
              Sabes variables, funciones, decisiones, bucles y listas, y has superado una prueba de entrevista. Es justo la base con la que se empieza un grado superior. Prueba ahora otro mundo: verás que las ideas son las mismas y solo cambia la forma de escribirlas. Y cuando quieras más, el siguiente nivel es <strong className="text-white">CodeForge: The Living Engine</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-xl font-extrabold text-white">Nadie nace sabiendo programar.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300">
              Todas las personas que hoy viven de esto empezaron con un «Hola, mundo», se equivocaron miles de veces y siguieron. Equivocarse y arreglarlo ES programar. Llevas {best} de {CHALLENGES.length} niveles en tu mejor mundo.
            </p>
            {onMap && (
              <button type="button" onClick={() => { play('run'); onMap(); }} className="btn-neon mx-auto mt-4 bg-neon-cyan text-void-950 shadow-neon">
                Seguir con las misiones <ChevronRight size={13} />
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
