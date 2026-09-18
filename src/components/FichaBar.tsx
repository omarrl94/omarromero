"use client";

import { Crown, ExternalLink, MessageSquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CRITERIOS,
  fechaRelativa,
  formatearNota,
  notaGlobal,
  tierDeNota,
} from "@/lib/scores";
import type { BarConNota } from "@/lib/types";
import { FormularioValoracion } from "./FormularioValoracion";
import { RollitosEstaticos } from "./Rollitos";

/**
 * Ficha del bar: BottomSheet en móvil, panel lateral en escritorio.
 * Muestra las notas del baño y desde aquí se abre el formulario.
 */
export function FichaBar({
  barConNota,
  onCerrar,
}: {
  barConNota: BarConNota;
  onCerrar: () => void;
}) {
  const { bar, media, medias, reviews, esRolloDeOro } = barConNota;
  const [valorando, setValorando] = useState(false);
  const tier = tierDeNota(media);

  // Al cambiar de bar se vuelve a la vista de lectura.
  useEffect(() => setValorando(false), [bar.place_id]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  return (
    <>
      {/* Velo oscuro solo en móvil */}
      <button
        type="button"
        aria-label="Cerrar ficha"
        onClick={onCerrar}
        className="fixed inset-0 z-40 bg-tinta/35 md:hidden"
      />

      <aside
        role="dialog"
        aria-label={`Baño de ${bar.nombre}`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] animate-sube-sheet flex-col rounded-t-3xl border border-papel-300 bg-papel-50 shadow-sheet md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:animate-entra-panel md:rounded-l-3xl md:rounded-tr-none md:shadow-ficha"
      >
        {/* Asa para arrastrar (decorativa en móvil) */}
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-papel-300 md:hidden" />

        <header className="flex items-start gap-3 px-5 pb-4 pt-3 md:pt-5">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold text-white"
            style={{ backgroundColor: tier.color }}
          >
            {formatearNota(media)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-bold leading-tight">
              {bar.nombre}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-xs text-carton-600">
              {bar.direccion}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tier.badge}`}
              >
                {tier.etiqueta}
              </span>
              <span className="rounded-full bg-papel-200 px-2.5 py-0.5 text-[11px] font-semibold text-carton-700">
                {reviews.length}{" "}
                {reviews.length === 1 ? "valoración" : "valoraciones"}
              </span>
              {esRolloDeOro && (
                <span className="flex items-center gap-1 rounded-full bg-oro-200 px-2.5 py-0.5 text-[11px] font-bold text-oro-600 ring-1 ring-oro-400">
                  <Crown className="h-3 w-3" /> Rollo de Oro
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-carton-500 hover:bg-papel-200 hover:text-tinta"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {valorando ? (
            <FormularioValoracion
              placeId={bar.place_id}
              onGuardado={() => setValorando(false)}
            />
          ) : (
            <div className="space-y-5">
              {/* Medias por categoría */}
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-carton-500">
                  El desglose
                </h3>
                {medias ? (
                  <ul className="space-y-2">
                    {CRITERIOS.map(({ key, label, emoji }) => {
                      const valor = medias[key];
                      return (
                        <li key={key} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-sm font-medium">
                            {emoji} {label}
                          </span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-papel-200">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${(valor / 5) * 100}%`,
                                backgroundColor: tierDeNota(valor).color,
                              }}
                            />
                          </span>
                          <span className="w-7 shrink-0 text-right text-sm font-bold tabular-nums">
                            {formatearNota(valor)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-dashed border-carton-300 bg-papel-100 p-4 text-center text-sm text-carton-600">
                    Nadie ha valorado este baño todavía. Puedes ser el
                    explorador que abra el camino.
                  </p>
                )}
              </section>

              <button
                type="button"
                onClick={() => setValorando(true)}
                className="btn-agua flex h-12 w-full items-center justify-center gap-2 text-[15px]"
              >
                <MessageSquarePlus className="h-5 w-5" />
                Valorar este baño
              </button>

              {/* Comentarios */}
              {reviews.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-carton-500">
                    Partes de guerra
                  </h3>
                  <ul className="space-y-2.5">
                    {reviews.map((review) => {
                      const nota = notaGlobal(review);
                      return (
                        <li
                          key={review.id}
                          className="rounded-2xl border border-papel-300 bg-papel-100 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">
                              {review.autor}
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                              <RollitosEstaticos valor={nota} />
                              <span className="text-sm font-bold tabular-nums">
                                {formatearNota(nota)}
                              </span>
                            </span>
                          </div>
                          {review.comentario && (
                            <p className="mt-1.5 text-sm leading-relaxed text-tinta/85">
                              “{review.comentario}”
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] text-carton-500">
                            {fechaRelativa(review.fecha)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  bar.nombre,
                )}&query_place_id=${bar.place_id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-papel flex h-11 w-full items-center justify-center gap-2 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en Google Maps
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
