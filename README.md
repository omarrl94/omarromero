# 🧻 Rollo Madrid

**El mapa callejero de los baños de los bares de Madrid.** Antes de entrar a ese baño, mira la nota. Cuatro categorías, de 1 a 5 rollos, y un aviso para quien entre después.

> MVP funcional: Next.js 14 (App Router) + TypeScript + Tailwind + Google Maps. Las valoraciones viven de momento en el navegador (`localStorage`), listas para enchufarse a un backend real.

---

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # y pega tu clave de Google Maps
npm run dev                  # → http://localhost:3000
```

Sin clave la app **no se rompe**: en el hueco del mapa sale un esquema del centro con las mismas chapas de colores —etiquetado como simulación, que aquí no se cuela a nadie— y el ranking, la ficha y el formulario siguen funcionando con los datos de ejemplo.

### La clave de Google

1. [console.cloud.google.com](https://console.cloud.google.com/) → nuevo proyecto.
2. **APIs y servicios → Biblioteca**, habilita **Maps JavaScript API** y **Places API (New)**.
3. **Credenciales → Clave de API**, y restríngela por *HTTP referrers* (`http://localhost:3000/*` y tu dominio).
4. Crea un **Map ID** (Maps Platform → Gestión de mapas, tipo JavaScript vectorial): los marcadores avanzados —las chapas de colores— no se pintan sin él.

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...tu-clave
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID

# Opcionales: sin ellas las cuentas funcionan en modo local
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...tu-anon-key
```

El mapa se pide en modo oscuro con `colorScheme={ColorScheme.DARK}`, así que no hace falta estilarlo a mano en Cloud Console para que pegue con la app.

---

## Cómo funciona

### Los bares no se crean a mano

El identificador de un local es su **`place_id` de Google**. El usuario escribe en el buscador, Google Places autocompleta, y al elegir un sitio se "adopta": guardamos `place_id`, nombre, dirección y coordenadas oficiales. Cero duplicados, cero nombres mal escritos.

El buscador ofrece primero los bares ya fichados (instantáneo, sin gastar cuota) y debajo las sugerencias de Google. Usa la Places API nueva (`AutocompleteSuggestion`) y cae sola a la clásica (`AutocompleteService`) si la clave solo tiene esa.

### Femenino, masculino o único

El mismo bar puede tener el baño de ellas impecable y el de ellos arrasado, así que **la nota cuelga del aseo, no del local**. Cada parte dice a cuál se refiere: `femenino`, `masculino` o `unico` (el de toda la vida, uno para todo el mundo).

- En la cabecera del listado hay un filtro — **Todos · ♀ Femenino · ♂ Masculino · ⚲ Único** — que manda en todo: las chapas del mapa, el podio, la lista negra y el parte técnico de la ficha pasan a hablar solo de ese aseo. Un bar del que solo se ha valorado el único desaparece al filtrar por femenino, porque de ese no hay nada que decir.
- La ficha enseña siempre los tres de un vistazo: `♀ 4,6 · ♂ 3,3 · ⚲ sin catar`.
- Cada comentario lleva su aseo al lado, para que no se mezclen.
- **Un voto por persona, bar y aseo**: puedes valorar los dos, y cada uno se corrige por separado.

### Las notas

| Categoría | La pregunta de verdad |
|---|---|
| Limpieza | ¿Se puede comer en el suelo o huele a muerte? |
| Espacio | ¿Caben las rodillas al cerrar la puerta? |
| Intimidad | ¿El pestillo es de verdad o es decorativo? |
| Suministros | ¿Hay papel y jabón o toca improvisar? |

Cada puntuación suelta tiene nombre: **Infierno · Malo · Justito · Bien · Gloria**. La nota global es la media de las cuatro, y la del bar la media de las reseñas del aseo que estés mirando. De ahí sale el veredicto, que es lo que se lee en la chapa del mapa:

| Nota media | Veredicto | Color |
|---|---|---|
| ≥ 4,2 | Vía libre | `#C6FF3D` |
| ≥ 3,5 | Se puede | `#9BE03A` |
| ≥ 2,5 | Aprieta y reza | `#FFB800` |
| ≥ 1,6 | Mal asunto | `#FF7A2F` |
| < 1,6 | Ni de coña | `#FF3B30` (la chapa late) |

Los que superan **4,5 con dos votos o más** se llevan el **Rollo de Oro** 👑.

### La ubicación

El **modo urgencia** y el panel **Cerca de ti** funcionan con la ubicación del navegador, y se pide con estas reglas:

- **Nunca al cargar.** El permiso se solicita solo cuando alguien pulsa "Los más cercanos" o el modo urgencia.
- **Si la deniegas, no pasa nada**: la app sigue entera, ordenando por nota en vez de por distancia, y lo dice sin insistir.
- No se guarda ni se envía a ningún sitio: se usa en memoria para calcular distancias (fórmula del haversine, en `src/lib/distancia.ts`) y se pierde al recargar.

Con ubicación activa, el modo urgencia deja de abrir el mejor valorado y abre **el baño decente (3,5 o más) que más cerca te pilla**; si ninguno aprueba, el más cercano a secas. Las fichas y los rankings muestran la distancia y los minutos andando, y en el mapa —real o simulado— aparece un punto verde donde estás.

### Las cuentas

Leer el mapa no pide nada. **Para firmar un parte hace falta cuenta**: así cada nota lleva autor y, el día que haga falta, se puede moderar.

- **Con Supabase configurado** (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`): registro e inicio de sesión de verdad con correo y contraseña (`supabase.auth`), sesión persistente y alias guardado en `user_metadata`. Si tienes activada la confirmación por correo, el registro avisa de que hay que confirmarlo antes de entrar.
- **Sin Supabase**: la app entra en **modo local**. Basta un alias, que se guarda en este navegador. Sirve para probar el flujo entero sin montar nada; no es seguridad de verdad y la propia pantalla lo dice.

La clave que se usa es la **anon public**, que está pensada para ir en el navegador. La `service_role` es secreta y no debe aparecer en el cliente ni en el repositorio.

Montarlo, si quieres cuentas reales:

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan Free vale).
2. **Project Settings → API**: copia *Project URL* y *anon public*.
3. **Authentication → Providers**: deja activado *Email*.
4. **SQL Editor → New query**: pega entero `supabase/schema.sql` y dale a *Run*. Crea las tablas, las políticas y cinco bares de ejemplo. Si ya lo habías ejecutado antes, vuelve a pasarlo: añade la columna del aseo y rehace el índice sin tocar lo que hubiera.
5. Pega las dos variables en `.env.local` y reinicia el servidor.

### Dónde viven los datos

Dos orígenes, elegidos por las variables de entorno:

| | Con Supabase | Sin Supabase (modo local) |
|---|---|---|
| Bares y reseñas | tablas `bares` y `reviews` | mocks + `localStorage` |
| Alcance | compartido entre todo el mundo | solo ese navegador |
| Quién escribe | hace falta sesión (lo exige RLS) | cualquiera con alias |

```ts
Bar    { place_id (PK), nombre, direccion, lat, lng, creado_por }
Review { id, place_id (FK), aseo, user_id (FK), autor,
         limpieza, espacio, intimidad, suministros, comentario, fecha }
```

Las notas no se guardan calculadas: se derivan en `src/lib/scores.ts`.

**Las reglas están en la base de datos, no en el navegador** (`supabase/schema.sql`):

- Leer bares y reseñas: cualquiera, con o sin cuenta.
- Fichar un bar: solo con sesión, y queda apuntado quién lo trajo.
- Publicar una reseña: solo con sesión y solo a tu nombre (`user_id = auth.uid()`); firmar en nombre de otro lo rechaza Postgres.
- Corregir o retirar: solo lo tuyo.
- Cambiar o borrar un bar desde el cliente: nadie. No hay política de update ni de delete.
- **Un voto por persona, bar y aseo**: hay un índice único sobre `(place_id, user_id, aseo)`, así que el segundo parte del mismo aseo actualiza el primero en vez de duplicarlo. En la app esto se ve como "Actualizar mi parte".

---

## Mapa del código

```
src/
├─ app/
│  ├─ layout.tsx              Fuentes (Anton · Manrope · Space Mono) y metadatos
│  ├─ page.tsx                Monta el provider y la app
│  └─ globals.css             Asfalto, grano, botones y paneles (@layer components)
├─ components/
│  ├─ RolloApp.tsx            ★ La app: titular, mapa, rankings y ficha
│  ├─ MapaRollos.tsx          Google Maps en modo oscuro + cámara
│  ├─ ChapaBar.tsx            La chapa de cada bar (sobre Google o simulada)
│  ├─ Buscador.tsx            Google Places Autocomplete con UI propia
│  ├─ Ranking.tsx             El podio y la lista negra
│  ├─ FichaBar.tsx            BottomSheet en móvil, cartel en escritorio
│  ├─ FormularioValoracion.tsx  Las 4 categorías + veredicto en vivo
│  ├─ Rollitos.tsx            Escala de 1 a 5 rollos (monolínea)
│  ├─ Cabecera.tsx            Barra superior con buscador y sesión
│  ├─ ModalAcceso.tsx        Registro e inicio de sesión
│  ├─ BotonSesion.tsx        Alias, salir o invitación a entrar
│  ├─ Ticker.tsx              Los avisos de la casa, en bucle
│  ├─ MapaSimulado.tsx       Mapa esquemático si falta la API key
│  └─ Logo.tsx                Logo SVG: el papel cae y dibuja una "M"
├─ hooks/
│  ├─ usePlacesBuscador.ts    Autocompletado + detalle del sitio
│  └─ useUbicacion.ts         Ubicación del navegador, a petición
└─ lib/
   ├─ auth.tsx                Cuentas: Supabase o modo local
   ├─ datos.ts                Lectura y escritura contra Supabase
   ├─ distancia.ts            Distancias, formato y minutos andando
   ├─ supabase.ts             Cliente del navegador (null si no hay proyecto)
   ├─ types.ts                Bar, Review, BarConNota
   ├─ scores.ts               Medias, veredictos, grados y fechas
   ├─ mock-data.ts            5 bares clásicos con place_id inventados
   ├─ store.tsx               Estado global + persistencia
   └─ config.ts               Centro de Madrid, zooms y variables de entorno

supabase/
└─ schema.sql                Tablas, políticas RLS y datos de ejemplo
```

### El logo

Un rollo de papel higiénico cuyo papel cae, recorre el suelo y se levanta dibujando una **M** mayúscula. Todo SVG (`src/components/Logo.tsx`): aquí va en magenta rotulador con el perforado en verde ácido.

---

## Dirección visual

Fanzine nocturno de bar: asfalto de madrugada, rotulador magenta, verde ácido de neón, ámbar para los premios y papel de fotocopia para el texto. Marcos negros de 3 px, sombras duras sin difuminar y un grano de fotocopia sobre todo el fondo.

| Uso | Token |
|---|---|
| Fondo | `asfalto-900` `#0C0C0D` · paneles `asfalto-800` |
| Marca | `marca` `#FF2E88` |
| Vía libre | `acido` `#C6FF3D` |
| Premios y avisos | `ambar` `#FFB800` |
| Alarma | `alarma` `#FF3B30` |
| Texto | `papel` `#F2ECDF` · secundario `papel-apagado` |

Tipografías: **Anton** para los titulares (clase `.grito`), **Manrope** para el texto y **Space Mono** para rótulos y datos. Se sirven desde el propio dominio con `next/font`.

Mobile-first: la ficha sube como BottomSheet, la escala de rollos se pulsa con el pulgar y nada se sale de la pantalla. Que la gente lo usará desde el baño.

---

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run typecheck` | TypeScript en modo estricto |
| `npm run deploy` | Publicar en Netlify ([guía](DESPLIEGUE-NETLIFY.md)) |
| `npm run demo` | Grabar el vídeo de presentación 16:9 (con `npm run dev` abierto) |
| `npm run demo:reel` | Grabar el reel vertical 9:16 de 30 segundos |

---

## El vídeo de presentación

`scripts/grabar-demo.mjs` recorre la app de verdad con Playwright —cursor visible, rótulos encima y cartel de entrada y salida— y deja el vídeo en `demo/` (webm, y mp4 si tienes ffmpeg). No es una maqueta: es la aplicación funcionando.

```bash
npm run dev                                   # en una terminal
npm i -D playwright && npx playwright install chromium
npm run demo                                  # en otra → 16:9, 1:11
npm run demo:reel                             #        → 9:16, 0:32
```

Dos formatos, un solo guion por cada uno:

- **`demo`** (1280×720): el recorrido completo — modo urgencia, buscador y adopción de bares, registro y sesión, el formulario de rollos con el veredicto en vivo, el parte publicado, podio, lista negra y mapa.
- **`demo:reel`** (grabado a 720×1280 y escalado a 1080×1920 al codificar): versión corta para redes — gancho, el mapa por colores, el mejor baño, la lista negra, cuatro toques para puntuar y el parte firmado, con rótulos a pantalla completa y destellos entre cortes.

Si grabas con la clave de Google en `.env.local`, el tramo del mapa sale con Google Maps de verdad; sin clave sale el mapa simulado, con las mismas chapas.

Los rótulos y sus tiempos están en `grabar()` y `guionReel()`, en el mismo orden en que se ven.

---

## Siguiente parada

- Moderación: denunciar un parte y esconder lo denunciado hasta revisarlo.
- Filtros: abiertos ahora, accesibles, con cambiador.
- Realtime de Supabase para que el mapa se actualice sin recargar.
- Fotos del baño (con moderación, que nos conocemos).
- Filtros: solo verdes, abiertos ahora, accesibles, con cambiador.
