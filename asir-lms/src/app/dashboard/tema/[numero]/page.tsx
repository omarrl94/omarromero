import { notFound } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { parseSection, TopicView } from "@/components/topic/TopicView";
import { audienceForRole, contentFor } from "@/content";
import { requireSession } from "@/lib/auth";
import { levelsForRole, ROLE_LABEL } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: { numero: string };
  searchParams: { s?: string };
}) {
  const session = await requireSession(["STUDENT_MEDIO", "STUDENT_SUPERIOR", "PROF_MEDIO", "PROF_SUPERIOR"]);
  const number = Number(params.numero);
  const topic = Number.isInteger(number) ? await prisma.topic.findUnique({ where: { number } }) : null;
  if (!topic || !levelsForRole(session.user.role).includes(topic.level)) notFound();

  const audience = audienceForRole(session.user.role);
  const content = contentFor(number, audience);

  const progress = await prisma.progress.findUnique({
    where: { userId_topicId: { userId: session.user.id, topicId: topic.id } },
  });

  return (
    <div className="min-h-screen">
      <AppHeader name={session.user.name ?? ""} roleLabel={ROLE_LABEL[session.user.role]} />
      <main className="container max-w-4xl py-8">
        <TopicView
          topic={topic}
          content={content}
          audience={audience}
          section={parseSection(searchParams.s)}
          hrefFor={(s) => `/dashboard/tema/${number}?s=${s}`}
          backHref="/dashboard"
          status={progress ? { completed: progress.completed, score: progress.score } : undefined}
        />
      </main>
    </div>
  );
}
