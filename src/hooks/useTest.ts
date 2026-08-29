import { useCallback, useEffect, useMemo, useState } from 'react';
import { PREGUNTAS, TOTAL_PREGUNTAS } from '../data/questions';
import { calcularResultado, rehidratarResultado } from '../lib/scoring';
import {
  borrarProgreso,
  borrarResultado,
  cargarProgreso,
  cargarResultado,
  guardarProgreso,
  guardarResultado,
} from '../lib/storage';
import type { Resultado, Respuestas, SituacionId } from '../types';

/**
 * Estado del test.
 *
 * `paso` 0 es la eleccion de situacion academica; a partir de ahi cada paso es
 * una pregunta. Cada cambio se persiste, de modo que cerrar la pestana a medias
 * no cuesta nada: al volver, la app ofrece retomar donde se quedo.
 */
export function useTest() {
  const [situacion, setSituacion] = useState<SituacionId | null>(null);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [paso, setPaso] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [hayProgresoGuardado, setHayProgresoGuardado] = useState(false);

  // Rehidratacion inicial desde localStorage.
  useEffect(() => {
    const guardado = cargarResultado();
    if (guardado) setResultado(rehidratarResultado(guardado));

    const progreso = cargarProgreso();
    if (progreso && progreso.situacion) {
      setHayProgresoGuardado(Object.keys(progreso.respuestas).length > 0);
    }
  }, []);

  // Persistencia del progreso en curso.
  useEffect(() => {
    if (!situacion) return;
    guardarProgreso({ situacion, respuestas, paso });
  }, [situacion, respuestas, paso]);

  const retomarProgreso = useCallback(() => {
    const progreso = cargarProgreso();
    if (!progreso?.situacion) return false;

    setSituacion(progreso.situacion);
    setRespuestas(progreso.respuestas);
    setPaso(Math.min(Math.max(progreso.paso, 0), TOTAL_PREGUNTAS));
    setHayProgresoGuardado(false);
    return true;
  }, []);

  const descartarProgreso = useCallback(() => {
    borrarProgreso();
    setHayProgresoGuardado(false);
  }, []);

  const elegirSituacion = useCallback((id: SituacionId) => {
    setSituacion(id);
    setPaso(1);
  }, []);

  const responder = useCallback((preguntaId: string, opcionId: string) => {
    setRespuestas((actuales) => ({ ...actuales, [preguntaId]: opcionId }));
  }, []);

  const avanzar = useCallback(() => {
    setPaso((actual) => Math.min(actual + 1, TOTAL_PREGUNTAS));
  }, []);

  const retroceder = useCallback(() => {
    setPaso((actual) => Math.max(actual - 1, 0));
  }, []);

  /** Recalcula y persiste el resultado. Devuelve null si falta algo. */
  const finalizar = useCallback((): Resultado | null => {
    if (!situacion) return null;

    const calculado = calcularResultado(situacion, respuestas);
    setResultado(calculado);
    guardarResultado(calculado);
    borrarProgreso();
    return calculado;
  }, [situacion, respuestas]);

  const reiniciar = useCallback(() => {
    setSituacion(null);
    setRespuestas({});
    setPaso(0);
    setResultado(null);
    setHayProgresoGuardado(false);
    borrarProgreso();
    borrarResultado();
  }, []);

  /** Pregunta activa, o null si estamos en el paso de situacion. */
  const preguntaActual = useMemo(() => {
    if (paso < 1 || paso > TOTAL_PREGUNTAS) return null;
    return PREGUNTAS[paso - 1] ?? null;
  }, [paso]);

  const respondidas = useMemo(
    () => PREGUNTAS.filter((p) => Boolean(respuestas[p.id])).length,
    [respuestas],
  );

  const completo = respondidas === TOTAL_PREGUNTAS && situacion !== null;

  /** Porcentaje de avance incluyendo el paso de situacion. */
  const progreso = Math.round((paso / (TOTAL_PREGUNTAS + 1)) * 100);

  return {
    situacion,
    respuestas,
    paso,
    preguntaActual,
    respondidas,
    completo,
    progreso,
    resultado,
    hayProgresoGuardado,
    elegirSituacion,
    responder,
    avanzar,
    retroceder,
    finalizar,
    reiniciar,
    retomarProgreso,
    descartarProgreso,
  };
}
