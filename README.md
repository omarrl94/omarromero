# 🎵 Hipster Bingo · Hitster Music Bingo

Generador visual de **cartones de colores** para music bingo estilo **Hitster**, multijugador **en tiempo real** y con estética *vintage craft paper*. Crea una sala, comparte el código o el QR, adivina canciones y estampa X negras hasta cantar **¡BINGO!**

Construido con **Next.js (App Router) + TypeScript estricto**, **Tailwind CSS**, **Framer Motion**, **Lucide Icons** y **Supabase Realtime** (canales Broadcast + Presence, sin base de datos).

---

## ✨ Características

- **Salas con código de 4 caracteres**, enlace copiable y **código QR** para compartir.
- **Cartón visual 5×5 estilo Hitster**: fichas cuadradas de color sólido y vibrante (Amarillo, Azul, Verde, Rojo, Morado) con borde negro fino — distribución equilibrada de 5 fichas por color.
- **Casilla central fija Morada** (comodín) con el texto "FREE / Pipa de Cobre", marcada de nacimiento.
- **Distribución espacial aleatoria y única por jugador**: Fisher-Yates con semilla determinista (`sala + jugador + ronda`).
- **Zona blanca de adivinanza** bajo el cartón, imitando la tarjeta física: texto "Adivina:", campo de entrada grande y limpio, y logo **HITSTER** en la base.
- **Mecánica de rondas por color**: el host lanza una ronda de un color, pone la canción, los jugadores escriben su respuesta y el host **valida o rechaza** cada una. Al validar, una **X negra** se estampa sobre la primera ficha libre de ese color del jugador. *(Sin marcado táctil: las casillas no se marcan tocando.)*
- **Panel lateral en vivo** con el % de progreso de cada jugador (sin desvelar su cartón).
- **Botón ¡BINGO!** que solo se activa con 5 X en línea (horizontal, vertical o diagonal).
- **Validación anti-trampas distribuida** de la reclamación: cada cliente regenera el cartón del reclamante desde su semilla y verifica la línea de forma independiente.
- **Victoria global**: congela la partida, lanza confetti y proclama al ganador en todas las pantallas.
- **Rol host**: arranca la partida, lanza rondas, valida respuestas y reinicia con cartones nuevos.
- **Persistencia**: si recargas o pierdes la conexión, recuperas exactamente el mismo cartón con tus X intactas (localStorage + regeneración determinista).
- **Reconexión automática** con backoff exponencial y reenganche al recuperar la red.

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

**Sobre el aviso "Falta configurar el tiempo real":** aparece cuando las variables no existen, quedan con los valores placeholder del `.env.example`, o son inválidas. La app sanea los valores (espacios, comillas) y valida el formato antes de crear el cliente. Tras editar `.env.local` **reinicia `npm run dev`** (Next.js inyecta las `NEXT_PUBLIC_*` en build, no en caliente). En Vercel, tras añadir variables hay que **redeployar**.

---

## ☁️ Despliegue en Vercel (recomendado, 1 clic)

1. Sube este repositorio a GitHub.
2. Entra en [vercel.com/new](https://vercel.com/new) e **importa el repositorio**. Vercel detecta Next.js automáticamente.
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
│   ├── layout.tsx            # Layout raíz, metadatos, fuentes
│   ├── page.tsx              # Lobby: crear partida / unirse con código
│   └── room/[code]/page.tsx  # Sala de juego (valida el código en servidor)
├── components/
│   ├── RoomClient.tsx        # Orquestador: join gate, toolbar, controles
│   ├── BingoCard.tsx         # Cartón 5×5 de fichas de color con X negras
│   ├── AnswerZone.tsx        # Zona blanca "Adivina:" + input + logo HITSTER
│   ├── HostPanel.tsx         # Mesa del host: lanzar rondas y validar respuestas
│   ├── PlayersDrawer.tsx     # Panel lateral con progreso de cada jugador
│   ├── WinnerOverlay.tsx     # Alerta global de victoria + confetti
│   ├── ShareRoom.tsx         # Código, enlace copiable y QR
│   └── ConfigNotice.tsx      # Aviso si faltan variables de entorno
├── hooks/
│   └── useRoom.ts            # Canal Realtime, rondas, veredictos, reconexión
└── lib/
    ├── colors.ts             # Paleta de fichas (5 colores + etiquetas)
    ├── bingo.ts              # PRNG con semilla, Fisher-Yates, líneas, validación
    ├── storage.ts            # Persistencia de sesión/cartón en localStorage
    ├── supabase.ts           # Cliente Realtime (saneado + validación de env)
    └── types.ts              # Tipos compartidos del protocolo de sala
```

### Flujo de una ronda (protocolo Broadcast)

1. `round:launch` — el host elige un color y lanza la ronda (con `launchId` único).
2. `guess:submit` — cada jugador envía su respuesta desde la zona "Adivina:" (una por ronda).
3. `guess:verdict` — el host valida ✔ o rechaza ✖ cada respuesta de su cola.
4. Si es válida, el cliente del jugador estampa la **X** en su **primera ficha libre de ese color** (determinista: orden de lectura).
5. `bingo:claim` — con 5 X en línea, el botón ¡BINGO! difunde la reclamación y **todos** los clientes la validan regenerando el cartón desde la semilla.
6. `game:state` — start/reset del host y proclamación del ganador.

La **Presence** difunde el estado vivo (apodo, host, % de progreso) y, en la presencia del host, la fase/ronda/color activo autoritativos — quien entra tarde o se reconecta queda sincronizado al instante.

### Unicidad y persistencia de los cartones

- Cada cartón se genera con **mulberry32** sembrado con `hash(sala | playerId | ronda)` y un **Fisher-Yates** sobre el pool de 24 fichas (5+5+5+5 de Amarillo/Azul/Verde/Rojo y 4 Moradas; la central Morada es fija) → distribución espacial única por jugador.
- Como la generación es determinista, el cartón **no se guarda en ningún sitio**: se regenera idéntico tras cada recarga, y las X se restauran desde `localStorage`.

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
2. Cada jugador entra con su apodo y recibe un **cartón de colores único**.
3. El host arranca la partida y **lanza rondas de color** mientras suena la música.
4. Cada jugador escribe su respuesta ("'90", "Dua Lipa"…) en la zona **Adivina:** y el host la valida — si acierta, gana una **X** en su primera ficha libre de ese color.
5. Con **5 X en línea** (fila, columna o diagonal — el comodín central cuenta siempre) se activa el botón **¡BINGO!**
6. La reclamación se **valida automáticamente en todos los clientes**; si es legítima, la partida se congela, llueve confetti y se proclama al ganador.
7. El host puede lanzar una **nueva partida** con cartones nuevos para todos.
