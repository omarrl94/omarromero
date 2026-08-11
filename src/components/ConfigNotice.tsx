import { TriangleAlert } from "lucide-react";

/** Aviso mostrado cuando faltan las variables de entorno de Supabase. */
export function ConfigNotice() {
  return (
    <div
      role="alert"
      className="paper-card w-full border-mustard-400 bg-mustard-100 p-4 text-sm text-ink"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-mustard-500" aria-hidden />
        <div>
          <p className="font-display font-bold">Falta configurar el tiempo real</p>
          <p className="mt-1 leading-relaxed">
            Define <code className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ver{" "}
            <code className="font-mono font-semibold">.env.example</code>) y reinicia la app.
          </p>
        </div>
      </div>
    </div>
  );
}
