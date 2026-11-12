import { useMemo, useState } from 'react';
import { normaNum } from '../data/content';
import { circuitoSano, inyecta, mideAislamiento, mideContinuidad, mideFuga, mideTension, type Averia, type Lectura, type Punto } from '../engine/averias';

/** Banco de pruebas: esquema del circuito + multímetro con pantalla LCD y sondas. */
export function Instrumento({ averia, alimentadoInicial, bloqueado, onSeguridad }: { averia: string; alimentadoInicial: boolean; bloqueado: boolean; onSeguridad: () => void }) {
  const [alimentado, setAlimentado] = useState(alimentadoInicial);
  const [log, setLog] = useState<string[]>([]);
  const [lcd, setLcd] = useState<Lectura | null>(null);
  const circuito = useMemo(() => ({ ...inyecta(circuitoSano(), averia as Averia), alimentado }), [averia, alimentado]);
  const U = normaNum('tension.monofasica');
  const mide = (nombre: string, l: Lectura) => {
    setLog((x) => [...x.slice(-5), `${nombre}: ${l.texto}`]);
    setLcd(l);
    if (l.danio) onSeguridad();
  };
  const T: [Punto, Punto][] = [['F', 'N'], ['F', 'PE'], ['N', 'PE']];
  const dis = bloqueado;
  const linea = alimentado ? '#EFCD2F' : '#6b7679';
  return (
    <section className="grid gap-3 rounded-2xl border-[3px] border-tinta bg-[#2b3235] p-3 shadow-[0_6px_0_#000]" aria-label="Instrumentos">
      <h2 className="font-titulo text-lg font-black text-amarillo">🔧 Banco de pruebas</h2>
      <svg viewBox="0 0 300 110" className="w-full rounded-xl bg-[#1d2326]" role="img" aria-label={alimentado ? 'Esquema: circuito con tensión' : 'Esquema: circuito sin tensión'}>
        <text x="14" y="22" fill="#A9CABB" fontSize="12">230 V</text>
        <circle cx="30" cy="60" r="20" fill="#12171a" stroke="#A9CABB" strokeWidth="3" /><text x="30" y="65" textAnchor="middle" fontSize="16" fill="#EFCD2F">~</text>
        {[['F', 38, '#E39F7D'], ['N', 62, '#8FB4F5'], ['PE', 86, '#2FB872']].map(([t, y, c]) => (
          <g key={String(t)}>
            <line x1="50" y1={Number(y) - 6} x2="200" y2={Number(y) - 6} stroke={t === 'PE' ? String(c) : linea} strokeWidth="4" strokeDasharray={alimentado || t === 'PE' ? undefined : '6 6'} />
            <text x="262" y={Number(y) - 2} fill={String(c)} fontSize="12" fontWeight="bold">{String(t)}</text>
          </g>
        ))}
        <circle cx="228" cy="52" r="18" fill={alimentado ? '#EFCD2F' : '#3b4447'} stroke="#A9CABB" strokeWidth="3" /><text x="228" y="58" textAnchor="middle" fontSize="16">💡</text>
        <text x="120" y="104" textAnchor="middle" fill="#A9CABB" fontSize="11">{alimentado ? '⚡ con tensión' : '⛔ sin tensión'}</text>
      </svg>
      <button type="button" className="btn" disabled={dis} onClick={() => { setAlimentado((a) => !a); setLog((x) => [...x.slice(-5), alimentado ? '⏻ Alimentación cortada y comprobada' : '⏻ Alimentación conectada']); setLcd(null); }}>
        {alimentado ? '⏻ Cortar alimentación' : '⏻ Reconectar alimentación'}
      </button>
      <div className="rounded-2xl border-[3px] border-tinta bg-amarillo p-3">
        <output aria-live="polite" className="mb-3 block rounded-lg border-[3px] border-tinta bg-[#9fb89a] px-3 py-2 text-right font-mono text-2xl font-black text-[#1f2a1f] shadow-inner">{lcd ? lcd.texto : '---'}</output>
        <div className="flex flex-wrap gap-2">
          {T.map(([a, b]) => <button key={a + b} type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" disabled={dis} onClick={() => mide(`Tensión ${a}-${b}`, mideTension(circuito, a, b, U))}>V {a}-{b}</button>)}
          {(['F', 'N', 'PE'] as Punto[]).map((p) => <button key={p} type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" disabled={dis} onClick={() => mide(`Continuidad ${p}`, mideContinuidad(circuito, p))}>Ω {p}</button>)}
          <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" disabled={dis} onClick={() => mide('Aislamiento', mideAislamiento(circuito))}>MΩ aislamiento</button>
          <button type="button" className="btn btn-ghost !px-3 !py-1.5 text-sm" disabled={dis} onClick={() => mide('Corriente de fuga', mideFuga(circuito))}>mA fuga (pinza)</button>
        </div>
      </div>
      <ol className="min-h-[3rem] rounded-lg bg-black/60 p-2 font-mono text-xs text-menta">
        {log.length ? log.map((l, i) => <li key={i}>{l}</li>) : <li>Sin medidas todavía.</li>}
      </ol>
    </section>
  );
}
