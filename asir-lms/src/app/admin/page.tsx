import Link from "next/link";
import type { Role } from "@prisma/client";
import { BookOpen, Clock, GraduationCap, TrendingUp, Users } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import { levelsForRole, managedStudentRoles, ROLE_LABEL, STAFF_ROLES } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  CreateStudentDialog,
  CreateUserDialog,
  DeleteUserButton,
  EditUserDialog,
  PendingActions,
  ResetPasswordDialog,
} from "./UserDialogs";

export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<Role, "ofensiva" | "defensiva" | "disponibilidad"> = {
  ADMIN: "ofensiva",
  PROF_MEDIO: "defensiva",
  PROF_SUPERIOR: "disponibilidad",
  STUDENT_MEDIO: "defensiva",
  STUDENT_SUPERIOR: "disponibilidad",
};

const ALL_ROLES: Role[] = ["ADMIN", "PROF_MEDIO", "PROF_SUPERIOR", "STUDENT_MEDIO", "STUDENT_SUPERIOR"];

export default async function AdminPage() {
  const session = await requireSession(STAFF_ROLES);
  const isAdmin = session.user.role === "ADMIN";

  // Roles visibles: el admin ve a todos; el profesorado, solo a su alumnado.
  const visibleRoles = isAdmin ? ALL_ROLES : managedStudentRoles(session.user.role);
  const studentRoles = managedStudentRoles(session.user.role);

  const [people, topics] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: visibleRoles } },
      orderBy: [{ approved: "asc" }, { role: "asc" }, { name: "asc" }],
      include: { progress: { select: { completed: true, score: true } } },
    }),
    prisma.topic.findMany({ select: { level: true } }),
  ]);

  const rows = people.map((u) => {
    const available = topics.filter((t) => levelsForRole(u.role).includes(t.level)).length;
    const done = u.progress.filter((p) => p.completed);
    const pct = available ? Math.round((done.length / available) * 100) : 0;
    const avgScore = done.length ? Math.round(done.reduce((s, p) => s + p.score, 0) / done.length) : null;
    return { ...u, available, done: done.length, pct, avgScore };
  });

  const pending = rows.filter((r) => !r.approved && studentRoles.includes(r.role));
  const active = rows.filter((r) => r.approved || !studentRoles.includes(r.role));
  const students = active.filter((r) => studentRoles.includes(r.role));
  const medio = students.filter((r) => r.role === "STUDENT_MEDIO");
  const superior = students.filter((r) => r.role === "STUDENT_SUPERIOR");
  const avg = (list: typeof students) => (list.length ? Math.round(list.reduce((s, r) => s + r.pct, 0) / list.length) : 0);

  const showMedio = studentRoles.includes("STUDENT_MEDIO");
  const showSuperior = studentRoles.includes("STUDENT_SUPERIOR");

  const stats = [
    { label: "Alumnos activos", value: students.length, icon: Users, className: "bg-ofensiva-100 text-ofensiva-800", show: true },
    { label: "Pendientes", value: pending.length, icon: Clock, className: "bg-muted text-foreground", show: true },
    { label: "Grado Medio", value: medio.length, icon: GraduationCap, className: "bg-defensiva-100 text-defensiva-800", show: showMedio },
    { label: "Grado Superior", value: superior.length, icon: GraduationCap, className: "bg-disponibilidad-100 text-disponibilidad-800", show: showSuperior },
    { label: "Progreso medio", value: `${avg(students)}%`, icon: TrendingUp, className: "bg-muted text-foreground", show: true },
  ].filter((s) => s.show);

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? ""} roleLabel={ROLE_LABEL[session.user.role]} />
      <main className="container space-y-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdmin ? "Panel de administración" : "Panel del profesor"}
            </h1>
            <p className="text-muted-foreground">Seguridad y Alta Disponibilidad · ASIR</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isAdmin && (
              <Button asChild>
                <Link href="/dashboard">
                  <GraduationCap /> Vista de alumno
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href="/admin/temario">
                <BookOpen /> Ver temario
              </Link>
            </Button>
          </div>
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

        {pending.length > 0 && (
          <Card className="border-ofensiva-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-ofensiva-700" /> Solicitudes pendientes de aprobación
              </CardTitle>
              <CardDescription>Alumnado que se ha registrado y espera tu aprobación para poder entrar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <PendingActions id={u.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{isAdmin ? "Usuarios" : "Mi alumnado"}</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Todas las cuentas. Edita rol o contraseña, restablece o da de baja, y crea nuevas cuentas."
                  : "Tu alumnado aprobado. Consulta el progreso y restablece contraseñas."}
              </CardDescription>
            </div>
            {isAdmin ? (
              <CreateUserDialog />
            ) : (
              <CreateStudentDialog level={session.user.role === "PROF_SUPERIOR" ? "SUPERIOR" : "MEDIO"} />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="min-w-40">Progreso</TableHead>
                  <TableHead className="text-right">Nota media</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((u) => {
                  const isStudent = studentRoles.includes(u.role) || u.role === "STUDENT_MEDIO" || u.role === "STUDENT_SUPERIOR";
                  const editable = { id: u.id, name: u.name, email: u.email, role: u.role };
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      </TableCell>
                      <TableCell>
                        {isStudent ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-muted">
                              <div className="h-2 rounded-full bg-defensiva-500" style={{ width: `${u.pct}%` }} />
                            </div>
                            <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                              {u.done}/{u.available} · {u.pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{isStudent ? u.avgScore ?? "—" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <ResetPasswordDialog user={editable} />
                        {isAdmin && (
                          <>
                            <EditUserDialog user={editable} />
                            {u.id !== session.user.id && <DeleteUserButton user={editable} />}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
