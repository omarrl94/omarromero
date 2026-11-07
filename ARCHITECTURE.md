# Arquitectura — PawsMatch

## Decisión principal: PWA con Next.js (no Expo/React Native)

| Criterio | Next.js PWA | Expo / React Native |
| --- | --- | --- |
| Tiempo hasta el primer usuario | Una URL; sin revisión de App Store / Play Store | Builds y revisión de tiendas |
| Coste para las protectoras | El panel de protectora es web de escritorio de forma natural | Habría que hacer una web aparte |
| Gestos de swipe | Suficientes con Framer Motion / pointer events | Mejores (nativos) |
| Notificaciones push | Web Push (en iOS solo con la PWA instalada, iOS 16.4+) | Completas |
| Un solo código para front + API | Sí (Route Handlers / Server Actions) | No: necesita backend aparte |

Para un MVP cuya hipótesis es *"el matching reduce devoluciones"*, la velocidad de iteración y tener **un solo repositorio para adoptantes, protectoras y API** pesa más que la experiencia nativa. Si la retención móvil lo justifica, la lógica de dominio (`src/utils`, Prisma) es TypeScript puro y se puede reutilizar desde una app Expo que consuma la misma API.

## Stack

| Capa | Tecnología | Notas |
| --- | --- | --- |
| Front + backend | **Next.js 15** (App Router, React 19, TypeScript) | Server Components para leer datos; Route Handlers / Server Actions para escribir |
| PWA | `app/manifest.ts` (Web App Manifest) | Service worker y modo offline en Fase 2 |
| Runtime | **Node.js** ≥ 20 | |
| Base de datos | **PostgreSQL 16** | `docker-compose.yml` para local; Neon / Supabase / RDS en producción |
| ORM | **Prisma 7** con driver adapter `@prisma/adapter-pg` | Cliente generado en `src/generated/prisma` (no se versiona) |
| Tests | `node:test` + `tsx` | Sin dependencias extra; se puede migrar a Vitest si crece |
| UI (Fase 2) | Tailwind CSS + Framer Motion | Tarjetas con swipe |
| Auth | Propia: scrypt + cookie firmada con HMAC (`src/lib/auth.ts`) | Sin dependencias. Roles `ADOPTER` / `SHELTER` en `User`. Migrar a Auth.js si hace falta login social o revocar sesiones |
| Validación | Zod | Mismo esquema en el formulario y en la server action |
| Imágenes (Fase 2) | Almacenamiento S3-compatible (Supabase Storage / R2) | `Animal.fotos` guarda URLs |
| Despliegue | Vercel / Netlify + Postgres gestionado | |

## Estructura de carpetas

```
.
├── prisma/
│   ├── schema.prisma          # Modelos: Shelter, Adopter, Animal, Match
│   ├── migrations/            # Migraciones SQL versionadas
│   └── seed.ts                # Datos falsos para desarrollo
├── prisma.config.ts           # Config de Prisma 7 (URL de la BD, seed)
├── src/
│   ├── app/                   # Next.js App Router (páginas, API, manifest PWA)
│   ├── lib/prisma.ts          # Singleton de PrismaClient
│   ├── utils/
│   │   ├── matchingAlgorithm.ts       # Algoritmo de compatibilidad
│   │   └── matchingAlgorithm.test.ts  # Tests unitarios
│   └── generated/prisma/      # Cliente Prisma generado (gitignored)
└── docker-compose.yml         # PostgreSQL local
```

## Modelo de datos

```
Shelter 1 ──── n Animal 1 ──── n Match n ──── 1 Adopter 1 ──── 1 User
```

- **User**: la cuenta (email, hash de contraseña, rol). Se crea al registrarse; el `Adopter` se crea al terminar el test.

- **Shelter** — la protectora.
- **Adopter** — el adoptante y sus *variables de matching*: `horasFuera`, `tieneJardin`, `otrosAnimales`, `tieneNinos`, `nivelActividad`.
- **Animal** — sus *variables de matching*: `requiereJardin`, `nivelEnergia`, `sociableAnimales`, `sociableNinos`, `nivelAnsiedad` y opcionalmente `horasMaxSolo`. `sociable*` admite `null` = *no evaluado*.
- **Match** — un registro por swipe (`@@unique([adopterId, animalId])`): `accion` (LIKE/DISLIKE), `compatibilidad` (0-100) y `desglose` (JSON) **calculados en el momento del swipe**, y `estado` (PENDIENTE → ACEPTADO → ADOPTADO / DEVUELTO). Guardar la foto del % junto al resultado final es lo que permitirá medir si el algoritmo funciona.

Las columnas en BD usan `snake_case` (`horas_fuera`, `tiene_jardin`, …) mediante `@map`; en el código son `camelCase`.

## Algoritmo de compatibilidad

`src/utils/matchingAlgorithm.ts` expone:

- `computeCompatibility(adopter, animal)` — función **pura**, sin BD. La usan la UI, los tests y cualquier cálculo masivo (p. ej. ordenar el feed).
- `getCompatibility(adopterId, animalId)` — carga ambos por ID y devuelve `{ percentage, breakdown, dealbreakers, warnings }`.
- `calculateCompatibility(adopterId, animalId)` — atajo que devuelve solo el número 0-100.

Pesos (suman 100): ansiedad vs. horas solo **25** · energía vs. actividad **20** · niños **15** · otros animales **15** · experiencia **10** · preferencias del test (especie, tamaño, edad, necesidades especiales) **10** · jardín **5**. Además, si el adoptante elige una especie concreta, el feed no le enseña la otra. Un *dealbreaker* (niños o animales en casa con un animal que no los tolera) limita la nota a **25 %**. El razonamiento de cada peso está comentado en el propio archivo.

## Próximos pasos (Fase 2)

1. ~~Auth~~ y ~~test de estilo de vida~~ ✅
3. Feed de swipe: animales `DISPONIBLE` no vistos, ordenados por compatibilidad, con el desglose visible.
4. Panel de protectora: alta de animales y bandeja de *likes* ordenados por %.
5. Service worker (offline + Web Push).
