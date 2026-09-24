"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Audience } from "@/content/types";
import { gradeQuiz, type QuizResult } from "@/lib/quiz-actions";
import { cn } from "@/lib/utils";

export type PublicQuestion = { id: number; question: string; options: string[] };

export function QuizForm({
  topicNumber,
  questions,
  previewAudience,
}: {
  topicNumber: number;
  questions: PublicQuestion[];
  /** Solo para la vista previa del profesorado. */
  previewAudience?: Audience;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answered = questions.filter((q) => answers[q.id] !== undefined).length;
  const byId = new Map(result?.results.map((r) => [r.id, r]));

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        setResult(await gradeQuiz(topicNumber, answers, previewAudience));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setError("No se ha podido corregir el test. Inténtalo de nuevo.");
      }
    });
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  return (
    <div className="space-y-4">
      {result && (
        <Card className={result.passed ? "border-defensiva-400 bg-defensiva-50" : "border-ofensiva-300 bg-ofensiva-50"}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-2xl font-bold tabular-nums">{result.score}/100</p>
              <p className="text-sm text-muted-foreground">
                {result.correct} de {result.total} aciertos ·{" "}
                {result.passed ? "¡Aprobado! Tema completado." : "Necesitas un 50 para aprobar."}
                {result.saved && ` Mejor nota guardada: ${result.best}/100.`}
                {!result.saved && " (Vista previa: no se guarda.)"}
              </p>
            </div>
            <Button variant="outline" onClick={retry}>
              <RotateCcw /> Repetir test
            </Button>
          </CardContent>
        </Card>
      )}

      <ol className="space-y-4">
        {questions.map((q, i) => {
          const r = byId.get(q.id);
          return (
            <li key={q.id}>
              <Card>
                <CardContent className="space-y-3 p-5">
                  <p className="font-medium">
                    {i + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, o) => {
                      const chosen = answers[q.id] === o;
                      const isRight = r && r.answer === o;
                      const isWrongChoice = r && chosen && !r.ok;
                      return (
                        <label
                          key={o}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                            !r && chosen && "border-ofensiva-500 bg-ofensiva-50",
                            !r && "hover:bg-muted",
                            isRight && "border-defensiva-500 bg-defensiva-50",
                            isWrongChoice && "border-destructive/60 bg-destructive/5",
                            r && "cursor-default"
                          )}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            className="mt-0.5 accent-ofensiva-600"
                            checked={chosen}
                            disabled={!!r}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                          />
                          <span className="flex-1">{opt}</span>
                          {isRight && <CheckCircle2 className="h-4 w-4 text-defensiva-700" />}
                          {isWrongChoice && <XCircle className="h-4 w-4 text-destructive" />}
                        </label>
                      );
                    })}
                  </div>
                  {r && <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{r.explanation}</p>}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={submit} disabled={pending || answered < questions.length}>
            {pending && <Loader2 className="animate-spin" />} Corregir test
          </Button>
          <span className="text-sm text-muted-foreground">
            {answered}/{questions.length} respondidas
          </span>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      )}
    </div>
  );
}
