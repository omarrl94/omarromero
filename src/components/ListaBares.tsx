"use client";

import { Crown } from "lucide-react";
import { formatearNota, tierDeNota } from "@/lib/scores";
import type { Bar, BarConNota } from "@/lib/types";
import { RollitosEstaticos } from "./Rollitos";

/**
 * Ranking de baños fichados. Se usa como alternativa al mapa cuando no
 * hay clave de Google, y como refuerzo del mapa en pantallas pequeñas.
 */
export function ListaBares({
  bares,
  seleccion,
  onElegir,
}: {
  bares: readonly BarConNota[];
  seleccion: string | null;
  onElegir: (bar: Bar) => void;
}) {
  const ordenados = [...bares].sort(
    (a, b) => (b.media ?? 0) - (a.media ?? 0),
  );

  if (ordenados.length === 0) {
    return (
      <p className="tarjeta p-4 text-center text-sm text-carton-600">
        Todavía no hay ningún baño valorado. Busca un bar y estrena el mapa.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {ordenados.map(({ bar, media, reviews, esRolloDeOro }) => {
        const tier = tierDeNota(media);
        const activo = bar.place_id === seleccion;
        return (
          <li key={bar.place_id}>
            <button
              type="button"
              onClick={() => onElegir(bar)}
              className={`tarjeta flex w-full items-center gap-3 p-3 text-left transition-shadow hover:shadow-ficha ${
                activo ? "ring-2 ring-agua-400" : ""
              }`}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-base font-bold text-white"
                style={{ backgroundColor: tier.color }}
              >
                {formatearNota(media)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{bar.nombre}</span>
                  {esRolloDeOro && (
                    <Crown className="h-3.5 w-3.5 shrink-0 text-oro-500" />
                  )}
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <RollitosEstaticos valor={media ?? 0} />
                  <span className="truncate text-xs text-carton-600">
                    {reviews.length}{" "}
                    {reviews.length === 1 ? "valoración" : "valoraciones"}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
