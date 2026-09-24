import Link from "next/link";
import { BookOpen, GraduationCap, TrendingUp, Users } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import { levelsForRole, ROLE_LABEL } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { CreateUserDialog, DeleteUserButton, EditUserDialog } from "./UserDialogs";

export const dynamic = "force-dynamic";

const ROLE_BADGE = { ADMIN: "ofensiva", STUDENT_MEDIO: "defensiva", STUDENT_SUPERIOR: "disponibilidad" } as const;

export default async function AdminPage() {
  const session = await requireSession(["ADMIN"]);

  const [users, topics] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: { progress: { select: { completed: true, score: true } } },
    }),
    prisma.topic.findMany({ select: { level: true } }),
  ]);

  const rows = users.map((u) => {
    const available = topics.filter((t) => levelsForRole(u.role).includes(t.level)).length;
    const done = u.progress.filter((p) => p.completed);
    const pct = available ? Math.round((done.length / available) * 100) : 0;
    const avgScore = done.length ? Math.round(done.reduce((s, p) => s + p.score, 0) / done.length) : null;
    return { ...u, available, done: done.length, pct, avgScore };
  });

  const students = rows.filter((r) => r.role !== "ADMIN");
  const medio = students.filter((r) => r.role === "STUDENT_MEDIO");
  const superior = students.filter((r) => r.role === "STUDENT_SUPERIOR");
  const avg = (list: typeof students) =>
    list.length ? Math.round(list.reduce((s, r) => s + r.pct, 0) / list.length) : 0;

  const stats = [
    { label: "Alumnos totales", value: students.length, icon: Users, className: "bg-ofensiva-100 text-ofensiva-800" },
    { label: "Grado Medio", value: medio.length, icon: GraduationCap, className: "bg-defensiva-100 text-defensiva-800" },
    { label: "Grado Superior", value: superior.length, icon: GraduationCap, className: "bg-disponibilidad-100 text-disponibilidad-800" },
    { label: "Progreso medio", value: `${avg(students)}%`, icon: TrendingUp, className: "bg-muted text-foreground" },
  ];

  const grades = [
    { label: "Grado Medio", count: medio.length, progress: avg(medio), bar: "bg-defensiva-500" },
    { label: "Grado Superior", count: superior.length, progress: avg(superior), bar: "bg-disponibilidad-500" },
  ];
  const maxCount = Math.max(1, ...grades.map((g) => g.count));

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? "Profesor"} roleLabel={ROLE_LABEL.ADMIN} />
      <main className="container space-y-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panel del profesor</h1>
            <p className="text-muted-foreground">Seguridad y Alta Disponibilidad · ASIR</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/admin/temario">
              <BookOpen /> Ver temario
            </Link>
          </Button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, className }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`grid h-11 w-11 place-items-center rounded-lg ${className}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Alumnos por grado</CardTitle>
            <CardDescription>Número de alumnos y progreso medio del temario de cada nivel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {grades.map((g) => (
              <div key={g.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
                <span className="font-medium">{g.label}</span>
                <div className="h-6 rounded-md bg-muted">
                  <div className={`h-6 rounded-md ${g.bar}`} style={{ width: `${(g.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-32 text-right tabular-nums text-muted-foreground">
                  {g.count} {g.count === 1 ? "alumno" : "alumnos"} · {g.progress}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Gestión de usuarios</CardTitle>
              <CardDescription>Alumnos, nivel y progreso (temas con el test aprobado). Edita contraseñas o roles y da de alta nuevos alumnos.</CardDescription>
            </div>
            <CreateUserDialog />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="min-w-40">Progreso</TableHead>
                  <TableHead className="text-right">Nota media tests</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === "ADMIN" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-defensiva-500" style={{ width: `${u.pct}%` }} />
                          </div>
                          <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                            {u.done}/{u.available} · {u.pct}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u.avgScore ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <EditUserDialog user={{ id: u.id, name: u.name, email: u.email, role: u.role }} />
                      {u.id !== session.user.id && (
                        <DeleteUserButton user={{ id: u.id, name: u.name, email: u.email, role: u.role }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
