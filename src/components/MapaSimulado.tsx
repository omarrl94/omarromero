"use client";

import { KeyRound, TriangleAlert } from "lucide-react";
import { MADRID_CENTRO } from "@/lib/config";
import type { Punto } from "@/lib/distancia";
import type { Bar, BarConNota } from "@/lib/types";
import { ChapaContenido } from "./ChapaBar";

/**
 * Mapa esquemático del centro, para cuando no hay clave de Google (o
 * cuando Google falla). No pretende colar: lo dice en una esquina. Sirve
 * para que la app siga siendo usable y para enseñar de qué va el mapa.
 *
 * Las chapas son las mismas que sobre Google Maps, colocadas con una
 * proyección lineal del recuadro del centro de Madrid.
 */

/** Recuadro que se dibuja: de Malasaña a Huertas, de Sol a Chueca. */
const LIMITES = {
  norte: 40.4295,
  sur: 40.4105,
  oeste: -3.7105,
  este: -3.6925,
};

function proyectar(lat: number, lng: number) {
  const x = ((lng - LIMITES.oeste) / (LIMITES.este - LIMITES.oeste)) * 100;
  const y = ((LIMITES.norte - lat) / (LIMITES.norte - LIMITES.sur)) * 100;
  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(88, Math.max(14, y)),
  };
}

export function MapaSimulado({
  bares,
  posicion,
  seleccion,
  error,
  onElegir,
}: {
  bares: readonly BarConNota[];
  /** Dónde está quien mira, si lo ha compartido y cae en el recuadro. */
  posicion: Punto | null;
  seleccion: string | null;
  /** true si Google llegó a cargar y falló; false si falta la clave. */
  error: boolean;
  onElegir: (bar: Bar) => void;
}) {
  const sol = proyectar(MADRID_CENTRO.lat, MADRID_CENTRO.lng);

  return (
    <div className="relative h-full w-full overflow-hidden bg-asfalto-950">
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="1000" height="700" fill="#08080A" />
        {/* Manzanas */}
        <g stroke="#1B1B20" strokeWidth="2" fill="#101014">
          <rect x="40" y="36" width="280" height="180" />
          <rect x="360" y="36" width="300" height="180" />
          <rect x="700" y="36" width="260" height="180" />
          <rect x="40" y="256" width="280" height="190" />
          <rect x="360" y="256" width="300" height="190" />
          <rect x="700" y="256" width="260" height="190" />
          <rect x="40" y="486" width="280" height="178" />
          <rect x="360" y="486" width="300" height="178" />
        </g>
        {/* Un parque, para que no sea todo asfalto */}
        <rect
          x="700"
          y="486"
          width="260"
          height="178"
          fill="#0D1409"
          stroke="#1B2416"
          strokeWidth="2"
        />
        {/* Calles */}
        <g stroke="#26262C" strokeWidth="9" strokeLinecap="round">
          <path d="M340 20 L340 680" />
          <path d="M680 20 L680 680" />
          <path d="M20 236 L980 236" />
          <path d="M20 466 L980 466" />
        </g>
        {/* La diagonal, con su línea de rotulador */}
        <path d="M20 320 L980 150" stroke="#2E2E36" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 320 L980 150"
          stroke="#FF2E88"
          strokeWidth="1.5"
          strokeDasharray="14 16"
          opacity="0.55"
        />
      </svg>

      {/* Kilómetro cero */}
      <span
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-papel-apagado"
        style={{ left: `${sol.x}%`, top: `${sol.y}%` }}
      >
        <span className="h-2 w-2 rotate-45 bg-papel-apagado" />
        Sol · km 0
      </span>

      {posicion &&
        posicion.lat <= LIMITES.norte &&
        posicion.lat >= LIMITES.sur &&
        posicion.lng >= LIMITES.oeste &&
        posicion.lng <= LIMITES.este && (
          <span
            className="pointer-events-none absolute grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center"
            style={{
              left: `${proyectar(posicion.lat, posicion.lng).x}%`,
              top: `${proyectar(posicion.lat, posicion.lng).y}%`,
              zIndex: 20,
            }}
          >
            <span className="absolute h-5 w-5 animate-late rounded-full bg-acido/30" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-black bg-acido" />
            <span className="absolute top-full mt-1 whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.18em] text-acido">
              Estás aquí
            </span>
          </span>
        )}

      {bares.map((barConNota, i) => {
        const { x, y } = proyectar(barConNota.bar.lat, barConNota.bar.lng);
        return (
          <button
            key={barConNota.bar.place_id}
            type="button"
            onClick={() => onElegir(barConNota.bar)}
            aria-label={`${barConNota.bar.nombre}, ver ficha`}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              zIndex: barConNota.bar.place_id === seleccion ? 30 : 10,
            }}
          >
            <ChapaContenido
              barConNota={barConNota}
              activo={barConNota.bar.place_id === seleccion}
              indice={i}
            />
          </button>
        );
      })}

      {/* Aviso: esto no es Google Maps y no se disimula */}
      <div className="absolute inset-x-3 bottom-3 border-2 border-borde bg-asfalto-900/95 px-3 py-2.5 sm:inset-x-auto sm:left-3 sm:max-w-[320px]">
        <p className="grito flex items-center gap-2 text-sm text-ambar">
          {error ? (
            <>
              <TriangleAlert className="h-4 w-4 shrink-0" />
              Google Maps no ha cargado
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4 shrink-0" />
              Mapa simulado
            </>
          )}
        </p>
        <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-papel-apagado">
          {error
            ? "Revisa la clave: APIs habilitadas, dominio permitido y facturación activa. Mientras tanto, esto es un esquema."
            : "Añade NEXT_PUBLIC_GOOGLE_MAPS_API_KEY a .env.local y aquí sale Google Maps en oscuro, con estas mismas chapas sobre las calles de verdad."}
        </p>
      </div>
    </div>
  );
}
