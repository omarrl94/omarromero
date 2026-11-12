import { useEffect, useMemo, useRef, useState } from 'react';
import { GRUPOS, aplica, avanza, evaluaEscenarios, newSim, type Cable, type Comp, type Escenario, type Sim } from '../engine/automatismo';
import { Icon } from './Icon';

const W = 205, MARGEN = 8, COLS = 3;
const color = (i: number) => ['#EFCD2F', '#8FB4F5', '#E39F7D', '#A9CABB', '#c9a0ff', '#6ee79a'][i % 6]!;

interface Pos { x: number; y: number; w: number; h: number }
function disposicion(comps: Comp[]) {
  const pos: Record<string, Pos> = {};
  const term: Record<string, { x: number; y: number }> = {};
  let y = MARGEN; let fila = 0, maxH = 0;
  comps.forEach((c, i) => {
    const col = i % COLS;
    if (col === 0 && i > 0) { y += maxH + 14; maxH = 0; fila++; }
    const h = 36 + GRUPOS[c.tipo].length * 38;
    const x = MARGEN + col * (W + 8);
    pos[c.id] = { x, y, w: W, h }; maxH = Math.max(maxH, h);
    GRUPOS[c.tipo].forEach((g, j) => g.terms.forEach((t, k) => { term[`${c.id}.${t}`] = { x: x + W - 78 + k * 44, y: y + 46 + j * 38 }; }));
  });
  return { pos, term, alto: y + maxH + MARGEN, fila };
}

/** Editor de cableado de mando + banco de pruebas en vivo. */
export function Cableado({ comps, fijos, cables, onChange, bloqueado, escenarios, revelar }: { comps: Comp[]; fijos: Cable[]; cables: Cable[]; onChange: (c: Cable[]) => void; bloqueado: boolean; escenarios: Escenario[]; revelar: boolean }) {
  const { pos, term, alto } = useMemo(() => disposicion(comps), [comps]);
  const [sel, setSel] = useState<string | null>(null);
  const todos = useMemo(() => [...fijos, ...cables], [fijos, cables]);

  // Simulación en vivo
  const sim = useRef<Sim>(newSim(comps, todos));
  const [, tick] = useState(0);
  const [veloz, setVeloz] = useState(false);
  useEffect(() => { sim.current = newSim(comps, todos); tick((t) => t + 1); }, [comps, todos]);
  useEffect(() => {
    const id = setInterval(() => { avanza(sim.current, veloz ? 0.5 : 0.1); tick((t) => t + 1); }, 100);
    return () => clearInterval(id);
  }, [veloz]);
  const s = sim.current;
  const act = (a: string) => { aplica(sim.current, a); tick((t) => t + 1); };

  const clic = (t: string) => {
    if (bloqueado) return;
    if (!sel) { setSel(t); return; }
    if (sel === t) { setSel(null); return; }
    const existe = todos.some(([a, b]) => (a === sel && b === t) || (a === t && b === sel));
    if (!existe) onChange([...cables, [sel, t]]);
    setSel(null);
  };
  const quita = (i: number) => { if (!bloqueado) onChange(cables.filter((_, k) => k !== i)); };
  const ruta = ([a, b]: Cable, i: number) => {
    const p = term[a], q = term[b];
    if (!p || !q) return '';
    const sag = 20 + (i % 6) * 7;
    return `M ${p.x} ${p.y} C ${p.x} ${p.y + sag}, ${q.x} ${q.y + sag}, ${q.x} ${q.y}`;
  };
  const pulsadores = comps.filter((c) => c.tipo === 'pulsador_na' || c.tipo === 'pulsador_nc');
  const termicos = comps.filter((c) => c.tipo === 'termico');
  const receptores = comps.filter((c) => ['contactor', 'temporizador', 'piloto'].includes(c.tipo));
  const res = revelar ? evaluaEscenarios(comps, todos, escenarios).resultados : [];

  return (
    <section className="grid gap-4" aria-label="Cableado del circuito de mando">
      <div className="rounded-lg border border-line bg-ink p-2">
        <svg viewBox={`0 0 ${MARGEN * 2 + COLS * (W + 8)} ${alto}`} className="w-full" role="group" aria-label="Esquema de cableado">
          {comps.map((c) => {
            const p = pos[c.id]!;
            return (
              <g key={c.id}>
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="5" fill="#161c20" stroke="#2b363c" />
                <text x={p.x + 10} y={p.y + 20} fontSize="12" fontWeight="600" fill="#e7edef">{c.etiqueta}</text>
                {c.retardo !== undefined && <text x={p.x + p.w - 10} y={p.y + 20} fontSize="10" fill="#93a4ab" textAnchor="end" fontFamily="monospace">{c.retardo} s</text>}
                {GRUPOS[c.tipo].map((g, j) => <text key={j} x={p.x + 10} y={p.y + 50 + j * 38} fontSize="10" fill="#93a4ab">{g.nombre}</text>)}
              </g>
            );
          })}
          {todos.map((c, i) => <path key={`w${i}`} d={ruta(c, i)} fill="none" stroke={i < fijos.length ? '#566872' : color(i - fijos.length)} strokeWidth="2" strokeLinecap="round" />)}
          {cables.map((c, i) => <path key={`h${i}`} d={ruta(c, i + fijos.length)} fill="none" stroke="transparent" strokeWidth="12" className="cursor-pointer" onClick={() => quita(i)}><title>Clic para eliminar el cable</title></path>)}
          {Object.entries(term).map(([id, p]) => (
            <g key={id} role="button" tabIndex={0} aria-label={`Terminal ${id}${sel === id ? ' (seleccionado)' : ''}`} aria-pressed={sel === id}
              onClick={() => clic(id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clic(id); } }} className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-info">
              <circle cx={p.x} cy={p.y} r={sel === id ? 8 : 6} fill={sel === id ? '#EFCD2F' : '#0e1215'} stroke={sel === id ? '#EFCD2F' : '#93a4ab'} strokeWidth="2" />
              <text x={p.x} y={p.y + 19} fontSize="9" fill="#93a4ab" textAnchor="middle" fontFamily="monospace">{id.split('.')[1]}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="text-xs text-mute">Pulsa un terminal y después otro para unirlos con un cable. Pulsa un cable para eliminarlo. Los cables grises ya vienen montados.</p>
      {cables.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 font-mono text-xs">{cables.map(([a, b], i) => <li key={a + b + i}><button type="button" disabled={bloqueado} onClick={() => quita(i)} className="chip hover:border-bad" style={{ borderColor: color(i) }}>{a} — {b} <Icon n="x" className="ml-1 h-3 w-3" /></button></li>)}</ul>
      )}
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="eyebrow">Banco de pruebas en vivo</h2>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost !px-2.5 !py-1 !text-xs" onClick={() => setVeloz((v) => !v)} aria-pressed={veloz}>Tiempo ×5 {veloz ? 'activo' : ''}</button>
            <button type="button" className="btn btn-ghost !px-2.5 !py-1 !text-xs" onClick={() => { sim.current = newSim(comps, todos); tick((t) => t + 1); }}><Icon n="redo" className="h-3 w-3" />Reiniciar</button>
          </div>
        </div>
        {s.corto && <p role="alert" className="mb-3 rounded border border-bad bg-bad/10 p-2 text-sm text-bad">Cortocircuito: fase y neutro están unidos sin receptor. Revisa el cableado.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-wrap gap-2">
            {pulsadores.map((c) => (
              <button key={c.id} type="button" className={`btn btn-ghost select-none ${s.pulsados.has(c.id) ? '!border-acc !bg-acc/20' : ''}`}
                onPointerDown={() => act(`press:${c.id}`)} onPointerUp={() => act(`release:${c.id}`)} onPointerLeave={() => s.pulsados.has(c.id) && act(`release:${c.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(`pulse:${c.id}`); } }}>
                {c.etiqueta}<span className="text-[10px] text-mute">{c.tipo === 'pulsador_nc' ? 'NC' : 'NA'}</span>
              </button>
            ))}
            {termicos.map((c) => (
              <label key={c.id} className="btn btn-ghost cursor-pointer">
                <input type="checkbox" checked={s.disparados.has(c.id)} onChange={(e) => act(`${e.target.checked ? 'trip' : 'reset'}:${c.id}`)} />Disparar {c.etiqueta}
              </label>
            ))}
          </div>
          <ul className="grid gap-1.5 text-sm">
            {receptores.map((c) => {
              const on = c.tipo === 'contactor' ? s.on[c.id] : s.activos[c.id];
              return (
                <li key={c.id} className="flex items-center gap-2"><span aria-hidden className={`h-3 w-3 rounded-full ${on ? 'bg-ok shadow-[0_0_8px_#3fb27f]' : 'bg-line'}`} /><span className="font-mono">{c.etiqueta}</span><span className="text-xs text-mute">{on ? 'activo' : 'reposo'}{c.tipo === 'temporizador' && s.activos[c.id] ? ` · ${(s.t[c.id] ?? 0).toFixed(1)}/${c.retardo} s` : ''}</span></li>
              );
            })}
          </ul>
        </div>
      </div>
      {revelar && (
        <ul className="grid gap-1.5 text-sm" aria-label="Resultado de las pruebas">
          {res.map((r) => <li key={r.nombre} className={`rounded border px-3 py-2 ${r.ok ? 'border-ok/50 bg-ok/10' : 'border-bad/50 bg-bad/10'}`}><strong>{r.ok ? 'Correcto' : 'Fallo'} · {r.nombre}</strong>{r.motivo && <div className="text-mute">{r.motivo}</div>}</li>)}
        </ul>
      )}
    </section>
  );
}
