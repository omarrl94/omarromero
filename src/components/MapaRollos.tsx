"use client";

import { ColorScheme, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import {
  GOOGLE_MAPS_MAP_ID,
  MADRID_CENTRO,
  ZOOM_DETALLE,
  ZOOM_INICIAL,
} from "@/lib/config";
import type { Bar, BarConNota } from "@/lib/types";
import { ChapaBar } from "./ChapaBar";

/** Posición a la que viajar, con sello para poder repetir el mismo destino. */
export interface Objetivo {
  lat: number;
  lng: number;
  sello: number;
}

/**
 * El mapa de Google de verdad, en modo oscuro, con una chapa pegada
 * sobre cada bar que ya tiene votos.
 */
export function MapaRollos({
  bares,
  seleccion,
  objetivo,
  onElegir,
  onFondo,
}: {
  bares: readonly BarConNota[];
  seleccion: string | null;
  objetivo: Objetivo | null;
  onElegir: (bar: Bar) => void;
  onFondo: () => void;
}) {
  return (
    <>
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        colorScheme={ColorScheme.DARK}
        defaultCenter={MADRID_CENTRO}
        defaultZoom={ZOOM_INICIAL}
        gestureHandling="greedy"
        clickableIcons={false}
        disableDefaultUI
        zoomControl
        className="h-full w-full"
        onClick={onFondo}
      >
        {bares.map((barConNota, i) => (
          <ChapaBar
            key={barConNota.bar.place_id}
            barConNota={barConNota}
            indice={i}
            activo={barConNota.bar.place_id === seleccion}
            onClick={() => onElegir(barConNota.bar)}
          />
        ))}
      </Map>
      <Camara objetivo={objetivo} />
    </>
  );
}

/** Mueve la cámara cuando se elige un bar desde el buscador o el ranking. */
function Camara({ objetivo }: { objetivo: Objetivo | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !objetivo) return;
    map.panTo({ lat: objetivo.lat, lng: objetivo.lng });
    if ((map.getZoom() ?? 0) < ZOOM_DETALLE) map.setZoom(ZOOM_DETALLE);
  }, [map, objetivo]);

  return null;
}
