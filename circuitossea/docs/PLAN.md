# CircuitosSEA · Fase 0 · Plan y arquitectura

## 1. Arquitectura

```
circuitossea/
├─ src/
│  ├─ engine/      Motor de simulación PURO (sin DOM, sin React). Tests con Vitest.
│  │   solver.ts   Eliminación gaussiana con pivote parcial (detecta singularidad)
│  │   dc.ts       Análisis nodal modificado (MNA) en continua
│  │   (fases 3+)  ac.ts fasores · transient.ts · protections.ts · cables.ts
│  ├─ model/       Modelo ÚNICO del circuito (lógico) + datos de representación
│  │   types.ts    Component, Wire, Project
│  │   library.ts  Definición de componentes por datos (terminales, símbolo, modelo)
│  │   netlist.ts  Cableado -> nudos (union-find) -> netlist del motor, y corrientes por cable
│  │   migrate.ts  Versionado del formato de proyecto
│  ├─ data/        Tablas normativas con fuente citada (fase 6): REBT, secciones, resistividades
│  ├─ i18n/        Cadenas (es-ES por defecto, estructura lista para más idiomas)
│  ├─ ui/          React: Canvas SVG, Paleta, Propiedades, Barra, Avisos
│  ├─ store.ts     Estado (Zustand) con historial deshacer/rehacer
│  └─ main.tsx
├─ docs/           Plan, ayuda "qué simula y qué no"
└─ tests/          (E2E Playwright a partir de fase 2)
```

### Modelo de datos
- **Lógico**: `Component{id,type,params}`, `Wire{a:{comp,term}, b:{comp,term}}`. Los nudos se derivan por union-find de los cables; el netlist del motor se genera a partir de ahí. Nada del motor conoce la geometría.
- **Representación**: `Component.pos[view]` con una posición por vista (`schematic`, `unifilar`, `multifilar`, `real`). Si falta una posición, se autogenera. Cambiar de vista **no toca** el modelo lógico.
- **Cable**: sección, color, longitud, material (campos reservados desde ya para fases 4-6).
- **Proyecto**: `{version, components, wires, view, settings}` + migraciones por versión.

## 2. Decisiones técnicas
| Decisión | Motivo |
|---|---|
| TypeScript + Vite + React | Estándar, rápido, tipado fuerte para el motor |
| SVG para el lienzo | Nítido, escalable, exportable a SVG/PDF; 150 componentes caben de sobra |
| Zustand + historial por instantáneas | Simple; deshacer/rehacer ilimitado con proyectos pequeños |
| Motor MNA propio (matriz densa) | <300 nudos: densa es suficiente, sin dependencias, testeable |
| Componentes por datos | Añadir uno = una entrada en `library.ts` |
| Corriente por cable con árbol de expansión | Permite animar sentido/intensidad en empalmes sin simular cables como resistencias |
| Sin backend; PWA (fase 10) | Hosting gratis (Netlify/GitHub Pages) y uso offline |

## 3. Fases y criterios de «hecho»
Los de la tabla del encargo. Estado: ver README. Fase 1 = circuito de 2 pilas con carga → 5 V / 5 A visible en pantalla y cubierto por test.

## 4. Riesgos
| Riesgo | Mitigación |
|---|---|
| Tres vistas desde un solo modelo | Posiciones por vista en el modelo; símbolo por vista en `library.ts`; autolayout cuando falta |
| Matrices singulares / nudos flotantes | Detección previa (conectividad) + pivote con tolerancia + mensajes en español; gmin solo como último recurso y con aviso |
| Conmutación (contactores, protecciones) | Simulación por pasos: resolver → evaluar disparos → reconfigurar → resolver (fase 6/8) |
| Normativa REBT | Datos en archivos aparte con fuente; si hay duda, valor configurable y marcado «a verificar» |
| Alcance enorme | Entregar por fases, versión simplificada documentada en cada una |
