import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { homeForRole, requireSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireSession();
  const back = homeForRole(session.user.role);

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? ""} roleLabel={ROLE_LABEL[session.user.role]} />
      <main className="container max-w-2xl space-y-6 py-8">
        <Link href={back} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="text-muted-foreground">{session.user.email}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>Actualiza tu contraseña de acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
