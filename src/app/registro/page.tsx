import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/actions";

export const metadata = { title: "Crear cuenta · PawsMatch" };

export default function RegistroPage() {
  return (
    <main className="shell glow" style={{ gap: 28 }}>
      <Logo />
      <div>
        <h1 style={{ fontSize: 34 }}>Crea tu cuenta</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>Después te haremos unas preguntas rápidas para encontrar tu match.</p>
      </div>
      <AuthForm
        action={registerAction}
        submit="Continuar al test"
        fields={[
          { name: "nombre", label: "Nombre", autoComplete: "given-name", placeholder: "Lucía" },
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "tu@email.com" },
          { name: "ciudad", label: "Ciudad", autoComplete: "address-level2", placeholder: "Madrid" },
          { name: "password", label: "Contraseña", type: "password", autoComplete: "new-password", placeholder: "Mínimo 8 caracteres" },
        ]}
        footer={{ text: "¿Ya tienes cuenta?", href: "/login", link: "Inicia sesión" }}
      />
    </main>
  );
}
