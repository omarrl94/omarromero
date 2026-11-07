"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string };

export function AuthForm({
  action,
  fields,
  submit,
  footer,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
  footer: { text: string; href: string; link: string };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="form" noValidate>
      {state?.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {fields.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            defaultValue={f.type === "password" ? undefined : state?.fields?.[f.name]}
            required
          />
        </div>
      ))}
      <button type="submit" className="btn btn-primary block" disabled={pending} style={{ marginTop: 8 }}>
        {pending ? "Un momento…" : submit}
      </button>
      <p className="muted" style={{ textAlign: "center", margin: 0 }}>
        {footer.text} <Link href={footer.href} style={{ color: "var(--hot)", fontWeight: 700 }}>{footer.link}</Link>
      </p>
    </form>
  );
}
