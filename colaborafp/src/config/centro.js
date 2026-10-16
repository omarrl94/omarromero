/**
 * Datos del titular para el aviso legal, la política de privacidad y el canal de contacto.
 * Se configuran con variables de entorno (Netlify → Project configuration → Environment variables).
 * Mientras falte alguno, las páginas legales lo muestran como «pendiente de completar».
 */
const env = import.meta.env;

export const CENTRO = {
  nombre: env.VITE_CENTRO_NOMBRE || 'Centro de Formación Profesional José Ramón Otero',
  titular: env.VITE_CENTRO_TITULAR || '', // razón social de la entidad titular
  nif: env.VITE_CENTRO_NIF || '',
  direccion: env.VITE_CENTRO_DIRECCION || '',
  email: env.VITE_CENTRO_EMAIL || '', // contacto general y notificación de contenidos
  telefono: env.VITE_CENTRO_TELEFONO || '',
  registro: env.VITE_CENTRO_REGISTRO || '', // código de centro / autorización administrativa
  dpd: env.VITE_CENTRO_DPD || '', // contacto del Delegado de Protección de Datos
  web: env.VITE_CENTRO_WEB || '',
};

export const LEGAL_VERSION = '15 de octubre de 2026';

/** Campos obligatorios para cumplir el art. 10 LSSI y el art. 13 RGPD. */
export const LEGAL_MISSING = ['titular', 'nif', 'direccion', 'email', 'dpd'].filter((k) => !CENTRO[k]);
