import { Logotipo } from "./Logo";

/** Barra superior: logo, nombre y el lema de la casa. */
export function Cabecera() {
  return (
    <header className="z-40 flex shrink-0 items-center justify-between gap-3 border-b border-papel-300 bg-papel-50/90 px-4 py-2.5 backdrop-blur">
      <Logotipo />
      <p className="hidden max-w-[42ch] text-right text-xs leading-snug text-carton-600 sm:block">
        Valora el baño antes de que sea tarde.
        <span className="block font-semibold text-madrid-600">
          La comunidad que le pone nota a Madrid.
        </span>
      </p>
      <span className="rounded-full bg-madrid-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-madrid-600 sm:hidden">
        MVP
      </span>
    </header>
  );
}
