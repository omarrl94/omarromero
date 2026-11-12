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
0 esqueleto · 1 evaluación + D1 · 2 circuitos + D3/D4 · 3 D7/D2 (hecho) · 4 D6 (hecho) · 5 D5/D8 + epílogo (hecho) · 6 capa de juego (panel docente en nube pendiente). Interfaz estilo juego (mapa, estrellas, sonido) en src/components y src/pages. Un PR por fase.

## Teoría
Cada bloque tiene su lección en `content/teoria/dN.json` (esquema `TeoriaSchema`); se muestra en `/distrito/:id/teoria`. Todo en borrador hasta que lo valide el profesor.

## Simulación realista
Aparatos dibujados en SVG en `src/components/sim/Aparatos.tsx` (PIA, diferencial, IGA, regletas, cables, tubos, cajas, bandejas…) con defectos visuales (`visual`). Banco de pruebas en `Instrumento.tsx` (cuadro, base de enchufe, multímetro con selector y puntas, megóhmetro, pinza). Plano de local en `Plano.tsx`; documentos en `Documento.tsx`.
