"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { formatearNota, tierDeNota } from "@/lib/scores";
import type { BarConNota } from "@/lib/types";

/**
 * Pin del mapa. El color sale de la nota media del baño:
 * verde = excelente, amarillo = pasable, rojo = zona catastrófica.
 * Los que rozan la perfección llevan aro dorado (Rollo de Oro).
 */
export function PinBar({
  barConNota,
  activo,
  onClick,
}: {
  barConNota: BarConNota;
  activo: boolean;
  onClick: () => void;
}) {
  const { bar, media, esRolloDeOro } = barConNota;
  const tier = tierDeNota(media);

  return (
    <AdvancedMarker
      position={{ lat: bar.lat, lng: bar.lng }}
      title={`${bar.nombre} · ${tier.etiqueta}`}
      zIndex={activo ? 20 : esRolloDeOro ? 10 : 1}
      onClick={onClick}
    >
      <div className="group relative flex flex-col items-center">
        <div
          className={`grid place-items-center rounded-full border-[3px] border-papel-50 font-display font-bold text-white shadow-pin transition-transform duration-150 group-hover:scale-110 ${
            activo ? "h-12 w-12 scale-110 text-base" : "h-10 w-10 text-sm"
          } ${esRolloDeOro ? "ring-[3px] ring-oro-300" : ""}`}
          style={{ backgroundColor: tier.color }}
        >
          {formatearNota(media)}
        </div>
        {/* Puntita del pin */}
        <div
          className="-mt-[3px] h-0 w-0 border-x-[6px] border-t-[9px] border-x-transparent"
          style={{ borderTopColor: tier.color }}
        />
        {esRolloDeOro && (
          <span className="absolute -top-2 -right-1 rounded-full bg-oro-400 px-1 text-[10px] leading-4 shadow-sm">
            👑
          </span>
        )}
        {/* Nombre del bar: solo en el activo y al pasar el ratón */}
        <span
          className={`pointer-events-none absolute top-full mt-1 max-w-[160px] truncate rounded-lg bg-papel-50/95 px-2 py-0.5 text-[11px] font-semibold text-tinta shadow-sm transition-opacity ${
            activo ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {bar.nombre}
        </span>
      </div>
    </AdvancedMarker>
  );
}
