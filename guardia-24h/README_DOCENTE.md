# Guía del docente

## Cómo se calcula la nota
- PE de un ítem = `pe_base × dificultad × factor_nivel` (N1 0,5 · N2 0,75 · N3 1 · N4 1,25 · N5 1,5).
- Cita correcta 100 %; respuesta correcta sin cita 70 %; cita correcta con respuesta incorrecta 0 %. Cada pista resta el 20 %.
- Error de seguridad grave: ítem a 0 y −10 % del PE máximo del nivel (tope −30 %).
- `RA_juego = ΣPE obtenidos ÷ ΣPE máximos × 10` (mejor intento; solo si hay ≥ 80 % de cobertura).
- `RA_final = a·RA_juego + (1−a)·RA_taller` (a = 0,4 por defecto, en `content/ra/ra.json`; sin nota de taller, `RA_final = RA_juego`).
- `Nota final = Σ RA × peso` (pesos en `content/ra/ra.json`). Aprobado: final ≥ 5 **y** cada RA ≥ 5.
Implementación y ejemplos numéricos: `src/game/grading.ts` y `grading.test.ts`.

## Añadir contenido (sin tocar código)
1. Ítems: un `.json` por ítem en `content/distritos/dN/` con el contrato de `src/data/schemas.ts` (`ItemSchema`). Nacen con `estado: "borrador"` y `verificado: false`.
2. Valores normativos: `content/norma/*.json` con `fuente` (documento, ITC, apartado/tabla).
3. REBT y manuales: `content/library/*.json` (secciones con `id`, `titulo`, `texto`). Copia el texto **oficial**.
4. `npm run content:validar` comprueba todo.

## Pendiente del profesor (TODO(profesor))
- Texto oficial del REBT y manuales (`content/library/rebt.json` está vacío a propósito).
- ITC exactas del RA4 (distrito 5), valores normativos a verificar, valor de `a`.
- Logotipo y fotos de cuadros; proyecto de Firebase y creación de clases.
- Los CE de `content/ra/ra.json` están transcritos del Anexo I del RD 1127/2010; verificar contra el currículo de Madrid.
