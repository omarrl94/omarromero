# CircuitosSEA

Simulador web de circuitos eléctricos para alumnos de FP (CFGS Sistemas Electrotécnicos y Automatizados).
Aplicación estática (sin backend): TypeScript + Vite + React + SVG. Licencia MIT.

> **Estado: Fase 1 de 10** (ver `docs/PLAN.md`). Lienzo, componentes básicos de CC y motor MNA con tests.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests del motor y del netlist
npm run build      # genera dist/ (alojable en Netlify / GitHub Pages)
```

## Qué hay hecho
- Motor MNA en continua (`src/engine`): resistencias, pilas con resistencia interna, fuentes de corriente, interruptores. Detecta lazos de fuentes, cortocircuitos y nudos flotantes con mensajes en español.
- Lienzo SVG: arrastrar desde la paleta, mover con imán a rejilla, girar (R), duplicar (Ctrl+D), borrar (Supr), deshacer/rehacer (Ctrl+Z/Y), zoom y desplazamiento, cableado pulsando terminal a terminal, empalmes.
- Corriente animada (sentido e intensidad), mapa de calor de tensiones, etiquetas V/I, lámpara que se ilumina.
- Panel de propiedades y de avisos, tema claro/oscuro, guardado automático local, abrir/guardar `.json`.
- Ejemplos: dos pilas en paralelo (Millman: **5 V y 5 A**), lámpara con interruptor, divisor de tensión.

## Estructura
```
src/engine/   motor puro (solver.ts, dc.ts) — sin DOM
src/model/    types, library (componentes por datos), netlist (cables→nudos), ejemplos
src/ui/       React + SVG
src/store.ts  estado + historial
docs/PLAN.md  arquitectura, decisiones, fases y riesgos
```

## Añadir un componente
1. Añade una entrada en `src/model/library.ts` (terminales, parámetros y modelo `R`/`V`/`I`/`SW`).
2. Añade su símbolo en `src/ui/symbols.tsx`.

## Limitaciones conocidas (Fase 1)
- Solo CC en régimen estático; la lámpara es una resistencia lineal R = Vn²/Pn.
- Aún sin polímetro, CA, vistas unifilar/multifilar/real, plano, protecciones, automatismos, retos ni PWA (fases 2-10).
- No hay aviso de «circuito abierto» ni validación REBT todavía.
