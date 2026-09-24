import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { parseSection, TopicView } from "@/components/topic/TopicView";
import { contentFor, type Audience } from "@/content";
import { requireSession } from "@/lib/auth";
import { levelOf, ROLE_LABEL, STAFF_ROLES } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTopicPreview({
  params,
  searchParams,
}: {
  params: { numero: string };
  searchParams: { s?: string; nivel?: string };
}) {
  const session = await requireSession(STAFF_ROLES);
  const number = Number(params.numero);
  const topic = Number.isInteger(number) ? await prisma.topic.findUnique({ where: { number } }) : null;
  if (!topic) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const profLevel = levelOf(session.user.role); // MEDIO/SUPERIOR para profesores, null admin

  // El profesorado solo previsualiza su nivel; el admin puede alternar.
  const requested: Audience = searchParams.nivel === "medio" ? "MEDIO" : "SUPERIOR";
  const forced: Audience = topic.level === "BOTH" ? (profLevel ?? requested) : topic.level;
  const audience: Audience = isAdmin ? (topic.level === "BOTH" ? requested : topic.level) : forced;
  if (!isAdmin && profLevel && topic.level !== "BOTH" && topic.level !== profLevel) notFound();
  const content = contentFor(number, audience);

  const section = parseSection(searchParams.s);
  const href = (nivel: Audience, s = section) => `/admin/temario/${number}?nivel=${nivel.toLowerCase()}&s=${s}`;

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? ""} roleLabel={ROLE_LABEL[session.user.role]} />
      <main className="container max-w-4xl space-y-6 py-8">
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3 text-sm">
            <span className="font-medium">Vista previa como:</span>
            {(["MEDIO", "SUPERIOR"] as const).map((a) => {
              const available = topic.level === "BOTH" || topic.level === a;
              return available ? (
                <Link
                  key={a}
                  href={href(a)}
                  className={cn("rounded-md px-3 py-1", audience === a ? "bg-ofensiva font-semibold text-ofensiva-foreground" : "hover:bg-muted")}
                >
                  {a === "MEDIO" ? "Grado Medio" : "Grado Superior"}
                </Link>
              ) : null;
            })}
          </div>
        )}
        <TopicView
          topic={topic}
          content={content}
          audience={audience}
          section={section}
          hrefFor={(s) => href(audience, s)}
          backHref="/admin/temario"
          preview
        />
      </main>
    </div>
  );
}
