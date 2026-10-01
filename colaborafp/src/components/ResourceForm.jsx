import { CodeXml, FileText, Link2, Paperclip, Send, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { LANGUAGES, MAX_CONTENT_LENGTH, MAX_FILE_SIZE, RESOURCE_TYPES } from '../utils/constants';
import { formatBytes, validateFile } from '../utils/files';

const TYPE_ICONS = { code: CodeXml, task: FileText, link: Link2, file: Paperclip };
const PLACEHOLDERS = {
  code: 'def saludar(nombre):\n    return f"Hola, {nombre}"',
  task: 'Ejercicio 3: Crea una función que reciba una lista de notas y devuelva la media.\nUsa `sum()` y `len()`.',
  link: 'https://developer.mozilla.org/es/',
};

const emptyDraft = (language) => ({ type: 'code', language, title: '', content: '', file: null });

/**
 * Formulario único para emitir recursos (profesor) o proponerlos (alumno).
 * `onSubmit(draft)` debe lanzar un Error con mensaje legible si falla.
 */
export default function ResourceForm({ onSubmit, submitLabel = 'Publicar', submittingLabel = 'Enviando…', children, idPrefix = 'res' }) {
  const [lastLanguage, setLastLanguage] = useState('python');
  const [draft, setDraft] = useState(() => emptyDraft('python'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const ready = draft.type === 'file' ? !!draft.file : !!draft.content.trim();

  const pickFile = (file) => {
    if (!file) return;
    const problem = validateFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    set({ file, title: draft.title });
  };

  const set = (patch) => {
    setError(null);
    setDraft((d) => ({ ...d, ...patch }));
  };

  // Tab inserta 4 espacios en el editor de código en lugar de saltar de campo
  const handleKeyDown = (e) => {
    if (draft.type !== 'code' || e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const { selectionStart: start, selectionEnd: end, value } = e.target;
    const next = `${value.slice(0, start)}    ${value.slice(end)}`;
    set({ content: next });
    requestAnimationFrame(() => {
      e.target.selectionStart = e.target.selectionEnd = start + 4;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(draft);
      setDraft({ ...emptyDraft(lastLanguage), type: draft.type });
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div role="tablist" aria-label="Tipo de recurso" className="grid grid-cols-2 gap-1 sm:grid-cols-4 rounded-xl bg-stone-100 p-1 dark:bg-ink-850">
        {Object.entries(RESOURCE_TYPES).map(([type, { label }]) => {
          const Icon = TYPE_ICONS[type];
          const active = draft.type === type;
          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => set({ type })}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-white text-ink-950 shadow-sm ring-1 ring-stone-200 dark:bg-ink-700 dark:text-white dark:ring-0'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div className={draft.type === 'code' ? 'grid gap-3 sm:grid-cols-[1fr_11rem]' : ''}>
        <div>
          <label className="label" htmlFor={`${idPrefix}-title`}>
            Título <span className="font-normal text-stone-400">(opcional)</span>
          </label>
          <input
            id={`${idPrefix}-title`}
            className="input"
            maxLength={120}
            placeholder={{ link: 'Documentación oficial de…', file: 'Ej.: Plantilla de la práctica 2' }[draft.type] ?? 'Ej.: Bucle for con range()'}
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>
        {draft.type === 'code' && (
          <div>
            <label className="label" htmlFor={`${idPrefix}-lang`}>
              Lenguaje
            </label>
            <select
              id={`${idPrefix}-lang`}
              className="input"
              value={draft.language}
              onChange={(e) => {
                setLastLanguage(e.target.value);
                set({ language: e.target.value });
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-content`}>
          {{ code: 'Código', task: 'Enunciado', link: 'URL', file: 'Archivo' }[draft.type]}
        </label>
        {draft.type === 'file' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-5 text-center transition ${
              dragging
                ? 'border-brand-400 bg-brand-50 dark:bg-brand-400/10'
                : 'border-stone-300 bg-stone-50 dark:border-ink-700 dark:bg-ink-850'
            }`}
          >
            <input
              ref={fileInput}
              id={`${idPrefix}-content`}
              type="file"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {draft.file ? (
              <div className="flex items-center gap-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300">
                  <Paperclip className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{draft.file.name}</span>
                  <span className="block text-xs text-stone-500">{formatBytes(draft.file.size)}</span>
                </span>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  aria-label="Quitar archivo"
                  onClick={() => {
                    set({ file: null });
                    if (fileInput.current) fileInput.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label htmlFor={`${idPrefix}-content`} className="flex cursor-pointer flex-col items-center gap-2">
                <Upload className="h-7 w-7 text-brand-500" />
                <span className="text-sm font-semibold">
                  Arrastra un archivo o <span className="text-brand-700 underline underline-offset-2 dark:text-brand-400">selecciónalo</span>
                </span>
                <span className="text-xs text-stone-500">PDF, imágenes, documentos, .zip… · máx. {formatBytes(MAX_FILE_SIZE)}</span>
              </label>
            )}
          </div>
        ) : draft.type === 'link' ? (
          <input
            id={`${idPrefix}-content`}
            className="input font-mono"
            type="text"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={PLACEHOLDERS.link}
            value={draft.content}
            onChange={(e) => set({ content: e.target.value })}
          />
        ) : (
          <textarea
            id={`${idPrefix}-content`}
            className={`input min-h-[11rem] resize-y scroll-thin ${
              draft.type === 'code' ? 'bg-[#1e1b19] font-mono text-[13px] leading-6 text-stone-100 dark:bg-[#1e1b19]' : ''
            }`}
            spellCheck={draft.type !== 'code'}
            maxLength={MAX_CONTENT_LENGTH}
            placeholder={PLACEHOLDERS[draft.type]}
            value={draft.content}
            onChange={(e) => set({ content: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      {children}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={submitting || !ready}>
        <Send className="h-4 w-4" />
        {submitting ? (draft.type === 'file' ? 'Subiendo archivo…' : submittingLabel) : submitLabel}
      </button>
    </form>
  );
}
