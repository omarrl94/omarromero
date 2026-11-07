/**
 * Seed de desarrollo: 1 protectora, 2 adoptantes y 3 animales con perfiles
 * deliberadamente distintos para ejercitar todos los caminos del algoritmo
 * (encaje perfecto, desajuste de energía/horas y dealbreakers).
 *
 * Uso:  npm run db:seed   (equivale a `prisma db seed` → `tsx prisma/seed.ts`)
 *
 * Es idempotente: borra los datos existentes y vuelve a crearlos con IDs fijos,
 * así los IDs se pueden usar en pruebas manuales (p. ej. "adopter_lucia").
 *
 * Cuentas de prueba (contraseña "paws1234"):
 *   lucia@example.com · familia.martin@example.com
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { getCompatibility } from "../src/utils/matchingAlgorithm";

async function main() {
  // Orden inverso a las dependencias.
  await prisma.match.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.adopter.deleteMany();
  await prisma.shelter.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("paws1234");

  // --- Protectora ------------------------------------------------------------
  const shelter = await prisma.shelter.create({
    data: {
      id: "shelter_huellas",
      nombre: "Protectora Huellas Libres",
      email: "hola@huellaslibres.example",
      telefono: "+34 600 000 000",
      ciudad: "Madrid",
      descripcion: "Protectora de perros y gatos rescatados. Datos ficticios para desarrollo.",
    },
  });

  // --- Adoptantes ------------------------------------------------------------
  // Lucía: vive sola en un piso, trabaja fuera muchas horas, vida tranquila.
  const lucia = await prisma.adopter.create({
    data: {
      id: "adopter_lucia",
      nombre: "Lucía Fernández",
      email: "lucia@example.com",
      ciudad: "Madrid",
      tipoVivienda: "PISO",
      bio: "Teletrabajo 1 día a la semana. Me gustan los planes tranquilos.",
      horasFuera: 9,
      tieneJardin: false,
      otrosAnimales: false,
      tieneNinos: false,
      nivelActividad: "BAJO",
      experiencia: "NINGUNA",
      especiePreferida: "INDIFERENTE",
      tamanosPreferidos: ["PEQUENO", "MEDIANO"],
      edadesPreferidas: [],
      aceptaNecesidadesEspeciales: false,
      user: { create: { email: "lucia@example.com", nombre: "Lucía", ciudad: "Madrid", passwordHash } },
    },
  });

  // Familia Martín: casa con jardín, dos niños, ya tienen un perro, muy activos.
  const martin = await prisma.adopter.create({
    data: {
      id: "adopter_martin",
      nombre: "Familia Martín",
      email: "familia.martin@example.com",
      ciudad: "Alcobendas",
      tipoVivienda: "CASA",
      bio: "Dos niños (6 y 9 años) y una labradora. Senderismo cada fin de semana.",
      horasFuera: 4,
      tieneJardin: true,
      otrosAnimales: true,
      tieneNinos: true,
      nivelActividad: "ALTO",
      experiencia: "MUCHA",
      especiePreferida: "PERRO",
      tamanosPreferidos: [],
      edadesPreferidas: ["CACHORRO", "JOVEN", "ADULTO"],
      aceptaNecesidadesEspeciales: true,
      user: { create: { email: "familia.martin@example.com", nombre: "Familia Martín", ciudad: "Alcobendas", passwordHash } },
    },
  });

  // --- Animales --------------------------------------------------------------
  // Toby: joven y muy enérgico. Ideal para familia activa con jardín.
  const toby = await prisma.animal.create({
    data: {
      id: "animal_toby",
      nombre: "Toby",
      especie: "PERRO",
      raza: "Border Collie",
      edadMeses: 24,
      tamano: "MEDIANO",
      sexo: "MACHO",
      descripcion: "Listísimo y incansable. Necesita ejercicio y estímulos a diario.",
      fotos: [],
      shelterId: shelter.id,
      requiereJardin: true,
      nivelEnergia: "ALTO",
      sociableAnimales: true,
      sociableNinos: true,
      nivelAnsiedad: "MEDIO",
    },
  });

  // Misha: gata senior, tranquila, independiente; no tolera otros animales.
  const misha = await prisma.animal.create({
    data: {
      id: "animal_misha",
      nombre: "Misha",
      especie: "GATO",
      raza: "Común europeo",
      edadMeses: 108,
      tamano: "PEQUENO",
      sexo: "HEMBRA",
      descripcion: "Gata senior muy cariñosa y tranquila. Quiere ser la única reina de la casa.",
      fotos: [],
      shelterId: shelter.id,
      requiereJardin: false,
      nivelEnergia: "BAJO",
      sociableAnimales: false,
      sociableNinos: null, // No evaluada todavía con niños
      nivelAnsiedad: "BAJO",
    },
  });

  // Rocky: rescatado con ansiedad por separación; no apto con niños.
  const rocky = await prisma.animal.create({
    data: {
      id: "animal_rocky",
      nombre: "Rocky",
      especie: "PERRO",
      raza: "Mestizo de podenco",
      edadMeses: 48,
      tamano: "GRANDE",
      sexo: "MACHO",
      descripcion: "Noble y sensible. Lo pasa mal solo y se pone nervioso con niños pequeños.",
      fotos: [],
      shelterId: shelter.id,
      requiereJardin: false,
      nivelEnergia: "MEDIO",
      sociableAnimales: true,
      sociableNinos: false,
      nivelAnsiedad: "ALTO",
      horasMaxSolo: 3,
      requiereExperiencia: true, // Miedos: necesita alguien que sepa manejarlos
    },
  });

  // Extra (los mismos que en la preview): perfiles fáciles y algún caso especial.
  const extras = await Promise.all(
    [
      { id: "animal_bruno", nombre: "Bruno", especie: "PERRO", raza: "Labrador", edadMeses: 72, tamano: "GRANDE", sexo: "MACHO",
        descripcion: "Un osito de peluche con patas. Se adapta a cualquier ritmo, siempre que haya una pelota.",
        requiereJardin: false, nivelEnergia: "MEDIO", sociableAnimales: true, sociableNinos: true, nivelAnsiedad: "BAJO" },
      { id: "animal_coco", nombre: "Coco", especie: "PERRO", raza: "Beagle", edadMeses: 14, tamano: "MEDIANO", sexo: "MACHO",
        descripcion: "Pura energía y nariz. Le encanta robar zapatillas y jugar con niños.",
        requiereJardin: false, nivelEnergia: "ALTO", sociableAnimales: true, sociableNinos: true, nivelAnsiedad: "MEDIO" },
      { id: "animal_luna", nombre: "Luna", especie: "GATO", raza: "Gata negra", edadMeses: 26, tamano: "PEQUENO", sexo: "HEMBRA",
        descripcion: "Curiosa, independiente y muy limpia. Convive sin problema con otros gatos.",
        requiereJardin: false, nivelEnergia: "MEDIO", sociableAnimales: true, sociableNinos: true, nivelAnsiedad: "BAJO" },
      { id: "animal_nala", nombre: "Nala", especie: "GATO", raza: "Gatita carey", edadMeses: 4, tamano: "PEQUENO", sexo: "HEMBRA",
        descripcion: "Cuatro meses de travesuras. Le falta un ojo, pero no se entera. Aún no probada con otros animales.",
        requiereJardin: false, nivelEnergia: "ALTO", sociableAnimales: null, sociableNinos: true, nivelAnsiedad: "MEDIO",
        necesidadesEspeciales: true },
    ].map((data) => prisma.animal.create({ data: { ...data, fotos: [], shelterId: shelter.id } as Parameters<typeof prisma.animal.create>[0]["data"] })),
  );

  // --- Matriz de compatibilidad ----------------------------------------------
  const adopters = [lucia, martin];
  const animals = [toby, misha, rocky, ...extras];

  console.log("\n🐾 Matriz de compatibilidad\n");
  const table: Record<string, Record<string, string>> = {};
  for (const ad of adopters) {
    table[ad.nombre] = {};
    for (const an of animals) {
      const r = await getCompatibility(ad.id, an.id, prisma);
      table[ad.nombre][an.nombre] = `${r.percentage}%${r.dealbreakers.length ? " ⛔" : ""}${r.warnings.length ? " ⚠️" : ""}`;
    }
  }
  console.table(table);
  console.log("⛔ = dealbreaker (nota limitada)   ⚠️ = dato sin evaluar\n");

  // --- Swipes de ejemplo -----------------------------------------------------
  const swipes = [
    { adopter: martin, animal: toby, accion: "LIKE" as const },
    { adopter: lucia, animal: misha, accion: "LIKE" as const },
    { adopter: lucia, animal: toby, accion: "DISLIKE" as const },
  ];
  for (const s of swipes) {
    const r = await getCompatibility(s.adopter.id, s.animal.id, prisma);
    await prisma.match.create({
      data: {
        adopterId: s.adopter.id,
        animalId: s.animal.id,
        accion: s.accion,
        compatibilidad: r.percentage,
        desglose: JSON.parse(JSON.stringify(r)),
        estado: s.accion === "LIKE" ? "PENDIENTE" : null,
      },
    });
  }

  console.log(
    `✅ Seed completado: 1 protectora, ${adopters.length} adoptantes, ${animals.length} animales, ${swipes.length} swipes.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
