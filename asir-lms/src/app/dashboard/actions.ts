"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { levelsForRole } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

/** Marca un tema como completado (con autoevaluación 0-100) o lo desmarca. */
export async function setTopicProgress(topicId: string, completed: boolean, score: number) {
  const session = await requireSession(["STUDENT_MEDIO", "STUDENT_SUPERIOR"]);

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic || !levelsForRole(session.user.role).includes(topic.level)) {
    throw new Error("Tema no disponible para tu nivel.");
  }

  const safeScore = completed ? Math.max(0, Math.min(100, Math.round(score) || 0)) : 0;
  await prisma.progress.upsert({
    where: { userId_topicId: { userId: session.user.id, topicId } },
    update: { completed, score: safeScore },
    create: { userId: session.user.id, topicId, completed, score: safeScore },
  });

  revalidatePath("/dashboard");
}
