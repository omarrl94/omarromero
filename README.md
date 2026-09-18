# 🧻 Rollo Madrid

**El mapa comunitario de los baños de los bares de Madrid.** Busca el bar, mira la nota de su baño y entra sabiendo a qué te enfrentas. Cuatro categorías, de 1 a 5 rollos, y un comentario libre para las advertencias que salvan vidas.

> MVP funcional: Next.js 14 (App Router) + TypeScript + Tailwind + Google Maps. Las valoraciones viven de momento en el navegador (`localStorage`), listas para enchufarse a un backend real.

---

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # y pega tu clave de Google Maps
npm run dev                  # → http://localhost:3000
```

Sin clave la app **no se rompe**: en lugar del mapa muestra el buscador local y el ranking de baños, así puedes ver el flujo completo con los datos de ejemplo.

### La clave de Google

1. [console.cloud.google.com](https://console.cloud.google.com/) → nuevo proyecto.
2. **APIs y servicios → Biblioteca**, habilita **Maps JavaScript API** y **Places API (New)**.
3. **Credenciales → Clave de API**, y restríngela por *HTTP referrers* (`http://localhost:3000/*` y tu dominio).
4. Opcional: crea un **Map ID** (Maps Platform → Gestión de mapas) para quitar la marca de agua de `DEMO_MAP_ID`.

Variables (`.env.local`):

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...tu-clave
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
```

---

## Cómo funciona

### Los bares no se crean a mano

El identificador de un local es su **`place_id` de Google**. El usuario escribe en el buscador, Google Places autocompleta, y al elegir un sitio se "adopta": guardamos `place_id`, nombre, dirección y coordenadas oficiales. Cero duplicados, cero nombres mal escritos.

El buscador ofrece primero los bares que ya están en Rollo Madrid (instantáneo, sin gastar cuota) y debajo las sugerencias de Google. Usa la Places API nueva (`AutocompleteSuggestion`) y cae sola a la clásica (`AutocompleteService`) si la clave solo tiene esa.

### Las notas

| Categoría | La pregunta de verdad |
|---|---|
| 🧼 Limpieza | ¿Se puede comer en el suelo o huele a muerte? |
| 📏 Espacio | ¿Caben las rodillas al cerrar la puerta? |
| 🔒 Intimidad | ¿La puerta cierra bien y tiene pestillo de verdad? |
| 🧻 Suministros | ¿Hay papel y jabón o toca improvisar? |

La **nota global** es la media de las cuatro, y la nota del bar la media de todas sus reseñas. De ahí sale el color del pin:

| Nota media | Pin | Etiqueta |
|---|---|---|
| ≥ 3,5 | 🟢 verde | Zona de confort |
| ≥ 2,5 | 🟡 amarillo | Pasable con prisa |
| < 2,5 | 🔴 rojo | Zona catastrófica |

Los que superan **4,5 con dos reseñas o más** se llevan el **Rollo de Oro** 👑 (aro dorado en el pin).

### Estructura de datos

```ts
Bar    { place_id (PK), nombre, direccion, lat, lng }
Review { id, place_id (FK), limpieza, espacio, intimidad, suministros,
         comentario, autor, fecha }
```

Las notas no se guardan calculadas: se derivan en `src/lib/scores.ts`. Cuando haya backend, el esquema se traduce a dos tablas tal cual.

---

## Mapa del código

```
src/
├─ app/
│  ├─ layout.tsx              Metadatos, fuentes y estilos globales
│  ├─ page.tsx                Pantalla única: cabecera + mapa
│  └─ globals.css             Paleta papel, botones y tarjetas
├─ components/
│  ├─ MapaRollos.tsx          ★ Mapa de Madrid + buscador integrado
│  ├─ Buscador.tsx            Google Places Autocomplete (UI propia)
│  ├─ PinBar.tsx              Pin de color según la nota media
│  ├─ FichaBar.tsx            BottomSheet (móvil) / panel lateral (desktop)
│  ├─ FormularioValoracion.tsx  Las 4 categorías + comentario
│  ├─ Rollitos.tsx            Iconos de puntuación (rollos de papel)
│  ├─ ListaBares.tsx          Ranking (y alternativa si no hay mapa)
│  ├─ AvisoSinClave.tsx       Qué hacer si falta la API key
│  ├─ Cabecera.tsx            Barra superior
│  └─ Logo.tsx                Logo SVG: el papel cae y dibuja una "M"
├─ hooks/
│  └─ usePlacesBuscador.ts    Autocompletado + detalle del sitio
└─ lib/
   ├─ types.ts                Bar, Review, BarConNota
   ├─ scores.ts               Medias, niveles, colores, fechas
   ├─ mock-data.ts            5 bares clásicos con place_id inventados
   ├─ store.tsx               Estado global + persistencia
   └─ config.ts               Centro de Madrid, zooms y variables de entorno
```

### El logo

Un rollo de papel higiénico cuyo papel cae, recorre el suelo y se levanta dibujando una **M** mayúscula. Todo SVG (`src/components/Logo.tsx`): escala sin pixelarse y el degradado del papel va del azul agua al rojo Madrid.

---

## Paleta

| Uso | Color |
|---|---|
| Fondo papel | `papel-50/100/200` · `#FFFDF8 → #F1EADA` |
| Marca (agua) | `agua-500` · `#1E9FC6` |
| Detalles cartón | `carton-400/600` · `#C2A17B`, `#8B6A45` |
| Premios | `oro-400` · `#E0B252` |
| Acento Madrid | `madrid-500` · `#D0202E` |
| Notas | verde `#2E9E5B` · amarillo `#E0A526` · rojo `#D64541` |

Mobile-first de verdad: la ficha sube como BottomSheet, los rollitos son pulsables con el pulgar y todo se maneja con una mano. Que la gente lo usará desde el baño.

---

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run typecheck` | TypeScript en modo estricto |
| `npm run deploy` | Publicar en Netlify ([guía](DESPLIEGUE-NETLIFY.md)) |

---

## Siguiente parada

- Backend real (Postgres/Supabase) con las tablas `bares` y `reviews`.
- Cuentas de usuario: una reseña por persona y bar.
- Fotos del baño (con moderación, que nos conocemos).
- Filtros: solo verdes, abiertos ahora, accesibles, con cambiador.
- Modo "urgencia": el baño decente más cercano, en un toque.
