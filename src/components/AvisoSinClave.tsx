"use client";

import { KeyRound, TriangleAlert } from "lucide-react";

/**
 * Lo que se pinta en el hueco del mapa cuando falta la clave de Google
 * (o cuando Google devuelve error). La app no se rompe: el ranking y el
 * formulario siguen funcionando.
 */
export function AvisoSinClave({ error }: { error: boolean }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <p className="grito flex items-center gap-2.5 text-2xl">
        {error ? (
          <>
            <TriangleAlert className="h-7 w-7 shrink-0 text-alarma" />
            Google Maps se ha caído del mapa
          </>
        ) : (
          <>
            <KeyRound className="h-7 w-7 shrink-0 text-acido" />
            Aquí falta la clave
          </>
        )}
      </p>

      <p className="max-w-[60ch] text-papel-apagado">
        {error
          ? "Revisa que la clave tenga habilitadas «Maps JavaScript API» y «Places API (New)», que el dominio esté en las restricciones y que el proyecto de Google Cloud tenga facturación activa."
          : "Crea un archivo .env.local en la raíz del proyecto y reinicia el servidor. Mientras tanto, el ranking de abajo funciona igual."}
      </p>

      {!error && (
        <pre className="overflow-x-auto border-2 border-borde bg-asfalto-950 p-3 font-mono text-[12px] leading-relaxed text-acido">
          <code>
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...tu-clave{"\n"}
            NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=tu-map-id
          </code>
        </pre>
      )}
    </div>
  );
}
