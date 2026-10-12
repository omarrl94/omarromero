"use client";

import { Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlacesBuscador, type Sugerencia } from "@/hooks/usePlacesBuscador";
import { formatearNota, veredictoDeNota } from "@/lib/scores";
import { useRollo } from "@/lib/store";
import type { Bar } from "@/lib/types";

/**
 * Buscador con Google Places Autocomplete.
 *
 * Primero ofrece los bares ya fichados (instantáneo y sin gastar cuota)
 * y debajo lo que devuelve Google. Al elegir un sitio se adopta con su
 * place_id oficial.
 */
export function Buscador({ onElegir }: { onElegir: (bar: Bar) => void }) {
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [resolviendo, setResolviendo] = useState<string | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const { bares } = useRollo();
  const { sugerencias, cargando, error, resolverBar, listo } =
    usePlacesBuscador(consulta);

  const texto = consulta.trim().toLowerCase();
  const fichados =
    texto.length >= 2
      ? bares.filter((b) => b.bar.nombre.toLowerCase().includes(texto)).slice(0, 5)
      : [];

  const deGoogle = sugerencias.filter(
    (s) => !fichados.some((f) => f.bar.place_id === s.placeId),
  );

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alPulsar);
    return () => document.removeEventListener("mousedown", alPulsar);
  }, [abierto]);

  const elegirDeGoogle = async (sugerencia: Sugerencia) => {
    setResolviendo(sugerencia.placeId);
    const bar = await resolverBar(sugerencia);
    setResolviendo(null);
    if (!bar) return;
    setConsulta("");
    setAbierto(false);
    onElegir(bar);
  };

  const hayResultados = fichados.length > 0 || deGoogle.length > 0;

  return (
    <div ref={contenedor} className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-acido"
          aria-hidden="true"
        />
        <input
          type="search"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder="¿En qué bar estás metido?"
          aria-label="Buscar un bar de Madrid"
          autoComplete="off"
          className="campo h-11 pl-10 pr-10 font-semibold"
        />
        {consulta.length > 0 && (
          <button
            type="button"
            onClick={() => setConsulta("")}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-papel-apagado hover:text-marca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {cargando && consulta.length === 0 && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-acido" />
        )}
      </div>

      {abierto && consulta.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[62vh] overflow-y-auto border-2 border-acido bg-asfalto-800 shadow-dura">
          {fichados.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-acido">
                Ya fichados
              </p>
              {fichados.map(({ bar, media, reviews }) => {
                const veredicto = veredictoDeNota(media);
                return (
                  <button
                    key={bar.place_id}
                    type="button"
                    onClick={() => {
                      setConsulta("");
                      setAbierto(false);
                      onElegir(bar);
                    }}
                    className="flex w-full items-center gap-3 border-t border-borde px-3 py-2.5 text-left hover:bg-asfalto-700"
                  >
                    <span
                      className="grito min-w-[46px] border-[3px] border-black px-1.5 py-1 text-center text-lg leading-none text-asfalto-900 shadow-dura-s"
                      style={{ backgroundColor: veredicto.color }}
                    >
                      {formatearNota(media)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold">
                        {bar.nombre}
                      </span>
                      <span className="block truncate font-mono text-[11.5px] text-papel-apagado">
                        {veredicto.texto} · {reviews.length}{" "}
                        {reviews.length === 1 ? "voto" : "votos"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {deGoogle.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-acido">
                Google Places
              </p>
              {deGoogle.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => void elegirDeGoogle(s)}
                  disabled={resolviendo !== null}
                  className="flex w-full items-center gap-3 border-t border-borde px-3 py-2.5 text-left hover:bg-asfalto-700 disabled:opacity-60"
                >
                  <span className="grid min-w-[46px] place-items-center border-[3px] border-black bg-papel py-2 text-asfalto-900 shadow-dura-s">
                    {resolviendo === s.placeId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold">
                      {s.principal}
                    </span>
                    <span className="block truncate font-mono text-[11.5px] text-papel-apagado">
                      {s.secundario}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {!hayResultados && (
            <p className="px-3 py-4 text-center text-sm text-papel-apagado">
              {!listo
                ? "Cargando Google Places…"
                : cargando
                  ? "Buscando…"
                  : (error ??
                    "Ni rastro. Prueba con «Casa», «Venencia» o «Dolores».")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
