"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2, GraduationCap, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStudent, type RegisterState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />} Crear cuenta
    </Button>
  );
}

export function RegisterForm() {
  const [state, action] = useFormState<RegisterState, FormData>(registerStudent, null);

  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-defensiva-600" />
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Volver a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="nombre@jrotero.es" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" minLength={6} required />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">¿Qué grado cursas?</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm has-[:checked]:border-defensiva-500 has-[:checked]:bg-defensiva-50">
            <input type="radio" name="level" value="MEDIO" defaultChecked className="accent-defensiva-600" />
            <GraduationCap className="h-4 w-4" /> Grado Medio
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm has-[:checked]:border-disponibilidad-500 has-[:checked]:bg-disponibilidad-50">
            <input type="radio" name="level" value="SUPERIOR" className="accent-disponibilidad-600" />
            <ShieldCheck className="h-4 w-4" /> Grado Superior
          </label>
        </div>
      </fieldset>
      {state && !state.ok && (
        <p role="alert" className="rounded-md bg-ofensiva-100 px-3 py-2 text-sm text-ofensiva-800">
          {state.message}
        </p>
      )}
      <Submit />
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
