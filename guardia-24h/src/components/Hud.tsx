import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { repo } from '../data';
import { RANGOS, rangoDe, useStore } from '../game/store';
import { estaSilenciado, silenciar } from '../game/sound';
import { Icon, type IconName } from './Icon';

const NAV: { to: string; icono: IconName; texto: string; fin?: boolean }[] = [
  { to: '/', icono: 'map', texto: 'Plan formativo', fin: true },
  { to: '/biblioteca', icono: 'book', texto: 'Biblioteca' },
  { to: '/empresa', icono: 'crown', texto: 'Mi empresa' },
  { to: '/notas', icono: 'chart', texto: 'Notas' },
  { to: '/docente', icono: 'user', texto: 'Docente' },
];

export function Hud() {
  const { sesion, estado, salir } = useStore();
  const [mute, setMute] = useState(estaSilenciado());
  if (!sesion) return null;
  const idx = RANGOS.findIndex((r) => r.nombre === rangoDe(estado.xp));
  const sig = RANGOS[idx + 1];
  const pct = sig ? ((estado.xp - RANGOS[idx]!.xp) / (sig.xp - RANGOS[idx]!.xp)) * 100 : 100;
  const enlace = ({ isActive }: { isActive: boolean }) => `flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium no-underline ${isActive ? 'border-acc text-white' : 'border-transparent text-[#9DB0A7] hover:text-white'}`;
  return (
    <>
      <header className="sticky top-0 z-20 bg-tinta text-[#E6EDE9]"><div className="hazard h-[5px]" aria-hidden />
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
          <Link to="/" aria-label="Guardia 24 h, inicio" className="flex items-center gap-2 whitespace-nowrap py-3 text-white no-underline">
            <span className="grid h-7 w-7 place-items-center rounded bg-acc text-tinta"><Icon n="bolt" className="h-4 w-4" /></span>
            <span className="font-display text-xl font-bold tracking-[0.03em]">Guardia</span><span className="cinta !text-[12px]">24h</span>
          </Link>
          <nav aria-label="Principal" className="ml-2 hidden md:flex">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.fin} aria-label={n.texto} className={enlace}><Icon n={n.icono} className="h-4 w-4" />{n.texto}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <div className="hidden text-right leading-tight sm:block" title={`${estado.xp} puntos de experiencia`}>
              <div className="text-xs font-semibold text-white">{rangoDe(estado.xp)}</div>
              <div className="mt-1 h-1 w-32 overflow-hidden rounded bg-white/20" role="progressbar" aria-label="Experiencia" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-acc transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-0.5 text-[10px] text-[#9DB0A7]">{estado.xp} XP{sig ? ` · ${sig.xp - estado.xp} → ${sig.nombre}` : ''}</div>
            </div>
            <span className="hidden whitespace-nowrap rounded border border-white/20 px-2 py-1 text-xs text-[#9DB0A7] xl:inline" title={repo.modo === 'nube' ? 'Datos en la nube' : 'Datos solo en este dispositivo'}>{sesion.alias} · {sesion.claseCodigo} · {repo.modo}</span>
            <button aria-label={mute ? 'Activar sonido' : 'Silenciar'} className="text-[#9DB0A7] hover:text-white" onClick={() => { silenciar(!mute); setMute(!mute); }}><Icon n={mute ? 'mute' : 'sound'} className="h-4 w-4" /></button>
            <button className="text-xs text-[#9DB0A7] hover:text-white" onClick={() => void salir()}>Salir</button>
          </div>
        </div>
      </header>
      <nav aria-label="Principal móvil" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t-4 border-acc bg-tinta py-1 md:hidden">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.fin} aria-label={n.texto} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium ${isActive ? 'text-acc' : 'text-mute'}`}>
            <Icon n={n.icono} />{n.texto.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
