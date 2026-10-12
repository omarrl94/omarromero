"use client";

import type { Bar } from "@/lib/types";
import { BotonSesion } from "./BotonSesion";
import { Buscador } from "./Buscador";
import { Logotipo } from "./Logo";

/** Barra superior pegajosa: marca, buscador y estado de la sesión. */
export function Cabecera({
  onElegirBar,
  onPedirAcceso,
}: {
  onElegirBar: (bar: Bar) => void;
  onPedirAcceso: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-borde bg-asfalto-900/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-3 px-4 py-2.5">
        <Logotipo />
        <span className="ml-auto md:order-3">
          <BotonSesion onPedirAcceso={onPedirAcceso} />
        </span>
        <div className="w-full min-w-0 md:order-2 md:ml-auto md:w-auto md:max-w-[420px] md:flex-1">
          <Buscador onElegir={onElegirBar} />
        </div>
      </div>
    </header>
  );
}
