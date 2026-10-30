import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { Logo } from './TopBar.jsx';
import { play } from '../core/sound.js';

const BOOT = [
  'forge_vm: polyglot core ......... [ OK ]',
  'physics: gravity = undefined .... [ESPERANDO TU CÓDIGO]',
  'drones: patrol_ai ............... [SIN PROGRAMAR]',
  'heap: 0 bytes asignados ......... [ OK ]',
  'rubber_duck: socratic_mode ...... [ OK ]',
];

/** Pantalla de arranque: eliges tu primer lenguaje y enciendes el motor. */
export default function Intro({ onStart }) {
  const [lang, setLang] = useState('python');
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-center">
          <Logo />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center text-3xl font-extrabold leading-tight text-white md:text-5xl">
          Aquí no se hacen ejercicios.<br />
          <span className="text-neon-cyan neon-text">Se programa el mundo.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-400">
          Escribe la gravedad, la IA de los drones, la memoria y las entidades de un motor de juego vivo. Cada línea que escribes se compila y se ve al instante. Cada bug, se ve también.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="glass mx-auto mt-6 max-w-xl rounded-xl p-4 text-[11px] leading-6 text-slate-400">
          {BOOT.map((l, i) => (
            <motion.div key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.12 }}>
              <span className="text-neon-lime">$</span> {l}
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Elige tu primer lenguaje (podrás cambiar en cualquier momento)</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {LANG_ORDER.map((l, i) => {
            const L = LANGUAGES[l];
            const active = l === lang;
            return (
              <motion.button
                key={l}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => { setLang(l); play('click'); }}
                className={`rounded-xl border p-3 text-left transition-colors ${active ? 'bg-white/5' : 'border-void-600/60 hover:border-void-600'}`}
                style={active ? { borderColor: L.color, boxShadow: `0 0 24px -8px ${L.color}` } : {}}
              >
                <div className="text-sm font-extrabold" style={{ color: L.color }}>{L.name}</div>
                <div className="mt-1 text-[10px] leading-snug text-slate-400">{L.tagline}</div>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { play('rankup'); onStart(lang); }}
            className="btn-neon bg-neon-cyan px-6 py-3 text-sm text-void-950 shadow-neon"
          >
            <Rocket size={16} /> Encender el motor
          </motion.button>
        </div>
      </div>
    </div>
  );
}
