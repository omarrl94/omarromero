"use client";

import { formatearNota, veredictoDeNota } from "@/lib/scores";
import type { Bar, BarConNota } from "@/lib/types";

/**
 * Panel de ranking. Se usa dos veces: el podio (los que salvan la
 * noche) y la lista negra (los que arruinan una).
 */
export function Ranking({
  titulo,
  subtitulo,
  bares,
  medallas,
  seleccion,
  vacio,
  tono = "podio",
  onElegir,
}: {
  titulo: string;
  subtitulo: string;
  bares: readonly BarConNota[];
  /** Lo que sustituye al número de puesto, si procede. */
  medallas?: readonly string[];
  seleccion: string | null;
  vacio: string;
  tono?: "podio" | "negra";
  onElegir: (bar: Bar) => void;
}) {
  return (
    <section className="panel" aria-label={titulo}>
      <header
        className={`flex items-center justify-between gap-3 border-b-[3px] border-black px-3.5 py-2.5 ${
          tono === "negra" ? "bg-alarma text-white" : "bg-papel text-asfalto-900"
        }`}
      >
        <h2 className="grito text-lg">{titulo}</h2>
        <span
          className={`font-mono text-[10.5px] uppercase tracking-wider ${
            tono === "negra" ? "text-white/75" : "text-asfalto-600"
          }`}
        >
          {subtitulo}
        </span>
      </header>

      {bares.length === 0 ? (
        <p className="m-4 border-2 border-dashed border-borde p-5 text-center text-papel-apagado">
          {vacio}
        </p>
      ) : (
        <ul>
          {bares.map(({ bar, media, reviews, esRolloDeOro }, i) => {
            const veredicto = veredictoDeNota(media);
            const activo = bar.place_id === seleccion;
            return (
              <li key={bar.place_id}>
                <button
                  type="button"
                  onClick={() => onElegir(bar)}
                  className={`grid w-full grid-cols-[46px_1fr_auto] items-center gap-3 border-b border-borde px-3.5 py-3 text-left last:border-b-0 hover:bg-asfalto-700 ${
                    activo ? "bg-asfalto-700 shadow-[inset_5px_0_0_#FF2E88]" : ""
                  }`}
                >
                  <span
                    className={`grito text-3xl leading-none ${
                      i === 0 && tono === "podio" ? "text-ambar" : "text-papel-apagado"
                    }`}
                  >
                    {medallas?.[i] ?? i + 1}
                  </span>

                  <span className="min-w-0">
                    <span className="grito flex items-center gap-1.5 text-lg">
                      <span className="truncate">{bar.nombre}</span>
                      {esRolloDeOro && <span title="Rollo de Oro">👑</span>}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10.5px] text-papel-apagado">
                      {bar.direccion}
                    </span>
                    <span className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-papel-apagado">
                      <span
                        className="grito border-2 border-black px-1.5 text-[11px] text-asfalto-900"
                        style={{ backgroundColor: veredicto.color }}
                      >
                        {veredicto.texto}
                      </span>
                      <span className="truncate">
                        {reviews.length} {reviews.length === 1 ? "voto" : "votos"}
                      </span>
                    </span>
                  </span>

                  <span
                    className="grito min-w-[56px] border-[3px] border-black px-2 py-1 text-center text-2xl leading-none text-asfalto-900 shadow-dura-s tabular-nums"
                    style={{ backgroundColor: veredicto.color }}
                  >
                    {formatearNota(media)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
