# Presentación de OrientaFP

Genera `OrientaFP-presentacion.pptx` en la raíz del repositorio: 20 diapositivas
con notas del ponente en cada una.

```bash
cd presentacion
npm install
npm run build
```

## Por qué está separado del proyecto

El generador necesita `pptxgenjs`, `sharp` y `react-icons` (para rasterizar los
iconos). La aplicación web no usa nada de eso, así que tiene su propio
`package.json` en lugar de ensuciar las dependencias de la app.

## Qué contiene

| Diapositivas | Contenido |
| --- | --- |
| 1–4 | Portada, el problema, la propuesta y el recorrido de uso |
| 5–9 | Guía, cuestionario, algoritmo, fórmula del encaje y resultados |
| 10–15 | Arquetipos, comparador, itinerarios, gemas ocultas, mitos e informe |
| 16–18 | Catálogo, arquitectura técnica y guardias de calidad |
| 19–20 | Honestidad de los datos, y estado y siguientes pasos |

La diapositiva 19 separa qué datos son verificables y cuáles son estimaciones
orientativas. No la quites de la presentación: es lo que sostiene la
credibilidad del resto.

## Editar

Las cifras del deck se escriben a mano en `build-deck.mjs`. Si cambia el
catálogo, actualiza los números de las diapositivas 1, 7 y 16, que son las que
los citan.

El fichero `.pptx` generado no se versiona: es un artefacto, igual que `dist/`.
