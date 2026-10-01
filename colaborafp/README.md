# ColaboraFP

Plataforma de **sincronización de recursos en tiempo real para el aula** (código, enunciados y enlaces) del
**Centro de Formación Profesional José Ramón Otero** — abierta a todos los ciclos formativos.

- **Profesorado**: se registra, crea *Salas de Clase*, proyecta un QR/PIN, publica recursos y modera las aportaciones del alumnado.
- **Alumnado**: entra sin registro (QR o PIN de 6 dígitos), recibe el contenido al instante y puede **proponer** su código o enlaces, que llegan a la **Bandeja de Aprobación** del profesor.

## Stack

| Capa | Tecnología |
| --- | --- |
| UI | React 18 + Vite 6 |
| Estilos | Tailwind CSS 3 (modo oscuro por defecto en las salas) |
| Routing | react-router-dom 6 (rutas públicas y privadas) |
| Datos, Auth y Realtime | Firebase (recomendado) **o** Supabase **o** mock local (modo demo) |
| QR | react-qr-code |
| Código | react-syntax-highlighter (Prism: Python, JS, TS, Bash, HTML, CSS, Java, SQL, PHP, C/C++, C#, JSON, YAML) |
| Despliegue | Netlify (`netlify.toml` + `public/_redirects`) |

## Puesta en marcha

```bash
cd colaborafp
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

### Modo demo (sin credenciales)

Si no defines las variables de Supabase, la app usa `src/services/mockBackend.js`: Auth, salas y recursos se guardan en
`localStorage` y el "tiempo real" funciona **entre pestañas/ventanas del mismo navegador** (`BroadcastChannel`).

Prueba rápida del ciclo completo:

1. Pestaña A → *Acceso profesorado* → *Regístrate* → crea una sala.
2. Pestaña B → `/` → introduce el PIN (o pulsa *Vista alumno* en el panel).
3. En B pulsa **Compartir recurso** → en A aparece en la **Bandeja de aprobación** → **Aprobar** → aparece en el muro de B.

> El modo demo no sincroniza entre dispositivos distintos. Para usarlo en clase con los móviles del alumnado, conecta Firebase o Supabase.

### Modo producción con Firebase (recomendado, gratis sin tarjeta)

1. [console.firebase.google.com](https://console.firebase.google.com) → *Crear proyecto* (sin Google Analytics).
2. *Authentication → Comenzar → Correo electrónico/contraseña* → activar.
3. *Firestore Database → Crear base de datos* → ubicación `eur3` → modo producción.
4. *Firestore → Reglas* → pega [`firebase/firestore.rules`](firebase/firestore.rules) → *Publicar*.
5. *Configuración del proyecto → Tus apps → Web (`</>`)* → copia el objeto `firebaseConfig`.
6. Define `VITE_FIREBASE_CONFIG` con ese objeto (ver `.env.example`). Se admite tal cual lo muestra la consola.

Las reglas garantizan que el alumnado (sin sesión) solo puede resolver un PIN concreto, leer lo aprobado y enviar
peticiones `pending`; no puede listar salas, auto-aprobarse, borrar ni firmar como `teacher`. Están probadas contra el
emulador oficial (`firebase emulators:start` usando `firebase.json`).

### Modo producción con Supabase (alternativa)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. *SQL Editor* → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql) (tablas, RLS, funciones y publicación Realtime).
3. *Authentication → Providers → Email*: activado (opcional: desactiva *Confirm email* para pruebas).
4. Copia `.env.example` a `.env.local` y rellena:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

La UI no cambia: `src/services/backend.js` elige automáticamente la implementación.

**Seguridad (RLS):**
- El alumnado (rol `anon`) solo puede *leer* recursos aprobados e *insertar* peticiones `pending` en salas abiertas; nunca puede firmar como `teacher`.
- Las salas no se pueden listar: el PIN se resuelve con la función `get_room_by_pin`.
- Solo el profesor dueño de la sala ve las peticiones pendientes, aprueba, rechaza o elimina.

## Despliegue en Netlify

Este repositorio contiene más proyectos, así que en Netlify configura:

- **Base directory**: `colaborafp`
- **Build command**: `npm run build` · **Publish directory**: `dist` (ya definidos en `netlify.toml`)
- **Environment variables**: `VITE_FIREBASE_CONFIG` (o bien `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`)

El *rewrite* `/* → /index.html 200` (en `netlify.toml` y `public/_redirects`) hace que rutas como `/sala/123456`
o `/profesor/sala/<id>` funcionen al recargar o al abrirlas desde el QR.

## Rutas

| Ruta | Acceso | Página |
| --- | --- | --- |
| `/` | Pública | Landing con input de PIN (`?pin=` opcional) |
| `/sala/:pin` | Pública | `StudentLiveFeed` — muro de la clase |
| `/login`, `/registro` | Pública | Acceso del profesorado |
| `/profesor` | Privada | `TeacherDashboard` — crear salas e historial |
| `/profesor/sala/:roomId` | Privada | `RoomControlPanel` — Emisión, Bandeja de aprobación y Muro |

## Estructura

```
src/
├── components/   Tarjetas (CodeSnippetCard, TaskCard, LinkCard), ResourceForm, ShareResourceModal,
│                 ApprovalInbox, RoomQRCode, AppLayout, ProtectedRoute…
├── context/      AuthContext, RoomContext (motor de sincronización), ThemeContext
├── hooks/        useRoomFeed, useAuth, useCopyToClipboard, useTheme, useDocumentTitle
├── pages/        Home, StudentLiveFeed, Login, Register, TeacherDashboard, RoomControlPanel, NotFound
├── services/     backend.js (selector) · mockBackend.js · supabaseBackend.js (misma interfaz)
└── utils/        constantes, validación de recursos, formato, PIN/IDs
```

### Modelo de datos

```ts
Resource {
  id: string; room_id: string;
  author: 'teacher' | string;        // alias del alumno
  type: 'code' | 'task' | 'link';
  content: string; language?: string; title?: string;
  status: 'pending' | 'approved';
  timestamp: number;                 // momento de publicación en el muro
}
```

`useRoomFeed()` expone `publishedResources`, `pendingRequests`, `mySubmissions` y las acciones
`publish`, `requestShare`, `approve`, `reject` y `remove`.
