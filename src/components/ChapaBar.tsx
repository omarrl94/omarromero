"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import {
  UMBRAL_PELIGRO,
  formatearNota,
  veredictoDeNota,
} from "@/lib/scores";
import type { BarConNota } from "@/lib/types";

/**
 * Chapa pegada sobre el mapa de Google: la nota a tamaño cartel, el
 * veredicto debajo y el color del nivel. Las catastróficas laten para
 * que se vean desde el otro lado del mapa.
 */
export function ChapaBar({
  barConNota,
  activo,
  indice,
  onClick,
}: {
  barConNota: BarConNota;
  activo: boolean;
  /** Alterna la inclinación para que no parezcan impresas. */
  indice: number;
  onClick: () => void;
}) {
  const { bar, media, esRolloDeOro } = barConNota;
  const veredicto = veredictoDeNota(media);
  const peligro = media !== null && media < UMBRAL_PELIGRO;
  const giro = indice % 2 === 0 ? "-3deg" : "3deg";

  return (
    <AdvancedMarker
      position={{ lat: bar.lat, lng: bar.lng }}
      title={`${bar.nombre} · ${veredicto.texto}`}
      zIndex={activo ? 30 : esRolloDeOro ? 20 : 10}
      onClick={onClick}
    >
      <div
        className="group flex flex-col items-center transition-transform duration-150 hover:!rotate-0 hover:scale-110"
        style={{ transform: `rotate(${giro})` }}
      >
        <div
          className={`grito border-[3px] border-black px-2 py-1 text-center leading-none text-asfalto-900 ${
            activo ? "text-2xl" : "text-xl"
          } ${peligro ? "animate-late" : ""}`}
          style={{
            backgroundColor: veredicto.color,
            boxShadow: esRolloDeOro
              ? "0 0 0 3px #FFB800, 4px 4px 0 #000"
              : activo
                ? "0 0 0 3px #F2ECDF, 4px 4px 0 #000"
                : "4px 4px 0 #000",
          }}
        >
          {formatearNota(media)}
          <span className="mt-0.5 block font-mono text-[8px] tracking-wider opacity-75">
            {veredicto.texto}
          </span>
        </div>
        {/* Palito de la chapa */}
        <div className="h-3.5 w-[3px] bg-black" />
        <span
          className={`pointer-events-none absolute top-full whitespace-nowrap bg-black px-1.5 py-0.5 font-mono text-[10.5px] text-papel transition-opacity ${
            activo ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {bar.nombre}
        </span>
      </div>
    </AdvancedMarker>
  );
}
