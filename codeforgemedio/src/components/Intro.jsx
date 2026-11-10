import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { Logo } from './TopBar.jsx';
import { play } from '../core/sound.js';

const BOOT = [
  'pantalla principal .............. [APAGADA: FALTA TU CÓDIGO]',
  'gravedad de la nave ............. [SIN PROGRAMAR]',
  'drones de patrulla .............. [SIN PROGRAMAR]',
  'pato de goma (te echa un cable) . [ LISTO ]',
];

/** Pantalla de arranque: eliges tu primer lenguaje y enciendes el motor. */
export default function Intro({ onStart }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-center">
          <Logo />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center text-3xl font-extrabold leading-tight text-white md:text-5xl">
          Aprende a programar<br />
          <span className="text-neon-cyan neon-text">jugando. Desde cero.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-400">
          Una nave averiada, drones sin programar y un Guardián que no deja pasar a cualquiera. Tú escribes el código de verdad, línea a línea, y ves al momento lo que hace. No hace falta saber nada: empezamos por «Hola, mundo».
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="glass mx-auto mt-6 max-w-xl rounded-xl p-4 text-[11px] leading-6 text-slate-400">
          {BOOT.map((l, i) => (
            <motion.div key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.12 }}>
              <span className="text-neon-lime">$</span> {l}
            </motion.div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 flex flex-wrap justify-center gap-2">
          {LANG_ORDER.map((l) => (
            <span key={l} className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: `${LANGUAGES[l].color}55`, color: LANGUAGES[l].color }}>{LANGUAGES[l].name}</span>
          ))}
        </motion.div>
        <p className="mt-3 text-center text-xs text-slate-500">3 lenguajes que se usan en empresas de verdad. Misiones cortas, oro, estrellas y ranking.</p>
        <div className="mt-8 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { play('rankup'); onStart(); }}
            className="btn-neon bg-neon-cyan px-6 py-3 text-sm text-void-950 shadow-neon"
          >
            <Rocket size={16} /> Empezar a jugar
          </motion.button>
        </div>
      </div>
    </div>
  );
}
