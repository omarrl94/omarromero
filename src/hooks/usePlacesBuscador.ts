"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { MADRID_CENTRO } from "@/lib/config";
import type { Bar } from "@/lib/types";

/** Una sugerencia del autocompletado, ya normalizada para pintarla. */
export interface Sugerencia {
  placeId: string;
  /** Nombre del local ("Casa Camacho"). */
  principal: string;
  /** Dirección o contexto ("C. de San Andrés, 4, Madrid"). */
  secundario: string;
}

/** Tipos de local que nos interesan: donde se bebe, se come y se va al baño. */
const TIPOS = ["bar", "restaurant", "cafe", "night_club"];

/** Sesgo de resultados: 12 km alrededor de Sol. */
const SESGO: google.maps.CircleLiteral = {
  center: MADRID_CENTRO,
  radius: 12_000,
};

const CAMPOS_LEGACY = ["place_id", "name", "formatted_address", "geometry"];

/**
 * Autocompletado de Google Places con debounce.
 *
 * Usa la Places API nueva (`AutocompleteSuggestion`) y, si la clave solo
 * tiene habilitada la API clásica, cae automáticamente a
 * `AutocompleteService` + `PlacesService`.
 */
export function usePlacesBuscador(consulta: string) {
  const places = useMapsLibrary("places");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Token de sesión: agrupa las pulsaciones + el detalle final en una
  // sola sesión facturable de Google.
  const sesion = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const servicioLegacy = useRef<google.maps.places.AutocompleteService | null>(
    null,
  );

  const nuevaSesion = useCallback(() => {
    if (!places) return null;
    sesion.current = new places.AutocompleteSessionToken();
    return sesion.current;
  }, [places]);

  useEffect(() => {
    const texto = consulta.trim();
    if (!places || texto.length < 3) {
      setSugerencias([]);
      setCargando(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    const temporizador = window.setTimeout(async () => {
      try {
        const token = sesion.current ?? nuevaSesion() ?? undefined;
        const resultados = places.AutocompleteSuggestion
          ? await buscarModerno(places, texto, token)
          : await buscarLegacy(places, servicioLegacy, texto, token);
        if (!cancelado) setSugerencias(resultados);
      } catch (e) {
        if (!cancelado) {
          setSugerencias([]);
          setError(
            e instanceof Error
              ? e.message
              : "No se ha podido consultar Google Places.",
          );
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 280);

    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
    };
  }, [consulta, places, nuevaSesion]);

  /**
   * Pide a Google la ficha completa del sitio elegido y la convierte en
   * nuestro modelo `Bar`. Cierra la sesión de facturación.
   */
  const resolverBar = useCallback(
    async (sugerencia: Sugerencia): Promise<Bar | null> => {
      if (!places) return null;
      try {
        const bar = places.Place
          ? await detalleModerno(places, sugerencia.placeId)
          : await detalleLegacy(places, sugerencia.placeId);
        return bar;
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se ha podido abrir el sitio.",
        );
        return null;
      } finally {
        sesion.current = null;
      }
    },
    [places],
  );

  return {
    sugerencias,
    cargando,
    error,
    resolverBar,
    /** true cuando la librería de Places ya está descargada. */
    listo: Boolean(places),
  };
}

// ── Places API nueva ──────────────────────────────────────────

async function buscarModerno(
  places: google.maps.PlacesLibrary,
  input: string,
  sessionToken: google.maps.places.AutocompleteSessionToken | undefined,
): Promise<Sugerencia[]> {
  const { suggestions } =
    await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken,
      includedPrimaryTypes: TIPOS,
      includedRegionCodes: ["es"],
      locationBias: SESGO,
      language: "es",
      region: "es",
    });

  return suggestions.flatMap((s) => {
    const p = s.placePrediction;
    if (!p?.placeId) return [];
    return [
      {
        placeId: p.placeId,
        principal: p.mainText?.text ?? p.text.text,
        secundario: p.secondaryText?.text ?? "",
      },
    ];
  });
}

async function detalleModerno(
  places: google.maps.PlacesLibrary,
  placeId: string,
): Promise<Bar | null> {
  const place = new places.Place({ id: placeId, requestedLanguage: "es" });
  await place.fetchFields({
    fields: ["id", "displayName", "formattedAddress", "location"],
  });
  if (!place.location) return null;
  return {
    place_id: place.id,
    nombre: place.displayName ?? "Sitio sin nombre",
    direccion: place.formattedAddress ?? "",
    lat: place.location.lat(),
    lng: place.location.lng(),
  };
}

// ── Places API clásica (claves antiguas) ──────────────────────

async function buscarLegacy(
  places: google.maps.PlacesLibrary,
  servicio: React.MutableRefObject<google.maps.places.AutocompleteService | null>,
  input: string,
  sessionToken: google.maps.places.AutocompleteSessionToken | undefined,
): Promise<Sugerencia[]> {
  servicio.current ??= new places.AutocompleteService();
  const { predictions } = await servicio.current.getPlacePredictions({
    input,
    sessionToken,
    types: ["establishment"],
    componentRestrictions: { country: "es" },
    locationBias: SESGO,
    language: "es",
    region: "es",
  });

  return predictions.map((p) => ({
    placeId: p.place_id,
    principal: p.structured_formatting.main_text,
    secundario: p.structured_formatting.secondary_text ?? "",
  }));
}

function detalleLegacy(
  places: google.maps.PlacesLibrary,
  placeId: string,
): Promise<Bar | null> {
  const servicio = new places.PlacesService(document.createElement("div"));
  return new Promise((resolve, reject) => {
    servicio.getDetails({ placeId, fields: CAMPOS_LEGACY }, (lugar, estado) => {
      if (estado !== google.maps.places.PlacesServiceStatus.OK || !lugar) {
        reject(new Error(`Google Places ha respondido: ${estado}`));
        return;
      }
      const posicion = lugar.geometry?.location;
      if (!posicion) {
        resolve(null);
        return;
      }
      resolve({
        place_id: lugar.place_id ?? placeId,
        nombre: lugar.name ?? "Sitio sin nombre",
        direccion: lugar.formatted_address ?? "",
        lat: posicion.lat(),
        lng: posicion.lng(),
      });
    });
  });
}
