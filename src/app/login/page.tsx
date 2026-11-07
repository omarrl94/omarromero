import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/actions";

export const metadata = { title: "Iniciar sesión · PawsMatch" };

export default function LoginPage() {
  return (
    <main className="shell glow" style={{ gap: 28 }}>
      <Logo />
      <h1 style={{ fontSize: 34 }}>Hola de nuevo</h1>
      <AuthForm
        action={loginAction}
        submit="Entrar"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Contraseña", type: "password", autoComplete: "current-password" },
        ]}
        footer={{ text: "¿Nuevo por aquí?", href: "/registro", link: "Crea una cuenta" }}
      />
    </main>
  );
}
