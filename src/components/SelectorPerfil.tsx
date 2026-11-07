import { cicloPorId, config, perfilesDe, type Ciclo, type ModalidadId } from '../../config/ffe.config';
import { fecha } from '../lib/formato';
import type { Alumno } from '../lib/alumno';

interface Props {
  alumno: Alumno;
  cambiar: (cambios: Partial<Alumno>) => void;
  /** Número de paso visible (portada) o sin numerar (Mis datos). */
  numerado?: boolean;
}


function Paso({ n, titulo, numerado, children }: { n: number; titulo: string; numerado?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
        {numerado && (
          <span className="grid size-8 place-items-center rounded-full bg-tinta text-base text-papel" aria-hidden="true">
            {n}
          </span>
        )}
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

export function SelectorPerfil({ alumno, cambiar, numerado }: Props) {
  const elegirCiclo = (ciclo: Ciclo) => {
    if (ciclo === alumno.ciclo) return;
    cambiar({ ciclo, perfiles: [], curso: null });
  };
  const alternarPerfil = (id: string) => {
    const ya = alumno.perfiles.includes(id);
    cambiar({ perfiles: ya ? alumno.perfiles.filter((p) => p !== id) : [...alumno.perfiles, id] });
  };

  return (
    <div className="grid gap-8">
      <Paso n={1} titulo="¿Qué ciclo estudias?" numerado={numerado}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {config.ciclos.map((info) => {
            const c = info.id as Ciclo;
            const activo = alumno.ciclo === c;
            return (
              <label key={c} className={`relative flex cursor-pointer flex-col rounded-2xl border-2 border-tinta p-4 transition ${activo ? `${info.color} shadow-[5px_5px_0_var(--color-tinta)]` : 'bg-white hover:bg-hueso'}`}>
                <input type="radio" name="ciclo" value={c} checked={activo} onChange={() => elegirCiclo(c)} className="peer sr-only" />
                <span className={`font-display font-extrabold ${info.corto.length > 6 ? 'pr-8 text-2xl leading-tight' : 'text-3xl'}`}>{info.corto}</span>
                <span className="mt-1 text-sm leading-snug">
                  {info.corto === info.id ? info.nombre : info.familia} · Grado {info.grado}
                </span>
                <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full border-2 border-tinta bg-white text-xs font-bold peer-focus-visible:outline-3 peer-focus-visible:outline-tinta" aria-hidden="true">
                  {activo ? '✓' : ''}
                </span>
              </label>
            );
          })}
        </div>
      </Paso>

      {alumno.ciclo && (cicloPorId(alumno.ciclo).cursosFFE ?? [2]).length > 1 && (
        <fieldset className="-mt-4 min-w-0">
          <legend className="etiqueta">¿En qué curso estás? (en {cicloPorId(alumno.ciclo).corto} hay Formación en Empresa en los dos cursos)</legend>
          <div className="flex flex-wrap gap-2">
            {(cicloPorId(alumno.ciclo).cursosFFE ?? [2]).map((c) => (
              <label key={c} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2 font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-tinta ${alumno.curso === c ? 'border-tinta bg-amarillo' : 'border-linea bg-white'}`}>
                <input type="radio" name="curso" className="sr-only" checked={alumno.curso === c} onChange={() => cambiar({ curso: c })} />
                {c}.º curso
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {alumno.ciclo && (
        <Paso n={2} titulo="¿Qué te gustaría hacer? Elige uno o varios" numerado={numerado}>
          <div className="flex flex-wrap gap-2">
            {perfilesDe(alumno.ciclo).map((p) => {
              const activo = alumno.perfiles.includes(p.id);
              return (
                <label key={p.id} title={p.descripcion} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 font-semibold transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta ${activo ? 'border-tinta bg-amarillo' : 'border-linea bg-white hover:border-tinta'}`}>
                  <input type="checkbox" checked={activo} onChange={() => alternarPerfil(p.id)} className="sr-only" />
                  <span aria-hidden="true">{activo ? '✓' : '+'}</span>
                  {p.nombre}
                </label>
              );
            })}
          </div>
        </Paso>
      )}

      {alumno.ciclo && (
        <div className="grid gap-8 md:grid-cols-2">
          <Paso n={3} titulo="¿Por qué zona?" numerado={numerado}>
            <label className="etiqueta" htmlFor="zona">Zona preferida</label>
            <select id="zona" className="campo" value={alumno.zona ?? ''} onChange={(e) => cambiar({ zona: e.target.value || null })}>
              <option value="">Cualquier zona</option>
              {config.zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                  {z.incluye.length > 1 ? ` (${z.incluye.slice(0, 3).join(', ')}…)` : ''}
                </option>
              ))}
            </select>
          </Paso>
          <Paso n={4} titulo="¿Qué modalidad tienes?" numerado={numerado}>
            <div className="grid gap-2">
              {config.modalidades.map((m) => (
                <label key={m.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-tinta ${alumno.modalidad === m.id ? 'border-tinta bg-amarillo-claro' : 'border-linea bg-white'}`}>
                  <input type="radio" name="modalidad" value={m.id} checked={alumno.modalidad === m.id} onChange={() => cambiar({ modalidad: m.id as ModalidadId })} className="size-5 accent-tinta" />
                  <span>
                    <strong>{m.nombre}</strong>
                    <span className="block text-sm text-tinta-suave">
                      Del {fecha(m.inicio)} al {fecha(m.fin)} · {m.horasDia} h/día
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-tinta-suave">
              {(cicloPorId(alumno.ciclo).cursosFFE ?? [2]).length > 1
                ? `FFE de ${cicloPorId(alumno.ciclo).corto}: en 1.º y 2.º curso (horas pendientes de confirmar).`
                : `FFE de ${cicloPorId(alumno.ciclo).corto}: ${config.horas[alumno.ciclo]} horas${config.horasPendientesDeConfirmar[alumno.ciclo] ? ' (pendiente de confirmar)' : ''}.`}
            </p>
          </Paso>
        </div>
      )}
    </div>
  );
}
