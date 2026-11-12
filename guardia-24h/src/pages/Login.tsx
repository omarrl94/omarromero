import { useState, type FormEvent } from 'react';
import { CuadroHero } from '../components/Iconos';
import { repo } from '../data';
import { useStore } from '../game/store';
import { sonidoClick } from '../game/sound';

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
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-6 p-4">
      <div className="text-center">
        <CuadroHero />
        <h1 className="mt-4 text-5xl font-black tracking-tight drop-shadow-[0_4px_0_#000] sm:text-6xl">Guardia <span className="text-crema">24 h</span></h1>
        <p className="mt-2 text-lg font-bold text-menta">Eres el técnico de guardia. Cada aviso es un trabajo real… y lo firmas tú.</p>
        <p className="text-xs opacity-70">CFGS Sistemas Electrotécnicos y Automatizados · TPIE</p>
      </div>
      <form onSubmit={(e) => void enviar(e)} className="card grid gap-3">
        <label className="font-bold">Código de clase
          <input className="input mt-1 text-lg uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off" required />
        </label>
        <label className="font-bold">Alias
          <input className="input mt-1 text-lg" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={24} autoComplete="nickname" required />
        </label>
        {error && <p role="alert" className="rounded-lg bg-mal p-2 font-bold text-white">{error}</p>}
        <button className="btn btn-big" disabled={cargando}>{cargando ? 'Entrando…' : '⚡ Entrar'}</button>
        <p className="text-xs">Modo: <strong>{repo.modo === 'nube' ? 'en la nube' : 'local (solo este dispositivo)'}</strong>. Solo guardamos tu alias y el código de clase. Tu «Mi manual» nunca sale de tu dispositivo.</p>
      </form>
    </main>
  );
}
