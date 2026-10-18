"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  ASEOS,
  CRITERIOS,
  GRADOS,
  formatearNota,
  veredictoDeNota,
} from "@/lib/scores";
import { useRollo } from "@/lib/store";
import type { Bar, CriterioKey, Puntuacion, TipoAseo } from "@/lib/types";
import { EscalaRollos } from "./Rollitos";

type Valores = Partial<Record<CriterioKey, Puntuacion>>;

/**
 * El parte: primero qué aseo se visitó —el de ellas y el de ellos no se
 * parecen en nada—, luego las cuatro categorías, el veredicto en vivo y
 * el aviso para quien entre después.
 */
export function FormularioValoracion({
  bar,
  onGuardado,
  onCancelar,
}: {
  bar: Bar;
  onGuardado: (mensaje: string) => void;
  onCancelar: () => void;
}) {
  const { publicarReview, retirarReview, miReview, filtroAseo } = useRollo();
  const { usuario } = useAuth();

  // Si estabas mirando un aseo concreto, se da por elegido.
  const [aseo, setAseo] = useState<TipoAseo | null>(
    filtroAseo === "todos" ? null : filtroAseo,
  );
  const [valores, setValores] = useState<Valores>({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anterior = aseo
    ? miReview(bar.place_id, usuario?.id ?? null, aseo)
    : null;

  // Al cambiar de aseo, el formulario se rellena con lo que ya dijiste
  // de ese aseo (o se vacía si es la primera vez).
  useEffect(() => {
    if (!aseo) return;
    if (anterior) {
      setValores({
        limpieza: anterior.limpieza,
        espacio: anterior.espacio,
        intimidad: anterior.intimidad,
        suministros: anterior.suministros,
      });
      setComentario(anterior.comentario);
    } else {
      setValores({});
      setComentario("");
    }
    // Solo cuando cambia el aseo: lo que teclees después no se pisa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aseo, bar.place_id]);

  const puestas = CRITERIOS.map(({ key }) => valores[key]).filter(
    (v): v is Puntuacion => v !== undefined,
  );
  const completo = puestas.length === CRITERIOS.length && aseo !== null;
  const notaViva =
    puestas.length > 0
      ? puestas.reduce((a, b) => a + b, 0) / puestas.length
      : null;
  const veredicto = veredictoDeNota(completo ? notaViva : null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { limpieza, espacio, intimidad, suministros } = valores;
    if (!limpieza || !espacio || !intimidad || !suministros) return;
    if (!aseo || !usuario || enviando) return;

    setEnviando(true);
    setError(null);
    const resultado = await publicarReview(
      bar,
      { aseo, limpieza, espacio, intimidad, suministros, comentario },
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
        ¿En qué baño estuviste?
      </p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Aseo">
        {ASEOS.map(({ key, label, simbolo, pregunta }) => {
          const activo = aseo === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setAseo(key)}
              className={`grito border-2 px-2 py-3 leading-none ${
                activo
                  ? "border-black bg-acido text-asfalto-900 shadow-dura-s"
                  : "border-borde bg-asfalto-700 text-papel-apagado hover:border-papel hover:text-papel"
              }`}
            >
              <span className="block text-2xl">{simbolo}</span>
              <span className="mt-1.5 block text-sm">{label}</span>
              <span className="mt-1 block font-mono text-[9px] normal-case tracking-normal opacity-70">
                {pregunta}
              </span>
            </button>
          );
        })}
      </div>

      {anterior && (
        <p className="mt-3 border-2 border-ambar bg-ambar/10 px-3 py-2 font-mono text-[11px] text-ambar">
          Ya tenías un parte de este aseo: lo que publiques lo sustituye.
        </p>
      )}

      <div className={aseo ? "" : "pointer-events-none opacity-40"}>
        <p className="mb-3 mt-6 font-mono text-[10.5px] uppercase tracking-[0.22em] text-acido">
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
                : aseo
                  ? `Faltan ${CRITERIOS.length - puestas.length}`
                  : "Elige el aseo"}
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
      </div>

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

        {anterior && (
          <button
            type="button"
            onClick={async () => {
              const resultado = await retirarReview(anterior);
              onGuardado(
                resultado.ok
                  ? "Parte retirado."
                  : (resultado.mensaje ?? "No se ha podido retirar."),
              );
            }}
            className="btn btn-fantasma w-full"
          >
            <Trash2 className="h-4 w-4" />
            Retirar mi parte
          </button>
        )}

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
          {aseo
            ? "Puntúa las cuatro categorías para poder publicar."
            : "Elige primero de qué aseo hablas."}
        </p>
      )}
    </form>
  );
}
