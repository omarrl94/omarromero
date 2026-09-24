# ASIR LMS · Seguridad y Alta Disponibilidad

Plataforma de aprendizaje (LMS) del módulo **Seguridad y Alta Disponibilidad (ASIR)** de
**FP José Ramón Otero**, con contenido adaptado a **Grado Medio** y **Grado Superior** y el
enfoque de la **Inteligencia Artificial** en la ciberseguridad.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + componentes shadcn/ui (`button`, `input`, `card`, `table`, `dialog`, `label`, `badge`)
- Prisma ORM + SQLite
- NextAuth.js (credenciales, sesión JWT)

## Puesta en marcha

```bash
cd asir-lms
npm install
cp .env.example .env          # y cambia NEXTAUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev        # crea prisma/dev.db y ejecuta el seed
npm run dev                   # http://localhost:3000
```

`npm run db:seed` vuelve a cargar el temario y los usuarios; `npm run db:reset` borra y recrea la base de datos.

### Usuarios de prueba

| Rol            | Email                 | Contraseña  |
| -------------- | --------------------- | ----------- |
| Profesor/a     | profesor@jrotero.es   | admin123    |
| Grado Medio    | medio@jrotero.es      | alumno123   |
| Grado Superior | superior@jrotero.es   | alumno123   |

## Rutas

| Ruta         | Acceso      | Contenido |
| ------------ | ----------- | --------- |
| `/login`     | Pública     | Inicio de sesión con el branding del centro |
| `/admin`     | `ADMIN`     | Estadísticas por grado y gestión de usuarios (alta, edición de rol/contraseña, baja) |
| `/dashboard` | `STUDENT_*` | Temario filtrado por nivel y registro de progreso |

`src/middleware.ts` protege las rutas; además, cada página y cada server action vuelve a comprobar el rol en el servidor.

## Temario y niveles

`prisma/seed.ts` carga los 19 temas oficiales (0-18) en 6 bloques, cada uno con su enfoque IA.
Cada tema tiene un `level`:

- `BOTH`: visible para ambos grados, con puntos clave distintos (`contentMedio` / `contentSuperior`).
- `SUPERIOR`: solo Grado Superior (temas 3-7 de hacking ético y 16 de análisis forense).
- `MEDIO`: solo Grado Medio (disponible para ampliar el temario).

Grado Medio ve una interfaz simplificada (lista de temas y conceptos clave); Grado Superior ve
el temario completo agrupado por bloques, con estadísticas y autoevaluación numérica.

## Paleta corporativa

| Token Tailwind   | Color     | Uso |
| ---------------- | --------- | --- |
| `ofensiva`       | `#EFCD2F` | Mirada ofensiva: botones principales y alertas (`primary`) |
| `defensiva`      | `#A9CABB` | Mirada defensiva: tarjetas, badges de éxito (`secondary`) |
| `disponibilidad` | `#E39F7D` | Alta disponibilidad: gráficos, infraestructura (`accent`) |
| `lienzo`         | `#F8F9FA` | Fondo |

> Los componentes shadcn/ui están escritos a mano en `src/components/ui` (el registro de shadcn
> no era accesible desde el entorno de desarrollo); son equivalentes a los que genera `npx shadcn add`.
