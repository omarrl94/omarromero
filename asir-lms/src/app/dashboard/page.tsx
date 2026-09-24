import type { Topic } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, CheckCircle2, Layers, Sparkles, Target } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { isStaff, levelOf, levelsForRole, ROLE_LABEL } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Color de cada bloque según la mirada que trabaja
const BLOCK_THEME: Record<number, { badge: "ofensiva" | "defensiva" | "disponibilidad" | "outline"; accent: string }> = {
  1: { badge: "outline", accent: "border-l-muted-foreground/40" },
  2: { badge: "ofensiva", accent: "border-l-ofensiva" },
  3: { badge: "defensiva", accent: "border-l-defensiva-500" },
  4: { badge: "disponibilidad", accent: "border-l-disponibilidad" },
  5: { badge: "defensiva", accent: "border-l-defensiva-500" },
  6: { badge: "outline", accent: "border-l-muted-foreground/40" },
};

type TopicWithProgress = Topic & { completed: boolean; score: number };

function keyPoints(text: string | null) {
  return text ? text.split("\n").filter(Boolean) : [];
}

function groupByBlock(topics: TopicWithProgress[]) {
  const map = new Map<number, { title: string; topics: TopicWithProgress[] }>();
  for (const t of topics) {
    if (!map.has(t.block)) map.set(t.block, { title: t.blockTitle, topics: [] });
    map.get(t.block)!.topics.push(t);
  }
  return Array.from(map.entries());
}

export default async function DashboardPage() {
  // Alumnado y, para ver su vista, el profesorado del nivel.
  const session = await requireSession(["STUDENT_MEDIO", "STUDENT_SUPERIOR", "PROF_MEDIO", "PROF_SUPERIOR"]);
  const role = session.user.role;
  const isSuperior = levelOf(role) === "SUPERIOR";
  const staffPreview = isStaff(role);

  const [topics, progress] = await Promise.all([
    prisma.topic.findMany({ where: { level: { in: levelsForRole(role) } }, orderBy: { number: "asc" } }),
    prisma.progress.findMany({ where: { userId: session.user.id } }),
  ]);
  const byTopic = new Map(progress.map((p) => [p.topicId, p]));
  const items: TopicWithProgress[] = topics.map((t) => ({
    ...t,
    completed: byTopic.get(t.id)?.completed ?? false,
    score: byTopic.get(t.id)?.score ?? 0,
  }));

  const done = items.filter((t) => t.completed);
  const pct = items.length ? Math.round((done.length / items.length) * 100) : 0;
  const avgScore = done.length ? Math.round(done.reduce((s, t) => s + t.score, 0) / done.length) : 0;
  const firstName = session.user.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? ""} roleLabel={ROLE_LABEL[role]} />
      <main className="container space-y-8 py-8">
        {staffPreview && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-disponibilidad-200 bg-disponibilidad-50 px-4 py-3 text-sm text-disponibilidad-800">
            <span>
              Vista del alumnado de <strong>{isSuperior ? "Grado Superior" : "Grado Medio"}</strong> (así lo ven tus alumnos).
            </span>
            <Link href="/admin" className="font-medium underline underline-offset-4">
              Volver al panel
            </Link>
          </div>
        )}
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {staffPreview ? `Temario de ${isSuperior ? "Grado Superior" : "Grado Medio"}` : `Hola, ${firstName}`}
            </h1>
            <p className="text-muted-foreground">
              Seguridad y Alta Disponibilidad · {ROLE_LABEL[role]}
              {isSuperior ? " — itinerario avanzado" : " — itinerario básico"}
            </p>
          </div>
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Tu progreso</span>
                <span className="tabular-nums text-muted-foreground">
                  {done.length} de {items.length} temas · {pct}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-defensiva-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </CardContent>
          </Card>
          {isSuperior && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat icon={CheckCircle2} label="Temas completados" value={done.length} className="bg-defensiva-100 text-defensiva-800" />
              <Stat icon={Target} label="Nota media en tests" value={`${avgScore}/100`} className="bg-ofensiva-100 text-ofensiva-800" />
              <Stat icon={Layers} label="Temas exclusivos de Superior" value={items.filter((t) => t.level === "SUPERIOR").length} className="bg-disponibilidad-100 text-disponibilidad-800" />
            </div>
          )}
        </section>

        {isSuperior ? <SuperiorSyllabus topics={items} /> : <MedioSyllabus topics={items} />}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, className }: { icon: typeof BookOpen; label: string; value: React.ReactNode; className: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className={cn("grid h-10 w-10 place-items-center rounded-lg", className)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Estado del tema y acceso a teoría, laboratorio, actividades, trabajo y test. */
function TopicLink({ topic }: { topic: TopicWithProgress }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <span className="text-sm">
        {topic.completed ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-defensiva-700">
            <CheckCircle2 className="h-4 w-4" /> Completado · test {topic.score}/100
          </span>
        ) : topic.score > 0 ? (
          <span className="text-muted-foreground">Mejor nota del test: {topic.score}/100</span>
        ) : (
          <span className="text-muted-foreground">Pendiente</span>
        )}
      </span>
      <Link
        href={`/dashboard/tema/${topic.number}`}
        className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-ofensiva-500"
      >
        {topic.completed ? "Repasar tema" : "Abrir tema"} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** Grado Medio: interfaz simplificada, lista de temas con conceptos clave. */
function MedioSyllabus({ topics }: { topics: TopicWithProgress[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Tu temario</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((t) => (
          <Card key={t.id} className={cn("border-l-4", BLOCK_THEME[t.block].accent, t.completed && "bg-defensiva-50")}>
            <CardHeader className="pb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tema {t.number}</p>
              <CardTitle className="text-base">{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="list-disc space-y-1 pl-5">
                {keyPoints(t.contentMedio).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="flex gap-2 rounded-md bg-defensiva-100 p-3 text-defensiva-800">
                <Bot className="mt-0.5 h-4 w-4 shrink-0" /> {t.aiFocus}
              </p>
            </CardContent>
            <CardFooter>
              <TopicLink topic={t} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** Grado Superior: temario completo agrupado por bloques con enfoque IA. */
function SuperiorSyllabus({ topics }: { topics: TopicWithProgress[] }) {
  return (
    <div className="space-y-10">
      {groupByBlock(topics).map(([block, { title, topics: list }]) => {
        const theme = BLOCK_THEME[block];
        const blockDone = list.filter((t) => t.completed).length;
        return (
          <section key={block} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={theme.badge}>Bloque {block}</Badge>
              <h2 className="text-lg font-semibold">{title}</h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                Temas {list[0].number}–{list[list.length - 1].number} · {blockDone}/{list.length} completados
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {list.map((t) => (
                <Card key={t.id} className={cn("flex flex-col border-l-4", theme.accent, t.completed && "bg-defensiva-50")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tema {t.number}</span>
                      {t.level === "SUPERIOR" && (
                        <Badge variant="disponibilidad" className="gap-1">
                          <Sparkles className="h-3 w-3" /> Avanzado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{t.title}</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 text-sm">
                    <ul className="list-disc space-y-1 pl-5">
                      {keyPoints(t.contentSuperior).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <div className="rounded-md border border-disponibilidad-200 bg-disponibilidad-50 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-disponibilidad-700">
                        <Bot className="h-3.5 w-3.5" /> Enfoque IA
                      </p>
                      <p className="text-disponibilidad-800">{t.aiFocus}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <TopicLink topic={t} />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
