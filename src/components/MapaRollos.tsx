"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Crown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  HAY_API_KEY,
  MADRID_CENTRO,
  ZOOM_DETALLE,
  ZOOM_INICIAL,
} from "@/lib/config";
import { tierDeNota } from "@/lib/scores";
import { useRollo } from "@/lib/store";
import type { Bar } from "@/lib/types";
import { AvisoSinClave } from "./AvisoSinClave";
import { Buscador } from "./Buscador";
import { FichaBar } from "./FichaBar";
import { ListaBares } from "./ListaBares";
import { PinBar } from "./PinBar";

/**
 * Componente principal: mapa de Madrid + buscador de Google Places.
 *
 * Los bares no se crean a mano: se buscan en Google, se adoptan con su
 * `place_id` y a partir de ahí viven en nuestra base de datos con las
 * valoraciones de la comunidad.
 */
export function MapaRollos() {
  const { baresValorados, getBar, adoptarBar, listo } = useRollo();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  // Cambia cada vez que hay que mover la cámara (aunque sea al mismo bar).
  const [objetivo, setObjetivo] = useState<{
    lat: number;
    lng: number;
    sello: number;
  } | null>(null);
  const [errorApi, setErrorApi] = useState(false);

  /** Al elegir un sitio del buscador: se adopta, se centra y se abre. */
  const abrirBar = useCallback(
    (bar: Bar) => {
      adoptarBar(bar);
      setSeleccion(bar.place_id);
      setObjetivo({ lat: bar.lat, lng: bar.lng, sello: Date.now() });
    },
    [adoptarBar],
  );

  const barSeleccionado = seleccion ? getBar(seleccion) : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {HAY_API_KEY && !errorApi ? (
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          libraries={["places", "marker"]}
          language="es"
          region="ES"
          onError={() => setErrorApi(true)}
        >
          <Map
            mapId={GOOGLE_MAPS_MAP_ID}
            defaultCenter={MADRID_CENTRO}
            defaultZoom={ZOOM_INICIAL}
            gestureHandling="greedy"
            clickableIcons={false}
            disableDefaultUI
            zoomControl
            className="h-full w-full"
            onClick={() => setSeleccion(null)}
          >
            {baresValorados.map((barConNota) => (
              <PinBar
                key={barConNota.bar.place_id}
                barConNota={barConNota}
                activo={barConNota.bar.place_id === seleccion}
                onClick={() => abrirBar(barConNota.bar)}
              />
            ))}
          </Map>

          <Camara objetivo={objetivo} />

          {/* El buscador flota sobre el mapa */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 md:p-4">
            <div className="pointer-events-auto mx-auto w-full max-w-xl">
              <Buscador onElegir={abrirBar} />
            </div>
          </div>

          <Leyenda total={baresValorados.length} />
        </APIProvider>
      ) : (
        /* Sin clave (o si Google falla) la app sigue siendo usable:
           buscador local + listado de bares valorados. */
        <div className="h-full w-full overflow-y-auto">
          <div className="mx-auto w-full max-w-xl space-y-4 p-4">
            <AvisoSinClave error={errorApi} />
            <Buscador onElegir={abrirBar} />
            <ListaBares
              bares={baresValorados}
              seleccion={seleccion}
              onElegir={abrirBar}
            />
          </div>
        </div>
      )}

      {listo && barSeleccionado && (
        <FichaBar
          barConNota={barSeleccionado}
          onCerrar={() => setSeleccion(null)}
        />
      )}
    </div>
  );
}

/** Mueve la cámara cuando se elige un bar. */
function Camara({
  objetivo,
}: {
  objetivo: { lat: number; lng: number; sello: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !objetivo) return;
    map.panTo({ lat: objetivo.lat, lng: objetivo.lng });
    if ((map.getZoom() ?? 0) < ZOOM_DETALLE) map.setZoom(ZOOM_DETALLE);
  }, [map, objetivo]);

  return null;
}

/** Leyenda de colores de los pines. */
function Leyenda({ total }: { total: number }) {
  const niveles = [5, 3, 1].map((n) => tierDeNota(n));

  return (
    <div className="tarjeta pointer-events-none absolute bottom-3 left-3 z-20 hidden gap-3 px-3 py-2 sm:flex sm:flex-col">
      <ul className="space-y-1">
        {niveles.map((nivel) => (
          <li
            key={nivel.tier}
            className="flex items-center gap-2 text-[11px] font-semibold text-carton-700"
          >
            <span
              className="h-3 w-3 rounded-full border border-papel-50"
              style={{ backgroundColor: nivel.color }}
            />
            {nivel.etiqueta}
          </li>
        ))}
        <li className="flex items-center gap-2 text-[11px] font-semibold text-oro-600">
          <Crown className="h-3 w-3" /> Rollo de Oro
        </li>
      </ul>
      <p className="border-t border-papel-300 pt-1.5 text-[11px] text-carton-600">
        {total} {total === 1 ? "baño fichado" : "baños fichados"}
      </p>
    </div>
  );
}
