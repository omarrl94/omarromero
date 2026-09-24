import Link from "next/link";
import type { Topic } from "@prisma/client";
import { ArrowLeft, BookOpen, Bot, ClipboardList, FlaskConical, ListChecks, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Audience, FilteredContent } from "@/content";
import { cn } from "@/lib/utils";
import { LabChecklist } from "./LabChecklist";
import { QuizForm } from "./QuizForm";

export const SECTIONS = [
  { id: "teoria", label: "Teoría", icon: BookOpen },
  { id: "laboratorio", label: "Laboratorio", icon: FlaskConical },
  { id: "actividades", label: "Actividades", icon: ListChecks },
  { id: "trabajo", label: "Trabajo", icon: ClipboardList },
  { id: "test", label: "Test", icon: Target },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

const SECTION_EMPTY: Record<SectionId, (c: FilteredContent) => boolean> = {
  teoria: (c) => c.theory.length === 0,
  laboratorio: (c) => c.labs.length === 0,
  actividades: (c) => c.activities.length === 0,
  trabajo: (c) => c.projects.length === 0,
  test: (c) => c.quiz.length === 0,
};

export function parseSection(value: string | string[] | undefined): SectionId {
  return SECTIONS.some((s) => s.id === value) ? (value as SectionId) : "teoria";
}

function Pending() {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Contenido en preparación. El profesorado lo publicará próximamente.
      </CardContent>
    </Card>
  );
}

function OnlyBadge({ only }: { only?: Audience }) {
  if (only !== "SUPERIOR") return null;
  return (
    <Badge variant="disponibilidad" className="gap-1">
      <Sparkles className="h-3 w-3" /> Profundización Superior
    </Badge>
  );
}

export function TopicView({
  topic,
  content,
  audience,
  section,
  hrefFor,
  backHref,
  status,
  preview = false,
}: {
  topic: Topic;
  content: FilteredContent;
  audience: Audience;
  section: SectionId;
  hrefFor: (section: SectionId) => string;
  backHref: string;
  status?: { completed: boolean; score: number };
  preview?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al temario
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Bloque {topic.block} · {topic.blockTitle}</Badge>
          <Badge variant={audience === "MEDIO" ? "defensiva" : "disponibilidad"}>
            {audience === "MEDIO" ? "Grado Medio" : "Grado Superior"}
          </Badge>
          {status?.completed && <Badge variant="defensiva">Completado · {status.score}/100</Badge>}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tema {topic.number}. {topic.title}
        </h1>
        <p className="text-muted-foreground">{topic.description}</p>
        <p className="flex gap-2 rounded-md border border-disponibilidad-200 bg-disponibilidad-50 p-3 text-sm text-disponibilidad-800">
          <Bot className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Enfoque IA:</strong> {topic.aiFocus}
          </span>
        </p>
      </div>

      <nav className="-mx-4 overflow-x-auto px-4" aria-label="Secciones del tema">
        <div className="flex min-w-max gap-1 rounded-lg bg-muted p-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={hrefFor(id)}
              scroll={false}
              aria-current={section === id ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                section === id && "bg-white text-foreground shadow-sm"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>
      </nav>

      {SECTION_EMPTY[section](content) && <Pending />}

      {section === "teoria" && (
        <div className="space-y-4">
          {content.theory.map((t) => (
            <Card key={t.title}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                  <OnlyBadge only={t.only} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-[15px] leading-relaxed">
                {t.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {t.bullets && (
                  <ul className="list-disc space-y-1 pl-5">
                    {t.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {section === "laboratorio" && (
        <div className="space-y-8">
          {content.labs.map((lab, i) => (
            <section key={lab.title} className="space-y-4">
              <Card className="border-l-4 border-l-defensiva-500">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">
                      Taller {i + 1}. {lab.title}
                    </CardTitle>
                    <OnlyBadge only={lab.only} />
                  </div>
                  <CardDescription className="text-[15px]">{lab.goal}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">Qué necesitas</p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {lab.environment.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <LabChecklist storageKey={`lab-${topic.number}-${audience}-${i}`} steps={lab.steps} />
              <p className="rounded-md bg-defensiva-100 p-3 text-sm text-defensiva-800">
                <strong>Comprobación final:</strong> {lab.check}
              </p>
            </section>
          ))}
        </div>
      )}

      {section === "actividades" && (
        <ol className="space-y-3">
          {content.activities.map((a, i) => (
            <li key={a.title}>
              <Card>
                <CardContent className="space-y-2 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      Actividad {i + 1}. {a.title}
                    </p>
                    <OnlyBadge only={a.only} />
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}

      {section === "trabajo" &&
        content.projects.map((p) => (
          <Card key={p.title} className="border-l-4 border-l-ofensiva">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <OnlyBadge only={p.only} />
              </div>
              <CardDescription className="text-[15px]">{p.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 text-sm md:grid-cols-2">
              <div>
                <p className="mb-2 font-medium">Entregables</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {p.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-medium">Criterios de evaluación</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {p.evaluation.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}

      {section === "test" && content.quiz.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {content.quiz.length} preguntas · se aprueba con 50/100
            {preview ? " · vista previa del profesor (no se guarda)" : " · se guarda tu mejor nota y al aprobar el tema queda completado"}.
          </p>
          <QuizForm
            topicNumber={topic.number}
            questions={content.quiz.map(({ id, question, options }) => ({ id, question, options }))}
            previewAudience={preview ? audience : undefined}
          />
        </div>
      )}
    </div>
  );
}
