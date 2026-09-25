# Despliegue en Vercel (gratis, sin límite de builds)

Netlify pausó los despliegues de producción por créditos. Vercel es la mejor
alternativa gratuita para Next.js y no tiene ese límite. La base de datos sigue
siendo la misma de Supabase.

## Pasos (5 minutos, una sola vez)

1. Entra en [vercel.com](https://vercel.com) → **Sign up** con tu cuenta de **GitHub**.
2. **Add New… → Project** → importa el repositorio `omarrl94/omarromero`.
3. En la pantalla de configuración:
   - **Root Directory:** pulsa *Edit* y selecciona **`asir-lms`** (¡importante! el proyecto está en esa carpeta).
   - **Framework Preset:** Next.js (se detecta solo).
   - **Branch:** `claude/dreamy-noether-v2sbqv`.
4. Abre **Environment Variables** y añade estas (las mismas de Supabase):

   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | `postgresql://postgres.hnshosdhcvqhhzsugwgn:omrolo.94%21%21@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
   | `DIRECT_URL` | `postgresql://postgres.hnshosdhcvqhhzsugwgn:omrolo.94%21%21@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` |
   | `NEXTAUTH_SECRET` | (el mismo secreto que usabas en Netlify, o genera uno con `openssl rand -base64 32`) |

   > No hace falta `NEXTAUTH_URL`: Vercel la deduce sola. Tampoco las `SEED_*`
   > (las contraseñas por defecto ya son admin123 / omrolo.94 / hola123).

5. **Deploy**. En 1-2 minutos tendrás una URL tipo `https://omarromero-xxxx.vercel.app`.

## Al entrar

La base de datos se migra sola en el primer acceso (roles de profesor incluidos).
Entra primero como **admin** para dispararlo:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin.ia@jrotero.es | admin123 |
| Profesor Grado Superior | omar.romero@jrotero.es | omrolo.94 |
| Profesor Grado Medio | unai.elorrieta@jrotero.es | hola123 |

Para comprobar que todo está bien: abre `TU-URL/api/health` (muestra la versión y
deja a Omar y Unai como profesores).

## Nota

Cuando Netlify recupere sus créditos también volverá a funcionar; puedes usar
cualquiera de los dos. Ambos leen la misma base de datos de Supabase.
