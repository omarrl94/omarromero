"use client";

import { KeyRound, TriangleAlert } from "lucide-react";

/**
 * Aviso que sustituye al mapa cuando falta la clave de Google Maps (o
 * cuando Google devuelve error). La app no se rompe: se puede seguir
 * consultando y valorando los bares desde el listado.
 */
export function AvisoSinClave({ error }: { error: boolean }) {
  return (
    <div className="tarjeta space-y-3 p-4">
      <p className="flex items-center gap-2 font-display text-base font-bold">
        {error ? (
          <>
            <TriangleAlert className="h-5 w-5 text-madrid-500" />
            Google Maps no ha podido cargar
          </>
        ) : (
          <>
            <KeyRound className="h-5 w-5 text-agua-500" />
            Falta la clave de Google Maps
          </>
        )}
      </p>
      <p className="text-sm leading-relaxed text-carton-700">
        {error
          ? "Revisa que la clave tenga habilitadas «Maps JavaScript API» y «Places API» y que el dominio esté permitido."
          : "Crea un archivo .env.local en la raíz del proyecto con tu clave y reinicia el servidor:"}
      </p>
      {!error && (
        <pre className="overflow-x-auto rounded-xl bg-tinta px-3 py-2 text-[12px] leading-relaxed text-papel-100">
          <code>
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-clave{"\n"}
            NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=tu-map-id
          </code>
        </pre>
      )}
      <p className="text-xs text-carton-600">
        Mientras tanto puedes cotillear y valorar los baños de ejemplo.
      </p>
    </div>
  );
}
