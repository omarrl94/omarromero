import { BLOCKED_EXTENSIONS, MAX_FILE_SIZE } from './constants';

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const fileExtension = (name = '') => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
};

/** Comprueba tamaño y tipo. Devuelve un mensaje de error o null. */
export const validateFile = (file) => {
  if (!file) return 'Selecciona un archivo.';
  if (file.size === 0) return 'El archivo está vacío.';
  if (file.size > MAX_FILE_SIZE) return `El archivo supera el máximo de ${formatBytes(MAX_FILE_SIZE)}.`;
  if (BLOCKED_EXTENSIONS.includes(fileExtension(file.name)))
    return 'Por seguridad no se permiten ejecutables. Comprímelo en .zip si es necesario.';
  return null;
};

/** Nombre seguro para mostrar y descargar. */
export const safeFileName = (name) =>
  String(name || 'archivo')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .slice(0, 150);

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });

export const base64ToBlob = (b64, type) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: type || 'application/octet-stream' });
};

/** Descarga forzada (nunca se abre en la propia web, evita HTML/SVG activos). */
export const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFileName(name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const PREVIEWABLE_IMAGES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const isPreviewableImage = (type) => PREVIEWABLE_IMAGES.includes(type);
