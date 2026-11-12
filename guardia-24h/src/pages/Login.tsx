import { useState, type FormEvent } from 'react';
import { repo } from '../data';
import { useStore } from '../game/store';

export function Login() {
  const entrar = useStore((s) => s.entrar);
  const [codigo, setCodigo] = useState('');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(''); setCargando(true);
    try { await entrar(codigo, alias); } catch (err) { setError((err as Error).message); } finally { setCargando(false); }
  }
  return (
    <main className="mx-auto max-w-md p-4 pt-12">
      <h1 className="font-titulo text-4xl font-black">⚡ Guardia 24 h</h1>
      <p className="mb-6 mt-1">Técnico de guardia · CFGS Sistemas Electrotécnicos y Automatizados · TPIE</p>
      <form onSubmit={(e) => void enviar(e)} className="card grid gap-3">
        <label>Código de clase
          <input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off" required />
        </label>
        <label>Alias
          <input className="input" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={24} autoComplete="nickname" required />
        </label>
        {error && <p role="alert" className="font-bold text-red-700">{error}</p>}
        <button className="btn" disabled={cargando}>Entrar</button>
        <p className="text-sm">
          Modo: <strong>{repo.modo === 'nube' ? 'en la nube' : 'local (solo este dispositivo)'}</strong>. Solo guardamos tu alias y el código de
          clase. Tu «Mi manual» nunca sale de tu dispositivo.
        </p>
      </form>
    </main>
  );
}
