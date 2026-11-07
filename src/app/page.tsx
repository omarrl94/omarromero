import { prisma } from "@/lib/prisma";
import { computeCompatibility } from "@/utils/matchingAlgorithm";

// Página provisional (Fase 1): muestra la matriz de compatibilidad del seed.
// Las pantallas reales (swipe, perfil, panel de protectora) llegan en la Fase 2.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [adopters, animals] = await Promise.all([
    prisma.adopter.findMany({ orderBy: { nombre: "asc" } }),
    prisma.animal.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1>🐾 PawsMatch</h1>
      <p>MVP · Fase 1: modelo de datos y algoritmo de compatibilidad.</p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Adoptante</th>
            {animals.map((a) => (
              <th key={a.id}>{a.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {adopters.map((ad) => (
            <tr key={ad.id}>
              <td>{ad.nombre}</td>
              {animals.map((an) => {
                const r = computeCompatibility(ad, an);
                return (
                  <td key={an.id} style={{ textAlign: "center" }} title={r.breakdown.map((c) => c.reason).join("\n")}>
                    {r.percentage}%{r.dealbreakers.length > 0 && " ⛔"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
