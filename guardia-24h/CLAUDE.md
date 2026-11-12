# CLAUDE.md · Guardia 24 h

Proyecto en `guardia-24h/` (rama `guardia-24h`). No tocar CodeForge (raíz del repo, rama `codeforge-netlify`).

## Decisiones
- Vite + React + TS estricto + Tailwind + Zustand + React Router. Datos: Firebase (Auth anónima para alumnos, email para profesor, Firestore `eur3`) con modo local IndexedDB (`src/data/repo.ts` define el contrato).
- Colecciones Firestore con prefijo `guardia_`. Despliegue en Netlify.
- **No inventar normativa**: valores/textos del REBT solo en `content/` con `fuente` y `verificado:false`; dudas → `TODO(profesor)`.
- Contenido nuevo siempre `estado: "borrador"`. «Mi manual» nunca sale del dispositivo. No se llama a APIs de IA en el juego.

## Comandos
`npm run dev|test|lint|typecheck|content:validar|build|e2e|test:rules`

## Fases
0 esqueleto · 1 evaluación + D1 · 2 circuitos + D3/D4 · 3 D7/D2 (hecho) · 4 D6 · 5 D5/D8 + epílogo · 6 capa de juego (panel docente en nube pendiente). Interfaz estilo juego (mapa, estrellas, sonido) en src/components y src/pages. Un PR por fase.
