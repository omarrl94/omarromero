"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setTopicProgress } from "./actions";

export function TopicProgressControl({
  topicId,
  completed,
  score,
  withScore,
}: {
  topicId: string;
  completed: boolean;
  score: number;
  /** Grado Superior registra autoevaluación numérica; Grado Medio solo marca el tema. */
  withScore: boolean;
}) {
  const [value, setValue] = useState(completed ? score : 70);
  const [pending, startTransition] = useTransition();

  const save = (done: boolean) => startTransition(() => setTopicProgress(topicId, done, withScore ? value : 100));

  if (completed) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-defensiva-700">
          <CheckCircle2 className="h-4 w-4" /> Completado{withScore && ` · ${score}/100`}
        </span>
        <Button variant="ghost" size="sm" onClick={() => save(false)} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : "Deshacer"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {withScore && (
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          Autoevaluación
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="h-8 w-16"
          />
        </label>
      )}
      <Button size="sm" onClick={() => save(true)} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Circle />} Marcar completado
      </Button>
    </div>
  );
}
