/**
 * Presupuesto de material: lista de material del circuito + precios de un proveedor (SIMULADOS, en red genérica).
 * Se puede cambiar la gama de cada línea, ajustar cantidades y exportar a CSV o PDF.
 */
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import type { SimResult } from '../model/netlist';
import { buildBom } from '../budget/bom';
import { GAMAS, PROVIDERS, fetchQuotes, itemsFor, type Gama, type Quote } from '../budget/catalog';
import { fmt } from '../model/library';

const eur = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
const download = (name: string, text: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

export function BudgetDialog({ sim, onClose }: { sim: SimResult; onClose: () => void }) {
  const project = useStore((s) => s.project);
  const [lamps, setLamps] = useState(true);
  const bom = useMemo(() => buildBom(project, sim, { lamps }), [project, sim, lamps]);
  const [pid, setPid] = useState(PROVIDERS[0].id);
  const provider = PROVIDERS.find((p) => p.id === pid)!;
  const [gama, setGama] = useState<Gama>(1);
  const [iva, setIva] = useState(21);
  const [ov, setOv] = useState<Record<string, { gama?: Gama; qty?: number }>>({});
  const [client, setClient] = useState(() => { try { return localStorage.getItem('circuitossea:cliente') ?? ''; } catch { return ''; } });
  const allItems = useMemo(() => bom.lines.flatMap((l) => itemsFor(l.key)), [bom]);
  const [quotes, setQuotes] = useState<Record<string, Quote> | null>(null);
  const [stamp, setStamp] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true; setQuotes(null);
    fetchQuotes(provider, allItems).then((q) => { if (live) { setQuotes(q); setStamp(new Date().toLocaleString('es-ES')); } });
    return () => { live = false; };
  }, [provider, allItems, tick]);

  const rows = bom.lines.map((l) => {
    const items = itemsFor(l.key); const g = ov[l.key]?.gama ?? gama; const it = items[g];
    const q = quotes?.[it?.ref]; const qty = ov[l.key]?.qty ?? l.qty;
    return { l, it, q, qty, g, amount: q ? q.price * qty : 0 };
  }).filter((r) => r.it);
  const subtotal = rows.reduce((a, r) => a + r.amount, 0);
  const shipping = quotes && subtotal > 0 && subtotal < 60 ? provider.shipping : 0;
  const base = subtotal + shipping, vat = base * (iva / 100);
  const date = new Date().toLocaleDateString('es-ES');

  useEffect(() => {
    const after = () => document.body.classList.remove('print-report');
    window.addEventListener('afterprint', after); return () => window.removeEventListener('afterprint', after);
  }, []);
  const print = () => { try { localStorage.setItem('circuitossea:cliente', client); } catch { /* ignorar */ } document.body.classList.add('print-report'); setTimeout(() => window.print(), 50); };
  const csv = () => download(`presupuesto-${project.name.replace(/[^\w]+/g, '-').slice(0, 40)}.csv`, ['Ref;Artículo;Marca;Ud;Cantidad;Precio ud (sin IVA);Importe (sin IVA)', ...rows.map((r) => [r.it.ref, r.it.name, r.it.brand, r.it.unit, r.qty, r.q ? r.q.price.toFixed(2).replace('.', ',') : '', r.q ? r.amount.toFixed(2).replace('.', ',') : ''].join(';')), `;;;;;Subtotal;${subtotal.toFixed(2).replace('.', ',')}`, `;;;;;IVA ${iva} %;${vat.toFixed(2).replace('.', ',')}`, `;;;;;Total;${(base + vat).toFixed(2).replace('.', ',')}`].join('\n'));
  const stockBadge = (q?: Quote) => (!q ? '…' : q.stock === 0 ? `Sin stock · ${q.leadDays} días` : q.stock < 5 ? `Pocas uds (${q.stock})` : q.leadDays ? `En stock · ${q.leadDays} día${q.leadDays > 1 ? 's' : ''}` : 'En stock');

  return (
    <div className="solve-overlay budget" role="dialog" aria-label="Presupuesto de material">
      <aside className="solve-side">
        <div className="side-head"><h2>Presupuesto</h2><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <p className="muted small">Lista de material del circuito con precios de un proveedor. <b>Los precios son simulados</b> (catálogo genérico): sirven para aprender a presupuestar.</p>
        <label className="field">Proveedor
          <select value={pid} onChange={(e) => setPid(e.target.value)}>{PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <p className="muted small">{provider.note}{provider.shipping ? ` · envío ${eur(provider.shipping)} por debajo de 60 €` : ''}</p>
        <label className="field">Gama del material
          <select value={gama} onChange={(e) => { setGama(+e.target.value as Gama); setOv((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...v, gama: undefined }]))); }}>{GAMAS.map((g, i) => <option key={g} value={i}>{g}</option>)}</select></label>
        <label className="field">IVA (%)<input type="number" min={0} max={30} value={iva} onChange={(e) => setIva(Math.max(0, Math.min(30, +e.target.value || 0)))} /></label>
        <label className="chk"><input type="checkbox" checked={lamps} onChange={(e) => setLamps(e.target.checked)} /> Incluir las lámparas LED</label>
        <label className="field">Cliente (para el PDF)<input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Opcional" /></label>
        <div className="solve-actions">
          <button onClick={() => setTick((t) => t + 1)} disabled={!quotes}>↻ Actualizar precios</button>
          <button className="primary" onClick={print} disabled={!quotes}>Guardar como PDF</button>
          <button onClick={csv} disabled={!quotes}>Descargar CSV</button>
        </div>
      </aside>
      <main className="solve-main">
        <article className="report">
          <header className="rhead"><div><h1>Presupuesto de material</h1><p>{project.name} · {date}{client ? ` · ${client}` : ''}</p></div><span className="rlogo">CircuitosSEA</span></header>
          <p className="rnote">Proveedor: {provider.name}. Precios simulados{stamp ? ` · consultados ${stamp}` : ''}. {quotes ? '' : 'Consultando precios…'}</p>
          {rows.length === 0 ? <p className="rwarn">El circuito no tiene material que presupuestar: añade protecciones, mecanismos o cables.</p> : (
            <table className="rtab btab">
              <thead><tr><th>Ref.</th><th>Artículo</th><th>Gama</th><th className="r">Cant.</th><th className="r">€/ud.</th><th className="r">Importe</th><th>Disponibilidad</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.l.key} className={r.q && r.q.stock === 0 ? 'out' : ''}>
                    <td>{r.it.ref}</td>
                    <td>{r.it.name}<small>{r.l.why}</small></td>
                    <td><select value={r.g} onChange={(e) => setOv((o) => ({ ...o, [r.l.key]: { ...o[r.l.key], gama: +e.target.value as Gama } }))}>{GAMAS.map((g, i) => <option key={g} value={i}>{g}</option>)}</select></td>
                    <td className="r"><input type="number" min={0} value={r.qty} onChange={(e) => setOv((o) => ({ ...o, [r.l.key]: { ...o[r.l.key], qty: Math.max(0, +e.target.value || 0) } }))} /> {r.it.unit}</td>
                    <td className="r">{r.q ? eur(r.q.price) : '…'}</td>
                    <td className="r">{r.q ? eur(r.amount) : '…'}</td>
                    <td className="stk">{stockBadge(r.q)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={5} className="r">Subtotal</td><td className="r">{eur(subtotal)}</td><td /></tr>
                {shipping > 0 && <tr><td colSpan={5} className="r">Gastos de envío</td><td className="r">{eur(shipping)}</td><td /></tr>}
                <tr><td colSpan={5} className="r">IVA {fmt(iva)} %</td><td className="r">{eur(vat)}</td><td /></tr>
                <tr className="tot"><td colSpan={5} className="r">TOTAL</td><td className="r">{eur(base + vat)}</td><td /></tr>
              </tfoot>
            </table>
          )}
          {bom.customer.length > 0 && <p className="rnote">Aparatos que aporta el cliente (no incluidos): {bom.customer.map((c) => `${c.qty}× ${c.name}`).join(' · ')}.</p>}
          {bom.notes.map((n, i) => <p key={i} className="rnote">{n}</p>)}
          {rows.some((r) => r.q && r.q.stock === 0) && <p className="rwarn">Hay artículos sin stock: cambia la gama o el proveedor para ver alternativas disponibles.</p>}
          <footer className="rfoot">Presupuesto orientativo con precios simulados. En un proveedor real, referencia, precio y disponibilidad vendrían de su catálogo. No sustituye al proyecto de un instalador autorizado.</footer>
        </article>
      </main>
    </div>
  );
}
