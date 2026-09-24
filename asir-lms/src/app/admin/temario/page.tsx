import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LEVEL_LABEL = { BOTH: "Medio y Superior", MEDIO: "Solo Medio", SUPERIOR: "Solo Superior" } as const;

export default async function AdminSyllabusPage() {
  const session = await requireSession(["ADMIN"]);
  const topics = await prisma.topic.findMany({ orderBy: { number: "asc" } });

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? ""} roleLabel={ROLE_LABEL.ADMIN} />
      <main className="container space-y-6 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Temario</h1>
          <p className="text-muted-foreground">Revisa la teoría, laboratorios, actividades, trabajos y tests tal como los ve cada grado.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>19 temas · 6 bloques</CardTitle>
            <CardDescription>Abre un tema para previsualizarlo como Grado Medio o Grado Superior.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {topics.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">
                    Tema {t.number}. {t.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bloque {t.block} · {t.blockTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={t.level === "SUPERIOR" ? "disponibilidad" : "defensiva"}>{LEVEL_LABEL[t.level]}</Badge>
                  {t.level !== "SUPERIOR" && (
                    <Link className="rounded-md px-2 py-1 font-medium hover:bg-muted" href={`/admin/temario/${t.number}?nivel=medio`}>
                      Ver Medio
                    </Link>
                  )}
                  {t.level !== "MEDIO" && (
                    <Link className="rounded-md px-2 py-1 font-medium hover:bg-muted" href={`/admin/temario/${t.number}?nivel=superior`}>
                      Ver Superior
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
