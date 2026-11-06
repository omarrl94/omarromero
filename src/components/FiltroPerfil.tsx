import { cicloPorId, config, IDS_CICLOS, perfilPorId, type Ciclo } from '../../config/ffe.config';
import type { Alumno } from '../lib/alumno';

/**
 * Valor del filtro de perfil:
 * - 'mis': los perfiles elegidos por el alumno (o su ciclo)
 * - 'todos': todos los perfiles de todos los ciclos
 * - 'ciclo:DAM', 'ciclo:ASIR', 'ciclo:ACOM': cualquier rama de ese ciclo
 * - un id de perfil concreto (p. ej. 'asir-cloud')
 */
export type ValorPerfil = string;

export function valorInicial(alumno: Alumno): ValorPerfil {
  if (alumno.perfiles.length) return 'mis';
  if (alumno.ciclo) return `ciclo:${alumno.ciclo}`;
  return 'todos';
}

const deCiclo = (perfiles: string[], ciclo: Ciclo) => perfiles.some((p) => perfilPorId(p)?.ciclo === ciclo);

/**
 * ¿Un elemento (empresa u oferta) con estos perfiles pasa el filtro?
 * Con `amplio`, «mis perfiles» incluye todo el ciclo del alumno (las empresas se ordenan luego por encaje).
 */
export function coincidePerfil(perfiles: string[], valor: ValorPerfil, alumno: Alumno, amplio = false): boolean {
  if (valor === 'todos') return true;
  if (valor.startsWith('ciclo:')) {
    const ciclo = valor.slice(6) as Ciclo;
    return IDS_CICLOS.includes(ciclo) && deCiclo(perfiles, ciclo);
  }
  if (valor === 'mis') {
    if (amplio && alumno.ciclo) return deCiclo(perfiles, alumno.ciclo);
    if (alumno.perfiles.length) return perfiles.some((p) => alumno.perfiles.includes(p));
    return alumno.ciclo ? deCiclo(perfiles, alumno.ciclo) : true;
  }
  return perfiles.includes(valor);
}

/** Perfiles que cuentan para ordenar por encaje según el filtro elegido. */
export function perfilesParaEncaje(valor: ValorPerfil, alumno: Alumno): string[] {
  return perfilPorId(valor) ? [valor] : alumno.perfiles;
}

export function FiltroPerfil({ id, valor, cambiar, alumno }: { id: string; valor: ValorPerfil; cambiar: (v: ValorPerfil) => void; alumno: Alumno }) {
  return (
    <div className="col-span-2 lg:col-span-1">
      <label htmlFor={id} className="etiqueta">Perfil o rama</label>
      <select id={id} className="campo" value={valor} onChange={(e) => cambiar(e.target.value)}>
        {(alumno.perfiles.length > 0 || alumno.ciclo) && <option value="mis">{alumno.perfiles.length ? 'Mis perfiles' : `Mi ciclo (${alumno.ciclo ? cicloPorId(alumno.ciclo).corto : ''})`}</option>}
        <option value="todos">Todos los ciclos</option>
        {config.ciclos.map((c) => (
          <option key={c.id} value={`ciclo:${c.id}`}>
            Cualquier rama de {c.corto}
          </option>
        ))}
        {config.ciclos.map((c) => (
          <optgroup key={c.id} label={c.corto}>
            {config.perfiles
              .filter((p) => p.ciclo === c.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {c.corto} · {p.nombre}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
