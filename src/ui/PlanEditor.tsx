/**
 * Editor de planos propios: sube la imagen de un plano, fija la escala, dibuja las estancias y guarda.
 * El plano resultante es jugable (mismo juego «Instalador») y se puede exportar/importar como archivo .json
 * para compartirlo con la clase.
 */
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { finalizeHouse, customHouses, registerHouse, removeHouse, validateHouse, type House, type Room, type RoomKind } from '../game/houses';

type Step = 'imagen' | 'escala' | 'estancias' | 'entrada' | 'guardar';
const STEPS: [Step, string][] = [['imagen', '1 · Imagen'], ['escala', '2 · Escala'], ['estancias', '3 · Estancias'], ['entrada', '4 · Entrada'], ['guardar', '5 · Guardar']];
const KINDS: { kind: RoomKind; label: string; unique: boolean }[] = [
  { kind: 'salon', label: 'Salón', unique: true }, { kind: 'cocina', label: 'Cocina', unique: true }, { kind: 'pasillo', label: 'Pasillo / distribuidor', unique: true },
  { kind: 'bano', label: 'Baño', unique: false }, { kind: 'dormitorio', label: 'Dormitorio', unique: false }, { kind: 'terraza', label: 'Terraza', unique: false }, { kind: 'garaje', label: 'Garaje', unique: false },
];
const COLORS: Record<RoomKind, string> = { salon: '#ffd23f', cocina: '#ff9a59', pasillo: '#9be3ff', bano: '#6cc24a', dormitorio: '#b07cff', terraza: '#5aa0ff', garaje: '#ff5fa8' };
const fm = (v: number, d = 2) => v.toFixed(d).replace('.', ',');

/** Reduce la foto para que quepa en el almacenamiento del navegador. */
async function downscale(file: File, max = 1400): Promise<{ src: string; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('No se pudo leer la imagen')); i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return { src: c.toDataURL('image/jpeg', 0.78), w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}

const idFor = (kind: RoomKind, rooms: Room[]) => {
  const n = rooms.filter((r) => r.kind === kind).length;
  const base = { salon: 'salon', cocina: 'cocina', pasillo: 'pasillo', bano: 'bano', dormitorio: 'd', terraza: 'terraza', garaje: 'garaje' }[kind];
  if (kind === 'dormitorio') return `d${n + 1}`;
  return n === 0 ? base : `${base}${n + 1}`;
};
const nameFor = (kind: RoomKind, rooms: Room[]) => {
  const n = rooms.filter((r) => r.kind === kind).length + 1;
  const label = { salon: 'Salón', cocina: 'Cocina', pasillo: 'Pasillo', bano: 'Baño', dormitorio: 'Dormitorio', terraza: 'Terraza', garaje: 'Garaje' }[kind];
  return n === 1 || ['salon', 'cocina', 'pasillo'].includes(kind) ? label : `${label} ${n}`;
};

export function PlanEditor({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [step, setStep] = useState<Step>('imagen');
  const [img, setImg] = useState<{ src: string; w: number; h: number } | null>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [dist, setDist] = useState('');
  const [ppm, setPpm] = useState<number | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [entry, setEntry] = useState<{ x: number; y: number } | null>(null);
  const [name, setName] = useState('Mi plano');
  const [msg, setMsg] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const toPx = (e: { clientX: number; clientY: number }) => {
    const el = svg.current!; const p = el.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(el.getScreenCTM()!.inverse());
    return { x: Math.max(0, Math.min(img!.w, q.x)), y: Math.max(0, Math.min(img!.h, q.y)) };
  };
  const snapM = (v: number) => Math.round(v * 10) / 10;
  const m = (px: number) => px / (ppm ?? 1);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    try { setImg(await downscale(f)); setPts([]); setPpm(null); setRooms([]); setEntry(null); setStep('escala'); setMsg(''); } catch (e) { setMsg((e as Error).message); }
  };
  const applyScale = () => {
    const d = parseFloat(dist.replace(',', '.'));
    if (pts.length < 2 || !(d > 0)) { setMsg('Marca dos puntos en el plano e indica la distancia real entre ellos en metros.'); return; }
    const px = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    if (px < 8) { setMsg('Los dos puntos están demasiado cerca.'); return; }
    setPpm(px / d); setMsg(''); setStep('estancias');
  };

  const onDown = (e: React.PointerEvent) => {
    if (!img) return;
    const p = toPx(e);
    if (step === 'escala') { setPts((a) => (a.length >= 2 ? [p] : [...a, p])); return; }
    if (step === 'estancias' && ppm && !pending) { drag.current = true; setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); (e.target as Element).setPointerCapture?.(e.pointerId); return; }
    if (step === 'entrada' && ppm) {
      const hall = rooms.find((r) => r.kind === 'pasillo');
      if (!hall) { setMsg('Primero dibuja el pasillo.'); return; }
      const mx = m(p.x), my = m(p.y);
      const left = Math.abs(mx - hall.x), right = Math.abs(mx - (hall.x + hall.w));
      setEntry({ x: left <= right ? hall.x : hall.x + hall.w, y: Math.min(hall.y + hall.h - 0.45, Math.max(hall.y + 0.45, my)) }); setMsg('');
    }
  };
  const onMove = (e: React.PointerEvent) => { if (drag.current && draft) { const p = toPx(e); setDraft({ ...draft, x1: p.x, y1: p.y }); } };
  const onUp = () => {
    if (!drag.current || !draft) return;
    drag.current = false;
    const x = snapM(m(Math.min(draft.x0, draft.x1))), y = snapM(m(Math.min(draft.y0, draft.y1)));
    const w = snapM(m(Math.abs(draft.x1 - draft.x0))), h = snapM(m(Math.abs(draft.y1 - draft.y0)));
    setDraft(null);
    if (w >= 1 && h >= 1) setPending({ x, y, w, h }); else setMsg('Arrastra para dibujar una estancia (mínimo 1 × 1 m).');
  };
  const addRoom = (kind: RoomKind) => {
    if (!pending) return;
    const outdoor = kind === 'terraza' || kind === 'garaje';
    setRooms((rs) => [...rs, { id: idFor(kind, rs), name: nameFor(kind, rs), kind, ...pending, outdoor }]);
    setPending(null); setMsg('');
  };

  const problems = (() => {
    const p = validateHouse({ rooms });
    if (!entry) p.push('Falta marcar la puerta de entrada en el pasillo.');
    return p;
  })();
  const build = (): House => finalizeHouse('custom-' + Date.now().toString(36), name.trim() || 'Mi plano', rooms, entry!, img ? { src: img.src, w: img.w / ppm!, h: img.h / ppm! } : undefined);
  const save = () => {
    if (problems.length || !img || !ppm) return;
    const h = build();
    if (!registerHouse(h)) { setMsg('No cabe en el almacenamiento del navegador. Prueba con una imagen más pequeña o exporta el plano a un archivo.'); removeHouse(h.id); return; }
    onSaved(h.id);
  };

  const sw = Math.max(2, (img?.w ?? 800) / 400);
  const canGo = (s: Step) => (s === 'imagen' ? true : !!img && (s === 'escala' || !!ppm));
  return createPortal(
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="Subir mi plano">
      <div className="pe">
        <header className="pe-head">
          <h2>Subir mi plano</h2>
          <nav className="pe-steps">{STEPS.map(([id, l]) => <button key={id} className={step === id ? 'on' : ''} disabled={!canGo(id)} onClick={() => { setStep(id); setMsg(''); }}>{l}</button>)}</nav>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </header>
        <div className="pe-body">
          <div className="pe-canvas">
            {!img ? (
              <label className="pe-drop">
                <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} />
                <b>Elige la foto o captura de tu plano</b>
                <span>JPG, PNG o WebP. Se queda en tu navegador; no se sube a ningún servidor.</span>
              </label>
            ) : (
              <svg ref={svg} viewBox={`0 0 ${img.w} ${img.h}`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} style={{ cursor: step === 'imagen' ? 'default' : 'crosshair' }}>
                <image href={img.src} width={img.w} height={img.h} />
                {ppm && rooms.map((r) => <g key={r.id}><rect x={r.x * ppm} y={r.y * ppm} width={r.w * ppm} height={r.h * ppm} fill={COLORS[r.kind]} fillOpacity={0.28} stroke={COLORS[r.kind]} strokeWidth={sw} /><text x={(r.x + r.w / 2) * ppm} y={(r.y + r.h / 2) * ppm} textAnchor="middle" fontSize={sw * 6} fontWeight={800} fill="#10233f" stroke="#fff" strokeWidth={sw * 0.5} paintOrder="stroke">{r.name}</text></g>)}
                {draft && <rect x={Math.min(draft.x0, draft.x1)} y={Math.min(draft.y0, draft.y1)} width={Math.abs(draft.x1 - draft.x0)} height={Math.abs(draft.y1 - draft.y0)} fill="#ffd23f55" stroke="#ffd23f" strokeWidth={sw} strokeDasharray={`${sw * 3} ${sw * 2}`} />}
                {pending && ppm && <rect x={pending.x * ppm} y={pending.y * ppm} width={pending.w * ppm} height={pending.h * ppm} fill="#ffd23f55" stroke="#ffd23f" strokeWidth={sw * 1.5} />}
                {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={sw * 2.5} fill="#ff3d2e" stroke="#fff" strokeWidth={sw * 0.6} />)}
                {pts.length === 2 && <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="#ff3d2e" strokeWidth={sw} />}
                {entry && ppm && <g transform={`translate(${entry.x * ppm} ${entry.y * ppm})`}><circle r={sw * 4} fill="#ffd23f" stroke="#10233f" strokeWidth={sw * 0.7} /><text y={-sw * 6} textAnchor="middle" fontSize={sw * 6} fontWeight={800} fill="#10233f" stroke="#fff" strokeWidth={sw * 0.5} paintOrder="stroke">ENTRADA</text></g>}
              </svg>
            )}
          </div>
          <aside className="pe-side">
            {step === 'imagen' && <>
              <p>Sube la imagen de la vivienda (un plano a escala, un croquis o una captura de inmobiliaria).</p>
              <label className="pe-btn">Elegir imagen<input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} /></label>
              <hr />
              <h3>Mis planos guardados</h3>
              <Library onClose={onClose} onSaved={onSaved} />
            </>}
            {step === 'escala' && <>
              <p><b>Fija la escala.</b> Pulsa dos puntos del plano cuya distancia real conozcas (por ejemplo, el ancho de una puerta o de una pared) e indica los metros.</p>
              <label className="pe-field">Distancia real entre los dos puntos (m)<input value={dist} onChange={(e) => setDist(e.target.value)} inputMode="decimal" placeholder="p. ej. 4,5" /></label>
              <p className="pe-hint">{pts.length}/2 puntos marcados</p>
              <button className="pe-primary" onClick={applyScale}>Fijar escala</button>
            </>}
            {step === 'estancias' && <>
              <p><b>Dibuja las estancias.</b> Arrastra un rectángulo sobre cada una y elige qué es. Necesitas: salón, cocina, pasillo, baño y un dormitorio.</p>
              {pending ? (
                <div className="pe-kinds">
                  <b>{fm(pending.w, 1)} × {fm(pending.h, 1)} m · ¿qué es?</b>
                  {KINDS.map((k) => { const used = k.unique && rooms.some((r) => r.kind === k.kind); return <button key={k.kind} disabled={used} onClick={() => addRoom(k.kind)}><i style={{ background: COLORS[k.kind] }} />{k.label}{used ? ' (ya añadido)' : ''}</button>; })}
                  <button className="ghost" onClick={() => setPending(null)}>Cancelar</button>
                </div>
              ) : <p className="pe-hint">Arrastra sobre el plano para crear una estancia.</p>}
              <ul className="pe-rooms">{rooms.map((r) => <li key={r.id}><i style={{ background: COLORS[r.kind] }} />{r.name} <small>{fm(r.w, 1)}×{fm(r.h, 1)} m</small><button aria-label={`Quitar ${r.name}`} onClick={() => setRooms((rs) => rs.filter((x) => x !== r))}>×</button></li>)}</ul>
              <button className="pe-primary" disabled={!rooms.length} onClick={() => setStep('entrada')}>Siguiente</button>
            </>}
            {step === 'entrada' && <>
              <p><b>Marca la puerta de entrada.</b> Pulsa en el extremo del pasillo por donde se entra a la vivienda. Ahí irá el cuadro eléctrico.</p>
              <p className="pe-hint">{entry ? 'Entrada marcada. Puedes pulsar otra vez para moverla.' : 'Aún sin marcar.'}</p>
              <button className="pe-primary" disabled={!entry} onClick={() => setStep('guardar')}>Siguiente</button>
            </>}
            {step === 'guardar' && <>
              <label className="pe-field">Nombre del plano<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
              {problems.length ? <ul className="pe-problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul> : <p className="pe-ok">Plano listo: {rooms.length} estancias. Las puertas, ventanas y el mobiliario se colocan solos.</p>}
              <button className="pe-primary" disabled={problems.length > 0} onClick={save}>Guardar y jugar con él</button>
              <button className="pe-btn" disabled={problems.length > 0} onClick={() => download(build())}>Exportar archivo para compartir</button>
            </>}
            {msg && <p className="pe-msg" role="alert">{msg}</p>}
          </aside>
        </div>
      </div>
    </div>, document.body);
}

function download(h: House) {
  const blob = new Blob([JSON.stringify({ circuitossea: 'plano', v: 1, house: h })], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${h.name.replace(/[^\w-]+/g, '_')}.plano.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Lista de planos guardados con exportar, importar y borrar. */
function Library({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [, force] = useState(0);
  const [msg, setMsg] = useState('');
  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const h = j?.house as House | undefined;
      if (j?.circuitossea !== 'plano' || !h || !Array.isArray(h.rooms) || validateHouse(h).length) throw new Error('Ese archivo no es un plano válido de CircuitosSEA.');
      const ok = registerHouse({ ...h, id: 'custom-' + Date.now().toString(36), custom: true });
      if (!ok) throw new Error('No cabe en el almacenamiento del navegador.');
      force((n) => n + 1); setMsg('Plano importado.');
    } catch (e) { setMsg((e as Error).message); }
  };
  const list = customHouses();
  return (
    <div className="pe-lib">
      {!list.length && <p className="pe-hint">Todavía no has guardado ningún plano.</p>}
      <ul>{list.map((h) => (
        <li key={h.id}><b>{h.name}</b><span>{h.rooms.length} estancias</span>
          <button onClick={() => { onSaved(h.id); onClose(); }}>Jugar</button>
          <button onClick={() => download(h)}>Exportar</button>
          <button className="danger" onClick={() => { if (confirm(`¿Borrar «${h.name}»?`)) { removeHouse(h.id); force((n) => n + 1); } }}>Borrar</button></li>
      ))}</ul>
      <label className="pe-btn">Importar plano de un compañero<input type="file" accept="application/json,.json" hidden onChange={(e) => importFile(e.target.files?.[0])} /></label>
      {msg && <p className="pe-hint">{msg}</p>}
    </div>
  );
}
