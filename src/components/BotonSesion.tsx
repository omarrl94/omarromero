"use client";

import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Chip de sesión en la barra superior: alias y salida, o invitación a entrar. */
export function BotonSesion({ onPedirAcceso }: { onPedirAcceso: () => void }) {
  const { usuario, cargando, salir, modo } = useAuth();

  if (cargando) {
    return (
      <span className="h-9 w-24 animate-pulse border-2 border-borde bg-asfalto-700" />
    );
  }

  if (!usuario) {
    return (
      <button
        type="button"
        onClick={onPedirAcceso}
        className="btn btn-papel min-h-[44px] px-3 py-2 text-sm"
      >
        <UserRound className="h-4 w-4" />
        Entrar
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-2 border-2 border-borde bg-asfalto-700 px-2.5 py-1.5">
        <span className="grid h-6 w-6 place-items-center bg-acido text-[13px] font-extrabold text-[#0A0E02]">
          {usuario.alias.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[120px] truncate font-mono text-[11.5px] text-papel">
          {usuario.alias}
          {modo === "local" && (
            <span className="ml-1 text-papel-apagado">· local</span>
          )}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void salir()}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="grid h-11 w-11 place-items-center border-2 border-borde text-papel-apagado hover:border-marca hover:text-marca"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </span>
  );
}
