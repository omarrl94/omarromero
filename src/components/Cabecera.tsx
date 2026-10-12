"use client";

import type { Bar } from "@/lib/types";
import { Buscador } from "./Buscador";
import { Logotipo } from "./Logo";

/** Barra superior pegajosa: marca a la izquierda, buscador a la derecha. */
export function Cabecera({ onElegirBar }: { onElegirBar: (bar: Bar) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-borde bg-asfalto-900/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-3 px-4 py-2.5">
        <Logotipo />
        <div className="w-full min-w-0 md:ml-auto md:w-auto md:max-w-[460px] md:flex-1">
          <Buscador onElegir={onElegirBar} />
        </div>
      </div>
    </header>
  );
}
