"use client";

import { useActionState, useState } from "react";
import { saveTestAction } from "@/app/actions";
import { QUESTIONS, type TestAnswers } from "@/lib/lifestyleTest";

type Answers = Partial<Record<keyof TestAnswers, string | string[] | number>>;

function hoursHint(h: number) {
  if (h <= 3) return "Perfecto, incluso para animales con ansiedad por separación.";
  if (h <= 6) return "Ideal para la mayoría de animales.";
  if (h <= 8) return "Te enseñaremos sobre todo animales tranquilos e independientes.";
  return "Son muchas horas: priorizaremos animales que llevan bien estar solos. Un paseador o guardería ayuda mucho.";
}

export function LifestyleTest({ initial, nombre }: { initial?: Answers; nombre: string }) {
  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<Answers>({ horasFuera: 6, tamanosPreferidos: [], edadesPreferidas: [], ...initial });
  const [state, formAction, pending] = useActionState(saveTestAction, undefined);

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const done = step === total;

  const set = (id: keyof TestAnswers, value: Answers[keyof TestAnswers], advance = false) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (advance) setTimeout(() => setStep((s) => s + 1), 220);
  };

  if (step === -1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, justifyContent: "center" }}>
        <div style={{ fontSize: 64 }} aria-hidden="true">🐾</div>
        <h1 style={{ fontSize: 36, lineHeight: 1.05 }}>Hola, {nombre}. Hablemos de tu vida.</h1>
        <p className="muted" style={{ fontSize: 17, lineHeight: 1.5, margin: 0 }}>
          {total} preguntas, unos 2 minutos. Con tus respuestas calculamos tu compatibilidad con cada animal, para que la adopción salga bien a la primera.
        </p>
        <button type="button" className="btn btn-primary block" onClick={() => setStep(0)}>
          Empezar el test
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" className="btn-link" onClick={() => setStep((s) => s - 1)} aria-label="Pregunta anterior">
          ←
        </button>
        <div className="progress" style={{ flex: 1 }} aria-label={`Pregunta ${Math.min(step + 1, total)} de ${total}`}>
          <i style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
        <span className="muted" style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {Math.min(step + 1, total)}/{total}
        </span>
      </div>

      {done ? (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 64 }} aria-hidden="true">🎉</div>
          <h1 style={{ fontSize: 34 }}>¡Listo! Ya conocemos tu ritmo.</h1>
          <p className="muted" style={{ fontSize: 16, margin: 0 }}>
            Ahora te enseñaremos primero a los animales con los que más encajas. Puedes repetir el test cuando quieras.
          </p>
          {state?.error && <p className="error">{state.error}</p>}
          <input type="hidden" name="answers" value={JSON.stringify(answers)} />
          <button type="submit" className="btn btn-primary block" disabled={pending}>
            {pending ? "Calculando tus matches…" : "Ver mis matches"}
          </button>
        </form>
      ) : (
        <section key={q.id} style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          <div>
            <h2 style={{ fontSize: 28, lineHeight: 1.1 }}>{q.title}</h2>
            {q.subtitle && <p className="muted" style={{ margin: "8px 0 0" }}>{q.subtitle}</p>}
          </div>

          {q.kind === "hours" && (
            <div className="hours">
              <output htmlFor="horas">{answers.horasFuera} h</output>
              <input
                id="horas"
                type="range"
                min={0}
                max={12}
                step={1}
                value={Number(answers.horasFuera)}
                onChange={(e) => set("horasFuera", Number(e.target.value))}
                aria-label="Horas solo en casa"
              />
              <p className="muted">{hoursHint(Number(answers.horasFuera))}</p>
            </div>
          )}

          {q.kind !== "hours" && (
            <div className="options" role="group" aria-label={q.title}>
              {q.options.map((o) => {
                const current = answers[q.id];
                const selected = q.kind === "multi" ? (current as string[]).includes(o.value) : current === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    className="option"
                    aria-pressed={selected}
                    onClick={() => {
                      if (q.kind === "multi") {
                        const list = current as string[];
                        set(q.id, selected ? list.filter((v) => v !== o.value) : [...list, o.value]);
                      } else {
                        set(q.id, o.value, true);
                      }
                    }}
                  >
                    <span className="ico" aria-hidden="true">{o.icon}</span>
                    <span>
                      <b>{o.label}</b>
                      {o.hint && <small>{o.hint}</small>}
                    </span>
                    <span className="check" aria-hidden="true">{selected ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          )}

          {(q.kind !== "single" || answers[q.id] !== undefined) && (
            <button type="button" className="btn btn-primary block" style={{ marginTop: "auto" }} onClick={() => setStep((s) => s + 1)}>
              {q.kind === "multi" && (answers[q.id] as string[]).length === 0 ? "Me da igual" : "Siguiente"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
