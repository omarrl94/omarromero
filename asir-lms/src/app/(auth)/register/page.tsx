import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Logo } from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions, homeForRole } from "@/lib/auth";
import { verificarTokenCampus } from "@/lib/campus";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage({ searchParams }: { searchParams: { campus?: string } }) {
  const session = await getServerSession(authOptions);
  if (session) redirect(homeForRole(session.user.role));
  const campus = searchParams.campus ? verificarTokenCampus(searchParams.campus) : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm space-y-6">
        <Logo />
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear cuenta</CardTitle>
            <CardDescription>
              {campus
                ? "Vienes del Campus Virtual: tu acceso está confirmado y la cuenta queda activada al momento."
                : "Regístrate como alumno/a. Un profesor de tu grado aprobará tu acceso."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchParams.campus && !campus && (
              <p role="alert" className="mb-4 rounded-md bg-ofensiva-100 px-3 py-2 text-sm text-ofensiva-800">
                El enlace del Campus Virtual no es válido o ha caducado. Vuelve a entrar desde el campus o regístrate y espera la aprobación.
              </p>
            )}
            <RegisterForm campus={campus ? { token: searchParams.campus!, email: campus.e, nombre: campus.n ?? "" } : null} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
