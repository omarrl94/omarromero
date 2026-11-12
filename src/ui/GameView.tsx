import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame, type Stage, type Tool } from '../game/store';
import { useStore } from '../store';
import { analyze, evaluate, roomNeeds, makeCtx, buildBom, type Check, type Evaluation } from '../game/logic';
import { CIRCUITS, DEVICES, PIA_RATINGS, SECTIONS_GAME, circuitDef, dev, type DevKind } from '../game/data';
import { HOUSES, customHouses, houseOf } from '../game/houses';
import { CONSULTA } from '../data/materiales';
import { PlanEditor } from './PlanEditor';
import { Glyph, PlanSvg, type Status } from './PlanSvg';
import type { PanelConfig } from '../model/panel';
import { computePanel } from '../model/panel';
import { panelEnclosure } from './diagrams';
import { boomSound } from './sound';
import { Avatar } from './icons';
import './game.css';

const eur = (v: number) => `${Math.round(v).toLocaleString('es-ES')} €`;
const num = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const STEPS: { id: Stage; label: string }[] = [{ id: 'obra', label: 'Replanteo' }, { id: 'cuadro', label: 'Cuadro' }, { id: 'inspeccion', label: 'Inspección' }];

export function GameView({ onExit }: { onExit: () => void }) {
  const g = useGame();
  const ev = useMemo(() => evaluate(g.state, g.client.houseId, g.client), [g.state, g.client]);
  return (
    <div className="game" data-stage={g.stage}>
      <header className="g-head">
        <div className="who"><Avatar name={g.client.name} /><div><b>{g.client.name}</b><small>{houseOf(g.client.houseId).name}</small></div></div>
        {g.stage !== 'briefing' && (
          <nav className="steps" aria-label="Fases de la obra">
            {STEPS.map((s) => <button key={s.id} className={g.stage === s.id || (g.stage === 'resultado' && s.id === 'inspeccion') ? 'on' : ''} onClick={() => g.setStage(s.id)}>{s.label}</button>)}
          </nav>
        )}
        <div className="grow" />
        {g.stage !== 'briefing' && <Budget ev={ev} budget={g.client.budget} />}
        <button className="ghost" onClick={onExit}>Salir al simulador</button>
      </header>
      {g.stage === 'briefing' && <Briefing />}
      {g.stage === 'obra' && <Obra ev={ev} />}
      {g.stage === 'cuadro' && <CuadroStage ev={ev} />}
      {g.stage === 'inspeccion' && <Inspeccion ev={ev} />}
      {g.stage === 'resultado' && <Resultado ev={ev} />}
    </div>
  );
}

function Budget({ ev, budget }: { ev: Evaluation; budget: number }) {
  const pct = Math.min(130, (ev.cost / budget) * 100);
  return (
    <div className={`budget ${ev.cost > budget ? 'over' : pct > 88 ? 'tight' : ''}`} title="Materiales: mecanismos, cable, tubo y protecciones (precios orientativos)">
      <div className="bar"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
      <span><b>{eur(ev.cost)}</b> de {eur(budget)}</span>
    </div>
  );
}

/* ───────────────────────── Orden de trabajo ───────────────────────── */
function PlanPicker() {
  const g = useGame();
  const [edit, setEdit] = useState(false);
  const mine = customHouses();
  return (
    <div className="planpick">
      <label>Plano de la vivienda
        <select value={g.plan} onChange={(e) => g.setPlan(e.target.value)} aria-label="Plano de la vivienda">
          <option value="random">Al azar (planos de serie)</option>
          {mine.length > 0 && <option value="all">Al azar, incluidos mis planos</option>}
          <optgroup label="Planos de serie">{HOUSES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</optgroup>
          {mine.length > 0 && <optgroup label="Mis planos">{mine.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</optgroup>}
        </select>
      </label>
      <button onClick={() => setEdit(true)}>Subir mi plano</button>
      {edit && <PlanEditor onClose={() => setEdit(false)} onSaved={(id) => { setEdit(false); g.setPlan(id); }} />}
    </div>
  );
}

function Briefing() {
  const g = useGame();
  const house = houseOf(g.client.houseId);
  return (
    <div className="brief">
      <section className="order" aria-label="Orden de trabajo">
        <div className="order-top"><span className="num">Encargo {g.seed}</span><span className="lvl">Nivel {g.level}</span></div>
        <h1>{g.client.name}</h1>
        <p className="quote">«{g.client.intro}»</p>
        <p className="lead">Esto es lo que me gustaría:</p>
        <ul className="reqs">{g.client.reqs.map((r) => <li key={r.id}><i aria-hidden />{r.text}</li>)}</ul>
        <p className="foot">Presupuesto de materiales: <b>{eur(g.client.budget)}</b>. Y por favor, que cumpla el reglamento.</p>
        <PlanPicker />
        <div className="actions">
          <button className="primary" onClick={() => g.setStage('obra')}>Aceptar el encargo</button>
          <button onClick={() => g.newClient()}>Otro cliente</button>
          <span className="seg" role="group" aria-label="Nivel">{[1, 2, 3].map((l) => <button key={l} className={g.level === l ? 'on' : ''} onClick={() => g.newClient(undefined, l)}>Nivel {l}</button>)}</span>
        </div>
      </section>
      <aside className="blueprint-peek">
        <div className="peek"><PlanSvg mode="test" /></div>
        <p className="muted">{house.name}{house.custom ? ' (plano propio)' : ''}. Pulsa «Aceptar» para empezar a replantear.</p>
        <dl className="career">
          <div><dt>Obras</dt><dd>{g.career.jobs}</dd></div>
          <div><dt>Cobrado</dt><dd>{eur(g.career.money)}</dd></div>
          <div><dt>Mejor nota</dt><dd>{g.career.best}</dd></div>
          <div><dt>Estrellas</dt><dd>{g.career.stars}</dd></div>
        </dl>
      </aside>
    </div>
  );
}

/* ───────────────────────── Replanteo ───────────────────────── */
const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: 'move', label: 'Mover', hint: 'Arrastra mecanismos y cuadro' }, { id: 'delete', label: 'Borrar', hint: 'Clic en un mecanismo' }, { id: 'link', label: 'Vincular', hint: 'Clic en un mando y luego en sus luces' },
];

function Obra({ ev }: { ev: Evaluation }) {
  const g = useGame();
  const house = houseOf(g.client.houseId);
  const sel = g.state.devices.find((d) => d.id === g.selected);
  const an = useMemo(() => analyze(g.state, house), [g.state, house]);
  const groups = ['Iluminación', 'Mando', 'Tomas', 'Equipos'] as const;
  const tip = g.tool === 'link' ? (g.linkFrom ? 'Pulsa las luces que gobierna este mando (otra vez para quitarlas).' : 'Pulsa un interruptor, conmutador o detector.')
    : g.tool === 'panel' ? 'Pulsa en el plano donde irá el cuadro (cerca de la entrada).' : g.tool && !['move', 'delete'].includes(g.tool) ? `Pulsa en el plano para colocar: ${dev(g.tool as DevKind).name}.` : null;
  return (
    <div className="obra">
      <aside className="toolbox">
        <div className="modes">{TOOLS.map((t) => <button key={t.id} className={g.tool === t.id ? 'on' : ''} title={t.hint} onClick={() => g.setTool(g.tool === t.id ? null : t.id)}>{t.label}</button>)}</div>
        <button className={`panelbtn ${g.tool === 'panel' ? 'on' : ''}`} onClick={() => g.setTool(g.tool === 'panel' ? null : 'panel')}>▮ Colocar el cuadro</button>
        {groups.map((gr) => (
          <section key={gr}>
            <h3>{gr}</h3>
            {DEVICES.filter((d) => d.group === gr).map((d) => (
              <button key={d.kind} className={`dev ${g.tool === d.kind ? 'on' : ''}`} onClick={() => g.setTool(g.tool === d.kind ? null : d.kind)} title={d.help} data-kind={d.kind}>
                <svg width={36} height={30} viewBox="-18 -15 36 30"><Glyph kind={d.kind} color="#ffd23f" /></svg>
                <span>{d.name}</span><em>{eur(d.price)}</em>
              </button>
            ))}
          </section>
        ))}
        <div className="toggles">
          <label><input type="checkbox" checked={g.showRoutes} onChange={() => g.toggle('showRoutes')} /> Canalizaciones</label>
          <label><input type="checkbox" checked={g.showLinks} onChange={() => g.toggle('showLinks')} /> Vínculos de mando</label>
        </div>
      </aside>

      <main className="planwrap">
        {tip && <div className="tip">{tip}</div>}
        <PlanSvg mode="obra" />
        {sel && (
          <div className="selcard">
            <b>{dev(sel.kind).name}</b>
            <label>Circuito
              <select value={sel.circuit ?? ''} onChange={(e) => g.setCircuit(sel.id, e.target.value || null)}>
                <option value="">— ninguno (baja tensión) —</option>
                {CIRCUITS.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}
              </select></label>
            {['int', 'conm', 'detector'].includes(sel.kind) && <button onClick={() => g.setTool('link')}>Vincular luces…</button>}
            <button className="danger" onClick={() => g.removeDev(sel.id)}>Quitar</button>
          </div>
        )}
        <div className="legend">{Object.values(an.circuits).map((c) => <span key={c.id} style={{ ['--c' as string]: circuitDef(c.id).color }}><i />{c.id} · {num(c.ltotal, 0)} m</span>)}</div>
      </main>

      <aside className="checklist">
        <Checklist ev={ev} />
        <div className="nextrow">
          <button onClick={() => { if (confirm('¿Ver cómo lo montaría un instalador profesional? Se sustituirá tu plano actual.')) g.solve(); }}>Ver solución profesional</button>
          <button className="primary" onClick={() => g.setStage('cuadro')}>Continuar al cuadro</button>
        </div>
      </aside>
    </div>
  );
}

function Checklist({ ev }: { ev: Evaluation }) {
  const g = useGame();
  const house = houseOf(g.client.houseId);
  const c = useMemo(() => makeCtx(house, g.state), [house, g.state]);
  const cli = ev.checks.filter((k) => k.group === 'cliente');
  return (
    <div className="paper">
      <h2>Pedido del cliente</h2>
      <ul className="ticks">{cli.map((k) => <Tick key={k.id} k={k} />)}</ul>
      <h2>Mínimos por estancia</h2>
      <div className="rooms">
        {house.rooms.filter((r) => !r.outdoor).map((r) => {
          const needs = roomNeeds(c, r);
          const done = needs.filter((n) => n.have >= n.need).length;
          return (
            <details key={r.id} open={done < needs.length}>
              <summary><span className={done === needs.length ? 'chip ok' : 'chip'}>{done}/{needs.length}</span>{r.name}</summary>
              <ul className="mini">{needs.map((n) => <li key={n.key} className={n.have >= n.need ? 'ok' : ''}>{n.label} <b>{n.have}/{n.need}</b></li>)}</ul>
            </details>
          );
        })}
      </div>
      <p className="note">Mínimos orientativos tipo ITC-BT-25: verifica con el reglamento.</p>
    </div>
  );
}
const Tick = ({ k }: { k: Check }) => <li className={k.ok ? 'ok' : ''}><i aria-hidden>{k.ok ? '✓' : ''}</i><span>{k.label}{!k.ok && k.detail && <small>{k.detail}</small>}</span></li>;

/* ───────────────────────── Cuadro ───────────────────────── */
export function gameToPanel(state: ReturnType<typeof useGame.getState>['state'], name: string, house: ReturnType<typeof houseOf>): PanelConfig {
  const an = analyze(state, house);
  return {
    nombre: `Cuadro de ${name}`, voltage: 230, cosphi: 1, difA: state.board.idA, difMa: state.board.idMa, difType: state.board.idType, spd: state.board.spd,
    circuits: Object.values(an.circuits).map((c) => ({ id: c.id, name: circuitDef(c.id).name, p: Math.max(100, Math.round(c.pTotal * circuitDef(c.id).use)), length: Math.round(c.lmax), lighting: circuitDef(c.id).lighting, enabled: true, cs: 1, cu: 1, forceIn: c.choice.inA, forceSection: c.choice.section })),
  };
}

function CuadroStage({ ev }: { ev: Evaluation }) {
  const g = useGame();
  const house = houseOf(g.client.houseId);
  const an = ev.an;
  const b = g.state.board;
  const cfg = useMemo(() => gameToPanel(g.state, g.client.name, house), [g.state, g.client.name, house]);
  const diagram = useMemo(() => panelEnclosure(cfg, computePanel(cfg)), [cfg]);
  const ids = Object.keys(an.circuits);
  const bad = (k: string) => ev.checks.find((c) => c.id === k && !c.ok);
  return (
    <div className="cuadro-stage">
      <section className="table-card">
        <h2>Circuitos de la vivienda</h2>
        <p className="muted">Elige calibre, curva y sección de cada circuito. Los números salen del plano: longitud real del recorrido y corriente de uso.</p>
        <div className="tw"><table className="ct">
          <thead><tr><th>Circuito</th><th>Longitud</th><th>Uso</th><th>PIA</th><th>Curva</th><th>Sección</th><th>Iz</th><th>Caída</th><th>Icc</th><th></th></tr></thead>
          <tbody>
            {ids.length === 0 && <tr><td colSpan={10} className="muted">Aún no hay mecanismos con circuito. Vuelve al replanteo.</td></tr>}
            {ids.map((id) => {
              const c = an.circuits[id];
              const issues = [bad(`pia-${id}`), bad(`sec-${id}`), bad(`iz-${id}`), bad(`drop-${id}`), bad(`icc-${id}`)].filter(Boolean) as Check[];
              return (
                <tr key={id} className={issues.length ? 'warn' : ''}>
                  <td><span className="cdot" style={{ background: circuitDef(id).color }} /><b>{id}</b> <small>{circuitDef(id).name}</small></td>
                  <td>{num(c.ltotal, 0)} m <small>(máx. {num(c.lmax, 0)})</small></td>
                  <td>{num(c.ibUse)} A</td>
                  <td><select value={c.choice.inA} onChange={(e) => g.setChoice(id, { inA: +e.target.value })}>{PIA_RATINGS.map((p) => <option key={p} value={p}>{p} A</option>)}</select></td>
                  <td><select value={c.choice.curve} onChange={(e) => g.setChoice(id, { curve: +e.target.value as 5 | 10 | 20 })}><option value={5}>B</option><option value={10}>C</option><option value={20}>D</option></select></td>
                  <td><select value={c.choice.section} onChange={(e) => g.setChoice(id, { section: +e.target.value })}>{SECTIONS_GAME.map((s) => <option key={s} value={s}>{String(s).replace('.', ',')} mm²</option>)}</select></td>
                  <td className={c.iz < c.choice.inA ? 'bad' : ''}>{c.iz} A</td>
                  <td className={c.dropPct > c.dropLimit ? 'bad' : ''}>{num(c.dropPct, 2)} % <small>/ {c.dropLimit}</small></td>
                  <td className={c.icc < c.needIcc ? 'bad' : ''}>{Math.round(c.icc)} A</td>
                  <td>{issues.length ? <span className="chip bad" title={issues.map((i) => i.label).join('\n')}>revisar</span> : <span className="chip ok">ok</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <p className="formula">Caída = 2·L·In/(γ·S) con γ = 48 · Icc = 230/(2·L/(γ·S) + 0,25 Ω) · el magnético debe disparar con Icc ≥ (5, 10 o 20)·In según curva B, C o D · Iz orientativa (método B1, Cu/PVC).</p>
        {ev.checks.filter((c) => !c.ok && ['pia', 'sec', 'iz', 'drop', 'icc'].some((p) => c.id.startsWith(p + '-'))).slice(0, 4).map((c) => <p key={c.id} className="alert">{c.label}</p>)}

        <h2>Cuadro general</h2>
        <div className="board">
          <label>IGA<select value={b.iga} onChange={(e) => g.setBoard({ iga: +e.target.value })}>{[25, 32, 40, 50, 63].map((v) => <option key={v} value={v}>{v} A</option>)}</select></label>
          <label>Diferenciales<select value={b.idCount} onChange={(e) => g.setBoard({ idCount: +e.target.value })}>{[1, 2, 3].map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          <label>Calibre ID<select value={b.idA} onChange={(e) => g.setBoard({ idA: +e.target.value })}>{[25, 40, 63].map((v) => <option key={v} value={v}>{v} A</option>)}</select></label>
          <label>Sensibilidad<select value={b.idMa} onChange={(e) => g.setBoard({ idMa: +e.target.value as 30 | 300 })}><option value={30}>30 mA</option><option value={300}>300 mA</option></select></label>
          <label>Tipo<select value={b.idType} onChange={(e) => g.setBoard({ idType: e.target.value as 'A' | 'AC' })}><option>AC</option><option>A</option></select></label>
          <label className="chk"><input type="checkbox" checked={b.spd} onChange={(e) => g.setBoard({ spd: e.target.checked })} /> Limitador de sobretensiones</label>
        </div>
        {['iga', 'id30', 'panel-pos'].map((k) => bad(k)).filter(Boolean).map((c) => <p key={c!.id} className="alert">{c!.label}{c!.detail ? ` — ${c!.detail}` : ''}</p>)}
        <div className="nextrow"><button onClick={() => g.setStage('obra')}>← Volver al plano</button><button className="primary" onClick={() => g.setStage('inspeccion')}>Pasar a inspección</button></div>
      </section>
      <section className="enclosure">
        <h2>Así queda el cuadro</h2>
        <svg viewBox={`0 0 ${diagram.w} ${diagram.h}`} className="encl">{diagram.node}</svg>
        <p className="muted">Calibre y sección de cada circuito en su rótulo. Precio de protecciones y caja incluido en el presupuesto.</p>
      </section>
    </div>
  );
}

/* ───────────────────────── Inspección ───────────────────────── */
function Inspeccion({ ev }: { ev: Evaluation }) {
  const g = useGame();
  const app = useStore();
  const [idx, setIdx] = useState(-1);
  const [fireKey, setFireKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const status: Record<string, Status> = {};
  ev.tests.slice(0, idx + 1).forEach((t) => { status[t.cid] = t.outcome === 'ok' ? 'on' : t.outcome === 'nuisance' ? 'tripped' : t.outcome === 'fire' ? 'fire' : 'slow'; if (t.outcome === 'slow') status[t.cid] = 'on'; });
  const slow = new Set(ev.tests.slice(0, idx + 1).filter((t) => t.outcome === 'slow').map((t) => t.cid));
  slow.forEach((c) => { status[c] = 'slow'; });
  const running = idx >= 0 && idx < ev.tests.length - 1;
  const done = idx >= ev.tests.length - 1 && idx >= 0;
  useEffect(() => () => clearTimeout(timer.current), []);
  const next = (i: number) => {
    setIdx(i);
    const t = ev.tests[i];
    if (t?.outcome === 'fire') { setFireKey((k) => k + 1); if (app.sound) boomSound(); }
    if (i < ev.tests.length - 1) timer.current = setTimeout(() => next(i + 1), 1500);
  };
  const start = () => { clearTimeout(timer.current); if (!ev.tests.length) return; next(0); };
  return (
    <div className="inspec">
      <main className="planwrap"><PlanSvg mode="test" status={status} fireKey={fireKey} /></main>
      <aside className="checklist">
        <div className="paper">
          <h2>Puesta en servicio</h2>
          <p className="muted">Se da tensión circuito a circuito con el uso habitual. Si un cable no soporta su protección, lo verás arder.</p>
          <button className="primary big" disabled={running || !ev.tests.length} onClick={start}>{idx < 0 ? '⚡ Dar tensión y probar' : running ? 'Probando…' : '↻ Repetir la prueba'}</button>
          {!ev.tests.length && <p className="alert">No hay circuitos con mecanismos: monta algo primero.</p>}
          <ol className="log">
            {ev.tests.slice(0, idx + 1).map((t) => <li key={t.cid} className={t.outcome}><b style={{ color: circuitDef(t.cid).color }}>{t.cid}</b> {t.text}</li>)}
          </ol>
          {ev.caps.map((c) => <p key={c} className="alert">{c}</p>)}
          <div className="nextrow">
            <button onClick={() => g.setStage('cuadro')}>← Ajustar el cuadro</button>
            <button className="primary" disabled={!done && ev.tests.length > 0} onClick={() => g.finish(ev.score, ev.stars)}>Entregar la obra</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ───────────────────────── Resultado ───────────────────────── */
const QUOTES: Record<number, string[]> = {
  3: ['Esto es justo lo que quería. Y encima dentro de presupuesto. Os recomiendo a todo el mundo.', 'Impecable. Mi hermano, que es ingeniero, no ha encontrado nada que objetar.'],
  2: ['Está bien, pero me han dicho que podíais haber afinado algo. Os pago, eso sí.', 'Funciona todo, aunque tengo un par de dudas sobre el cuadro.'],
  1: ['Hmm. Tengo luz, pero no estoy tranquilo con esto. Revisadlo.', 'No sé… hay cosas que no me encajan. Pagaré la mitad hasta que lo arregléis.'],
  0: ['Así no puedo vivir aquí. Llamo a otro instalador.', 'Esto es peligroso. No os pago hasta que lo rehagáis.'],
};
function Bom({ ev }: { ev: Evaluation }) {
  const g = useGame();
  const lines = useMemo(() => buildBom(g.state, ev.an), [g.state, ev.an]);
  const groups = [...new Set(lines.map((l) => l.group))];
  const est = lines.filter((l) => l.est).length;
  return (
    <div className="paper bom">
      <h2>Lista de materiales <span className="chip">{eur(lines.reduce((a, l) => a + l.total, 0))}</span></h2>
      <table>
        <thead><tr><th>Material</th><th>Marca</th><th>Cant.</th><th>P. unit.</th><th>Importe</th></tr></thead>
        {groups.map((gr) => (
          <tbody key={gr}>
            <tr className="grp"><td colSpan={5}>{gr}</td></tr>
            {lines.filter((l) => l.group === gr).map((l, i) => (
              <tr key={i}>
                <td>{l.url ? <a href={l.url} target="_blank" rel="noreferrer noopener">{l.name}</a> : l.name}{l.est && <sup title="Precio estimado a partir de modelos vecinos"> est.</sup>}</td>
                <td>{l.brand}</td><td>{num(l.qty, l.unit === 'm' ? 1 : 0)} {l.unit}</td><td>{num(l.unitPrice, 2)} €</td><td>{num(l.total, 2)} €</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <p className="note">Precios con IVA tomados de fichas de tiendas españolas (Leroy Merlin, Obramat, ManoMano) consultadas en {CONSULTA}; cambian a menudo, son orientativos.{est > 0 && ` Las líneas marcadas «est.» (${est}) no tenían ficha clara y se han estimado a partir de modelos similares.`} No incluye mano de obra.</p>
      <div className="nextrow"><button onClick={() => { document.body.classList.add('print-bom'); window.print(); setTimeout(() => document.body.classList.remove('print-bom'), 500); }}>Imprimir lista</button></div>
    </div>
  );
}

function Resultado({ ev }: { ev: Evaluation }) {
  const g = useGame();
  const app = useStore();
  const house = houseOf(g.client.houseId);
  const quote = QUOTES[ev.stars][g.seed % 2];
  const groups: { id: Check['group']; title: string }[] = [{ id: 'cliente', title: 'Lo que pidió el cliente' }, { id: 'estancias', title: 'Mínimos por estancia' }, { id: 'cuadro', title: 'Cuadro y circuitos' }, { id: 'seguridad', title: 'Seguridad' }, { id: 'presupuesto', title: 'Presupuesto' }];
  const printPlano = () => {
    const cfg = gameToPanel(g.state, g.client.name, house);
    app.setPanel(cfg);
    app.setSheetData({ titulo: `Cuadro de ${g.client.name}`, alumno: '', curso: '', escala: 'S/E' });
    app.setView('plano');
  };
  return (
    <div className="result">
      <section className="verdict">
        <div className={`score s${ev.stars}`}><b>{ev.score}</b><span>/ 100</span></div>
        <div className="stars" aria-label={`${ev.stars} estrellas`}>{[0, 1, 2].map((i) => <i key={i} className={i < ev.stars ? 'on' : ''}>★</i>)}</div>
        <p className="quote">«{quote}»<small>— {g.client.name}</small></p>
        {ev.caps.map((c) => <p key={c} className="alert">{c}</p>)}
        <dl className="career">
          <div><dt>Materiales</dt><dd>{eur(ev.cost)}</dd></div><div><dt>Presupuesto</dt><dd>{eur(g.client.budget)}</dd></div>
          <div><dt>Cobrado en total</dt><dd>{eur(g.career.money)}</dd></div><div><dt>Obras</dt><dd>{g.career.jobs}</dd></div>
        </dl>
        <div className="actions">
          <button className="primary" onClick={() => g.newClient()}>Siguiente cliente</button>
          <button onClick={() => g.reset()}>Rehacer esta obra</button>
          <button onClick={printPlano}>Plano imprimible del cuadro</button>
          <button onClick={() => { g.solve(); g.setStage('obra'); }}>Ver cómo lo haría un profesional</button>
        </div>
      </section>
      <section className="detail">
        <Bom ev={ev} />
        {groups.map((gr) => {
          const items = ev.checks.filter((c) => c.group === gr.id);
          if (!items.length) return null;
          const ok = items.filter((c) => c.ok).length;
          return (
            <div key={gr.id} className="paper">
              <h2>{gr.title} <span className={ok === items.length ? 'chip ok' : 'chip'}>{ok}/{items.length}</span></h2>
              <ul className="ticks">{items.filter((c) => !c.ok).concat(items.filter((c) => c.ok).slice(0, 3)).map((k) => <Tick key={k.id} k={k} />)}</ul>
              {items.filter((c) => c.ok).length > 3 && <p className="note">y {items.filter((c) => c.ok).length - 3} correctos más</p>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
