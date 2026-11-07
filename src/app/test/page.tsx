import { Logo } from "@/components/Logo";
import { LifestyleTest } from "@/components/LifestyleTest";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Tu test · PawsMatch" };
export const dynamic = "force-dynamic";

export default async function TestPage() {
  const user = await requireUser();
  const a = user.adopter;
  // Si ya hizo el test, lo precargamos para que pueda corregir respuestas.
  const initial = a
    ? {
        especiePreferida: a.especiePreferida,
        tipoVivienda: a.tipoVivienda ?? undefined,
        tieneJardin: String(a.tieneJardin),
        horasFuera: a.horasFuera,
        nivelActividad: a.nivelActividad,
        tieneNinos: String(a.tieneNinos),
        otrosAnimales: String(a.otrosAnimales),
        experiencia: a.experiencia,
        tamanosPreferidos: a.tamanosPreferidos,
        edadesPreferidas: a.edadesPreferidas,
        aceptaNecesidadesEspeciales: String(a.aceptaNecesidadesEspeciales),
      }
    : undefined;

  return (
    <main className="shell glow" style={{ gap: 20 }}>
      <Logo href="/descubrir" />
      <LifestyleTest nombre={user.nombre} initial={initial} />
    </main>
  );
}
