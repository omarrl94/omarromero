# Despliegue: Supabase + Netlify

Guía para poner la plataforma ASIR LMS en producción con **Supabase** (base de datos
PostgreSQL) y **Netlify** (hosting de la app Next.js).

---

## 1. Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) → **New project**.
2. Elige nombre, región (por ejemplo *West EU (Ireland)*) y define una **contraseña de base de datos** (guárdala).
3. Cuando el proyecto esté listo, ve a **Project Settings → Database → Connection string** y copia dos cadenas:
   - **Transaction pooler** (puerto **6543**) → será `DATABASE_URL`.
   - **Direct connection** (puerto **5432**) → será `DIRECT_URL`.

Deben quedar parecidas a esto (sustituye `[REF]` y `[PASSWORD]`):

```
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

> El sufijo `?pgbouncer=true&connection_limit=1` en `DATABASE_URL` es importante para que
> Prisma funcione bien con el pooler en un entorno serverless como Netlify.

---

## 2. La base de datos se crea sola en el primer despliegue

No hace falta que ejecutes nada a mano. El primer despliegue en Netlify (paso 3) usa el
comando `build:deploy`, que:

1. `prisma db push` → crea las tablas en Supabase.
2. `scripts/maybe-seed.mjs` → si la base de datos está vacía, carga los 19 temas y las 3
   cuentas; si ya tiene datos, no toca nada.
3. `next build` → construye la app.

Así, en el primer deploy la base de datos queda lista, y en los siguientes no se
sobrescriben las cuentas ni el progreso. (Si algún día quieres forzar la recarga del
temario, añade en Netlify la variable `SEED_ON_BUILD=force` y vuelve a desplegar; luego
quítala.)

> Si prefieres prepararla desde tu ordenador en vez de en el deploy: copia `.env.example`
> a `.env`, rellena los valores y ejecuta `npm install && npm run db:setup`.

---

## 3. Desplegar en Netlify

1. En [netlify.com](https://netlify.com) → **Add new site → Import an existing project** y
   elige el repositorio de GitHub.
2. Configura:
   - **Base directory:** `asir-lms`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (lo gestiona el plugin de Next.js)
   - Rama: `claude/dreamy-noether-v2sbqv` (o la que uses).
3. En **Site settings → Environment variables** añade:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | cadena del pooler (puerto 6543) |
   | `DIRECT_URL` | cadena directa (puerto 5432) |
   | `NEXTAUTH_SECRET` | el mismo secreto que en local |
   | `NEXTAUTH_URL` | la URL pública del sitio, p. ej. `https://tu-sitio.netlify.app` |
   | `SEED_ADMIN_PASSWORD`, `SEED_SUPERIOR_PASSWORD`, `SEED_MEDIO_PASSWORD` | solo si vas a ejecutar el seed desde Netlify (normalmente no hace falta) |

4. **Deploy**. Cuando termine, abre la URL del sitio.

> `NEXTAUTH_URL` debe coincidir exactamente con el dominio real del sitio, o el inicio de
> sesión fallará. Si más tarde pones un dominio propio, actualiza esta variable.

---

## 4. Acceso

| Rol | Email | Contraseña |
|---|---|---|
| Profesor | admin.ia@jrotero.es | (la de `SEED_ADMIN_PASSWORD`) |
| Grado Superior | omar.romero@jrotero.es | (la de `SEED_SUPERIOR_PASSWORD`) |
| Grado Medio | unai.elorrieta@jrotero.es | (la de `SEED_MEDIO_PASSWORD`) |

---

## Notas

- El esquema se sincroniza con `npm run db:push`, no en cada build de Netlify, para no
  tocar la base de datos en cada despliegue.
- Si cambias el modelo de datos (`prisma/schema.prisma`), vuelve a ejecutar
  `npm run db:push` desde tu ordenador.
- Para crear más alumnos no hace falta tocar la base de datos: hazlo desde el panel del
  profesor (`/admin`).
