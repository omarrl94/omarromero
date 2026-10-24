# Rollo Madrid — descripción del proyecto

> El mapa callejero de los baños de los bares de Madrid. Antes de entrar a ese
> baño, mira la nota. App de iOS y Android, y web.

Documento de referencia: qué es, cómo está construido, qué reglas lo gobiernan y
qué falta. Estado a 19 de octubre de 2026, rama `claude/rollo-madrid-mvp-19emod`.

---

## 1. El problema y la propuesta

En Madrid hay miles de bares y, dentro de cada uno, una incógnita: el baño. La
información existe —todo el mundo tiene su lista mental de dónde no entrar— pero
no está en ningún sitio. Google te dice si el bar es bueno; nadie te dice si el
baño tiene pestillo.

**Rollo Madrid** es un mapa comunitario donde cada baño se puntúa en cuatro
criterios concretos y se resume en un veredicto legible de un vistazo. El tono es
deliberadamente callejero: es una app que se usa con prisa, de pie y con una mano.

**Para quién**: quien sale por Madrid y quiere evitar una sorpresa. En especial,
quien tiene menos margen para improvisar — gente con hijos pequeños, con
problemas digestivos, con reglas, o simplemente con criterio.

---

## 2. Estado actual

MVP funcional y desplegable. Unas 5.000 líneas entre `src/`, `firebase/` y
`scripts/`, sobre la rama de trabajo.

| Pieza | Estado |
|---|---|
| Mapa con Google Maps + marcadores propios | Hecho (pide clave de API) |
| Buscador con Google Places Autocomplete | Hecho (API nueva, con respaldo a la clásica) |
| Valoración en 4 criterios + veredicto | Hecho |
| Distinción femenino / masculino / único | Hecho |
| Cuentas (registro e inicio de sesión) | Hecho (Firebase Auth, con modo local) |
| Base de datos compartida con reglas | Hecho (Cloud Firestore, con modo local) |
| Geolocalización y orden por cercanía | Hecho |
| Mapa simulado cuando falta la clave | Hecho |
| Vídeo de presentación y reel, generados por script | Hecho |
| Empaquetado como app de iOS y Android (Capacitor) | Hecho (falta compilar en macOS/Android Studio) |
| Moderación, fotos, realtime, PWA | Pendiente |

Lo único que no se ha podido verificar de punta a punta es el mapa real de Google
y un proyecto real de Firebase, por no disponer de credenciales. Las reglas de
Firestore sí están probadas contra el emulador oficial (17 casos), y el mapa
simulado cubre el hueco mientras tanto.

---

## 3. Arquitectura

### Pila

- **Next.js 14** (App Router) + **React 18** + **TypeScript** en modo estricto
  (`noUncheckedIndexedAccess` incluido).
- **Tailwind CSS 3** con paleta propia; sin librería de componentes.
- **@vis.gl/react-google-maps** para el mapa y los marcadores avanzados.
- **firebase** (Authentication + Cloud Firestore) para cuentas y datos.
- **lucide-react** para iconografía de apoyo.
- **Capacitor 8** para empaquetar la web estática como app de iOS y Android,
  con sus plugins de ubicación, barra de estado, pantalla de carga, vibración y
  botón atrás.
- Fuentes servidas desde el propio dominio con `next/font` (Anton, Manrope,
  Space Mono).

Una sola ruta (`/`): la app es una pantalla. No hay backend propio; el cliente
habla directamente con Firebase y con Google.

### Mapa del código

```
src/
├─ app/
│  ├─ layout.tsx              Fuentes, metadatos, tema
│  ├─ page.tsx                Providers (Auth + Datos) y app
│  └─ globals.css             Asfalto, grano, botones y paneles (@layer components)
├─ components/
│  ├─ RolloApp.tsx            La pantalla: titular, filtros, mapa, rankings, ficha
│  ├─ MapaRollos.tsx          Google Maps en modo oscuro + cámara
│  ├─ MapaSimulado.tsx        Mapa esquemático de reserva, etiquetado como tal
│  ├─ ChapaBar.tsx            La chapa de cada bar, común a los dos mapas
│  ├─ Buscador.tsx            Google Places Autocomplete con UI propia
│  ├─ Ranking.tsx             Podio, lista negra y "cerca de ti"
│  ├─ FichaBar.tsx            BottomSheet en móvil, cartel en escritorio
│  ├─ FormularioValoracion.tsx  Aseo + 4 criterios + veredicto en vivo
│  ├─ Rollitos.tsx            Escala de 1 a 5 rollos (monolínea)
│  ├─ ModalAcceso.tsx         Registro e inicio de sesión
│  ├─ BotonSesion.tsx         Alias y salida
│  ├─ Cabecera.tsx            Barra superior
│  ├─ Ticker.tsx              Avisos de la casa en bucle
│  └─ Logo.tsx                Logo SVG
├─ hooks/
│  ├─ usePlacesBuscador.ts    Autocompletado + detalle del sitio
│  └─ useUbicacion.ts         Ubicación del navegador, a petición
└─ lib/
   ├─ types.ts                Bar, Review, BarConNota, TipoAseo
   ├─ scores.ts               Medias, veredictos, grados, aseos, fechas
   ├─ distancia.ts            Haversine, formato y minutos andando
   ├─ store.tsx               Estado global, dos orígenes de datos
   ├─ datos.ts                Lectura y escritura contra Firestore
   ├─ auth.tsx                Cuentas: Firebase o modo local
   ├─ firebase.ts             App, Auth y Firestore
   ├─ mock-data.ts            Cinco clásicos de Madrid con place_id inventados
   └─ config.ts               Centro de Madrid, zooms y variables de entorno

firebase/firestore.rules      Reglas de seguridad, probadas en el emulador
firebase/semilla.json         Bares de ejemplo para no nacer vacío
scripts/grabar-demo.mjs       Graba el vídeo de presentación y el reel
scripts/sembrar-firestore.mjs Semilla opcional de Firestore
```

### Las dos degradaciones, que son parte del diseño

La app **nunca** se queda inservible por falta de configuración, y **nunca**
disimula que le falta:

1. **Sin clave de Google** → el hueco del mapa dibuja un esquema del centro con
   las mismas chapas, misma interacción, y una tarjeta que dice "Mapa simulado" y
   qué variable falta. El buscador se reduce a los bares ya fichados.
2. **Sin proyecto de Firebase** → las cuentas pasan a "modo local" (basta un
   alias, guardado en ese navegador) y los datos vienen de los mocks +
   `localStorage`. El pie de página dice en cuál de los dos modos estás.

---

## 4. Modelo de datos

El identificador universal de un local es el **`place_id` de Google**: los bares
no se crean a mano, se adoptan desde Places al buscarlos. Cero duplicados, cero
nombres mal escritos.

```ts
Bar    { place_id (PK), nombre, direccion, lat, lng, creado_por }
Review { id, place_id (FK), aseo, user_id (FK), autor,
         limpieza, espacio, intimidad, suministros, comentario, fecha }
```

- `aseo`: `"femenino" | "masculino" | "unico"`. **La nota cuelga del aseo, no del
  local**: el mismo bar puede tener el de ellas impecable y el de ellos arrasado.
- Las notas **no se guardan calculadas**: se derivan siempre (`lib/scores.ts`).
- Un bar solo se persiste cuando alguien publica su primera valoración; hasta
  entonces vive en memoria como "bar a la vista".

### Reglas en la base de datos, no en el navegador (`firebase/firestore.rules`)

| Acción | Quién |
|---|---|
| Leer bares y reseñas | Cualquiera, con o sin cuenta |
| Fichar un bar | Solo con sesión; queda apuntado quién lo trajo |
| Publicar reseña | Solo con sesión y **solo a tu nombre** (`user_id = auth.uid()`) |
| Corregir o retirar | Solo lo tuyo |
| Editar o borrar un bar | Nadie desde el cliente (no hay política) |

Más el nombre del documento de la reseña, `{place_id}__{aseo}__{uid}`: Firestore
impone así **un voto por persona, bar y aseo** sin índices ni transacciones, y la
regla comprueba la autoría sin leer nada. En la interfaz eso es "Actualizar mi
parte".

Las reglas se prueban con el emulador oficial: `npm run probar:reglas`, 17 casos.

---

## 5. Reglas de producto

### Los cuatro criterios

| Criterio | La pregunta de verdad |
|---|---|
| Limpieza | ¿Se puede comer en el suelo o huele a muerte? |
| Espacio | ¿Caben las rodillas al cerrar la puerta? |
| Intimidad | ¿El pestillo es de verdad o es decorativo? |
| Suministros | ¿Hay papel y jabón o toca improvisar? |

Cada puntuación suelta tiene nombre: **Infierno · Malo · Justito · Bien ·
Gloria**. La nota de una reseña es la media de los cuatro; la de un bar, la media
de las reseñas del aseo que estés mirando.

### Los veredictos

| Media | Veredicto | Color | Frase |
|---|---|---|---|
| ≥ 4,2 | Vía libre | `#C6FF3D` | Entra tranquilo, incluso con tiempo. |
| ≥ 3,5 | Se puede | `#9BE03A` | Nada que objetar si no te paras a mirar. |
| ≥ 2,5 | Aprieta y reza | `#FFB800` | Entra con prisa y no toques nada. |
| ≥ 1,6 | Mal asunto | `#FF7A2F` | Solo si no queda otra en 500 metros. |
| < 1,6 | Ni de coña | `#FF3B30` | Aguanta hasta casa. Hazme caso. |
| sin datos | Sin catar | `#4A4A52` | Nadie se ha atrevido todavía. |

Por debajo de 1,6 la chapa **late** en el mapa. Con media ≥ 4,5 y dos votos o
más, el bar se lleva el **Rollo de Oro** 👑 (aro dorado en la chapa).

### La ubicación

- **Nunca se pide al cargar**: solo al pulsar "Los más cercanos" o el modo
  urgencia.
- Si se deniega, la app sigue entera ordenando por nota, y lo dice sin insistir.
- No se guarda ni se envía: vive en memoria y se pierde al recargar.
- Con ubicación, **el modo urgencia cambia de criterio**: deja de abrir el mejor
  valorado y abre **el baño decente (≥ 3,5) que más cerca te pilla**; si ninguno
  aprueba, el más cercano a secas.

---

## 6. Identidad visual

Dirección **"fanzine nocturno"**: asfalto de madrugada, rotulador magenta, verde
ácido de neón, ámbar de bar para los premios, papel de fotocopia para el texto.
Marcos negros de 3 px, sombras duras sin difuminar y un grano de fotocopia sobre
todo el fondo. Tema oscuro único, a propósito.

### Paleta

| Uso | Token | Hex |
|---|---|---|
| Fondo | `asfalto-900` | `#0C0C0D` |
| Paneles | `asfalto-800` / `asfalto-700` | `#141417` / `#1C1C21` |
| Bordes | `borde` | `#2A2A31` |
| Marca | `marca` | `#FF2E88` |
| Vía libre / acento | `acido` | `#C6FF3D` |
| Premios y avisos | `ambar` | `#FFB800` |
| Alarma | `alarma` | `#FF3B30` |
| Texto | `papel` / `papel-apagado` | `#F2ECDF` / `#B9B2A4` |

### Tipografía

- **Anton** — titulares y cifras (clase `.grito`, siempre en mayúsculas).
- **Manrope** — texto corrido.
- **Space Mono** — rótulos, datos y metadatos.

### El logo

Un rollo de papel higiénico del que cae el papel: al desenrollarse recorre el
suelo y se levanta dibujando una **M** mayúscula de Madrid. Todo SVG, sin
dependencias, en `src/components/Logo.tsx` (`viewBox="0 0 128 68"`):

```
Papel (trazo 9, magenta #FF2E88, extremos redondos):
  M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57
Perforado (mismo path, trazo 2, verde ácido #C6FF3D, dasharray "2 8")
Cuerpo del rollo (papel #F2ECDF, contorno negro 3):
  M9 20 h30 v28 a15 7 0 0 1 -30 0 z
Tapa: ellipse cx=24 cy=20 rx=15 ry=7
Canuto: ellipse cx=24 cy=20 rx=5 ry=2.3, relleno ámbar #FFB800
```

El papel sale por debajo del rollo, de ahí que el trazo se dibuje antes que el
cuerpo. Hay una variante monolínea del rollo para los iconos de puntuación.

### Voz

Callejera y directa, sin crueldad: "Antes de entrar a ese baño, mira la nota y
reza", "Aprieta y reza", "Ni de coña", "Partes de guerra", "El aviso para el
siguiente". El humor escatológico es parte del producto; los insultos no.

---

## 7. Funcionalidades, una a una

1. **Mapa oscuro de Madrid** (`ColorScheme.DARK`) centrado en Sol, con una chapa
   inclinada por bar: nota, veredicto y color. Las catastróficas laten. Pulsar
   abre la ficha; el mapa viaja al bar elegido desde cualquier listado.
2. **Buscador de Places** con UI propia: primero los bares ya fichados
   (instantáneo, sin gastar cuota), debajo las sugerencias de Google. Debounce de
   280 ms, token de sesión para facturación y respaldo automático a la API
   clásica.
3. **Filtro de aseo** — Todos · ♀ Femenino · ♂ Masculino · ⚲ Único — que manda en
   mapa, rankings y ficha.
4. **Ficha del baño**: nota a tamaño cartel, veredicto, resumen de los tres aseos,
   parte técnico por criterio con "cuántos lo suspenden", comentarios firmados y
   enlace a Google Maps. BottomSheet en móvil, cartel centrado en escritorio.
5. **Formulario**: elegir aseo (obligatorio), cuatro escalas de rollos con nombre
   por grado, veredicto recalculado en vivo, comentario y publicación firmada.
   Corregir y retirar lo tuyo.
6. **Cuentas**: registro e inicio de sesión con correo y contraseña, sesión
   persistente, alias visible. Leer es libre; firmar exige cuenta.
7. **Rankings**: El podio 🥇🥈🥉, La lista negra ☠️ y Cerca de ti 📍.
8. **Modo urgencia**: un botón que abre el baño decente más cercano.
9. **Resumen de cabecera**: baños fichados, nota media y Rollos de Oro.
10. **Vídeos**: `npm run demo` (16:9, 1:11) y `npm run demo:reel` (9:16, 0:32),
    grabados sobre la app real con rótulos, cursor visible y carteles.

---

## 8. Puesta en marcha

```bash
npm install
cp .env.example .env.local     # claves
npm run dev                    # http://localhost:3000
```

| Variable | Para qué | Si falta |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa y buscador | Mapa simulado |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Marcadores avanzados | `DEMO_MAP_ID` (marca de agua) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Cuentas y datos | Modo local |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Cuentas y datos | Modo local |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Cuentas y datos | Modo local |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Cuentas y datos | Modo local |

En Google Cloud: habilitar **Maps JavaScript API** y **Places API (New)**, crear
clave restringida por dominio y un **Map ID** vectorial. En Firebase: activar el
acceso por correo, crear la base de datos de Firestore y copiar la configuración
web. Todo en el mismo proyecto.

La app se exporta estática (`output: "export"`) y se publica en Firebase Hosting
con `npm run desplegar`, que además sube las reglas. Plan gratuito, sin funciones.

---

## 9. Lo que falta y lo que duele

- **Moderación**: no hay forma de denunciar un parte ni de esconder lo denunciado.
  Es lo primero que hará falta el día que entre gente de verdad.
- **Fotos del baño**: lo más pedido en este tipo de apps y lo más delicado
  (consentimiento, intimidad, moderación).
- **Escucha en vivo**: el mapa no se actualiza solo cuando alguien publica (`onSnapshot`).
- **Accesibilidad del producto** (no del código): falta marcar si el baño es
  accesible en silla, si tiene cambiador, y si hay que pedir llave o consumir.
- **Horarios**: saber si el bar está abierto ahora mismo (Places lo da).
- **Sin tests automatizados**: todo se ha verificado con Playwright a mano. Falta
  una suite que corra en CI.
- **Compilar los binarios**: los proyectos nativos se generan con `cap add`,
  pero compilarlos exige macOS con Xcode (iOS) y el SDK de Android.
- **Borrado de cuenta desde la app**: Apple lo exige para publicar, y no está.
- **El bundle**: 185 kB de first load, de los cuales buena parte es
  el SDK de Firebase entero para usar solo auth y dos colecciones.
