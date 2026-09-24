import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Server, ShieldCheck, Swords } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions, homeForRole } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

const PILLARS = [
  { icon: Swords, label: "Mirada ofensiva", className: "bg-ofensiva" },
  { icon: ShieldCheck, label: "Mirada defensiva", className: "bg-defensiva" },
  { icon: Server, label: "Alta disponibilidad", className: "bg-disponibilidad" },
];

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect(homeForRole(session.user.role));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-white p-12 lg:flex">
        <Logo />
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Seguridad y Alta Disponibilidad
            <span className="block text-muted-foreground">en la era de la Inteligencia Artificial</span>
          </h1>
          <div className="flex flex-wrap gap-3">
            {PILLARS.map(({ icon: Icon, label, className }) => (
              <span key={label} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${className}`}>
                <Icon className="h-4 w-4" /> {label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full">
          <span className="flex-1 bg-ofensiva" />
          <span className="flex-1 bg-defensiva" />
          <span className="flex-1 bg-disponibilidad" />
        </div>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
          <Logo className="lg:hidden" />
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
              <CardDescription>Accede con tu cuenta del centro.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
