# CircuitosSEA

Simulador web de circuitos eléctricos para alumnos de FP (CFGS Sistemas Electrotécnicos y Automatizados).
Aplicación estática (sin backend): TypeScript + Vite + React + SVG. Licencia MIT.

> **Estado: Fases 1-2 de 10** (ver `docs/PLAN.md`). Lienzo, 24 componentes de CC con símbolos animados, motor MNA con diodos y protecciones, polímetro y hoja de medidas.

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

- **24 componentes**: pila, fuente de corriente, resistencia, potenciómetro, condensador, bobina, NTC, PTC, LDR, diodo, LED (4 colores), Zener, interruptor, pulsadores NA/NC, conmutador, fusible, magnetotérmico (B/C/D), lámpara, resistencia calefactora, zumbador, motor de CC, masa y empalme.
- **Visual**: el LED y la lámpara brillan según la corriente, el motor gira, el fusible se funde con humo, el zumbador suena, los interruptores se accionan con un clic y los pulsadores mientras se mantienen.
- **Averías persistentes**: fusible, magnetotérmico, LED y lámpara se estropean al superar sus límites y quedan así hasta «Reponer averías».
- **Polímetro**: V⎓ (10 MΩ), A⎓ (shunt 0,05 Ω, fusible de 10 A que se funde si mides en paralelo), Ω y continuidad (solo sin tensión), bornes VΩ / 10 A, puntas que se colocan sobre terminales y hoja de medidas con valor teórico, error absoluto/relativo y exportación CSV.

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
- Solo CC en régimen estático; la lámpara es una resistencia lineal R = Vn²/Pn; condensador = abierto y bobina = resistencia del hilo.
- Protecciones simplificadas: el fusible salta a 1,6·In y el magnetotérmico solo por umbral magnético; sus curvas tiempo-corriente reales llegan en la fase 6.
- Las puntas del polímetro se colocan en terminales (no sobre cables).
- Aún sin polímetro, CA, vistas unifilar/multifilar/real, plano, protecciones, automatismos, retos ni PWA (fases 2-10).
- No hay aviso de «circuito abierto» ni validación REBT todavía.
