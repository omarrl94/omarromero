import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animaciones didácticas de las lecciones. Cada una ilustra UNA idea en bucle,
// a cámara lenta, para que se entienda mirando.

const C = { cyan: '#22e4ff', magenta: '#ff3df0', lime: '#a3ff3d', amber: '#ffb534', red: '#ff4767', violet: '#9d7bff', dim: '#252c45', muted: '#7a83ad', text: '#d6dcff' };

function useTick(ms, steps) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x + 1) % steps), ms);
    return () => clearInterval(id);
  }, [ms, steps]);
  return t;
}

const TYPE_NAMES = {
  python: { int: 'int', float: 'float', bool: 'bool', str: 'str' },
  java: { int: 'int', float: 'double', bool: 'boolean', str: 'String' },
  kotlin: { int: 'Int', float: 'Double', bool: 'Boolean', str: 'String' },
  swift: { int: 'Int', float: 'Double', bool: 'Bool', str: 'String' },
  c: { int: 'int', float: 'double', bool: 'bool', str: 'char[]' },
  rust: { int: 'i32', float: 'f64', bool: 'bool', str: '&str' },
  cpp: { int: 'int', float: 'double', bool: 'bool', str: 'string' },
  csharp: { int: 'int', float: 'double', bool: 'bool', str: 'string' },
  go: { int: 'int', float: 'float64', bool: 'bool', str: 'string' },
  js: { int: 'number', float: 'number', bool: 'boolean', str: 'string' },
};

function Box({ label, value, type, color = C.cyan, shown = true, warn }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: shown ? 1 : 0.15, y: shown ? 0 : 8 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="text-[10px] font-bold" style={{ color }}>{label}</div>
      <div className="relative grid h-14 min-w-[72px] place-items-center rounded-lg border-2 px-2 text-sm font-bold" style={{ borderColor: color, background: `${color}14`, color: C.text, boxShadow: `0 0 16px -6px ${color}` }}>
        {value}
        {warn && <span className="absolute -right-2 -top-2 rounded bg-neon-red px-1 text-[9px] text-void-950">{warn}</span>}
      </div>
      {type && <div className="rounded bg-white/5 px-1.5 text-[9px] text-slate-400">{type}</div>}
    </motion.div>
  );
}

function Boxes({ lang }) {
  const t = useTick(900, 6);
  const T = TYPE_NAMES[lang] || TYPE_NAMES.python;
  const items = [
    ['gravedad', '9.81', T.float, C.cyan],
    ['masaNave', '1200', T.int, C.amber],
    ['escudosActivos', lang === 'python' ? 'True' : 'true', T.bool, C.lime],
    ['nombrePiloto', '"Nova"', T.str, C.magenta],
  ];
  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      {items.map(([l, v, ty, c], i) => <Box key={l} label={l} value={v} type={ty} color={c} shown={t > i} />)}
    </div>
  );
}

function TypeCut({ lang }) {
  const t = useTick(1100, 4);
  const T = TYPE_NAMES[lang] || TYPE_NAMES.python;
  const strict = !['c', 'cpp', 'python'].includes(lang);
  if (lang === 'js') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-end justify-center gap-4">
          <Box label="typeof 1200" value="number" color={C.amber} />
          <Box label="typeof 9.81" value="number" color={C.cyan} />
          <Box label='typeof "Nova"' value="string" color={C.magenta} />
          <Box label="typeof true" value="boolean" color={C.lime} />
        </div>
        <div className="text-[11px] text-slate-400">En JavaScript enteros y decimales son el mismo tipo: number.</div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <motion.div animate={{ y: t >= 1 ? 30 : 0, opacity: t >= 1 ? 0 : 1 }} className="text-sm font-bold text-neon-cyan">9.81</motion.div>
        <Box label={`caja ${T.int}`} value={t >= 1 ? (strict ? '✖' : '9') : '?'} type="solo enteros" color={C.amber} warn={t >= 1 ? (strict ? 'error' : '.81 perdido') : null} />
        <div className="h-4 text-[10px] text-neon-red">{t >= 2 ? (strict ? 'el compilador lo rechaza' : 'se cortan los decimales') : ''}</div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <motion.div animate={{ y: t >= 1 ? 30 : 0, opacity: t >= 1 ? 0 : 1 }} className="text-sm font-bold text-neon-cyan">9.81</motion.div>
        <Box label={`caja ${T.float}`} value={t >= 1 ? '9.81' : '?'} type="decimales" color={C.cyan} />
        <div className="h-4 text-[10px] text-neon-lime">{t >= 2 ? 'cabe entero ✓' : ''}</div>
      </div>
    </div>
  );
}

function Quotes() {
  const t = useTick(1300, 3);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-neon-red/40 bg-neon-red/5 p-3 text-center">
        <div className="text-lg font-bold text-neon-red">"9.81" × 2</div>
        <div className="mt-1 text-xs text-slate-400">texto: no es una cantidad</div>
        <AnimatePresence>{t > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-red-200">→ error o «9.819.81»</motion.div>}</AnimatePresence>
      </div>
      <div className="rounded-xl border border-neon-lime/40 bg-neon-lime/5 p-3 text-center">
        <div className="text-lg font-bold text-neon-lime">9.81 × 2</div>
        <div className="mt-1 text-xs text-slate-400">número: se puede calcular</div>
        <AnimatePresence>{t > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-lime-200">→ 19.62</motion.div>}</AnimatePresence>
      </div>
    </div>
  );
}

function Odometer() {
  const [v, setV] = useState(2147483600);
  useEffect(() => {
    const id = setInterval(() => setV((x) => (x >= 2147483647 ? -2147483648 : x < 0 && x > -2147483600 ? 2147483600 : x + 11)), 120);
    return () => clearInterval(id);
  }, []);
  const neg = v < 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`rounded-xl border-2 px-5 py-3 text-2xl font-extrabold tabular-nums ${neg ? 'border-neon-red text-neon-red' : 'border-neon-cyan text-neon-cyan'}`}>
        {v.toLocaleString('es-ES')}
      </div>
      <div className="relative h-3 w-full max-w-md rounded-full bg-void-700">
        <motion.div className="absolute top-0 h-3 w-3 rounded-full" animate={{ left: neg ? '0%' : '97%' }} style={{ background: neg ? C.red : C.cyan }} />
        <div className="absolute -bottom-5 left-0 text-[9px] text-slate-500">−2.147.483.648</div>
        <div className="absolute -bottom-5 right-0 text-[9px] text-slate-500">+2.147.483.647</div>
      </div>
      <div className="mt-4 text-xs text-slate-400">{neg ? '¡Se pasó del máximo y dio la vuelta al mínimo!' : 'Subiendo hacia el máximo de un int…'}</div>
    </div>
  );
}

function Widths({ lang }) {
  const big = { python: 'int (sin límite)', java: 'long', csharp: 'long', kotlin: 'Long', swift: 'Int64', c: 'long long', rust: 'i64', cpp: 'long long', go: 'int64', js: 'BigInt (sin límite)' }[lang];
  const small = { python: 'int', java: 'int', csharp: 'int', kotlin: 'Int', swift: 'Int32', c: 'int', rust: 'i32', cpp: 'int', go: 'int32', js: 'number exacto' }[lang];
  return (
    <div className="space-y-3">
      {(lang === 'js' ? [['number', 53, 'exacto hasta 2^53'], ['BigInt', 64, 'sin límite']] : [[small, 32, '≈ 2.100 millones'], [big, 64, '≈ 9 trillones']]).map(([n, bits, max], k) => (
        <div key={n}>
          <div className="mb-1 flex justify-between text-[11px]"><span className="font-bold text-slate-200">{n}</span><span className="text-slate-500">{lang === 'js' ? max : `${bits} bits · máx ${max}`}</span></div>
          <div className="flex gap-[2px]">
            {Array.from({ length: bits }).map((_, i) => (
              <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.02 + k * 0.4 }} className="h-5 flex-1 rounded-sm" style={{ background: k ? C.lime : C.amber, opacity: 0.75 }} />
            ))}
          </div>
        </div>
      ))}
      <div className="text-center text-xs text-slate-400">{lang === 'js' ? <>2^53 + 1 → <span className="text-neon-red">se redondea</span> con number · <span className="text-neon-lime">exacto</span> con BigInt</> : <>3.000.000.000 → <span className="text-neon-red">no cabe</span> en {small} · <span className="text-neon-lime">cabe</span> en {big}</>}</div>
    </div>
  );
}

function Promotion() {
  const t = useTick(1500, 3);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded bg-amber-400/15 px-2 py-1 text-amber-200">int 4</span>×<span className="rounded bg-amber-400/15 px-2 py-1 text-amber-200">int 750M</span>→
        <span className={`rounded px-2 py-1 ${t >= 1 ? 'bg-neon-red/20 text-red-200' : 'bg-white/5'}`}>{t >= 1 ? 'int −1.294.967.296 💥' : '…'}</span>→<span className="rounded bg-white/5 px-2 py-1">caja 64 bits (demasiado tarde)</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded bg-lime-400/15 px-2 py-1 text-lime-200">64 bits 4</span>×<span className="rounded bg-amber-400/15 px-2 py-1 text-amber-200">int 750M</span>→
        <span className={`rounded px-2 py-1 ${t >= 2 ? 'bg-neon-lime/20 text-lime-200' : 'bg-white/5'}`}>{t >= 2 ? '3.000.000.000 ✓' : '…'}</span>
      </div>
    </div>
  );
}

function Division() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {[['1000 / 3', '333.33…', 'decimales', C.amber], ['1000 // 3', '333', 'parte entera', C.cyan], ['1000 % 3', '1', 'lo que sobra', C.lime]].map(([op, r, d, c], i) => (
        <motion.div key={op} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.35 }} className="rounded-xl border p-3 text-center" style={{ borderColor: `${c}66` }}>
          <div className="text-sm font-bold text-slate-200">{op}</div>
          <div className="text-xl font-extrabold" style={{ color: c }}>{r}</div>
          <div className="text-[10px] text-slate-500">{d}</div>
        </motion.div>
      ))}
    </div>
  );
}

function Loop() {
  const t = useTick(800, 8);
  const i = Math.min(t, 5);
  return (
    <div className="space-y-3">
      <div className="text-center text-sm">vuelta <span className="text-xl font-extrabold text-neon-cyan tabular-nums">i = {t < 6 ? i : '—'}</span></div>
      <div className="relative h-16 rounded-lg border border-void-600 bg-void-950/60">
        {Array.from({ length: 6 }).map((_, k) => (
          <motion.div key={k} animate={{ opacity: t >= k && t < 6 ? 1 : t >= 6 ? 1 : 0.1, scale: t === k ? 1.3 : 1 }} className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ left: `${6 + k * 17}%`, background: C.lime, boxShadow: `0 0 10px ${C.lime}` }} />
        ))}
      </div>
      <div className="text-center text-[11px] text-slate-500">{t >= 6 ? '6 vueltas → 6 balizas. Fin del bucle.' : 'cada vuelta coloca una baliza'}</div>
    </div>
  );
}

function RangeEnds() {
  const t = useTick(1600, 2);
  return (
    <div className="space-y-2">
      {[['excluye el final', 6, C.lime], ['incluye el final', 7, C.red]].map(([label, n, col], r) => (
        <div key={label} className={`flex items-center gap-2 rounded-lg p-2 ${t === r ? 'bg-white/5' : ''}`}>
          <div className="w-28 text-[11px] text-slate-400">{label}</div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, k) => (
              <div key={k} className="grid h-7 w-7 place-items-center rounded text-xs font-bold" style={{ background: k < n ? `${col}22` : 'transparent', border: `1px solid ${k < n ? col : C.dim}`, color: k < n ? col : C.dim }}>{k}</div>
            ))}
          </div>
          <div className="text-xs" style={{ color: col }}>{n} vueltas</div>
        </div>
      ))}
    </div>
  );
}

function Table() {
  const t = useTick(700, 8);
  return (
    <table className="mx-auto text-sm tabular-nums">
      <thead><tr className="text-[10px] uppercase tracking-wider text-slate-500"><th className="px-3">i</th><th className="px-3">80 + i × 100</th><th className="px-3">x</th></tr></thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i} className={t === i ? 'bg-neon-cyan/10' : ''} style={{ opacity: t >= i ? 1 : 0.25 }}>
            <td className="px-3 text-center text-neon-cyan">{i}</td><td className="px-3 text-center text-slate-400">80 + {i} × 100</td><td className="px-3 text-center font-bold text-neon-lime">{80 + i * 100}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Branch() {
  const t = useTick(1200, 4);
  const yes = t % 2 === 0;
  return (
    <div className="flex flex-col items-center gap-2 text-sm">
      <div className="rounded-lg border border-neon-violet/50 px-3 py-1 text-violet-200">fuel = {yes ? 80 : 20}</div>
      <div className="rounded-lg border-2 border-neon-amber px-3 py-1 font-bold text-amber-200">¿fuel &gt; 50?</div>
      <div className="flex gap-10">
        <motion.div animate={{ opacity: yes ? 1 : 0.2, scale: yes ? 1.08 : 1 }} className="rounded-lg border border-neon-lime px-3 py-1 text-lime-200">sí → «Vamos»</motion.div>
        <motion.div animate={{ opacity: yes ? 0.2 : 1, scale: yes ? 1 : 1.08 }} className="rounded-lg border border-neon-red px-3 py-1 text-red-200">no → «Repostar»</motion.div>
      </div>
    </div>
  );
}

function Modulo() {
  const t = useTick(600, 9);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} animate={{ opacity: t > i ? 1 : 0.2 }} className="flex flex-col items-center rounded-lg border p-2" style={{ borderColor: i % 2 ? C.magenta : C.cyan }}>
          <div className="text-sm font-bold text-slate-200">{i}</div>
          <div className="text-[10px] text-slate-500">{i} % 2</div>
          <div className="text-lg font-extrabold" style={{ color: i % 2 ? C.magenta : C.cyan }}>{i % 2}</div>
          <div className="text-[9px]" style={{ color: i % 2 ? C.magenta : C.cyan }}>{i % 2 ? 'impar' : 'par'}</div>
        </motion.div>
      ))}
    </div>
  );
}

function Zigzag() {
  const t = useTick(500, 10);
  const pts = Array.from({ length: 8 }, (_, i) => [20 + i * 37, i % 2 ? 80 : 20]);
  return (
    <svg viewBox="0 0 300 100" className="mx-auto w-full max-w-md">
      <polyline points={pts.slice(0, Math.max(1, Math.min(t, 8))).map((p) => p.join(',')).join(' ')} fill="none" stroke={C.lime} strokeWidth="2" />
      {pts.map(([x, y], i) => (
        <g key={i} opacity={t > i ? 1 : 0.2}>
          <circle cx={x} cy={y} r="5" fill={i % 2 ? C.magenta : C.cyan} />
          <text x={x} y={y === 20 ? 10 : 97} fontSize="8" textAnchor="middle" fill={C.muted}>i={i}</text>
        </g>
      ))}
    </svg>
  );
}

/** C: un texto es un array de char con el terminador '\0' al final. */
function CString() {
  const letters = ['N', 'o', 'v', 'a'];
  const t = useTick(650, 8);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs text-slate-400"><span className="font-bold text-neon-magenta">char nombrePiloto[]</span> = "Nova";</div>
      <div className="flex flex-wrap justify-center gap-1">
        {[...letters, '\\0'].map((ch, i) => {
          const end = i === letters.length;
          const lit = t > i;
          return (
            <div key={i} className="flex flex-col items-center">
              <motion.div
                animate={{ opacity: lit ? 1 : 0.25, scale: t === i + 1 ? 1.15 : 1 }}
                className="grid h-11 w-11 place-items-center rounded-md border-2 text-base font-bold"
                style={{ borderColor: end ? C.red : C.magenta, color: end ? C.red : C.text, background: end ? 'rgba(255,71,103,0.08)' : 'rgba(255,61,240,0.06)' }}
              >
                '{ch}'
              </motion.div>
              <div className="text-[10px] text-slate-500">[{i}]</div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {t > letters.length && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-center text-xs leading-relaxed text-slate-300">
            4 letras + <span className="font-bold text-neon-red">'\0'</span> (fin del texto) = <span className="font-bold text-white">5 char</span>
            <div className="text-slate-500">C no tiene tipo string: el texto es una fila de char</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrayV() {
  const vals = [42, 7, 93, 15, 68, 23, 81, 4];
  const t = useTick(500, 11);
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {vals.map((v, i) => (
        <div key={i} className="flex flex-col items-center">
          <motion.div animate={{ scale: t === i ? 1.15 : 1 }} className="grid h-11 w-11 place-items-center rounded-md border-2 text-sm font-bold" style={{ borderColor: t === i ? C.cyan : C.amber, color: C.text }}>{v}</motion.div>
          <div className="text-[10px] text-slate-500">[{i}]</div>
        </div>
      ))}
      <div className="flex flex-col items-center">
        <motion.div animate={{ opacity: t >= 8 ? [0.3, 1, 0.3] : 0.25 }} transition={{ repeat: t >= 8 ? Infinity : 0, duration: 0.6 }} className="grid h-11 w-11 place-items-center rounded-md border-2 border-dashed border-neon-red text-sm font-bold text-neon-red">?</motion.div>
        <div className="text-[10px] text-neon-red">[8] ✖</div>
      </div>
    </div>
  );
}

function Swap() {
  const t = useTick(900, 4);
  const steps = [
    { a: 42, b: 7, tmp: '', msg: 'a = 42, b = 7' },
    { a: 42, b: 7, tmp: 42, msg: '1. tmp = a (guardamos 42)' },
    { a: 7, b: 7, tmp: 42, msg: '2. a = b (ahora a vale 7)' },
    { a: 7, b: 42, tmp: 42, msg: '3. b = tmp (recuperamos 42) ✓' },
  ][t];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-6">
        <Box label="a [0]" value={steps.a} color={C.amber} />
        <Box label="b [1]" value={steps.b} color={C.amber} />
        <Box label="tmp" value={steps.tmp === '' ? '—' : steps.tmp} color={C.violet} />
      </div>
      <div className="text-xs text-slate-300">{steps.msg}</div>
    </div>
  );
}

function Bubble() {
  const [arr, setArr] = useState([5, 2, 8, 1, 4]);
  const [st, setSt] = useState({ i: 0, j: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      setSt(({ i, j }) => {
        const n = 5;
        if (i >= n - 1) { setArr([5, 2, 8, 1, 4]); return { i: 0, j: 0 }; }
        setArr((a) => {
          const b = [...a];
          if (b[j] > b[j + 1]) [b[j], b[j + 1]] = [b[j + 1], b[j]];
          return b;
        });
        return j + 1 >= n - 1 - i ? { i: i + 1, j: 0 } : { i, j: j + 1 };
      });
    }, 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-2">
        {arr.map((v, k) => (
          <motion.div layout key={v} className="flex flex-col items-center">
            <div className="w-9 rounded-t" style={{ height: v * 11, background: k === st.j || k === st.j + 1 ? C.magenta : k >= 5 - st.i ? C.lime : C.amber }} />
            <div className="text-xs text-slate-300">{v}</div>
          </motion.div>
        ))}
      </div>
      <div className="text-[11px] text-slate-400">pasada {st.i + 1} · comparando posiciones {st.j} y {st.j + 1} · en verde, ya colocados</div>
    </div>
  );
}

function Dict({ lang }) {
  const rows = lang === 'c' ? [['[0] ore', 4], ['[1] fuel', 2], ['[2] chip', 2]] : [['"ore"', 4], ['"fuel"', 2], ['"chip"', 2]];
  return (
    <div className="mx-auto max-w-xs overflow-hidden rounded-xl border border-void-600">
      <div className="grid grid-cols-2 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500"><span>{lang === 'c' ? 'índice' : 'clave'}</span><span>valor</span></div>
      {rows.map(([k, v], i) => (
        <motion.div key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.3 }} className="grid grid-cols-2 border-t border-void-600 px-3 py-1.5 text-sm">
          <span className="text-neon-magenta">{k}</span><span className="font-bold text-neon-lime">{v}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Counter() {
  const seq = ['rojo', 'azul', 'rojo', 'rojo', 'azul'];
  const t = useTick(1000, seq.length + 2);
  const counts = {};
  seq.slice(0, Math.min(t, seq.length)).forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  const cur = seq[t - 1];
  return (
    <div className="flex flex-col items-center gap-3 text-sm">
      <div className="flex gap-1">
        {seq.map((c, i) => <span key={i} className="h-5 w-5 rounded-full" style={{ background: c === 'rojo' ? C.red : C.cyan, opacity: i < t ? 0.25 : 1 }} />)}
      </div>
      <div className="h-5 text-xs text-slate-400">{cur && t <= seq.length ? `llega «${cur}»: leo ${counts[cur] - 1}, sumo 1 → guardo ${counts[cur]}` : 'resultado final'}</div>
      <div className="flex gap-3">
        {['rojo', 'azul'].map((c) => <Box key={c} label={`"${c}"`} value={counts[c] || 0} color={c === 'rojo' ? C.red : C.cyan} />)}
      </div>
    </div>
  );
}

function Mold() {
  const t = useTick(800, 5);
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="rounded-xl border-2 border-dashed border-neon-violet p-3 text-center text-xs text-violet-200">
        <div className="font-bold">class Entity</div><div className="text-slate-400">x, y</div><div className="text-slate-400">update()</div>
      </div>
      <div className="text-slate-500">→</div>
      <div className="flex gap-2">
        {[[10, 20], [50, 5], [90, 70]].map(([x, y], i) => (
          <motion.div key={i} animate={{ opacity: t > i ? 1 : 0.15, scale: t === i + 1 ? 1.1 : 1 }} className="rounded-lg border border-neon-cyan bg-neon-cyan/10 p-2 text-center text-[11px] text-cyan-100">
            objeto {i + 1}<div className="text-slate-400">x={x} y={y}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Tree() {
  const kids = [['Player', C.cyan], ['Enemy', C.red], ['Obstacle', C.muted]];
  return (
    <svg viewBox="0 0 300 120" className="mx-auto w-full max-w-md">
      <rect x="110" y="6" width="80" height="26" rx="6" fill="#0d1019" stroke={C.violet} />
      <text x="150" y="23" textAnchor="middle" fontSize="11" fill={C.violet} fontWeight="700">Entity</text>
      <text x="150" y="44" textAnchor="middle" fontSize="8" fill={C.muted}>x, y, update()</text>
      {kids.map(([n, c], i) => {
        const x = 50 + i * 100;
        return (
          <g key={n}>
            <motion.line x1="150" y1="50" x2={x} y2="80" stroke={c} strokeDasharray="3 3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.3 }} />
            <rect x={x - 38} y="80" width="76" height="26" rx="6" fill="#0d1019" stroke={c} />
            <text x={x} y="97" textAnchor="middle" fontSize="11" fill={c} fontWeight="700">{n}</text>
          </g>
        );
      })}
      <text x="150" y="118" textAnchor="middle" fontSize="8" fill={C.muted}>todas heredan x, y y update()</text>
    </svg>
  );
}

function Poly() {
  const t = useTick(60, 100);
  const k = t / 100;
  return (
    <div className="space-y-2">
      <div className="text-center text-xs text-slate-400">el motor llama <span className="text-neon-amber">entity.update()</span> a todas, cada frame</div>
      <div className="relative h-28 rounded-lg border border-void-600 bg-void-950/60">
        <div className="absolute text-[10px] text-cyan-200" style={{ left: `${5 + k * 75}%`, top: 12 }}>▶ Player: x += 2</div>
        <div className="absolute text-[10px] text-red-200" style={{ left: '45%', top: `${10 + k * 60}%` }}>◆ Enemy: y += 3</div>
        <div className="absolute bottom-3 right-4 text-[10px] text-slate-400">■ Obstacle: no se mueve</div>
      </div>
    </div>
  );
}

function Malloc() {
  const t = useTick(900, 5);
  return (
    <div className="space-y-2">
      <div className="text-center text-xs text-slate-400">malloc(8 * sizeof(int)) = 8 × 4 = <span className="text-neon-cyan">32 bytes</span></div>
      <div className="flex gap-[3px]">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="h-6 flex-1 rounded-sm" style={{ background: t >= 1 ? (Math.floor(i / 4) % 2 ? '#1e5a6b' : '#22e4ff') : C.dim, opacity: t >= 1 ? 1 : 0.5 }} />
        ))}
      </div>
      <div className="flex">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex-1 text-center text-[9px] text-slate-500">[{i}]</div>)}
      </div>
      <div className="text-center text-[11px] text-amber-200">{t >= 3 ? 'malloc(8) a secas = solo 8 bytes = 2 ints. ¡Escribir en [2] se sale del bloque!' : 'cada int ocupa 4 bytes'}</div>
    </div>
  );
}

function Leak() {
  const t = useTick(1000, 4);
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {['a', 'b'].map((n, i) => {
        const freed = n === 'a' ? t >= 1 : t >= 3;
        return (
          <div key={n} className="flex flex-col items-center gap-1">
            <motion.div animate={{ opacity: freed ? 0.3 : 1 }} className="grid h-14 w-28 place-items-center rounded-lg border-2 text-xs" style={{ borderColor: freed ? C.muted : i ? C.red : C.cyan, color: C.text }}>
              bloque {n}
            </motion.div>
            <div className="text-[10px]" style={{ color: freed ? C.lime : C.amber }}>{freed ? `free(${n}) ✓` : 'en uso'}</div>
          </div>
        );
      })}
      <div className="w-full text-center text-[11px] text-slate-400">{t === 2 ? 'Si el programa terminara aquí, el bloque b sería una fuga' : 'un free por cada malloc'}</div>
    </div>
  );
}

function Timeline() {
  const t = useTick(80, 60);
  const k = t / 40;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[['Uno detrás de otro', false], ['Todos a la vez', true]].map(([label, par]) => (
        <div key={label} className="rounded-xl border border-void-600 p-3">
          <div className="mb-2 text-xs font-bold" style={{ color: par ? C.lime : C.amber }}>{label}</div>
          {[0, 1, 2].map((i) => {
            const start = par ? 0 : i / 3;
            const w = Math.max(0, Math.min(1 / (par ? 1 : 3), k - start));
            return (
              <div key={i} className="relative mb-1 h-3 rounded bg-void-700">
                <div className="absolute h-3 rounded" style={{ left: `${start * 100}%`, width: `${w * 100}%`, background: [C.cyan, C.magenta, C.amber][i] }} />
              </div>
            );
          })}
          <div className="mt-1 text-[10px] text-slate-500">{par ? 'tiempo total: 1 s' : 'tiempo total: 3 s'}</div>
        </div>
      ))}
    </div>
  );
}

function Race() {
  const t = useTick(1100, 5);
  const msgs = ['total = 10', 'Tarea A lee 10 · Tarea B lee 10', 'A suma 10 → 20 · B suma 10 → 20', 'A escribe 20 · B escribe 20', 'total = 20 😱 (debería ser 30)'];
  return (
    <div className="flex flex-col items-center gap-2">
      <Box label="total" value={t >= 3 ? 20 : 10} color={t >= 4 ? C.red : C.cyan} />
      <div className="text-xs text-slate-300">{msgs[t]}</div>
    </div>
  );
}

function Grid() {
  const [n, setN] = useState(4);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x >= 16 ? 4 : x * 2)), 1600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="text-center">
        <div className="mb-1 text-xs text-neon-red">todos contra todos: {(n * (n - 1)) / 2} comparaciones</div>
        <div className="mx-auto grid w-40 gap-[2px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {Array.from({ length: n * n }).map((_, i) => <div key={i} className="aspect-square rounded-[2px]" style={{ background: i % n > Math.floor(i / n) ? C.red : C.dim }} />)}
        </div>
      </div>
      <div className="text-center">
        <div className="mb-1 text-xs text-neon-lime">una pasada: {n} pasos</div>
        <div className="mx-auto grid w-40 gap-[2px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {Array.from({ length: n }).map((_, i) => <div key={i} className="aspect-square rounded-[2px]" style={{ background: C.lime }} />)}
        </div>
      </div>
      <div className="text-center text-[11px] text-slate-400 sm:col-span-2">n = {n} drones</div>
    </div>
  );
}

function Seen() {
  const ids = [3, 1, 4, 1, 5];
  const t = useTick(1000, ids.length + 1);
  const seen = ids.slice(0, Math.min(t, 3));
  const found = t >= 4;
  return (
    <div className="flex flex-col items-center gap-3 text-sm">
      <div className="flex gap-2">
        {ids.map((x, i) => <motion.div key={i} animate={{ scale: t === i + 1 ? 1.2 : 1 }} className="grid h-9 w-9 place-items-center rounded-md border" style={{ borderColor: found && i === 3 ? C.red : t > i ? C.cyan : C.dim, color: C.text }}>{x}</motion.div>)}
      </div>
      <div className="rounded-lg border border-neon-violet/50 px-3 py-1 text-xs text-violet-200">vistos = {'{'} {seen.join(', ')} {'}'}</div>
      <div className="h-4 text-xs">{found ? <span className="text-neon-red">el 1 ya estaba en «vistos» → ¡clon detectado!</span> : <span className="text-slate-400">¿está en vistos? no → lo apunto</span>}</div>
    </div>
  );
}

function Bars() {
  return (
    <div className="space-y-2 text-xs">
      {[['Dos bucles (n²)', 1280000, C.red], ['Un bucle + conjunto (n)', 1600, C.lime]].map(([l, v, c], i) => (
        <div key={l}>
          <div className="mb-1 flex justify-between"><span className="text-slate-300">{l}</span><span className="tabular-nums" style={{ color: c }}>{v.toLocaleString('es-ES')} pasos</span></div>
          <div className="h-4 rounded bg-void-700"><motion.div className="h-4 rounded" style={{ background: c }} initial={{ width: 0 }} animate={{ width: `${Math.max(1, (v / 1280000) * 100)}%` }} transition={{ duration: 1.2, delay: i * 0.3 }} /></div>
        </div>
      ))}
    </div>
  );
}

function Stack() {
  const t = useTick(700, 10);
  const depth = t <= 4 ? t : 9 - t;
  const returning = t > 4;
  const frames = [4, 3, 2, 1];
  const results = { 1: 1, 2: 2, 3: 6, 4: 24 };
  return (
    <div className="flex flex-col items-center gap-1">
      {frames.slice(0, Math.max(1, depth + (returning ? 1 : 0))).map((n, i) => {
        const shown = i <= depth;
        const resolved = returning && i >= depth;
        return (
          <motion.div key={n} initial={{ opacity: 0, y: -6 }} animate={{ opacity: shown || resolved ? 1 : 0.2, y: 0 }}
            className="flex w-64 items-center justify-between rounded-lg border px-3 py-1 text-xs"
            style={{ borderColor: resolved ? C.lime : C.cyan, marginLeft: i * 14, background: resolved ? 'rgba(163,255,61,0.08)' : 'rgba(34,228,255,0.06)' }}>
            <span className="text-slate-200">factorial({n}) {n > 1 ? `= ${n} × factorial(${n - 1})` : '= 1 (caso base)'}</span>
            {resolved && <span className="font-bold text-neon-lime">→ {results[n]}</span>}
          </motion.div>
        );
      })}
      <div className="mt-1 text-[11px] text-slate-400">{returning ? 'Las llamadas se resuelven de abajo arriba' : 'Cada llamada espera a la siguiente'}</div>
    </div>
  );
}

function Borrow() {
  const t = useTick(1300, 4);
  return (
    <div className="flex flex-col items-center gap-2 text-xs">
      <div className="flex items-center gap-3">
        <Box label="dueño: a" value="Vec" color={t >= 1 ? C.muted : C.cyan} />
        <motion.div animate={{ x: t >= 1 ? 0 : -10, opacity: t >= 1 ? 1 : 0.2 }} className="text-neon-amber">→ move →</motion.div>
        <Box label="dueño: b" value={t >= 1 ? 'Vec' : '—'} color={C.lime} />
      </div>
      <div className="h-4 text-slate-300">{['a es dueño del vector', 'let b = a; → el vector se MUEVE a b', 'usar a ahora: error del compilador (borrowed after move)', 'Rust detecta el error antes de ejecutar'][t]}</div>
    </div>
  );
}

/** Un programa se ejecuta de arriba abajo: cada orden escribe su línea en la pantalla. */
function Orders() {
  const t = useTick(1100, 5);
  const lines = ['"Arrancando motores"', '"Escudos activados"', '"Listos para despegar"'];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-void-600 bg-void-950/60 p-3 text-[12px]">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">tu programa</div>
        {lines.map((l, i) => (
          <motion.div key={l} animate={{ opacity: t > i ? 1 : 0.35, x: t === i + 1 ? 6 : 0 }} className="flex items-center gap-2 py-0.5" style={{ color: t === i + 1 ? C.cyan : C.text }}>
            <span style={{ color: t === i + 1 ? C.cyan : 'transparent' }}>▶</span> orden {i + 1}: escribe {l}
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-neon-lime/40 bg-neon-lime/5 p-3 text-[12px]">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">la pantalla</div>
        {lines.map((l, i) => (
          <motion.div key={l} animate={{ opacity: t > i ? 1 : 0 }} className="py-0.5 font-bold text-lime-200">&gt; {l.slice(1, -1)}</motion.div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = {
  orders: Orders,
  boxes: Boxes, typecut: TypeCut, quotes: Quotes, odometer: Odometer, widths: Widths, promotion: Promotion, division: Division,
  loop: Loop, rangeEnds: RangeEnds, table: Table, branch: Branch, modulo: Modulo, zigzag: Zigzag,
  array: ArrayV, cstring: CString, swap: Swap, bubble: Bubble, dict: Dict, counter: Counter, mold: Mold, tree: Tree, poly: Poly,
  malloc: Malloc, leak: Leak, timeline: Timeline, race: Race, grid: Grid, seen: Seen, bars: Bars, borrow: Borrow, stack: Stack,
};

export default function LessonVisual({ kind, lang }) {
  const V = VISUALS[kind];
  if (!V) return null;
  return <V lang={lang} />;
}
