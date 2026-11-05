import { rm } from 'node:fs/promises';

/** Limpia el almacén local (límite de intentos) antes de cada ejecución. */
export default async function preparar() {
  await rm('.blobs-local', { recursive: true, force: true });
}
