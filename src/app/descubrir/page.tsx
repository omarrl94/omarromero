import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { computeCompatibility } from "@/utils/matchingAlgorithm";

export const metadata = { title: "Descubrir · PawsMatch" };
export const dynamic = "force-dynamic";

const ENERGIA = { BAJO: "baja", MEDIO: "media", ALTO: "alta" } as const;
const color = (p: number) => (p >= 70 ? "var(--like)" : p >= 45 ? "var(--mid)" : "var(--nope)");

function edad(meses: number) {
  if (meses < 12) return `${meses} meses`;
  const y = Math.floor(meses / 12);
  return `${y} ${y === 1 ? "año" : "años"}`;
}

/**
 * Feed provisional: animales disponibles ordenados por compatibilidad con el
 * perfil del test. La versión con swipe (ver preview) sustituirá esta lista.
 */
export default async function DescubrirPage() {
  const user = await requireUser();
  const adopter = user.adopter;
  if (!adopter) redirect("/test");

  const animals = await prisma.animal.findMany({
    where: {
      estado: "DISPONIBLE",
      // La especie es un filtro duro: si buscas gato, no te enseñamos perros.
      ...(adopter.especiePreferida !== "INDIFERENTE" && { especie: adopter.especiePreferida }),
    },
    include: { shelter: { select: { nombre: true, ciudad: true } } },
  });

  const ranked = animals
    .map((animal) => ({ animal, r: computeCompatibility(adopter, animal) }))
    .sort((a, b) => b.r.percentage - a.r.percentage);

  return (
    <main className="shell" style={{ gap: 4 }}>
      <div className="topbar">
        <Logo href="/descubrir" />
        <form action={logoutAction}>
          <button type="submit" className="btn-link">Salir</button>
        </form>
      </div>
      <div className="topbar" style={{ alignItems: "baseline" }}>
        <h1 style={{ fontSize: 26 }}>Tus matches, {user.nombre}</h1>
        <Link href="/test" className="btn-link" style={{ whiteSpace: "nowrap" }}>Repetir test</Link>
      </div>

      {ranked.length === 0 && <p className="muted">Ahora mismo no hay animales disponibles que encajen con tu búsqueda.</p>}

      <div className="feed">
        {ranked.map(({ animal: a, r }) => (
          <article className="pet" key={a.id}>
            {a.fotos[0] ? (
              <div className="ph" style={{ backgroundImage: `url(${a.fotos[0]})` }} />
            ) : (
              <div className="ph placeholder" aria-hidden="true">{a.especie === "GATO" ? "🐱" : "🐶"}</div>
            )}
            <span className="pct" style={{ color: color(r.percentage) }}>{r.percentage}% match</span>
            <div className="body">
              <h2>
                {a.nombre} <span>{edad(a.edadMeses)}</span>
              </h2>
              <span style={{ fontWeight: 600 }}>
                {a.raza ?? a.especie} · {a.shelter.nombre}, {a.shelter.ciudad}
              </span>
              <div className="chips">
                {r.dealbreakers.map((d) => <span key={d} className="chip bad">{d}</span>)}
                {r.warnings.map((w) => <span key={w} className="chip warn">{w}</span>)}
                <span className="chip">Energía {ENERGIA[a.nivelEnergia]}</span>
                {a.sociableNinos && <span className="chip">Apto con niños</span>}
                {a.necesidadesEspeciales && <span className="chip">Necesidades especiales</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
