import { useMemo } from 'react';
import { useStore } from '../store';
import { computePanel, defaultPanel, type PanelCircuit } from '../model/panel';
import { ELECTRIFICATION_BASIC, ITC25_SOURCE, IZ_SOURCE, GAMMA_SOURCE, DROP_SOURCE } from '../data/rebt';
import { BREAKER_RATINGS, SECTIONS } from '../data/rebt';
import { fmt, fmtSI } from '../model/library';
import { panelEnclosure, panelUnifilar } from './diagrams';
import { Viewport } from './Viewport';

const num = (s: string) => { const v = parseFloat(s.replace(',', '.')); return isFinite(v) ? v : NaN; };

/** Constructor de cuadro eléctrico de vivienda: dimensionado, unifilar, aspecto real y cuadro de cargas. */
export function CuadroView() {
  const st = useStore();
  const cfg = st.project.panel ?? defaultPanel();
  const res = useMemo(() => computePanel(cfg), [cfg]);
  const upd = (id: string, patch: Partial<PanelCircuit>) => st.setPanel({ circuits: cfg.circuits.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const addCircuit = () => {
    const n = cfg.circuits.length + 1;
    st.setPanel({ circuits: [...cfg.circuits, { id: `C${n}`, name: 'Circuito adicional', p: 2000, length: 10, lighting: false, enabled: true, cs: 1, cu: 1 }] });
  };
  const real = useMemo(() => panelEnclosure(cfg, res), [cfg, res]);
  const uni = useMemo(() => panelUnifilar(cfg, res), [cfg, res]);
  const ok = res.circuits.every((c) => !c.enabled || c.ok);

  return (
    <div className="cuadro">
      <header className="cuadro-head">
        <div>
          <h2>Cuadro eléctrico de vivienda</h2>
          <p>Elige los circuitos y la potencia: el simulador dimensiona protecciones y conductores <b>paso a paso</b> y dibuja el cuadro.</p>
        </div>
        <div className={`badge ${ok ? 'ok' : 'bad'}`}>{ok ? '✔ Instalación correcta' : '✖ Revisa los avisos'}</div>
        <div className="kpis">
          <div><span>IGA</span><b>{res.iga} A</b></div>
          <div><span>Instalada</span><b>{fmtSI(res.totalConnected, 'W')}</b></div>
          <div><span>Simultánea</span><b>{fmtSI(res.totalSim, 'W')}</b></div>
          <div><span>Circuitos</span><b>{res.circuits.filter((c) => c.enabled).length}</b></div>
        </div>
      </header>

      <section className="card">
        <h3>1 · Datos generales</h3>
        <div className="formgrid">
          <label>Nombre<input value={cfg.nombre} onChange={(e) => st.setPanel({ nombre: e.target.value })} /></label>
          <label>Tensión (V)<input defaultValue={cfg.voltage} key={cfg.voltage} onBlur={(e) => { const v = num(e.target.value); if (v > 0) st.setPanel({ voltage: v }); }} /></label>
          <label>cos φ<input defaultValue={cfg.cosphi} key={cfg.cosphi} onBlur={(e) => { const v = num(e.target.value); if (v > 0 && v <= 1) st.setPanel({ cosphi: v }); }} /></label>
          <label>Diferencial (A)<select value={cfg.difA} onChange={(e) => st.setPanel({ difA: +e.target.value })}>{[25, 40, 63].map((a) => <option key={a}>{a}</option>)}</select></label>
          <label>Sensibilidad (mA)<select value={cfg.difMa} onChange={(e) => st.setPanel({ difMa: +e.target.value })}>{[30, 300].map((a) => <option key={a}>{a}</option>)}</select></label>
          <label>Tipo<select value={cfg.difType} onChange={(e) => st.setPanel({ difType: e.target.value as 'A' | 'AC' })}><option>A</option><option>AC</option></select></label>
          <label className="chk"><input type="checkbox" checked={cfg.spd} onChange={(e) => st.setPanel({ spd: e.target.checked })} /> Limitador de sobretensiones</label>
          <button onClick={() => st.setPanel(defaultPanel())}>↺ Restaurar básica (ITC-BT-25)</button>
        </div>
      </section>

      <section className="card">
        <h3>2 · Circuitos</h3>
        <div className="tablewrap">
          <table className="ct">
            <thead><tr><th></th><th>Ref.</th><th>Circuito</th><th>P (W)</th><th>L (m)</th><th>Cs·Cu</th><th>Ib (A)</th><th>PIA</th><th>Sección</th><th>Iz (A)</th><th>Caída</th><th></th></tr></thead>
            <tbody>
              {res.circuits.map((r) => {
                const c = cfg.circuits.find((x) => x.id === r.id)!;
                return (
                  <tr key={r.id} className={!r.enabled ? 'off' : r.ok ? '' : 'warn'}>
                    <td><input type="checkbox" checked={c.enabled} onChange={(e) => upd(c.id, { enabled: e.target.checked })} aria-label={`Activar ${c.id}`} /></td>
                    <td><b>{c.id}</b></td>
                    <td><input value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} className="wide" /></td>
                    <td><input defaultValue={c.p} key={c.p} onBlur={(e) => { const v = num(e.target.value); if (v >= 0) upd(c.id, { p: v }); }} /></td>
                    <td><input defaultValue={c.length} key={c.length} onBlur={(e) => { const v = num(e.target.value); if (v > 0) upd(c.id, { length: v }); }} /></td>
                    <td>{fmt(c.cs * c.cu)}</td>
                    <td>{fmt(r.ib)}</td>
                    <td><select value={c.forceIn ?? ''} onChange={(e) => upd(c.id, { forceIn: e.target.value ? +e.target.value : null })}><option value="">auto ({r.inA})</option>{BREAKER_RATINGS.map((a) => <option key={a} value={a}>{a} A</option>)}</select></td>
                    <td><select value={c.forceSection ?? ''} onChange={(e) => upd(c.id, { forceSection: e.target.value ? +e.target.value : null })}><option value="">auto ({fmt(r.section)})</option>{SECTIONS.slice(0, 8).map((s) => <option key={s} value={s}>{fmt(s)} mm²</option>)}</select></td>
                    <td>{fmt(r.iz)}</td>
                    <td className={r.dropPct > r.dropLimit ? 'bad' : ''}>{fmt(r.dropPct)} % <small>/ {r.dropLimit}</small></td>
                    <td>{c.id.length && !ELECTRIFICATION_BASIC.find((t) => t.id === c.id) && <button onClick={() => st.setPanel({ circuits: cfg.circuits.filter((x) => x.id !== c.id) })} title="Quitar">✕</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addCircuit}>＋ Añadir circuito</button>
        {res.circuits.filter((c) => c.enabled && c.warnings.length).map((c) => (
          <p key={c.id} className="alert">⚠ <b>{c.id}</b>: {c.warnings.join(' ')}</p>
        ))}
      </section>

      <div className="two">
        <section className="card">
          <h3>3 · Aspecto real del cuadro</h3>
          <div className="vp"><Viewport d={real} paper={false} pad={10} /></div>
        </section>
        <section className="card">
          <h3>4 · Esquema unifilar</h3>
          <div className="vp"><Viewport d={uni} /></div>
        </section>
      </div>

      <section className="card">
        <h3>5 · Cuadro de cargas</h3>
        <div className="tablewrap">
          <table className="ct">
            <thead><tr><th>Ref.</th><th>Circuito</th><th>P instalada</th><th>Cs·Cu</th><th>P simultánea</th><th>Ib</th><th>Protección</th><th>Conductor</th><th>L</th><th>Caída</th></tr></thead>
            <tbody>
              {res.circuits.filter((c) => c.enabled).map((r) => (
                <tr key={r.id}><td><b>{r.id}</b></td><td>{r.name}</td><td>{fmtSI(r.p, 'W')}</td><td>{fmt(cfg.circuits.find((c) => c.id === r.id)!.cs * cfg.circuits.find((c) => c.id === r.id)!.cu)}</td><td>{fmtSI(r.psim, 'W')}</td><td>{fmt(r.ib)} A</td><td>PIA {r.inA} A</td><td>{fmt(r.section)} mm² Cu</td><td>{fmt(r.length)} m</td><td>{fmt(r.dropPct)} %</td></tr>
              ))}
              <tr className="total"><td colSpan={2}>TOTAL</td><td>{fmtSI(res.totalConnected, 'W')}</td><td></td><td>{fmtSI(res.totalSim, 'W')}</td><td colSpan={5}>IGA {res.iga} A · ID {cfg.difA} A / {cfg.difMa} mA tipo {cfg.difType}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>6 · Cálculo paso a paso</h3>
        <details open><summary><b>Previsión de potencia e IGA</b></summary><ol className="steps">{res.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></details>
        {res.circuits.filter((c) => c.enabled).map((r) => (
          <details key={r.id}><summary><b>{r.id}</b> · {r.name} → PIA {r.inA} A · {fmt(r.section)} mm²</summary><ol className="steps">{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></details>
        ))}
        <div className="sources">
          <b>Fuentes y fiabilidad de los datos</b>
          <ul>
            {[ITC25_SOURCE, IZ_SOURCE, GAMMA_SOURCE, DROP_SOURCE].map((s) => (
              <li key={s.ref}><span className={s.verified ? 'v' : 'nv'}>{s.verified ? 'revisado' : 'a verificar'}</span> {s.ref}. {s.note}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
