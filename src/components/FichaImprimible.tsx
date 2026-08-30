import { FAMILIAS_POR_ID, GRADOS, SITUACIONES } from '../data/fpData';
import { AVISO_CALENDARIO, FASES, PORTAL_ESTATAL } from '../data/calendario';
import { AVISO_DATOS_MERCADO, datosMercado, formatearSalario } from '../data/mercadoLaboral';
import { formatearHoras } from '../lib/format';
import { ETIQUETA_DIMENSION, porcentajesDimension } from '../lib/scoring';
import type { Resultado } from '../types';

/** Cuántos ciclos entran en la ficha impresa sin que se vaya a tres páginas. */
const CICLOS_EN_FICHA = 6;

/**
 * Ficha resumen para imprimir o guardar como PDF.
 *
 * Solo existe en el flujo de impresion (clase `print-only`), asi que se maqueta
 * con estilos pensados para papel: blanco y negro, sin sombras y evitando que
 * las tarjetas se partan entre paginas. No hace falta ninguna libreria de PDF:
 * el dialogo de impresion del navegador ya ofrece "Guardar como PDF".
 */
export function FichaImprimible({ resultado }: { resultado: Resultado }) {
  const principal = resultado.familias[0];
  if (!principal) return null;

  const secundarias = resultado.familias.slice(1, 3);
  const top = resultado.ciclos[0];
  const perfil = porcentajesDimension(resultado.dimensiones);
  const situacion = SITUACIONES.find((s) => s.id === resultado.situacion);
  const gradoSugerido = GRADOS[resultado.gradoSugerido];

  const fecha = (() => {
    const parsed = new Date(resultado.fecha);
    return Number.isNaN(parsed.getTime())
      ? ''
      : parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="print-only text-[#111]">
      <header className="border-b-2 border-[#111] pb-4 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[.14em] font-bold">
          OrientaFP · Informe vocacional
        </p>
        <h1 className="mt-2 font-extrabold text-[26px] leading-tight">
          {resultado.arquetipo.arquetipo.nombre}
        </h1>
        <p className="mt-1 text-[13px] italic">«{resultado.arquetipo.arquetipo.lema}»</p>
        <p className="mt-2 text-[13px]">
          <strong>Familia profesional:</strong> {principal.familia.nombre}
        </p>
        <p className="mt-1 text-[12px]">
          Afinidad {principal.afinidad}% · Punto de entrada recomendado:{' '}
          {gradoSugerido?.nombre ?? 'Grado Medio'}
          {fecha && ` · Generada el ${fecha}`}
        </p>
        {situacion && <p className="mt-1 text-[12px]">Situación de partida: {situacion.titulo}</p>}
      </header>

      <section className="mb-6 print-card p-4 rounded">
        <h2 className="font-bold text-[14px] mb-2">Tu arquetipo</h2>
        <p className="text-[12px] leading-relaxed">{resultado.arquetipo.arquetipo.descripcion}</p>
        <h2 className="font-bold text-[14px] mt-4 mb-2">Por qué encaja esta familia</h2>
        <p className="text-[12px] leading-relaxed">{principal.explicacion}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-bold text-[14px] mb-2">Afinidad por familias</h2>
        <ul className="text-[12px] space-y-1">
          {resultado.familias.slice(0, 5).map((match) => (
            <li key={match.familia.id} className="flex justify-between border-b border-[#e5e5e5] py-1">
              <span>{match.familia.nombre}</span>
              <span className="font-mono font-bold">{match.afinidad}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-bold text-[14px] mb-2">Tu perfil por dimensiones</h2>
        <ul className="text-[12px] space-y-1">
          {perfil.map((item) => (
            <li key={item.dimension} className="flex justify-between border-b border-[#e5e5e5] py-1">
              <span>{ETIQUETA_DIMENSION[item.dimension]}</span>
              <span className="font-mono font-bold">{item.porcentaje}%</span>
            </li>
          ))}
        </ul>
      </section>

      {secundarias.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-[14px] mb-2">Familias alternativas</h2>
          <ul className="text-[12px] space-y-1">
            {secundarias.map((match) => (
              <li key={match.familia.id}>
                <strong>{match.familia.nombre}</strong> — {match.afinidad}% de afinidad.{' '}
                {match.familia.claim}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-bold text-[14px] mb-3">Ciclos recomendados</h2>
        <div className="space-y-3">
          {resultado.ciclos.slice(0, CICLOS_EN_FICHA).map((match) => (
            <article key={match.ciclo.id} className="print-card p-3 rounded">
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-bold text-[13px]">
                  {match.ciclo.nombre}
                  {match.ciclo.siglas && ` (${match.ciclo.siglas})`}
                </h3>
                <span className="font-mono text-[11px] font-bold shrink-0">{match.encaje}%</span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider mt-1">
                {GRADOS[match.ciclo.grado]?.nombre ?? ''} · {formatearHoras(match.ciclo.duracionHoras)}
              </p>
              <p className="text-[11.5px] mt-1.5 leading-relaxed">{match.ciclo.descripcion}</p>
              <p className="text-[11px] mt-1.5">
                <strong>Salidas:</strong> {(match.ciclo.salidasLaborales ?? []).join(' · ')}
              </p>
              {(() => {
                const m = datosMercado(match.ciclo.id);
                if (!m) return null;
                return (
                  <p className="text-[11px] mt-1">
                    <strong>Mercado (orientativo):</strong> {m.insercion}% de inserción ·{' '}
                    {formatearSalario(m.salarioMin, m.salarioMax)}
                  </p>
                );
              })()}
            </article>
          ))}
        </div>
      </section>

      {/* ---- Hoja de ruta académica ---- */}
      {top && (
        <section className="mt-6">
          <h2 className="font-bold text-[14px] mb-2">Hoja de ruta sugerida</h2>
          <ol className="text-[11.5px] space-y-1.5">
            <li>
              <strong>Punto de partida:</strong> {situacion?.titulo ?? 'tu situación actual'}.
            </li>
            <li>
              <strong>1. Cursa:</strong> {top.ciclo.nombre} ({GRADOS[top.ciclo.grado]?.nombre}) ·{' '}
              {FAMILIAS_POR_ID[top.ciclo.familia]?.nombre}.
            </li>
            {(top.ciclo.continuidad?.especializacion ?? []).length > 0 && (
              <li>
                <strong>2. Especialízate (opcional):</strong>{' '}
                {top.ciclo.continuidad.especializacion.join(' · ')}.
              </li>
            )}
            {(top.ciclo.continuidad?.universidad ?? []).length > 0 ? (
              <li>
                <strong>3. Universidad (opcional):</strong>{' '}
                {top.ciclo.continuidad.universidad.join(' · ')}. Acceso sin selectividad y con un
                reconocimiento habitual de 30 a 60 créditos ECTS según la titulación.
              </li>
            ) : (
              <li>
                <strong>3. Universidad:</strong> encadenando después un Grado Superior se accede sin
                selectividad.
              </li>
            )}
          </ol>
        </section>
      )}

      {/* ---- Checklist de matriculación ---- */}
      <section className="mt-6">
        <h2 className="font-bold text-[14px] mb-1">Checklist de admisión y matrícula</h2>
        <p className="text-[10.5px] mb-2 leading-relaxed">{AVISO_CALENDARIO}</p>
        <ul className="text-[11.5px] space-y-1.5">
          {FASES.map((fase) => (
            <li key={fase.id} className="flex items-start gap-2">
              <span className="mt-[2px] inline-block w-3 h-3 border border-[#111] shrink-0" aria-hidden="true" />
              <span>
                <strong>{fase.nombre}</strong> ({fase.ventana}) — {fase.descripcion}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[10.5px] mt-2">
          Consulta las fechas exactas de tu comunidad autónoma y compara la oferta en{' '}
          {PORTAL_ESTATAL.nombre}: {PORTAL_ESTATAL.url}
        </p>
      </section>

      <footer className="mt-8 pt-3 border-t border-[#111] text-[10px]">
        Informe orientativo generado con OrientaFP. {AVISO_DATOS_MERCADO} La oferta concreta de
        ciclos varía según comunidad autónoma y centro. Contrasta siempre con el departamento de
        orientación de tu centro educativo.
      </footer>
    </div>
  );
}
