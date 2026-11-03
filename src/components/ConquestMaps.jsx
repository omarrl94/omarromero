import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Coins } from 'lucide-react';
import { LANGUAGES, LANG_ORDER } from '../core/languages.js';
import { MODULES, CHALLENGES } from '../curriculum/index.js';
import { useProgress, worldDone, goldOf, starsOf, isDone, moduleUnlocked, rankOf, worldXp } from '../core/progress.js';
import Avatar from './Avatar.jsx';
import { play } from '../core/sound.js';

const GOLD = '#ffd34d';
const GOLD_DARK = '#b8860b';

function seeded(n, seed = 3) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), r: rnd() }));
}

/** Moneda de oro (icono SVG reutilizable dentro de los mapas). */
function Coin({ x, y, r = 7 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.2" />
      <circle r={r * 0.62} fill="none" stroke={GOLD_DARK} strokeWidth="0.8" opacity="0.6" />
      <text y={r * 0.38} textAnchor="middle" fontSize={r * 1.05} fontWeight="800" fill={GOLD_DARK}>$</text>
    </g>
  );
}

// ───────────────────────── Galaxia de mundos ─────────────────────────

const PLANETS = {
  python: [130, 170], js: [320, 105], java: [500, 195], kotlin: [690, 110], swift: [870, 185],
  c: [190, 410], cpp: [395, 450], go: [610, 395], rust: [830, 445],
};
const LANES = [['python', 'js'], ['js', 'java'], ['java', 'kotlin'], ['kotlin', 'swift'], ['python', 'c'], ['c', 'cpp'], ['cpp', 'go'], ['go', 'rust'], ['java', 'cpp'], ['swift', 'rust'], ['java', 'go']];

/**
 * Mapa galáctico: cada lenguaje es un planeta que se cubre de oro a medida que
 * conquistas sus misiones. Al completarlo, gana una corona.
 */
export function GalaxyMap({ onEnter, avatar }) {
  const { state } = useProgress();
  const [sel, setSel] = useState(state.lang || null);
  const stars = useMemo(() => seeded(140, 11), []);
  const total = CHALLENGES.length;
  const selL = sel ? LANGUAGES[sel] : null;

  return (
    <div className="relative">
      <div className="glass mx-auto max-w-6xl overflow-hidden rounded-2xl">
        <svg viewBox="0 0 1000 560" className="block h-auto w-full" role="group" aria-label="Mapa galáctico de mundos">
          <defs>
            <radialGradient id="nebula1" cx="25%" cy="30%" r="45%"><stop offset="0%" stopColor="#22e4ff" stopOpacity="0.14" /><stop offset="100%" stopColor="#22e4ff" stopOpacity="0" /></radialGradient>
            <radialGradient id="nebula2" cx="75%" cy="70%" r="45%"><stop offset="0%" stopColor="#ff3df0" stopOpacity="0.13" /><stop offset="100%" stopColor="#ff3df0" stopOpacity="0" /></radialGradient>
            <linearGradient id="goldFill" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#b8860b" /><stop offset="60%" stopColor={GOLD} /><stop offset="100%" stopColor="#fff2b0" /></linearGradient>
            {LANG_ORDER.map((l) => (
              <radialGradient key={l} id={`pl-${l}`} cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="25%" stopColor={LANGUAGES[l].color} />
                <stop offset="100%" stopColor="#05060a" />
              </radialGradient>
            ))}
          </defs>
          <rect width="1000" height="560" fill="#060812" />
          <rect width="1000" height="560" fill="url(#nebula1)" />
          <rect width="1000" height="560" fill="url(#nebula2)" />
          {stars.map((s, i) => (
            <circle key={i} cx={s.x * 1000} cy={s.y * 560} r={0.4 + s.r * 1.3} fill="#cfe0ff" opacity={0.25 + s.r * 0.6}>
              {i % 9 === 0 && <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${2 + s.r * 3}s`} repeatCount="indefinite" />}
            </circle>
          ))}
          {/* rutas hiperespaciales */}
          {LANES.map(([a, b]) => {
            const conquered = worldDone(state, a) === total && worldDone(state, b) === total;
            return (
              <line key={`${a}-${b}`} x1={PLANETS[a][0]} y1={PLANETS[a][1]} x2={PLANETS[b][0]} y2={PLANETS[b][1]}
                stroke={conquered ? GOLD : '#2b3555'} strokeWidth={conquered ? 2.5 : 1.5} strokeDasharray="4 7" opacity="0.8">
                <animate attributeName="stroke-dashoffset" values="0;-22" dur="2.4s" repeatCount="indefinite" />
              </line>
            );
          })}
          {LANG_ORDER.map((l) => {
            const [x, y] = PLANETS[l];
            const L = LANGUAGES[l];
            const done = worldDone(state, l);
            const pct = done / total;
            const R = 44;
            const complete = done === total;
            const active = sel === l;
            const here = state.lang === l;
            const circ = 2 * Math.PI * (R + 9);
            return (
              <g
                key={l}
                transform={`translate(${x} ${y})`}
                role="button"
                tabIndex={0}
                aria-label={`Mundo ${L.name}: ${done} de ${total} misiones conquistadas`}
                onClick={() => { setSel(l); play('click'); }}
                onDoubleClick={() => onEnter(l)}
                onKeyDown={(e) => { if (e.key === 'Enter') onEnter(l); if (e.key === ' ') { e.preventDefault(); setSel(l); } }}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {active && <circle r={R + 22} fill="none" stroke={L.color} strokeOpacity="0.5" strokeWidth="1.5"><animate attributeName="r" values={`${R + 16};${R + 26};${R + 16}`} dur="2.4s" repeatCount="indefinite" /></circle>}
                <circle r={R + 9} fill="none" stroke="#1d2540" strokeWidth="5" />
                <circle r={R + 9} fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${circ * pct} ${circ}`} transform="rotate(-90)" style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }} />
                <circle r={R} fill={`url(#pl-${l})`} />
                <clipPath id={`clip-${l}`}><circle r={R} /></clipPath>
                <g clipPath={`url(#clip-${l})`}>
                  <rect x={-R} y={R - 2 * R * pct} width={2 * R} height={2 * R * pct} fill="url(#goldFill)" opacity="0.88">
                    {pct > 0 && pct < 1 && <animate attributeName="y" values={`${R - 2 * R * pct};${R - 2 * R * pct - 2};${R - 2 * R * pct}`} dur="3s" repeatCount="indefinite" />}
                  </rect>
                  <ellipse cx={-R * 0.3} cy={-R * 0.1} rx={R * 0.9} ry={R * 0.18} fill="#000" opacity="0.18" transform="rotate(-18)" />
                  <ellipse cx={R * 0.2} cy={R * 0.35} rx={R * 0.8} ry={R * 0.12} fill="#fff" opacity="0.07" transform="rotate(-18)" />
                </g>
                <circle r={R} fill="none" stroke={L.color} strokeWidth="1.5" opacity="0.8" />
                {complete && (
                  <g transform={`translate(0 ${-R - 26})`}>
                    <path d="M-18 8 L-14 -10 L-6 0 L0 -14 L6 0 L14 -10 L18 8 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 8px ${GOLD})` }} />
                  </g>
                )}
                {here && (
                  <g>
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />
                    <g transform={`translate(${R + 16} 0)`}>
                      <foreignObject x="-14" y="-14" width="28" height="28"><Avatar id={avatar} size={28} /></foreignObject>
                    </g>
                  </g>
                )}
                <text y={R + 30} textAnchor="middle" fontSize="15" fontWeight="800" fill={L.color} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{L.name}</text>
                <text y={R + 47} textAnchor="middle" fontSize="11" fill="#9aa3c7" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{done}/{total} · {goldOf(state, l)} oro</text>
                {L.trending && <text y={-R - 10} textAnchor="middle" fontSize="11" fill="#fb923c" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{complete ? '' : '🔥 en auge'}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {selL && (
          <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass mt-3 flex flex-wrap items-center gap-4 rounded-2xl p-4" style={{ boxShadow: `0 0 0 1px ${selL.color}55` }}>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: selL.color }}>Mundo {selL.name}</div>
              <p className="text-sm text-slate-200">{selL.tagline}</p>
              <p className="mt-1 text-xs text-slate-500">{selL.paradigm}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">{rankOf(worldXp(state, sel)).name}</span>
              <span className="flex items-center gap-1 font-bold text-amber-200"><Coins size={14} className="text-amber-300" /> {goldOf(state, sel)}</span>
              <span className="text-slate-400">{worldDone(state, sel)}/{total} conquistadas</span>
            </div>
            <button type="button" onClick={() => onEnter(sel)} className="btn-neon text-void-950" style={{ background: selL.color, boxShadow: `0 0 18px -4px ${selL.color}` }}>
              {worldDone(state, sel) || state.lang === sel ? 'Entrar' : 'Empezar'} <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────── Mapa de conquista de un mundo ─────────────────────────

const NODE_POS = {
  'm1-world-laws': [85, 405], 'm1-reactor': [180, 335],
  'm2-patrol': [300, 345], 'm2-zigzag': [395, 255],
  'm3-sort-cargo': [520, 390], 'm3-inventory': [610, 315],
  'm4-entities': [740, 250],
  'm5-systems': [865, 365],
  'boss-swarm': [905, 120],
};
const ISLANDS = {
  1: { cx: 132, cy: 372, rx: 102, ry: 82 },
  2: { cx: 348, cy: 300, rx: 98, ry: 92 },
  3: { cx: 565, cy: 352, rx: 98, ry: 84 },
  4: { cx: 740, cy: 250, rx: 62, ry: 62 },
  5: { cx: 865, cy: 365, rx: 62, ry: 62 },
  6: { cx: 905, cy: 122, rx: 74, ry: 64 },
};

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Mapa de un mundo: las misiones son territorios unidos por un camino.
 * Conquistados → dorados con tu bandera; disponibles → laten; bloqueados → candado.
 */
export function WorldMap({ onOpen, avatar }) {
  const { state } = useProgress();
  const L = LANGUAGES[state.lang];
  const order = MODULES.flatMap((m) => m.challenges.map((c) => ({ c, m })));
  const pts = order.map(({ c }) => NODE_POS[c.id]);
  const lastDone = order.reduce((acc, { c }, i) => (isDone(state, c.id) ? i : acc), -1);
  const goldPts = pts.slice(0, lastDone + 1);
  const stars = useMemo(() => seeded(60, 5), []);
  const [hover, setHover] = useState(null);

  return (
    <div className="glass mx-auto max-w-5xl overflow-hidden rounded-2xl">
      <svg viewBox="0 30 1000 470" className="block h-auto w-full" role="group" aria-label={`Mapa de conquista del mundo ${L.name}`}>
        <defs>
          <radialGradient id="seaGlow" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor={L.color} stopOpacity="0.10" /><stop offset="100%" stopColor="#05060a" stopOpacity="0" /></radialGradient>
          <linearGradient id="goldNode" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff2b0" /><stop offset="50%" stopColor={GOLD} /><stop offset="100%" stopColor="#b8860b" /></linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke={L.color} strokeOpacity="0.06" /></pattern>
        </defs>
        <rect width="1000" height="500" fill="#070912" />
        <rect width="1000" height="500" fill="url(#grid)" />
        <rect width="1000" height="500" fill="url(#seaGlow)" />
        {stars.map((s, i) => <circle key={i} cx={s.x * 1000} cy={s.y * 500} r={0.5 + s.r} fill="#cfe0ff" opacity={0.15 + s.r * 0.35} />)}
        {/* islas: una por módulo */}
        {MODULES.map((m) => {
          const is = ISLANDS[m.id];
          const conquered = m.challenges.every((c) => isDone(state, c.id));
          const unlocked = moduleUnlocked(state, m.id);
          return (
            <g key={m.id} opacity={unlocked ? 1 : 0.45}>
              <ellipse cx={is.cx} cy={is.cy + 8} rx={is.rx} ry={is.ry} fill="#000" opacity="0.35" />
              <ellipse cx={is.cx} cy={is.cy} rx={is.rx} ry={is.ry} fill={conquered ? '#3a2f0a' : '#0f1424'} stroke={conquered ? GOLD : m.color} strokeOpacity={conquered ? 0.9 : 0.5} strokeWidth="2" />
              <ellipse cx={is.cx} cy={is.cy} rx={is.rx - 12} ry={is.ry - 12} fill="none" stroke={conquered ? GOLD : m.color} strokeOpacity="0.18" strokeDasharray="3 6" />
              <text x={is.cx} y={is.cy - is.ry - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={conquered ? GOLD : m.color} opacity="0.85" style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
                {m.boss ? 'BOSS' : `M${m.id} · ${m.name.toUpperCase()}`}
              </text>
            </g>
          );
        })}
        {/* camino */}
        <path d={smoothPath(pts)} fill="none" stroke="#2b3555" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" />
        {goldPts.length > 1 && <path d={smoothPath(goldPts)} fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }} />}
        {/* territorios */}
        {order.map(({ c, m }, i) => {
          const [x, y] = NODE_POS[c.id];
          const done = isDone(state, c.id);
          const unlocked = moduleUnlocked(state, m.id);
          const st = starsOf(state, c.id);
          const isNext = unlocked && !done && (i === 0 || isDone(state, order[i - 1].c.id) || order[i - 1].m.id !== m.id);
          const r = c.boss ? 30 : 24;
          return (
            <g key={c.id} transform={`translate(${x} ${y})`}
              role="button" tabIndex={unlocked ? 0 : -1} aria-label={`${c.title}: ${done ? 'conquistada' : unlocked ? 'disponible' : 'bloqueada'}`}
              onClick={() => { if (unlocked) { play('click'); onOpen(c.id); } }}
              onKeyDown={(e) => { if (e.key === 'Enter' && unlocked) onOpen(c.id); }}
              onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)}
              style={{ cursor: unlocked ? 'pointer' : 'not-allowed', outline: 'none' }}>
              {isNext && (
                <circle r={r + 10} fill="none" stroke={L.color} strokeWidth="2">
                  <animate attributeName="r" values={`${r + 6};${r + 16};${r + 6}`} dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <path d={hexPath(r)} fill={done ? 'url(#goldNode)' : unlocked ? '#121a2e' : '#10131c'} stroke={done ? GOLD_DARK : unlocked ? L.color : '#3a4266'} strokeWidth="2.5"
                style={done ? { filter: `drop-shadow(0 0 10px ${GOLD})` } : unlocked ? { filter: `drop-shadow(0 0 8px ${L.color}88)` } : {}} />
              {c.boss ? (
                <text y="9" textAnchor="middle" fontSize="24">{done ? '👑' : '💀'}</text>
              ) : done ? (
                <g>
                  <line x1="0" y1="10" x2="0" y2="-26" stroke="#5a4206" strokeWidth="2.5" />
                  <path d="M0 -26 L22 -20 L0 -13 Z" fill={L.color} stroke="#05060a" strokeWidth="0.8" />
                  <foreignObject x="-12" y="-6" width="24" height="24"><Avatar id={avatar} size={22} /></foreignObject>
                </g>
              ) : unlocked ? (
                <text y="7" textAnchor="middle" fontSize="18" fontWeight="800" fill={L.color} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</text>
              ) : (
                <g transform="translate(-7 -9)"><rect x="1" y="7" width="12" height="10" rx="2" fill="#3a4266" /><path d="M3.5 7V4.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="#3a4266" strokeWidth="2" /></g>
              )}
              {/* estrellas */}
              <g transform={`translate(0 ${r + 14})`}>
                {[0, 1, 2].map((k) => (
                  <path key={k} transform={`translate(${(k - 1) * 13} 0) scale(0.55)`} d="M0 -10 L3 -3 L10 -3 L4.5 2 L6.5 9 L0 5 L-6.5 9 L-4.5 2 L-10 -3 L-3 -3 Z"
                    fill={k < st ? GOLD : '#252c45'} stroke={k < st ? GOLD_DARK : 'none'} />
                ))}
              </g>
              {done && <Coin x={r - 2} y={-r + 2} r={7} />}
              {(hover === c.id || isNext) && (
                <g transform={`translate(0 ${-r - (done ? 40 : 18)})`}>
                  <rect x={-c.title.length * 3.6 - 10} y="-15" width={c.title.length * 7.2 + 20} height="22" rx="6" fill="#0d1019" stroke={done ? GOLD : L.color} strokeOpacity="0.7" />
                  <text y="1" textAnchor="middle" fontSize="12" fill={done ? GOLD : '#e6ebff'} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{isNext && hover !== c.id ? '¡Conquista!' : c.title}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function hexPath(r) {
  const p = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    p.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  return `M ${p.join(' L ')} Z`;
}

export { Coin };
