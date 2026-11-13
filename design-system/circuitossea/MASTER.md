# CircuitosSEA · sistema de diseño de la portada («hoja de plano»)

Fuente de verdad de la identidad visual de la portada. Reglas de accesibilidad y de interfaz tomadas de la skill
`ui-ux-pro-max` (instalada en `.claude/skills/ui-ux-pro-max`); el concepto es propio: la página es un juego de hojas de plano.

## Concepto
Cada sección es una **hoja** (`−H1`…`−H6`) con su designación, título y **cajetín** normalizado. Los esquemas llevan
marco con referencias de zona (A–F / 1–4), designaciones de aparamenta (−Q1 IGA, −Q2 ID, −G1 red…) y símbolos unifilares.
La navegación lateral («espina») es una línea de conductores (marrón, negro, gris) con un terminal numerado por hoja.
Lo único «animado» es corriente (puntos de mostaza sobre la tinta) y la nube de revisión que se dibuja sobre «No en la obra».

## Tokens
| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#F3EFE8` | Fondo (papel de delineación con cuadrícula de 32/160 px) |
| `--sheet` | `#FBF9F4` | Superficie de los planos y formularios |
| `--ink` | `#2A2622` | Tinta, bordes, texto principal (contraste 13:1) |
| `--ink2` / `--mut` | `#4A433B` / `#6B6358` | Texto secundario (8,5:1 / 5,2:1) |
| `--terra` | `#A84A24` | Anotación y énfasis (≥ 4,5:1 sobre `--paper`) |
| `--mos` | `#EFCD2F` | Marcador: subrayado de botones y de palabras clave, corriente |
| `--sal` | `#2F6B58` | «Verificado» |
| Conductores | marrón `#7A4B2A`, negro `#1b1916`, gris `#8A8F96` | Espina de navegación |

## Tipografía (incrustada, OFL; `src/fonts/`)
- Titulares y botones: **Barlow Condensed** 600/700, mayúsculas.
- Cuerpo: **Barlow** 400/500/600, 17–19 px, interlineado 1,55–1,65.
- Designaciones, etiquetas y datos: **IBM Plex Mono** 400/500.

## Reglas
- Sin emoji como iconos: SVG de línea (`src/ui/icons.tsx`).
- Objetivos táctiles ≥ 44 px; foco visible (3 px, `--terra`); respeta `prefers-reduced-motion`.
- Bordes rectos y sombra dura (`12px 12px 0`) en lugar de tarjetas redondeadas y degradados.
- Cada dato normativo muestra su fuente y su marca «Verificado» / «A verificar».
- Responsive probado a 390, 768, 1024 y 1440 px; sin desplazamiento horizontal.

## Pendiente de alinear
El interior de la aplicación (simulador y juegos) mantiene su estilo actual de taller oscuro/cianotipo.
