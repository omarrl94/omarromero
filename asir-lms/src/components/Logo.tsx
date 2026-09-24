import { cn } from "@/lib/utils";

/** Isotipo del centro: círculo salmón con la gota blanca. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("h-10 w-10 shrink-0", className)}>
      <circle cx="50" cy="50" r="50" fill="#E6A57F" />
      <path d="M14 15 C 28 28, 30 38, 34 49 L 43 71 A 21 21 0 1 0 70 43 L 53 36 C 40 31, 28 25, 16 13 Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <div className="leading-tight">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Formación Profesional
        </p>
        <p className="text-base font-extrabold uppercase tracking-tight">
          José Ramón Otero
          <span className="ml-2 rounded bg-ofensiva px-1.5 py-0.5 align-middle text-xs font-bold text-ofensiva-foreground">
            ASIR
          </span>
        </p>
        {!compact && <p className="text-xs text-muted-foreground">Seguridad y Alta Disponibilidad</p>}
      </div>
    </div>
  );
}
