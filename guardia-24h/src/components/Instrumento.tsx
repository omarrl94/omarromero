import { useMemo, useState } from 'react';
import { normaNum } from '../data/content';
import { circuitoSano, inyecta, mideAislamiento, mideContinuidad, mideFuga, mideTension, type Averia, type Lectura, type Punto } from '../engine/averias';
import { Icon } from './Icon';

/** Banco de pruebas: esquema del circuito + multímetro con pantalla LCD. */
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
  const linea = alimentado ? '#EFCD2F' : '#4a5a62';
  const b = 'btn btn-ghost !px-3 !py-1.5 !text-xs font-mono';
  return (
    <section className="grid gap-3 rounded-lg border border-line bg-panel p-4" aria-label="Instrumentos">
      <div className="flex items-center justify-between"><h2 className="eyebrow">Banco de pruebas</h2><span className={`chip ${alimentado ? 'border-bad/50 text-bad' : 'border-ok/50 text-ok'}`}>{alimentado ? 'CON TENSIÓN' : 'SIN TENSIÓN'}</span></div>
      <svg viewBox="0 0 300 110" className="w-full rounded-md bg-ink" role="img" aria-label={alimentado ? 'Esquema: circuito con tensión' : 'Esquema: circuito sin tensión'}>
        <circle cx="30" cy="58" r="20" fill="none" stroke="#93a4ab" strokeWidth="1.5" /><text x="30" y="63" textAnchor="middle" fontSize="16" fill="#EFCD2F">~</text>
        <text x="30" y="92" textAnchor="middle" fill="#93a4ab" fontSize="10">230 V</text>
        {[['F', 36, '#E39F7D'], ['N', 60, '#8FB4F5'], ['PE', 84, '#3fb27f']].map(([t, y, c]) => (
          <g key={String(t)}>
            <line x1="50" y1={Number(y)} x2="200" y2={Number(y)} stroke={t === 'PE' ? String(c) : linea} strokeWidth="2.5" strokeDasharray={alimentado || t === 'PE' ? undefined : '5 5'} />
            <text x="262" y={Number(y) + 4} fill={String(c)} fontSize="11" fontFamily="monospace">{String(t)}</text>
          </g>
        ))}
        <circle cx="228" cy="48" r="16" fill={alimentado ? '#EFCD2F33' : 'none'} stroke="#93a4ab" strokeWidth="1.5" /><path d="M222 54l12-12M222 42l12 12" stroke="#93a4ab" strokeWidth="1.5" />
      </svg>
      <button type="button" className="btn btn-ghost" disabled={dis} onClick={() => { setAlimentado((a) => !a); setLog((x) => [...x.slice(-5), alimentado ? 'Alimentación cortada. Ausencia de tensión comprobada.' : 'Alimentación conectada.']); setLcd(null); }}>
        <Icon n="bolt" className="h-4 w-4" />{alimentado ? 'Cortar alimentación y comprobar ausencia de tensión' : 'Reconectar alimentación'}
      </button>
      <div className="rounded-md border border-line bg-panel2 p-3">
        <output aria-live="polite" className="mb-3 block rounded border border-[#2c3a2c] bg-[#0f1a12] px-3 py-2 text-right font-mono text-2xl text-[#6ee79a] shadow-inner">{lcd ? lcd.texto : '---'}</output>
        <div className="flex flex-wrap gap-2">
          {T.map(([a, c]) => <button key={a + c} type="button" className={b} disabled={dis} onClick={() => mide(`Tensión ${a}-${c}`, mideTension(circuito, a, c, U))}>V {a}-{c}</button>)}
          {(['F', 'N', 'PE'] as Punto[]).map((p) => <button key={p} type="button" className={b} disabled={dis} onClick={() => mide(`Continuidad ${p}`, mideContinuidad(circuito, p))}>Ω {p}</button>)}
          <button type="button" className={b} disabled={dis} onClick={() => mide('Aislamiento', mideAislamiento(circuito))}>MΩ aislamiento</button>
          <button type="button" className={b} disabled={dis} onClick={() => mide('Corriente de fuga', mideFuga(circuito))}>mA fuga (pinza)</button>
        </div>
      </div>
      <ol className="min-h-[3rem] rounded-md bg-ink p-2 font-mono text-xs text-mute">
        {log.length ? log.map((l, i) => <li key={i}>› {l}</li>) : <li>Sin medidas todavía.</li>}
      </ol>
    </section>
  );
}
