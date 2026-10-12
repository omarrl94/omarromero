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

Sin clave la app **no se rompe**: en el hueco del mapa sale qué hay que configurar, y el ranking, la ficha y el formulario siguen funcionando con los datos de ejemplo.

### La clave de Google

1. [console.cloud.google.com](https://console.cloud.google.com/) → nuevo proyecto.
2. **APIs y servicios → Biblioteca**, habilita **Maps JavaScript API** y **Places API (New)**.
3. **Credenciales → Clave de API**, y restríngela por *HTTP referrers* (`http://localhost:3000/*` y tu dominio).
4. Crea un **Map ID** (Maps Platform → Gestión de mapas, tipo JavaScript vectorial): los marcadores avanzados —las chapas de colores— no se pintan sin él.

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...tu-clave
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
```

El mapa se pide en modo oscuro con `colorScheme={ColorScheme.DARK}`, así que no hace falta estilarlo a mano en Cloud Console para que pegue con la app.

---

## Cómo funciona

### Los bares no se crean a mano

El identificador de un local es su **`place_id` de Google**. El usuario escribe en el buscador, Google Places autocompleta, y al elegir un sitio se "adopta": guardamos `place_id`, nombre, dirección y coordenadas oficiales. Cero duplicados, cero nombres mal escritos.

El buscador ofrece primero los bares ya fichados (instantáneo, sin gastar cuota) y debajo las sugerencias de Google. Usa la Places API nueva (`AutocompleteSuggestion`) y cae sola a la clásica (`AutocompleteService`) si la clave solo tiene esa.

### Las notas

| Categoría | La pregunta de verdad |
|---|---|
| Limpieza | ¿Se puede comer en el suelo o huele a muerte? |
| Espacio | ¿Caben las rodillas al cerrar la puerta? |
| Intimidad | ¿El pestillo es de verdad o es decorativo? |
| Suministros | ¿Hay papel y jabón o toca improvisar? |

Cada puntuación suelta tiene nombre: **Infierno · Malo · Justito · Bien · Gloria**. La nota global es la media de las cuatro, y la del bar la media de todas sus reseñas. De ahí sale el veredicto, que es lo que se lee en la chapa del mapa:

| Nota media | Veredicto | Color |
|---|---|---|
| ≥ 4,2 | Vía libre | `#C6FF3D` |
| ≥ 3,5 | Se puede | `#9BE03A` |
| ≥ 2,5 | Aprieta y reza | `#FFB800` |
| ≥ 1,6 | Mal asunto | `#FF7A2F` |
| < 1,6 | Ni de coña | `#FF3B30` (la chapa late) |

Los que superan **4,5 con dos votos o más** se llevan el **Rollo de Oro** 👑.

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
│  ├─ layout.tsx              Fuentes (Anton · Manrope · Space Mono) y metadatos
│  ├─ page.tsx                Monta el provider y la app
│  └─ globals.css             Asfalto, grano, botones y paneles (@layer components)
├─ components/
│  ├─ RolloApp.tsx            ★ La app: titular, mapa, rankings y ficha
│  ├─ MapaRollos.tsx          Google Maps en modo oscuro + cámara
│  ├─ ChapaBar.tsx            La chapa pegada sobre cada bar (AdvancedMarker)
│  ├─ Buscador.tsx            Google Places Autocomplete con UI propia
│  ├─ Ranking.tsx             El podio y la lista negra
│  ├─ FichaBar.tsx            BottomSheet en móvil, cartel en escritorio
│  ├─ FormularioValoracion.tsx  Las 4 categorías + veredicto en vivo
│  ├─ Rollitos.tsx            Escala de 1 a 5 rollos (monolínea)
│  ├─ Cabecera.tsx            Barra superior con buscador
│  ├─ Ticker.tsx              Los avisos de la casa, en bucle
│  ├─ AvisoSinClave.tsx       Qué hacer si falta la API key
│  └─ Logo.tsx                Logo SVG: el papel cae y dibuja una "M"
├─ hooks/
│  └─ usePlacesBuscador.ts    Autocompletado + detalle del sitio
└─ lib/
   ├─ types.ts                Bar, Review, BarConNota
   ├─ scores.ts               Medias, veredictos, grados y fechas
   ├─ mock-data.ts            5 bares clásicos con place_id inventados
   ├─ store.tsx               Estado global + persistencia
   └─ config.ts               Centro de Madrid, zooms y variables de entorno
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

---

## Siguiente parada

- Backend real (Postgres/Supabase) con las tablas `bares` y `reviews`.
- Cuentas de usuario: un voto por persona y bar.
- Fotos del baño (con moderación, que nos conocemos).
- Filtros: solo verdes, abiertos ahora, accesibles, con cambiador.
- Geolocalización para que el modo urgencia use la distancia real.
