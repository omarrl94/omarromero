# 🧔 Hipster Bingo

Bingo multijugador **en tiempo real** de clichés hipsters, con estética *vintage craft paper*. Crea una sala, comparte el código o el QR, y sella casillas con tinta hasta cantar **¡BINGO!**

Construido con **Next.js (App Router) + TypeScript estricto**, **Tailwind CSS**, **Framer Motion**, **Lucide Icons** y **Supabase Realtime** (canales Broadcast + Presence, sin base de datos).

---

## ✨ Características

- **Salas con código de 4 caracteres**, enlace copiable y **código QR** para compartir.
- **Cartones 5×5 únicos por jugador**: 24 clichés muestreados sin reemplazo (Fisher-Yates) de una lista máster de **66 tópicos** categorizados, más la casilla central fija **"FREE · Pipa de Cobre"** que nace marcada.
- **Generación determinista por semilla** (`sala + jugador + ronda`): si recargas la página o pierdes la conexión, recuperas **exactamente el mismo cartón** con tus marcas intactas (persistidas en `localStorage`).
- **Validación anti-trampas distribuida**: al pulsar ¡BINGO!, cada cliente regenera el cartón del reclamante desde su semilla y verifica la línea de forma independiente — es imposible falsear el contenido del cartón.
- **Panel lateral en vivo** con el % de progreso de cada jugador (sin desvelar sus frases).
- **Botón ¡BINGO!** que solo se activa con 5 en línea (horizontal, vertical o diagonal).
- **Victoria global**: congela la partida, lanza confetti y proclama al ganador en todas las pantallas.
- **Rol host**: arranca la partida y reinicia rondas (cartones nuevos para todos).
- **Reconexión automática** con backoff exponencial y reenganche al recuperar la red.
- Animación de **sello de tinta** al marcar cada casilla, sobre papel kraft con textura.

---

## 🚀 Puesta en marcha local

Requisitos: Node.js 18.17+ (o 20+).

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar el tiempo real (ver sección Supabase más abajo)
cp .env.example .env.local
#    → edita .env.local con tus credenciales

# 3. Arrancar en desarrollo
npm run dev
# → http://localhost:3000
```

Verificación de producción:

```bash
npm run build   # compila sin errores con TypeScript estricto
npm run start   # sirve el build de producción
```

---

## 🔑 Configurar Supabase Realtime (2 minutos, gratis)

La app **no usa base de datos ni tablas**: solo los canales Realtime (Broadcast + Presence) de Supabase, incluidos en el plan Free.

1. Crea una cuenta y un proyecto en [supabase.com](https://supabase.com).
2. Entra en **Project Settings → API**.
3. Copia dos valores en tu `.env.local` (o en las variables del hosting):

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → *anon public key* |

> Ambas claves son públicas por diseño (van al navegador). No pongas aquí la `service_role` key.

---

## ☁️ Despliegue en Vercel (recomendado, 1 clic)

1. Sube este repositorio a GitHub.
2. Entra en [vercel.com/new](https://vercel.com/new) e **importa el repositorio**. Vercel detecta Next.js automáticamente: no hay que tocar ningún ajuste de build.
3. En el paso *Environment Variables*, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Pulsa **Deploy**. En ~1 minuto tendrás tu URL pública para compartir salas.

### Alternativa: Render / Railway

Ambos detectan Next.js. Configura:

- **Build command:** `npm install && npm run build`
- **Start command:** `npm run start`
- **Variables de entorno:** las dos `NEXT_PUBLIC_*` de arriba.

---

## 🧠 Arquitectura

```
src/
├── app/
│   ├── layout.tsx            # Layout raíz, metadatos, fuentes, filtro SVG de tinta
│   ├── page.tsx              # Lobby: crear partida / unirse con código
│   └── room/[code]/page.tsx  # Sala de juego (valida el código en servidor)
├── components/
│   ├── RoomClient.tsx        # Orquestador: join gate, header, controles, toasts
│   ├── BingoCard.tsx         # Cartón 5×5 con animación de sello de tinta
│   ├── PlayersDrawer.tsx     # Panel lateral con progreso de cada jugador
│   ├── WinnerOverlay.tsx     # Alerta global de victoria + confetti
│   ├── ShareRoom.tsx         # Código, enlace copiable y QR
│   └── ConfigNotice.tsx      # Aviso si faltan variables de entorno
├── hooks/
│   └── useRoom.ts            # Canal Realtime, presencia, reconexión, estado de juego
└── lib/
    ├── cliches.ts            # Lista máster de 66 clichés categorizados
    ├── bingo.ts              # PRNG con semilla, Fisher-Yates, líneas, validación
    ├── storage.ts            # Persistencia de sesión/cartón en localStorage
    ├── supabase.ts           # Cliente Realtime (creación perezosa)
    └── types.ts              # Tipos compartidos del protocolo de sala
```

### Cómo se garantiza la unicidad y la persistencia de los cartones

- Cada cartón se genera con **mulberry32** sembrado con `hash(sala | playerId | ronda)` y un **Fisher-Yates** sobre los 66 índices de la lista máster, tomando los 24 primeros → **sin repeticiones posibles dentro de un cartón** (muestreo sin reemplazo).
- Jugadores distintos tienen `playerId` distintos → semillas distintas → barajados distintos: cartones con contenido y orden espacial diferentes dentro de la misma sala.
- Como la generación es determinista, **no hace falta guardar el cartón en ningún sitio**: se regenera idéntico tras cada recarga, y las marcas se restauran desde `localStorage`.

### Cómo se valida un ¡BINGO! sin servidor dedicado

Cuando un jugador reclama bingo, difunde por Broadcast sus posiciones marcadas. **Todos los clientes** (incluido el suyo) regeneran su cartón desde la semilla pública y comprueban la línea con la misma función pura → veredicto idéntico en todas las pantallas. Un tramposo no puede inventarse frases ni posiciones: solo puede marcar casillas de su cartón real, igual que en el bingo de verdad.

### Sincronización de sala

- **Presence** difunde el estado vivo de cada jugador (apodo, host, % de progreso) y, en la presencia del host, la fase/ronda autoritativas — quien entra tarde o se reconecta queda sincronizado al instante.
- **Broadcast** transporta los eventos instantáneos: `game:state` (start/reset del host) y `bingo:claim`.
- La reconexión es automática: backoff exponencial (1s → 15s) ante errores de canal y resuscripción al recuperar la red.

---

## 📜 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con hot-reload |
| `npm run build` | Build de producción (cero errores, TS estricto) |
| `npm run start` | Servir el build de producción |
| `npm run typecheck` | Solo comprobación de tipos |

---

## 🎲 Reglas del juego

1. El **host** crea la sala y comparte el código/enlace/QR.
2. Cada jugador entra con su apodo y recibe un **cartón único**.
3. Cuando el host arranca, todos van marcando los clichés que presencian.
4. Con **5 en línea** (fila, columna o diagonal — la casilla central cuenta siempre), se activa el botón **¡BINGO!**
5. La reclamación se **valida automáticamente**; si es legítima, la partida se congela, llueve confetti y se proclama al ganador. Si es falsa… toca pagar los cafés de especialidad.
6. El host puede lanzar una **nueva ronda** con cartones nuevos para todos.
