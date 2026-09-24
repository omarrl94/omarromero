"use client";

import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPassword, type PwState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />} Cambiar contraseña
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useFormState<PwState, FormData>(changeOwnPassword, null);
  return (
    <form action={action} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Contraseña actual</Label>
        <Input id="current" name="current" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">Nueva contraseña</Label>
        <Input id="next" name="next" type="password" minLength={6} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repeat">Repite la nueva contraseña</Label>
        <Input id="repeat" name="repeat" type="password" minLength={6} required />
      </div>
      {state && (
        <p
          role="alert"
          className={
            state.ok
              ? "flex items-center gap-2 rounded-md bg-defensiva-100 px-3 py-2 text-sm text-defensiva-800"
              : "rounded-md bg-ofensiva-100 px-3 py-2 text-sm text-ofensiva-800"
          }
        >
          {state.ok && <CheckCircle2 className="h-4 w-4" />} {state.message}
        </p>
      )}
      <Submit />
    </form>
  );
}
