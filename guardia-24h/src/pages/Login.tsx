import { useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { repo } from '../data';
import { sonidoClick } from '../game/sound';
import { useStore } from '../game/store';

function Unifilar() {
  return (
    <svg viewBox="0 0 320 220" className="w-full max-w-sm text-info" fill="none" stroke="#24604E" strokeWidth="1.5" role="img" aria-label="Esquema unifilar de ejemplo">
      <path d="M160 10v34M160 44h-100v22M160 44h100v22M160 44v22M60 66v20M160 66v20M260 66v20" />
      {[60, 160, 260].map((x) => <g key={x}><rect x={x - 12} y="86" width="24" height="30" rx="2" /><path d={`M${x} 92v18`} stroke="#1A1A1A" /><path d={`M${x} 116v36`} /><circle cx={x} cy="168" r="14" /><path d={`M${x - 5} 168h10`} /></g>)}
      <text x="60" y="206" fontSize="10" fill="#4A5C54" stroke="none" textAnchor="middle">C1</text><text x="160" y="206" fontSize="10" fill="#4A5C54" stroke="none" textAnchor="middle">C2</text><text x="260" y="206" fontSize="10" fill="#4A5C54" stroke="none" textAnchor="middle">C3</text>
      <text x="172" y="24" fontSize="10" fill="#4A5C54" stroke="none">IGA</text>
    </svg>
  );
}

export function Login() {
  const entrar = useStore((s) => s.entrar);
  const [codigo, setCodigo] = useState('');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  async function enviar(e: FormEvent) {
    e.preventDefault();
    sonidoClick(); setError(''); setCargando(true);
    try { await entrar(codigo, alias); } catch (err) { setError((err as Error).message); } finally { setCargando(false); }
  }
  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 p-6 md:grid-cols-2">
      <section>
        <div className="mb-6 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded bg-acc text-tinta"><Icon n="bolt" /></span><span className="font-display text-2xl font-bold">Guardia</span><span className="cinta">24h</span></div>
        <h1 className="!text-[3.2rem] !leading-[0.95] sm:!text-[4.6rem]">Instalaciones eléctricas: del aviso a la firma</h1><div className="hazard mt-5 h-[6px] w-40" aria-hidden />
        <p className="mt-4 max-w-md text-mute">Resuelve avisos como en una empresa real: planifica, interviene, mide y firma el certificado. Cada decisión se justifica con el REBT.</p>
        <p className="mt-2 text-xs text-mute">CFGS Sistemas Electrotécnicos y Automatizados. Módulo 0518, Técnicas y Procesos en Instalaciones Eléctricas.</p>
        <div className="mt-8 hidden md:block"><Unifilar /></div>
      </section>
      <form onSubmit={(e) => void enviar(e)} className="card grid gap-4 p-6">
        <div><h2>Entrar al aula</h2><p className="text-sm text-mute">Escribe el código de tu clase y el alias con el que aparecerás.</p></div>
        <label className="text-sm font-medium">Código de clase
          <input className="input mt-1 uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off" required />
        </label>
        <label className="text-sm font-medium">Alias
          <input className="input mt-1" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={24} autoComplete="nickname" required />
        </label>
        {error && <p role="alert" className="rounded-md border border-bad bg-bad/10 p-2 text-sm text-bad">{error}</p>}
        <button className="btn btn-big" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</button>
        <p className="text-xs text-mute">Modo: <strong className="text-tx">{repo.modo === 'nube' ? 'en la nube' : 'local (solo este dispositivo)'}</strong>. Solo se guarda tu alias y el código de clase. «Mi manual» nunca sale de tu dispositivo.</p>
      </form>
    </main>
  );
}
