import type { Ciclo, ModalidadId } from '../../config/ffe.config';
import { useLocal } from './almacen-local';

export interface Alumno {
  nombre: string;
  ciclo: Ciclo | null;
  /** Curso (solo se pregunta en ciclos con FFE en 1.º y 2.º, como SEA). */
  curso?: 1 | 2 | null;
  perfiles: string[];
  zona: string | null;
  modalidad: ModalidadId | null;
  github: string;
  portfolio: string;
  linkedin: string;
  telefono: string;
}

export const ALUMNO_VACIO: Alumno = {
  nombre: '',
  ciclo: null,
  perfiles: [],
  zona: null,
  modalidad: null,
  github: '',
  portfolio: '',
  linkedin: '',
  telefono: '',
};

export function useAlumno() {
  return useLocal<Alumno>('alumno', ALUMNO_VACIO);
}
