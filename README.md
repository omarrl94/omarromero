# 🐾 PawsMatch (nombre provisional)

**Adopción responsable con matching.** PawsMatch conecta **protectoras de animales** con **posibles adoptantes** mediante una experiencia tipo *swipe*: el adoptante ve tarjetas de animales y desliza para dar *like* o *dislike*. La diferencia con un catálogo normal es que **cada tarjeta lleva un % de compatibilidad** calculado comparando el estilo de vida del adoptante con las necesidades reales del animal.

## El problema

Una parte importante de las adopciones fracasan y terminan en **devolución**: el perro con ansiedad por separación que pasa 9 horas solo, el border collie en un piso con un dueño sedentario, el gato que no tolera a otros animales. Para el animal es un segundo abandono; para la protectora, tiempo y recursos perdidos.

## La solución

1. **El adoptante** responde un cuestionario breve de estilo de vida: horas fuera de casa, jardín, niños, otros animales y nivel de actividad.
2. **La protectora** describe a cada animal: energía, ansiedad, si requiere jardín y si es sociable con niños y con otros animales.
3. **El algoritmo** (`src/utils/matchingAlgorithm.ts`) calcula un **0-100 %** ponderado y detecta **incompatibilidades graves** (p. ej. niños en casa + animal no apto con niños), que limitan la nota.
4. El adoptante hace *swipe*; cada gesto se guarda en `Match` con el % de ese momento. La protectora recibe los *likes* ordenados por compatibilidad.
5. A futuro, cruzaremos el % con el resultado final (`ADOPTADO` / `DEVUELTO`) para recalibrar los pesos con datos reales.

## Estado actual — Fase 1 ✅

- [x] Documentación: este README y [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [x] Esquema de base de datos: [`prisma/schema.prisma`](./prisma/schema.prisma) (Shelter, Adopter, Animal, Match) + migración inicial
- [x] Algoritmo de compatibilidad comentado: [`src/utils/matchingAlgorithm.ts`](./src/utils/matchingAlgorithm.ts) + tests
- [x] Seed con datos falsos: [`prisma/seed.ts`](./prisma/seed.ts) (1 protectora, 2 adoptantes, 3 animales)
- [ ] Fase 2: pantallas (onboarding/cuestionario, swipe, detalle, panel de protectora), autenticación

## Puesta en marcha

Requisitos: Node.js ≥ 20 y PostgreSQL 16 (o Docker).

```bash
npm install                 # instala dependencias y genera el cliente Prisma
cp .env.example .env        # ajusta DATABASE_URL si no usas Docker
npm run db:up               # (opcional) levanta PostgreSQL con docker compose
npm run db:migrate          # crea las tablas
npm run db:seed             # datos de prueba + imprime la matriz de compatibilidad
npm test                    # tests unitarios del algoritmo
npm run dev                 # http://localhost:3000 → matriz de compatibilidad (provisional)
```

Salida del seed:

```
┌─────────────────┬────────┬────────────┬──────────┐
│ (index)         │ Toby   │ Misha      │ Rocky    │
├─────────────────┼────────┼────────────┼──────────┤
│ Lucía Fernández │ '43%'  │ '93%'      │ '55%'    │
│ Familia Martín  │ '100%' │ '25% ⛔ ⚠️' │ '25% ⛔' │
└─────────────────┴────────┴────────────┴──────────┘
⛔ = dealbreaker (nota limitada)   ⚠️ = dato sin evaluar
```

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Genera el cliente Prisma y compila Next.js |
| `npm test` | Tests del algoritmo (`node:test` + `tsx`) |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:up` | PostgreSQL en Docker |
| `npm run db:migrate` | Aplica/crea migraciones (`prisma migrate dev`) |
| `npm run db:seed` | Carga datos de prueba |
| `npm run db:studio` | Prisma Studio para inspeccionar la BD |
