"use client";

import { useEffect, useState } from "react";

import type { LabStep } from "@/content/types";
import { cn } from "@/lib/utils";

/** Pasos del laboratorio con casillas; el avance se recuerda en este navegador. */
export function LabChecklist({ storageKey, steps }: { storageKey: string; steps: LabStep[] }) {
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setDone(JSON.parse(saved));
    } catch {
      // sin almacenamiento local: la lista funciona igualmente
    }
  }, [storageKey]);

  function toggle(i: number) {
    const next = done.includes(i) ? done.filter((d) => d !== i) : [...done, i];
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignorado
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {done.length}/{steps.length} pasos completados
      </p>
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const checked = done.includes(i);
          return (
            <li key={i} className={cn("rounded-lg border bg-white p-4", checked && "border-defensiva-300 bg-defensiva-50")}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={checked} onChange={() => toggle(i)} className="mt-1 h-4 w-4 accent-defensiva-600" />
                <span className="flex-1 space-y-2">
                  <span className="block font-medium">
                    Paso {i + 1}. {s.title}
                  </span>
                  <span className="block text-sm text-muted-foreground">{s.detail}</span>
                </span>
              </label>
              {s.code && (
                <pre className="mt-3 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                  <code>{s.code}</code>
                </pre>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
