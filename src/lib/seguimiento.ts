import { useLocal } from './almacen-local';

export const ESTADOS = ['pendiente', 'enviado', 'respuesta', 'entrevista', 'aceptado', 'descartado'] as const;
export type EstadoSeguimiento = (typeof ESTADOS)[number];

export const NOMBRE_ESTADO: Record<EstadoSeguimiento, string> = {
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  respuesta: 'Con respuesta',
  entrevista: 'Entrevista',
  aceptado: 'Aceptado',
  descartado: 'Descartado',
};

export const COLOR_ESTADO: Record<EstadoSeguimiento, string> = {
  pendiente: 'bg-hueso',
  enviado: 'bg-amarillo-claro',
  respuesta: 'bg-salvia-claro',
  entrevista: 'bg-salvia',
  aceptado: 'bg-exito text-white',
  descartado: 'bg-terracota-claro',
};

export interface EntradaSeguimiento {
  nombre: string;
  estado: EstadoSeguimiento;
  /** Fechas ISO en que se abrió un borrador para esta empresa desde este dispositivo. */
  contactos: string[];
  notas: string;
  actualizado: string;
}

export type Seguimiento = Record<string, EntradaSeguimiento>;

export function useSeguimiento() {
  const [seg, fijar] = useLocal<Seguimiento>('seguimiento', {});

  const actualizar = (id: string, nombre: string, cambios: Partial<EntradaSeguimiento>) =>
    fijar((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { estado: 'pendiente', contactos: [], notas: '' }),
        nombre,
        ...cambios,
        actualizado: new Date().toISOString(),
      },
    }));

  const registrarContacto = (id: string, nombre: string) =>
    fijar((prev) => {
      const e = prev[id];
      return {
        ...prev,
        [id]: {
          nombre,
          estado: e?.estado ?? 'pendiente',
          notas: e?.notas ?? '',
          contactos: [...(e?.contactos ?? []), new Date().toISOString()],
          actualizado: new Date().toISOString(),
        },
      };
    });

  const quitar = (id: string) =>
    fijar((prev) => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });

  return { seguimiento: seg, actualizar, registrarContacto, quitar };
}
