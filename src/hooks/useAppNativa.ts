"use client";

import { App } from "@capacitor/app";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { SplashScreen } from "@capacitor/splash-screen";
import { Style, StatusBar } from "@capacitor/status-bar";
import { useEffect } from "react";
import { esNativo } from "@/lib/nativo";

/**
 * Lo que hay que hacer al arrancar dentro de la app de iOS o Android:
 * dejar la barra de estado en claro sobre el asfalto y quitar la
 * pantalla de carga cuando ya hay algo que enseñar.
 *
 * En el navegador no hace nada.
 */
export function useArranqueNativo(listo: boolean) {
  useEffect(() => {
    if (!esNativo()) return;
    // Texto claro: el fondo de la app es negro.
    void StatusBar.setStyle({ style: Style.Dark });
  }, []);

  useEffect(() => {
    if (!esNativo() || !listo) return;
    void SplashScreen.hide();
  }, [listo]);
}

/**
 * El botón atrás de Android cierra lo que esté abierto —ficha, acceso,
 * buscador— en vez de salirse de la app. Solo se sale cuando ya no queda
 * nada que cerrar.
 *
 * `alVolver` devuelve true si ha cerrado algo.
 */
export function useBotonAtras(alVolver: () => boolean) {
  useEffect(() => {
    if (!esNativo()) return;

    const suscripcion = App.addListener("backButton", () => {
      if (!alVolver()) void App.exitApp();
    });

    return () => {
      void suscripcion.then((s) => s.remove());
    };
  }, [alVolver]);
}

/** Golpecito al puntuar: en el móvil se agradece, en la web no existe. */
export function vibrar() {
  if (!esNativo()) return;
  void Haptics.impact({ style: ImpactStyle.Light });
}
