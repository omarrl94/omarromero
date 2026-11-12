import { useEffect, useRef } from 'react';
import { useStore, type InstId, type ProbeKey } from '../store';

/** Ventana flotante de instrumento: se arrastra por la barra de título, se minimiza y se cierra. */
export function FloatingWin({ id, title, width, children, order = 0 }: { id: InstId; title: string; width: number; children: React.ReactNode; order?: number }) {
  const st = useStore();
  const w = st.inst[id];
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // Posición inicial: esquina derecha del lienzo, escalonada
  useEffect(() => {
    if (w.open && w.x === null && ref.current?.parentElement) {
      const pw = ref.current.parentElement.clientWidth;
      st.moveInst(id, Math.max(8, pw - width - 12 - order * 16), 12 + order * 28);
    }
  }, [w.open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!w.open) return null;
  return (
    <div ref={ref} className="fwin" style={{ left: w.x ?? 12, top: w.y ?? 12, width }} data-win={id}
      onPointerDown={() => { /* traer al frente */ ref.current!.style.zIndex = String(20 + Date.now() % 100000); }}>
      <div className="fbar"
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; (e.currentTarget as Element).setPointerCapture(e.pointerId); const r = ref.current!.getBoundingClientRect(); drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top }; }}
        onPointerMove={(e) => {
          if (!drag.current || !ref.current?.parentElement) return;
          const p = ref.current.parentElement.getBoundingClientRect();
          st.moveInst(id, Math.min(p.width - 60, Math.max(-width + 80, e.clientX - p.left - drag.current.dx)), Math.min(p.height - 30, Math.max(0, e.clientY - p.top - drag.current.dy)));
        }}
        onPointerUp={() => (drag.current = null)}>
        <span className="grip">⠿</span><b>{title}</b>
        <span className="grow" />
        <button onClick={() => st.minInst(id)} aria-label="Minimizar">{w.min ? '▢' : '–'}</button>
        <button onClick={() => st.toggleInst(id)} aria-label="Cerrar">✕</button>
      </div>
      {!w.min && <div className="fbody">{children}</div>}
    </div>
  );
}

/**
 * Arrastre de puntas de prueba: se coge la punta en el instrumento (o una ya colocada en el circuito),
 * se suelta sobre un borne y se «imanta» al más cercano. Soltar en vacío quita la punta;
 * un simple clic arma la punta para pulsar después un borne.
 */
export function ProbeDragLayer() {
  const st = useStore();
  const d = st.probeDrag;
  const start = useRef<{ x: number; y: number } | null>(null);
  const nearest = (x: number, y: number, max = 34) => {
    let best: { el: Element; dist: number } | null = null;
    document.querySelectorAll('[data-term]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const dist = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (dist < max && (!best || dist < best.dist)) best = { el, dist };
    });
    return best as { el: Element; dist: number } | null;
  };
  const key = d?.key;
  useEffect(() => {
    if (!key) return;
    const move = (e: PointerEvent) => useStore.getState().setProbeDrag({ key, x: e.clientX, y: e.clientY });
    const up = (e: PointerEvent) => {
      const s = useStore.getState();
      const moved = start.current ? Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6 : true;
      const hit = nearest(e.clientX, e.clientY);
      if (hit) {
        const [comp, term] = (hit.el.getAttribute('data-term') ?? '').split(':');
        if (comp) s.placeProbe(key, { comp, term: Number(term) });
      } else if (!moved) {
        // clic simple: armar la punta
        if (key === 'red' || key === 'black') s.setMeter({ armed: s.meter.armed === key ? null : key });
        else s.armScope(s.scopeArm === key ? null : key);
      } else if ((key === 'red' || key === 'black' ? s.meter[key] : s.scopeTips[key])) {
        s.placeProbe(key, null); // soltada en vacío: se retira
      }
      s.setProbeDrag(null);
      start.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    document.body.style.cursor = 'grabbing';
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.body.style.cursor = ''; };
  }, [key]);
  if (!d) return null;
  start.current ??= { x: d.x, y: d.y };
  const hit = nearest(d.x, d.y);
  const r = hit?.el.getBoundingClientRect();
  const col = { red: '#e53935', black: '#1b1b1b', c1: '#f5d300', c2: '#29b6f6' }[d.key];
  return (
    <div className="probe-layer" aria-hidden>
      {r && <div className="snap" style={{ left: r.left + r.width / 2, top: r.top + r.height / 2 }} />}
      <svg className="ghost" style={{ left: d.x, top: d.y }} width={46} height={70} viewBox="-12 -62 46 70">
        <path d="M0 0L-5 -16h10Z" fill="#d8d8d8" stroke="#555" />
        <rect x={-7} y={-52} width={14} height={38} rx={5} fill={col} stroke="#fff" strokeWidth={1.5} />
        <circle cx={0} cy={-2} r={r ? 4 : 2.5} fill={r ? '#4caf50' : '#fff'} />
      </svg>
    </div>
  );
}

export const beginProbeDrag = (key: ProbeKey, e: React.PointerEvent) => {
  e.preventDefault(); e.stopPropagation();
  useStore.getState().setProbeDrag({ key, x: e.clientX, y: e.clientY });
};
