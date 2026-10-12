"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CRITERIOS,
  GRADOS,
  fechaRelativa,
  formatearNota,
  notaGlobal,
  veredictoDeNota,
} from "@/lib/scores";
import type { BarConNota } from "@/lib/types";
import { FormularioValoracion } from "./FormularioValoracion";

/**
 * Ficha del baño: BottomSheet en móvil, cartel centrado en escritorio.
 * La nota va a tamaño titular porque es lo único que se mira con prisa.
 */
export function FichaBar({
  barConNota,
  abrirValorando,
  onCerrar,
}: {
  barConNota: BarConNota;
  /** Al adoptar un bar nuevo se entra directo al formulario. */
  abrirValorando: boolean;
  onCerrar: () => void;
}) {
  const { bar, media, medias, reviews, esRolloDeOro } = barConNota;
  const [valorando, setValorando] = useState(abrirValorando);
  const veredicto = veredictoDeNota(media);

  useEffect(() => setValorando(abrirValorando), [bar.place_id, abrirValorando]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar ficha"
        onClick={onCerrar}
        className="fixed inset-0 z-40 bg-asfalto-950/80"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Baño de ${bar.nombre}`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92%] animate-sube flex-col border-t-4 border-black bg-asfalto-800 md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[86vh] md:w-[min(760px,calc(100%-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:animate-entra md:border-4 md:shadow-dura-l"
      >
        <header className="relative border-b-[3px] border-black p-5">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar ficha"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center border-2 border-black bg-papel text-asfalto-900 shadow-dura-s hover:bg-marca hover:text-white"
          >
            <X className="h-[18px] w-[18px]" />
          </button>

          <div className="flex flex-wrap items-center gap-3.5">
            <span
              className="grito border-4 border-black px-3.5 py-1.5 text-[clamp(54px,13vw,86px)] leading-[0.86] text-asfalto-900 shadow-dura tabular-nums"
              style={{ backgroundColor: veredicto.color }}
            >
              {formatearNota(media)}
            </span>
            <span className="min-w-0">
              <h2 className="grito text-[clamp(26px,6vw,40px)] leading-[0.98]">
                {bar.nombre}
              </h2>
              <p className="mt-1 font-mono text-[11.5px] text-papel-apagado">
                {bar.direccion}
              </p>
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                <span
                  className="grito border-2 border-black px-2 py-0.5 text-xs text-asfalto-900"
                  style={{ backgroundColor: veredicto.color }}
                >
                  {veredicto.texto}
                </span>
                <span className="grito border-2 border-borde bg-asfalto-700 px-2 py-0.5 text-xs text-papel-apagado">
                  {reviews.length} {reviews.length === 1 ? "voto" : "votos"}
                </span>
                {esRolloDeOro && (
                  <span className="grito -rotate-2 border-2 border-black bg-ambar px-2 py-0.5 text-xs text-[#140F00]">
                    👑 Rollo de Oro
                  </span>
                )}
              </span>
            </span>
          </div>
          {/* Cinta de advertencia bajo la cabecera */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #000 0 10px, #FF2E88 10px 20px)",
            }}
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {valorando ? (
            <FormularioValoracion
              placeId={bar.place_id}
              onGuardado={() => setValorando(false)}
              onCancelar={() => setValorando(false)}
            />
          ) : (
            <>
              <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-acido">
                El parte técnico
              </p>

              {medias ? (
                <>
                  <ul className="grid gap-3.5">
                    {CRITERIOS.map(({ key, label }) => {
                      const valor = medias[key];
                      const v = veredictoDeNota(valor);
                      const suspensos = reviews.filter((r) => r[key] <= 2).length;
                      return (
                        <li key={key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                          <span className="grito text-base">{label}</span>
                          <span
                            className="grito text-lg tabular-nums"
                            style={{ color: v.color }}
                          >
                            {formatearNota(valor)}
                          </span>
                          <span className="col-span-2 h-3.5 border-2 border-black bg-asfalto-700">
                            <span
                              className="block h-full"
                              style={{
                                width: `${(valor / 5) * 100}%`,
                                backgroundColor: v.color,
                              }}
                            />
                          </span>
                          <span className="col-span-2 font-mono text-[10.5px] uppercase text-papel-apagado">
                            {GRADOS[Math.max(0, Math.round(valor) - 1)]}
                            {suspensos > 0 &&
                              ` · ${suspensos} de ${reviews.length} lo suspende`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p
                    className="mt-4 border-l-4 py-0.5 pl-3.5 text-[16.5px]"
                    style={{ borderColor: veredicto.color }}
                  >
                    {veredicto.frase}
                  </p>
                </>
              ) : (
                <p className="border-2 border-dashed border-borde p-5 text-center text-papel-apagado">
                  Nadie ha entrado todavía. El primer voto define la leyenda de
                  este baño.
                </p>
              )}

              <button
                type="button"
                onClick={() => setValorando(true)}
                className="btn btn-acido mt-6 w-full"
              >
                Yo he estado ahí dentro
              </button>

              {reviews.length > 0 && (
                <div className="mt-7">
                  <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-acido">
                    Partes de guerra
                  </p>
                  {reviews.map((review) => {
                    const nota = notaGlobal(review);
                    const v = veredictoDeNota(nota);
                    return (
                      <article
                        key={review.id}
                        className="border-t-2 border-dashed border-borde py-4 first:border-t-0 first:pt-0"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="grito text-[17px]">{review.autor}</span>
                          <span
                            className="grito border-[3px] border-black px-1.5 py-0.5 text-lg leading-none text-asfalto-900 shadow-dura-s tabular-nums"
                            style={{ backgroundColor: v.color }}
                          >
                            {formatearNota(nota)}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10.5px] text-papel-apagado">
                          {fechaRelativa(review.fecha)}
                        </p>
                        {review.comentario && (
                          <p className="mt-2.5 border-l-4 border-marca py-0.5 pl-3.5 text-[16.5px] leading-relaxed">
                            {review.comentario}
                          </p>
                        )}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {CRITERIOS.map(({ key, corto }) => (
                            <span
                              key={key}
                              className="border border-borde px-1.5 py-0.5 font-mono text-[10.5px] text-papel-apagado"
                            >
                              {corto} {review[key]}/5
                            </span>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  bar.nombre,
                )}&query_place_id=${encodeURIComponent(bar.place_id)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-fantasma mt-6 w-full no-underline"
              >
                <ExternalLink className="h-4 w-4" />
                Cómo llegar
              </a>
            </>
          )}
        </div>
      </section>
    </>
  );
}
