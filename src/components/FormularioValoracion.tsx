"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { CRITERIOS, formatearNota, tierDeNota } from "@/lib/scores";
import { useRollo } from "@/lib/store";
import type { CriterioKey, Puntuacion } from "@/lib/types";
import { RollitosInput } from "./Rollitos";

type Valores = Partial<Record<CriterioKey, Puntuacion>>;

/**
 * Formulario de valoración: cuatro categorías de 1 a 5 rollitos,
 * comentario libre y nota global calculada en vivo.
 */
export function FormularioValoracion({
  placeId,
  onGuardado,
}: {
  placeId: string;
  onGuardado: () => void;
}) {
  const { añadirReview } = useRollo();
  const [valores, setValores] = useState<Valores>({});
  const [comentario, setComentario] = useState("");
  const [autor, setAutor] = useState("");
  const [guardando, setGuardando] = useState(false);

  const puestas = CRITERIOS.map(({ key }) => valores[key]).filter(
    (v): v is Puntuacion => v !== undefined,
  );
  const completo = puestas.length === CRITERIOS.length;
  const notaViva =
    puestas.length > 0
      ? puestas.reduce((a, b) => a + b, 0) / puestas.length
      : null;
  const tier = tierDeNota(completo ? notaViva : null);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completo || guardando) return;
    const { limpieza, espacio, intimidad, suministros } = valores;
    if (!limpieza || !espacio || !intimidad || !suministros) return;

    setGuardando(true);
    añadirReview(placeId, {
      limpieza,
      espacio,
      intimidad,
      suministros,
      comentario,
      autor,
    });
    setGuardando(false);
    onGuardado();
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-3.5">
        {CRITERIOS.map(({ key, label, pregunta, emoji }) => (
          <div
            key={key}
            className="rounded-2xl border border-papel-300 bg-papel-50 p-3"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-display text-[15px] font-semibold">
                {emoji} {label}
              </span>
              <span className="text-xs font-semibold text-carton-500">
                {valores[key] ? `${valores[key]}/5` : "sin nota"}
              </span>
            </div>
            <p className="mb-2 text-xs italic text-carton-600">{pregunta}</p>
            <RollitosInput
              etiqueta={label}
              valor={valores[key] ?? null}
              onChange={(v) => setValores((prev) => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Nota global calculada */}
      <div
        className="flex items-center justify-between rounded-2xl px-4 py-3 text-white"
        style={{ backgroundColor: tier.color }}
      >
        <span className="font-display text-sm font-semibold uppercase tracking-wide">
          Nota global
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold">
            {formatearNota(notaViva)}
          </span>
          <span className="text-xs opacity-90">
            {completo ? tier.etiqueta : `faltan ${4 - puestas.length}`}
          </span>
        </span>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="comentario"
          className="block text-xs font-bold uppercase tracking-[0.14em] text-carton-500"
        >
          Advertencias o halagos
        </label>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Lleva papel de casa, el pestillo es decorativo…"
          className="campo w-full resize-none p-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="autor"
          className="block text-xs font-bold uppercase tracking-[0.14em] text-carton-500"
        >
          Tu alias (opcional)
        </label>
        <input
          id="autor"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          maxLength={24}
          placeholder="Rollo Anónimo"
          className="campo h-11 w-full px-3 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={!completo || guardando}
        className="btn-agua flex h-12 w-full items-center justify-center gap-2 text-[15px]"
      >
        {guardando ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Check className="h-5 w-5" />
        )}
        Publicar valoración
      </button>
      {!completo && (
        <p className="text-center text-xs text-carton-600">
          Puntúa las cuatro categorías para poder publicar.
        </p>
      )}
    </form>
  );
}
