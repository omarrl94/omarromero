import { backend } from '../services/backend';
import { MAX_ALIAS_LENGTH, MAX_CONTENT_LENGTH, RESOURCE_TYPES, TEACHER_AUTHOR } from './constants';
import { safeFileName } from './files';
import { safeUrl } from './format';
import { uuid } from './ids';

/**
 * Copias de seguridad de una sala: un archivo .colaborafp (JSON) que se guarda en el equipo del
 * profesor. Incluye solo lo publicado (aprobado); lo pendiente no se copia. Las aportaciones del
 * alumnado solo se incluyen si el profesor lo elige (llevan su alias).
 */
export const BACKUP_FORMAT = 'colaborafp-copia';
export const BACKUP_VERSION = 1;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ITEMS = 500;

const slug = (s) =>
  String(s || 'sala')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'sala';

/** Construye la copia de una sala y la descarga. Devuelve cuántos recursos incluye. */
export async function downloadBackup(room, { includeStudents = false, onProgress } = {}) {
  const all = await backend.resources.list(room.id, { role: 'teacher' });
  const items = all.filter((r) => r.status === 'approved' && (includeStudents || r.author === TEACHER_AUTHOR));
  const resources = [];
  for (const [i, r] of items.entries()) {
    const entry = { type: r.type, author: r.author, title: r.title || null, content: r.content, language: r.language || null };
    if (r.type === 'file') {
      const file = await backend.resources.getFile(r);
      entry.file = { name: r.content, type: r.file_type || 'application/octet-stream', size: r.file_size || null, data: file.data };
    }
    resources.push(entry);
    onProgress?.(i + 1, items.length);
  }
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    room: { name: room.name, module: room.module || null },
    resources,
  };
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(room.name)}-${new Date().toISOString().slice(0, 10)}.colaborafp`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return resources.length;
}

/** Lee y valida un archivo de copia. Lanza un error comprensible si no es válido. */
export async function readBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('El archivo no es una copia de ColaboraFP.');
  }
  if (data?.format !== BACKUP_FORMAT || !Array.isArray(data.resources)) throw new Error('El archivo no es una copia de ColaboraFP.');
  if (data.version > BACKUP_VERSION) throw new Error('Esta copia es de una versión más nueva de ColaboraFP.');
  if (data.resources.length > MAX_ITEMS) throw new Error(`La copia tiene demasiados recursos (máximo ${MAX_ITEMS}).`);

  const resources = [];
  for (const r of data.resources) {
    if (!RESOURCE_TYPES[r?.type]) continue;
    let content = typeof r.content === 'string' ? r.content.slice(0, MAX_CONTENT_LENGTH) : '';
    const item = {
      type: r.type,
      author: r.author === TEACHER_AUTHOR ? TEACHER_AUTHOR : String(r.author || 'Anónimo').slice(0, MAX_ALIAS_LENGTH),
      title: typeof r.title === 'string' && r.title.trim() ? r.title.trim().slice(0, 120) : null,
      language: r.type === 'code' ? String(r.language || 'text').slice(0, 20) : null,
    };
    if (r.type === 'link') content = safeUrl(content) || '';
    if (r.type === 'file') {
      const f = r.file;
      if (!f || typeof f.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.data)) continue;
      const size = Math.floor((f.data.length * 3) / 4) - (f.data.endsWith('==') ? 2 : f.data.endsWith('=') ? 1 : 0);
      if (!size || size > MAX_FILE_BYTES) continue;
      content = safeFileName(f.name || content || 'archivo');
      item.file = { data: f.data, type: String(f.type || 'application/octet-stream').slice(0, 120), size };
    }
    if (!content.trim()) continue;
    resources.push({ ...item, content });
  }
  return {
    name: String(data.room?.name || 'Sala restaurada').slice(0, 120),
    module: typeof data.room?.module === 'string' ? data.room.module.slice(0, 60) : null,
    exportedAt: data.exported_at || null,
    resources,
    skipped: data.resources.length - resources.length,
  };
}

/** Crea una sala nueva (cerrada) con el contenido de la copia. */
export async function restoreBackup(backup, { name, expireAt, teacherId, onProgress }) {
  const created = await backend.rooms.create({ name: name.trim(), module: backup.module, teacherId, expireAt });
  const room = await backend.rooms.setActive(created.id, false); // se abre cuando el profesor quiera
  const start = Date.now() - backup.resources.length;
  for (const [i, r] of backup.resources.entries()) {
    const resource = {
      id: uuid(),
      room_id: room.id,
      author: r.author,
      type: r.type,
      content: r.content,
      language: r.language,
      title: r.title,
      status: 'approved',
      timestamp: start + i, // mantiene el orden original
      expire_at: room.expire_at,
      ...(r.file ? { file_size: r.file.size, file_type: r.file.type } : {}),
    };
    await backend.resources.create(resource, r.file ? { data: r.file.data } : undefined);
    onProgress?.(i + 1, backup.resources.length);
  }
  return room;
}
