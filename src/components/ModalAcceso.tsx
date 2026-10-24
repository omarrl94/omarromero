"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type Pestaña = "entrar" | "registro";

/**
 * Registro e inicio de sesión. Con Firebase configurado son cuentas de
 * verdad; sin él basta un alias y se avisa de que es modo local.
 */
export function ModalAcceso({
  motivo,
  onCerrar,
  onEntrado,
}: {
  /** Qué estaba intentando hacer quien abrió esto. */
  motivo?: string;
  onCerrar: () => void;
  onEntrado: (mensaje: string) => void;
}) {
  const { modo, registrar, entrar, entrarLocal } = useAuth();
  const [pestaña, setPestaña] = useState<Pestaña>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setError(null);
    setAviso(null);
    setEnviando(true);

    const resultado =
      modo === "local"
        ? entrarLocal(alias)
        : pestaña === "registro"
          ? await registrar(email, password, alias)
          : await entrar(email, password);

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.mensaje ?? "No ha podido ser.");
      return;
    }
    // Si hay que confirmar el correo no hay sesión todavía: se queda el
    // aviso a la vista en lugar de cerrar.
    if (resultado.mensaje?.includes("Confirma el correo")) {
      setAviso(resultado.mensaje);
      return;
    }
    onEntrado(resultado.mensaje ?? "Dentro.");
  };

  const esRegistro = pestaña === "registro";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar acceso"
        onClick={onCerrar}
        className="fixed inset-0 z-[60] bg-asfalto-950/85"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Entrar en Rollo Madrid"
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[92%] animate-sube overflow-y-auto border-t-4 border-black bg-asfalto-800 pb-[env(safe-area-inset-bottom,0px)] md:pb-0 md:inset-auto md:left-1/2 md:top-1/2 md:w-[min(460px,calc(100%-32px))] md:-translate-x-1/2 md:-translate-y-1/2 md:animate-entra md:border-4 md:shadow-dura-l"
      >
        <header className="relative border-b-[3px] border-black p-5">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center border-2 border-black bg-papel text-asfalto-900 shadow-dura-s hover:bg-marca hover:text-white"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
          <h2 className="grito pr-10 text-3xl leading-none">
            {modo === "local"
              ? "Ponte un alias"
              : esRegistro
                ? "Hazte de la banda"
                : "Vuelves a entrar"}
          </h2>
          <p className="mt-2 text-sm text-papel-apagado">
            {motivo ??
              "Para colaborar hace falta una cuenta: así cada parte lleva firma y se puede pedir cuentas."}
          </p>
        </header>

        <form onSubmit={enviar} className="p-5">
          {modo === "firebase" && (
            <div className="mb-5 grid grid-cols-2 gap-2">
              {(["entrar", "registro"] as const).map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => {
                    setPestaña(valor);
                    setError(null);
                    setAviso(null);
                  }}
                  aria-pressed={pestaña === valor}
                  className={`grito border-2 border-black px-3 py-2.5 text-base ${
                    pestaña === valor
                      ? "bg-acido text-[#0A0E02] shadow-dura-s"
                      : "bg-asfalto-700 text-papel-apagado hover:text-papel"
                  }`}
                >
                  {valor === "entrar" ? "Entrar" : "Registrarme"}
                </button>
              ))}
            </div>
          )}

          {(modo === "local" || esRegistro) && (
            <>
              <label
                htmlFor="alias"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-papel-apagado"
              >
                Tu alias
              </label>
              <input
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                maxLength={24}
                required
                placeholder="El que firmará tus partes"
                className="campo mb-4"
              />
            </>
          )}

          {modo === "firebase" && (
            <>
              <label
                htmlFor="email"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-papel-apagado"
              >
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="campo mb-4"
              />

              <label
                htmlFor="password"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-papel-apagado"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete={esRegistro ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="campo"
              />
            </>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 border-2 border-alarma bg-alarma/10 px-3 py-2 text-sm text-alarma"
            >
              {error}
            </p>
          )}
          {aviso && (
            <p
              role="status"
              className="mt-4 border-2 border-acido bg-acido/10 px-3 py-2 text-sm text-acido"
            >
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="btn btn-acido mt-5 w-full"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {modo === "local"
              ? "Entrar"
              : esRegistro
                ? "Crear cuenta"
                : "Entrar"}
          </button>

          <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-papel-apagado">
            {modo === "local"
              ? "Modo local: no hay servidor de cuentas configurado, así que tu alias se queda guardado solo en este navegador. Sirve para probar el flujo, no para producción."
              : "Usamos tu correo solo para identificarte y para que puedas recuperar la cuenta. El alias es lo único que se ve en los partes."}
          </p>
        </form>
      </section>
    </>
  );
}
