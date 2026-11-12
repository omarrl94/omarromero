import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { computePanel, defaultPanel } from '../model/panel';
import { multifilarDiagram, panelEnclosure, panelUnifilar, paperVars, unifilarDiagram, type Diagram } from './diagrams';
import { fmt, fmtSI } from '../model/library';
import type { SimResult } from '../model/netlist';
import type { CableInfo } from '../model/cables';

type Content = 'cuadro' | 'cuadroReal' | 'multifilar' | 'unifilar';
type Format = 'A3' | 'A4';
const DIM: Record<Format, [number, number]> = { A3: [420, 297], A4: [297, 210] };

/** Plano imprimible con marco, cajetín normalizado y el diagrama elegido. Imprime, exporta a PDF (diálogo), SVG y PNG. */
export function Plano({ sim, cables }: { sim: SimResult; cables: Record<string, CableInfo> }) {
  const st = useStore();
  const { project } = st;
  const sheet = project.sheet ?? { alumno: '', curso: '', titulo: '', escala: 'S/E' };
  const [content, setContent] = useState<Content>('cuadro');
  const [format, setFormat] = useState<Format>('A3');
  const [W, H] = DIM[format];
  const svgRef = useRef<SVGSVGElement>(null);
  const cfg = project.panel ?? defaultPanel();
  const res = useMemo(() => computePanel(cfg), [cfg]);
  const date = new Date().toLocaleDateString('es-ES');

  const diagram: Diagram = useMemo(() => {
    if (content === 'cuadro') return panelUnifilar(cfg, res);
    if (content === 'cuadroReal') return panelEnclosure(cfg, res);
    if (content === 'multifilar') return multifilarDiagram(project, sim, cables, true);
    return unifilarDiagram(project, sim, cables);
  }, [content, cfg, res, project, sim, cables]);

  useEffect(() => {
    let el = document.getElementById('page-style') as HTMLStyleElement | null;
    if (!el) { el = document.createElement('style'); el.id = 'page-style'; document.head.appendChild(el); }
    el.textContent = `@page { size: ${format} landscape; margin: 0 }`;
  }, [format]);

  const setSheet = (p: Partial<typeof sheet>) => st.setSheetData({ ...sheet, ...p });
  const title = sheet.titulo || (content.startsWith('cuadro') ? cfg.nombre : project.name);
  const kind = { cuadro: 'Esquema unifilar del cuadro', cuadroReal: 'Disposición del cuadro (carril DIN)', multifilar: 'Esquema multifilar', unifilar: 'Esquema unifilar' }[content];

  // Áreas (mm)
  const m = 10, bind = 20, cH = 52, cW = 190;
  const cx = W - m - cW, cy = H - m - cH;
  const areaW = W - bind - m - 6, areaH = cy - m - 6;

  const serialize = () => {
    const node = svgRef.current!.cloneNode(true) as SVGSVGElement;
    node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    node.setAttribute('width', `${W}mm`); node.setAttribute('height', `${H}mm`);
    return new XMLSerializer().serializeToString(node);
  };
  const download = (blob: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const exportSvg = () => download(new Blob([serialize()], { type: 'image/svg+xml' }), `plano_${content}.svg`);
  const exportPng = () => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([serialize()], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas'); const px = 6;
      c.width = W * px; c.height = H * px;
      const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => b && download(b, `plano_${content}.png`));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Escala del diagrama dentro del área
  const k = Math.min(areaW / diagram.w, (content === 'cuadro' ? areaH - 62 : areaH) / diagram.h);
  const dx = bind + 3 + (areaW - diagram.w * k) / 2, dy = m + 3;

  return (
    <div className="plano">
      <div className="plano-bar no-print">
        <label>Contenido
          <select value={content} onChange={(e) => setContent(e.target.value as Content)}>
            <option value="cuadro">Unifilar del cuadro + cuadro de cargas</option>
            <option value="cuadroReal">Cuadro (aspecto real)</option>
            <option value="unifilar">Unifilar del circuito</option>
            <option value="multifilar">Multifilar del circuito</option>
          </select></label>
        <label>Formato<select value={format} onChange={(e) => setFormat(e.target.value as Format)}><option>A3</option><option>A4</option></select></label>
        <label>Título<input value={sheet.titulo} placeholder={title} onChange={(e) => setSheet({ titulo: e.target.value })} /></label>
        <label>Alumno/a<input value={sheet.alumno} onChange={(e) => setSheet({ alumno: e.target.value })} /></label>
        <label>Curso<input value={sheet.curso} onChange={(e) => setSheet({ curso: e.target.value })} placeholder="1º CFGS SEA" /></label>
        <label>Escala<input value={sheet.escala} onChange={(e) => setSheet({ escala: e.target.value })} style={{ width: 70 }} /></label>
        <span className="grow" />
        <button className="primary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
        <button onClick={exportSvg}>SVG</button>
        <button onClick={exportPng}>PNG</button>
      </div>
      <div className="sheet-wrap">
        <svg ref={svgRef} className="sheet" viewBox={`0 0 ${W} ${H}`} style={{ ...(paperVars() as React.CSSProperties), aspectRatio: `${W} / ${H}` }} fontFamily="'Helvetica Neue', Arial, sans-serif" data-testid="sheet">
          <rect width={W} height={H} fill="#fff" />
          <rect x={bind} y={m} width={W - bind - m} height={H - 2 * m} fill="none" stroke="#14181d" strokeWidth={0.7} />
          <rect x={5} y={5} width={W - 10} height={H - 10} fill="none" stroke="#999" strokeWidth={0.2} />
          {/* marcas de centrado y cuadrícula de referencia */}
          {Array.from({ length: 8 }, (_, i) => { const x = bind + ((W - bind - m) / 8) * (i + 0.5); return <g key={i}><text x={x} y={m - 2} fontSize={2.8} textAnchor="middle" fill="#555">{i + 1}</text><text x={x} y={H - m + 4.5} fontSize={2.8} textAnchor="middle" fill="#555">{i + 1}</text></g>; })}
          {Array.from({ length: 5 }, (_, i) => { const y = m + ((H - 2 * m) / 5) * (i + 0.5); return <g key={i}><text x={bind - 3} y={y + 1} fontSize={2.8} textAnchor="middle" fill="#555">{'ABCDE'[i]}</text><text x={W - m + 3} y={y + 1} fontSize={2.8} textAnchor="middle" fill="#555">{'ABCDE'[i]}</text></g>; })}
          {/* diagrama */}
          <g transform={`translate(${dx} ${dy}) scale(${k})`}>{diagram.node}</g>
          {/* tabla de cargas (solo en el plano del cuadro) */}
          {content === 'cuadro' && (
            <g transform={`translate(${bind + 4} ${cy - 62})`} fontSize={3}>
              <rect width={W - bind - m - 8 - 0} height={58} fill="#fff" stroke="#14181d" strokeWidth={0.4} />
              {['Ref.', 'Circuito', 'P inst.', 'P simult.', 'Ib', 'PIA', 'Sección', 'L', 'Caída'].map((h, i) => (
                <text key={h} x={3 + [0, 14, 78, 102, 124, 140, 156, 180, 196][i]} y={5} fontWeight={700}>{h}</text>
              ))}
              <path d={`M0 7H${W - bind - m - 8}`} stroke="#14181d" strokeWidth={0.3} />
              {res.circuits.filter((c) => c.enabled).map((r, i) => (
                <g key={r.id} transform={`translate(3 ${12 + i * 7})`}>
                  {[r.id, r.name.slice(0, 34), fmtSI(r.p, 'W'), fmtSI(r.psim, 'W'), `${fmt(r.ib)} A`, `${r.inA} A`, `${fmt(r.section)} mm²`, `${fmt(r.length)} m`, `${fmt(r.dropPct)} %`].map((t, j) => (
                    <text key={j} x={[0, 14, 78, 102, 124, 140, 156, 180, 196][j]} y={0}>{t}</text>
                  ))}
                </g>
              ))}
              <text x={3} y={53} fontWeight={700}>TOTAL  {fmtSI(res.totalConnected, 'W')} instalada · {fmtSI(res.totalSim, 'W')} simultánea · IGA {res.iga} A</text>
            </g>
          )}
          {/* cajetín */}
          <g transform={`translate(${cx} ${cy})`}>
            <rect width={cW} height={cH} fill="#fff" stroke="#14181d" strokeWidth={0.7} />
            <path d={`M0 16H${cW}M0 30H${cW}M0 41H${cW}M120 16V${cH}M60 41V${cH}`} stroke="#14181d" strokeWidth={0.35} />
            <text x={3} y={5} fontSize={2.6} fill="#555">PROYECTO / TÍTULO</text>
            <text x={3} y={12} fontSize={5.2} fontWeight={800}>{title.slice(0, 44)}</text>
            <text x={3} y={20} fontSize={2.6} fill="#555">PLANO</text>
            <text x={3} y={27} fontSize={4.2} fontWeight={700}>{kind}</text>
            <text x={123} y={20} fontSize={2.6} fill="#555">NORMATIVA</text>
            <text x={123} y={27} fontSize={3.4} fontWeight={700}>REBT · RD 842/2002</text>
            <text x={3} y={34} fontSize={2.6} fill="#555">ALUMNO/A</text>
            <text x={3} y={39} fontSize={4} fontWeight={700}>{sheet.alumno || '—'}</text>
            <text x={123} y={34} fontSize={2.6} fill="#555">CURSO</text>
            <text x={123} y={39} fontSize={4} fontWeight={700}>{sheet.curso || '—'}</text>
            <text x={3} y={45} fontSize={2.6} fill="#555">FECHA</text><text x={3} y={50} fontSize={3.8} fontWeight={700}>{date}</text>
            <text x={63} y={45} fontSize={2.6} fill="#555">ESCALA</text><text x={63} y={50} fontSize={3.8} fontWeight={700}>{sheet.escala || 'S/E'}</text>
            <text x={123} y={45} fontSize={2.6} fill="#555">HOJA</text><text x={123} y={50} fontSize={3.8} fontWeight={700}>1 / 1 · {format}</text>
            <text x={cW - 4} y={50} fontSize={3} fontWeight={800} textAnchor="end" fill="#b3541e" letterSpacing={0.4}>CIRCUITOSSEA</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
