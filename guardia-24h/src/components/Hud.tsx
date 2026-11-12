import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { repo } from '../data';
import { RANGOS, rangoDe, useStore } from '../game/store';
import { estaSilenciado, silenciar } from '../game/sound';

const NAV = [
  { to: '/', icono: '🗺️', texto: 'Mapa', fin: true },
  { to: '/biblioteca', icono: '📚', texto: 'Biblioteca' },
  { to: '/notas', icono: '📊', texto: 'Notas' },
  { to: '/docente', icono: '🧑‍🏫', texto: 'Docente' },
];

export function Hud() {
  const { sesion, estado, salir } = useStore();
  const [mute, setMute] = useState(estaSilenciado());
  if (!sesion) return null;
  const idx = RANGOS.findIndex((r) => r.nombre === rangoDe(estado.xp));
  const sig = RANGOS[idx + 1];
  const pct = sig ? ((estado.xp - RANGOS[idx]!.xp) / (sig.xp - RANGOS[idx]!.xp)) * 100 : 100;
  const enlace = ({ isActive }: { isActive: boolean }) => `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs font-bold ${isActive ? 'bg-amarillo text-tinta' : 'text-crema hover:bg-white/10'}`;
  return (
    <>
      <header className="sticky top-0 z-20 border-b-4 border-amarillo bg-tinta text-crema">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
          <Link to="/" aria-label="Guardia 24 h, inicio" className="font-titulo text-xl font-black text-amarillo">⚡<span className="hidden sm:inline"> Guardia 24 h</span></Link>
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-crema bg-amarillo font-black text-tinta">{sesion.alias.charAt(0).toUpperCase()}</span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold">{rangoDe(estado.xp)}</div>
              <div className="h-2.5 w-24 overflow-hidden rounded-full bg-white/20 sm:w-36" role="progressbar" aria-label="Experiencia" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-menta transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] opacity-80">{estado.xp} XP{sig ? ` · ${sig.xp - estado.xp} para ${sig.nombre}` : ''}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm font-bold">
            <span aria-label={`${estado.vidas} vidas`} title="Vidas">{'❤️'.repeat(estado.vidas)}</span>
            <span title="Dinero">💶 {estado.dinero}</span>
            <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-xs md:inline" title={repo.modo === 'nube' ? 'Datos en la nube' : 'Datos solo en este dispositivo'}>{sesion.alias} · {sesion.claseCodigo} · {repo.modo}</span>
            <button aria-label={mute ? 'Activar sonido' : 'Silenciar'} className="text-lg" onClick={() => { silenciar(!mute); setMute(!mute); }}>{mute ? '🔇' : '🔊'}</button>
            <button className="text-xs underline" onClick={() => void salir()}>Salir</button>
          </div>
        </div>
        <nav aria-label="Principal" className="mx-auto hidden max-w-5xl gap-1 px-3 pb-2 md:flex">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.fin} aria-label={n.texto} className={enlace}><span aria-hidden>{n.icono}</span>{n.texto}</NavLink>)}
        </nav>
      </header>
      <nav aria-label="Principal móvil" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t-4 border-amarillo bg-tinta py-1 md:hidden">
        {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.fin} aria-label={n.texto} className={enlace}><span aria-hidden className="text-xl">{n.icono}</span>{n.texto}</NavLink>)}
      </nav>
    </>
  );
}
