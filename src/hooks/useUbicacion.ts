"use client";

import { Geolocation } from "@capacitor/geolocation";
import { useCallback, useState } from "react";
import type { Punto } from "@/lib/distancia";
import { esNativo } from "@/lib/nativo";

export type EstadoUbicacion =
  | "inactiva"
  | "pidiendo"
  | "lista"
  | "denegada"
  | "no-disponible";

/**
 * Ubicación del navegador, a petición y nunca antes.
 *
 * No se pide nada al cargar la página: el permiso solo se solicita
 * cuando alguien pulsa el botón, y si lo deniega la app sigue igual de
 * usable, solo que sin ordenar por cercanía.
 */
export function useUbicacion() {
  const [estado, setEstado] = useState<EstadoUbicacion>("inactiva");
  const [posicion, setPosicion] = useState<Punto | null>(null);

  const pedir = useCallback(async () => {
    setEstado("pidiendo");

    // En iOS y Android el permiso lo pide el sistema, no el navegador.
    if (esNativo()) {
      try {
        const permiso = await Geolocation.requestPermissions();
        if (permiso.location === "denied") {
          setEstado("denegada");
          return;
        }
        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10_000,
        });
        setPosicion({ lat: coords.latitude, lng: coords.longitude });
        setEstado("lista");
      } catch {
        setEstado("no-disponible");
      }
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setEstado("no-disponible");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosicion({ lat: coords.latitude, lng: coords.longitude });
        setEstado("lista");
      },
      (error) => {
        setEstado(
          error.code === error.PERMISSION_DENIED ? "denegada" : "no-disponible",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  /** Deja de usar la ubicación (el permiso se revoca desde el navegador). */
  const olvidar = useCallback(() => {
    setPosicion(null);
    setEstado("inactiva");
  }, []);

  return { estado, posicion, pedir, olvidar };
}
