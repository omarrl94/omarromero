"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/roles";
import { Check, KeyRound, Loader2, Pencil, Trash2, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABEL } from "@/lib/labels";
import {
  approveUser,
  createStudent,
  createUser,
  deleteUser,
  rejectUser,
  resetPassword,
  updateUser,
  type FormState,
} from "./actions";

type EditableUser = { id: string; name: string; email: string; role: Role };

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />} {children}
    </Button>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (!state || state.ok) return null;
  return <p role="alert" className="rounded-md bg-ofensiva-100 px-3 py-2 text-sm text-ofensiva-800">{state.message}</p>;
}

function useCloseOnSuccess(state: FormState, setOpen: (v: boolean) => void, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, setOpen, router]);
}

function RoleSelect({ defaultValue, roles }: { defaultValue: Role; roles: Role[] }) {
  return (
    <select
      id="role"
      name="role"
      defaultValue={defaultValue}
      className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

const ALL_ROLES: Role[] = ["ADMIN", "PROF_MEDIO", "PROF_SUPERIOR", "STUDENT_MEDIO", "STUDENT_SUPERIOR"];

/** ADMIN: alta de cuentas. */
export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createUser, null);
  const router = useRouter();
  useCloseOnSuccess(state, setOpen, router);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Nueva cuenta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
          <DialogDescription>Crea una cuenta de alumnado o profesorado (queda aprobada).</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña inicial</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <RoleSelect defaultValue="STUDENT_MEDIO" roles={ALL_ROLES} />
          </div>
          <Feedback state={state} />
          <DialogFooter>
            <Submit>Crear</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Profesor: alta directa de un alumno de su nivel. */
export function CreateStudentDialog({ level }: { level: "MEDIO" | "SUPERIOR" }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createStudent, null);
  const router = useRouter();
  useCloseOnSuccess(state, setOpen, router);
  const gradeLabel = level === "MEDIO" ? "Grado Medio" : "Grado Superior";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Alta de alumno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alta de alumno · {gradeLabel}</DialogTitle>
          <DialogDescription>La cuenta queda activa directamente, sin esperar aprobación.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="level" value={level} />
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña inicial</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <Feedback state={state} />
          <DialogFooter>
            <Submit>Dar de alta</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ADMIN: editar nombre, rol y contraseña. */
export function EditUserDialog({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateUser, null);
  const router = useRouter();
  useCloseOnSuccess(state, setOpen, router);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Editar ${user.name}`}>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <RoleSelect defaultValue={user.role} roles={ALL_ROLES} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" name="password" type="password" minLength={6} placeholder="Déjalo vacío para no cambiarla" />
          </div>
          <Feedback state={state} />
          <DialogFooter>
            <Submit>Guardar cambios</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Personal: restablecer la contraseña de un alumno. */
export function ResetPasswordDialog({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(resetPassword, null);
  const router = useRouter();
  useCloseOnSuccess(state, setOpen, router);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Restablecer contraseña de ${user.name}`}>
          <KeyRound />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <DialogDescription>{user.name} · {user.email}</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <Feedback state={state} />
          <DialogFooter>
            <Submit>Restablecer</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ADMIN: eliminar cuenta. */
export function DeleteUserButton({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res?.ok) {
        setOpen(false);
        router.refresh();
      } else setError(res?.message ?? "Error al eliminar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Eliminar ${user.name}`}>
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar a {user.name}?</DialogTitle>
          <DialogDescription>Se borrará la cuenta y todo su progreso. No se puede deshacer.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Personal: aprobar o rechazar una solicitud pendiente. */
export function PendingActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: (id: string) => Promise<FormState>) =>
    startTransition(async () => {
      await fn(id);
      router.refresh();
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run(approveUser)} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Check />} Aprobar
      </Button>
      <Button size="sm" variant="outline" onClick={() => run(rejectUser)} disabled={pending}>
        <X /> Rechazar
      </Button>
    </div>
  );
}
