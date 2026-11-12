import { Link } from 'react-router-dom';
import { repo } from '../data';
import { rangoDe, useStore } from '../game/store';

export function Hud() {
  const { sesion, estado, salir } = useStore();
  if (!sesion) return null;
  return (
    <header className="sticky top-0 z-10 border-b-2 border-tinta bg-amarillo">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <Link to="/" className="font-titulo text-lg font-black">⚡ Guardia 24 h</Link>
        <span aria-label="Vidas">{'❤️'.repeat(estado.vidas)}</span>
        <span>XP {estado.xp}</span>
        <span>{rangoDe(estado.xp)}</span>
        <span>💶 {estado.dinero}</span>
        <span>Reputación {estado.reputacion}</span>
        <nav className="ml-auto flex items-center gap-3">
          <Link to="/biblioteca" className="underline">📚 Biblioteca</Link>
          <span className="rounded bg-white px-2 py-0.5" title={repo.modo === 'nube' ? 'Datos en la nube' : 'Datos solo en este dispositivo'}>
            {sesion.alias} · {sesion.claseCodigo} · {repo.modo}
          </span>
          <button className="underline" onClick={() => void salir()}>Salir</button>
        </nav>
      </div>
    </header>
  );
}
