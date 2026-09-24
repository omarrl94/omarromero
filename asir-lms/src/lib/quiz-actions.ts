"use server";

import { revalidatePath } from "next/cache";

import { audienceForRole, contentFor, type Audience } from "@/content";
import { requireSession } from "@/lib/auth";
import { levelsForRole } from "@/lib/labels";
import { prisma } from "@/lib/prisma";


export type QuizResult = {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  saved: boolean;
  best: number;
  results: { id: number; ok: boolean; answer: number; explanation: string }[];
};

/**
 * Corrige el test de un tema en el servidor. Para el alumnado guarda la mejor nota
 * y marca el tema como completado al aprobar; el profesorado lo corrige sin guardar.
 */
export async function gradeQuiz(
  topicNumber: number,
  answers: Record<number, number>,
  previewAudience?: Audience
): Promise<QuizResult> {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const audience = isAdmin ? previewAudience ?? "SUPERIOR" : audienceForRole(session.user.role);

  const topic = await prisma.topic.findUnique({ where: { number: topicNumber } });
  if (!topic || (!isAdmin && !levelsForRole(session.user.role).includes(topic.level))) {
    throw new Error("Tema no disponible para tu nivel.");
  }
  const content = contentFor(topicNumber, audience);
  if (!content || content.quiz.length === 0) throw new Error("Este tema no tiene test.");

  const results = content.quiz.map((q) => ({
    id: q.id,
    ok: answers[q.id] === q.answer,
    answer: q.answer,
    explanation: q.explanation,
  }));
  const correct = results.filter((r) => r.ok).length;
  const score = Math.round((correct / results.length) * 100);
  const passed = score >= 50; // nota mínima para aprobar

  if (isAdmin) return { score, correct, total: results.length, passed, saved: false, best: score, results };

  const where = { userId_topicId: { userId: session.user.id, topicId: topic.id } };
  const previous = await prisma.progress.findUnique({ where });
  const best = Math.max(previous?.score ?? 0, score);
  const completed = (previous?.completed ?? false) || passed;
  await prisma.progress.upsert({
    where,
    update: { score: best, completed },
    create: { userId: session.user.id, topicId: topic.id, score: best, completed },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tema/${topicNumber}`);
  return { score, correct, total: results.length, passed, saved: true, best, results };
}
