"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  CRITERIOS,
  GRADOS,
  formatearNota,
  veredictoDeNota,
} from "@/lib/scores";
import { useAuth } from "@/lib/auth";
import { useRollo } from "@/lib/store";
import type { Bar, CriterioKey, Puntuacion, Review } from "@/lib/types";
import { EscalaRollos } from "./Rollitos";

type Valores = Partial<Record<CriterioKey, Puntuacion>>;

/**
 * El parte: cuatro categorías de 1 a 5 rollos, veredicto calculado en
 * vivo y el aviso para quien entre después.
 */
export function FormularioValoracion({
  bar,
  anterior,
  onGuardado,
  onCancelar,
}: {
  bar: Bar;
  /** Si ya habías valorado este baño, el formulario llega relleno. */
  anterior: Review | null;
  onGuardado: (mensaje: string) => void;
  onCancelar: () => void;
}) {
  const { publicarReview } = useRollo();
  const { usuario } = useAuth();
  const [valores, setValores] = useState<Valores>(
    anterior
      ? {
          limpieza: anterior.limpieza,
          espacio: anterior.espacio,
          intimidad: anterior.intimidad,
          suministros: anterior.suministros,
        }
      : {},
  );
  const [comentario, setComentario] = useState(anterior?.comentario ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puestas = CRITERIOS.map(({ key }) => valores[key]).filter(
    (v): v is Puntuacion => v !== undefined,
  );
  const completo = puestas.length === CRITERIOS.length;
  const notaViva =
    puestas.length > 0
      ? puestas.reduce((a, b) => a + b, 0) / puestas.length
      : null;
  const veredicto = veredictoDeNota(completo ? notaViva : null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { limpieza, espacio, intimidad, suministros } = valores;
    if (!limpieza || !espacio || !intimidad || !suministros || !usuario) return;
    if (enviando) return;

    setEnviando(true);
    setError(null);
    const resultado = await publicarReview(
      bar,
      { limpieza, espacio, intimidad, suministros, comentario },
      { autor: usuario.alias, userId: usuario.id },
    );
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.mensaje ?? "No se ha podido publicar.");
      return;
    }
    onGuardado(
      anterior ? "Parte actualizado." : "Parte publicado. El mapa ya lo sabe.",
    );
  };

  return (
    <form onSubmit={enviar}>
      <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-acido">
        {anterior ? "Corrige tu parte" : "Canta lo que viste"}
      </p>

      {CRITERIOS.map(({ key, label, pregunta }) => {
        const puesta = valores[key];
        return (
          <div
            key={key}
            className="border-t-2 border-dashed border-borde py-4 first:border-t-0 first:pt-1"
          >
            <div className="flex items-baseline justify-between gap-3">
              <b className="grito text-lg">{label}</b>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-acido">
                {puesta ? `${GRADOS[puesta - 1]} · ${puesta}/5` : "sin nota"}
              </span>
            </div>
            <p className="mb-3 mt-1 text-sm text-papel-apagado">{pregunta}</p>
            <EscalaRollos
              etiqueta={label}
              valor={puesta ?? null}
              onChange={(v) => setValores((prev) => ({ ...prev, [key]: v }))}
              colorDe={(p) => veredictoDeNota(p).color}
            />
          </div>
        );
      })}

      {/* Veredicto en vivo */}
      <div
        className="my-6 flex flex-wrap items-center justify-between gap-3 border-[3px] border-black bg-asfalto-700 px-4 py-3 shadow-dura"
        style={completo ? { backgroundColor: `${veredicto.color}22` } : undefined}
      >
        <span>
          <b className="block font-mono text-[10px] uppercase tracking-[0.22em] text-papel-apagado">
            Veredicto
          </b>
          <span
            className="grito mt-1 block text-2xl"
            style={{ color: completo ? veredicto.color : "#B9B2A4" }}
          >
            {completo
              ? veredicto.texto
              : `Faltan ${CRITERIOS.length - puestas.length}`}
          </span>
        </span>
        <span
          className="grito text-5xl leading-none tabular-nums"
          style={{ color: completo ? veredicto.color : "#B9B2A4" }}
        >
          {formatearNota(notaViva)}
        </span>
      </div>

      <label
        htmlFor="comentario"
        className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-papel-apagado"
      >
        El aviso para el siguiente
      </label>
      <textarea
        id="comentario"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={3}
        maxLength={400}
        placeholder="Lleva papel, el pestillo es decorativo, no mires al techo…"
        className="campo"
      />

      <p className="mt-4 flex items-center gap-2 border-2 border-borde bg-asfalto-700 px-3 py-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center bg-acido text-sm font-extrabold text-[#0A0E02]">
          {usuario?.alias.slice(0, 1).toUpperCase() ?? "?"}
        </span>
        <span className="font-mono text-[11px] text-papel-apagado">
          Firmas como <b className="text-papel">{usuario?.alias}</b>
        </span>
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 border-2 border-alarma bg-alarma/10 px-3 py-2 text-sm text-alarma"
        >
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-2.5">
        <button
          type="submit"
          disabled={!completo || enviando}
          className="btn btn-acido w-full"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          {anterior ? "Actualizar mi parte" : "Publicar el parte"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="btn btn-fantasma w-full"
        >
          Dejarlo estar
        </button>
      </div>
      {!completo && (
        <p className="mt-2 text-center font-mono text-[11px] text-papel-apagado">
          Puntúa las cuatro categorías para poder publicar.
        </p>
      )}
    </form>
  );
}
