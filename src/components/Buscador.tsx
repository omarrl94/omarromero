"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlacesBuscador, type Sugerencia } from "@/hooks/usePlacesBuscador";
import { formatearNota, tierDeNota } from "@/lib/scores";
import { useRollo } from "@/lib/store";
import type { Bar } from "@/lib/types";
import { RollitosEstaticos } from "./Rollitos";

/**
 * Buscador de bares con Google Places Autocomplete.
 *
 * Primero ofrece los bares que ya están en Rollo Madrid (respuesta
 * instantánea y sin gastar cuota) y debajo las sugerencias de Google.
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
  const conocidos =
    texto.length >= 2
      ? bares
          .filter((b) => b.bar.nombre.toLowerCase().includes(texto))
          .slice(0, 4)
      : [];

  // Las sugerencias de Google que ya tenemos fichadas no se repiten.
  const deGoogle = sugerencias.filter(
    (s) => !conocidos.some((c) => c.bar.place_id === s.placeId),
  );

  // Cerrar el desplegable al tocar fuera.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alPulsar);
    return () => document.removeEventListener("mousedown", alPulsar);
  }, [abierto]);

  const elegirSugerencia = async (sugerencia: Sugerencia) => {
    setResolviendo(sugerencia.placeId);
    const bar = await resolverBar(sugerencia);
    setResolviendo(null);
    if (!bar) return;
    setConsulta("");
    setAbierto(false);
    onElegir(bar);
  };

  const elegirConocido = (bar: Bar) => {
    setConsulta("");
    setAbierto(false);
    onElegir(bar);
  };

  const hayResultados = conocidos.length > 0 || deGoogle.length > 0;

  return (
    <div ref={contenedor} className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-carton-500"
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
          placeholder="Busca un bar de Madrid…"
          aria-label="Buscar un bar en Google Maps"
          autoComplete="off"
          className="campo h-12 w-full pl-12 pr-11 text-[15px] shadow-ficha sm:h-11"
        />
        {consulta.length > 0 && (
          <button
            type="button"
            onClick={() => setConsulta("")}
            aria-label="Borrar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-carton-500 hover:bg-papel-200 hover:text-tinta"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {cargando && (
          <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-agua-500" />
        )}
      </div>

      {abierto && consulta.trim().length >= 2 && (
        <div className="tarjeta absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[60vh] overflow-y-auto p-1.5">
          {conocidos.length > 0 && (
            <Seccion titulo="Ya en Rollo Madrid">
              {conocidos.map(({ bar, media, reviews }) => {
                const tier = tierDeNota(media);
                return (
                  <button
                    key={bar.place_id}
                    type="button"
                    onClick={() => elegirConocido(bar)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-papel-200"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                      style={{ backgroundColor: tier.color }}
                    >
                      {formatearNota(media)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {bar.nombre}
                      </span>
                      <span className="block truncate text-xs text-carton-600">
                        {reviews.length}{" "}
                        {reviews.length === 1 ? "valoración" : "valoraciones"}
                      </span>
                    </span>
                    <RollitosEstaticos valor={media ?? 0} />
                  </button>
                );
              })}
            </Seccion>
          )}

          {deGoogle.length > 0 && (
            <Seccion titulo="Sugerencias de Google">
              {deGoogle.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => void elegirSugerencia(s)}
                  disabled={resolviendo !== null}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-papel-200 disabled:opacity-60"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-agua-100 text-agua-600">
                    {resolviendo === s.placeId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {s.principal}
                    </span>
                    <span className="block truncate text-xs text-carton-600">
                      {s.secundario}
                    </span>
                  </span>
                </button>
              ))}
            </Seccion>
          )}

          {!hayResultados && (
            <p className="px-3 py-4 text-center text-sm text-carton-600">
              {!listo
                ? "Cargando Google Places…"
                : cargando
                  ? "Buscando…"
                  : error
                    ? error
                    : "Ningún bar con ese nombre. Prueba con otra cosa."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-carton-500">
        {titulo}
      </p>
      {children}
    </div>
  );
}
