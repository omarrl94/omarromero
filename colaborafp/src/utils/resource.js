import { MAX_ALIAS_LENGTH, MAX_CONTENT_LENGTH, RESOURCE_TYPES, TEACHER_AUTHOR } from './constants';
import { safeUrl } from './format';
import { uuid } from './ids';

/**
 * @typedef {Object} Resource
 * @property {string} id
 * @property {string} room_id
 * @property {'teacher' | string} author   'teacher' o el alias del alumno
 * @property {'code' | 'task' | 'link'} type
 * @property {string} content
 * @property {string} [language]
 * @property {string} [title]
 * @property {'pending' | 'approved'} status
 * @property {number} timestamp
 */

/** Valida y normaliza el borrador de un formulario. Devuelve { resource } o { error }. */
export const buildResource = ({ roomId, author, draft, status }) => {
  const type = draft.type;
  if (!RESOURCE_TYPES[type]) return { error: 'Tipo de recurso no válido.' };

  const content = String(draft.content ?? '').replace(/\s+$/, '');
  if (!content.trim()) return { error: 'El contenido no puede estar vacío.' };
  if (content.length > MAX_CONTENT_LENGTH)
    return { error: `El contenido supera el máximo de ${MAX_CONTENT_LENGTH} caracteres.` };

  let finalContent = content;
  if (type === 'link') {
    const withProtocol = /^https?:\/\//i.test(content.trim()) ? content.trim() : `https://${content.trim()}`;
    const url = safeUrl(withProtocol);
    if (!url) return { error: 'Introduce una URL válida (http o https).' };
    finalContent = url;
  }

  let finalAuthor = TEACHER_AUTHOR;
  if (author !== TEACHER_AUTHOR) {
    finalAuthor = String(author ?? '').trim().slice(0, MAX_ALIAS_LENGTH) || 'Anónimo';
    // Un alumno nunca puede firmar como el profesor
    if (finalAuthor.toLowerCase() === TEACHER_AUTHOR) finalAuthor = 'Anónimo';
  }

  const title = String(draft.title ?? '').trim().slice(0, 120);

  return {
    resource: {
      id: uuid(),
      room_id: roomId,
      author: finalAuthor,
      type,
      content: finalContent,
      language: type === 'code' ? draft.language || 'text' : null,
      title: title || null,
      status,
      timestamp: Date.now(),
    },
  };
};
