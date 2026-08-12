import { TriangleAlert } from "lucide-react";

/** Aviso mostrado cuando faltan las variables de entorno de Supabase. */
export function ConfigNotice() {
  return (
    <div
      role="alert"
      className="w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
        <div>
          <p className="font-display font-semibold text-amber-200">
            Falta configurar el tiempo real
          </p>
          <p className="mt-1 leading-relaxed text-amber-100/80">
            Define <code className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ver{" "}
            <code className="font-mono font-semibold">.env.example</code>) y reinicia la app.
          </p>
        </div>
      </div>
    </div>
  );
}
