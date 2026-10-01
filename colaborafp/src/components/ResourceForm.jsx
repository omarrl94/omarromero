import { CodeXml, FileText, Link2, Send } from 'lucide-react';
import { useState } from 'react';
import { LANGUAGES, MAX_CONTENT_LENGTH, RESOURCE_TYPES } from '../utils/constants';

const TYPE_ICONS = { code: CodeXml, task: FileText, link: Link2 };
const PLACEHOLDERS = {
  code: 'def saludar(nombre):\n    return f"Hola, {nombre}"',
  task: 'Ejercicio 3: Crea una función que reciba una lista de notas y devuelva la media.\nUsa `sum()` y `len()`.',
  link: 'https://developer.mozilla.org/es/',
};

const emptyDraft = (language) => ({ type: 'code', language, title: '', content: '' });

/**
 * Formulario único para emitir recursos (profesor) o proponerlos (alumno).
 * `onSubmit(draft)` debe lanzar un Error con mensaje legible si falla.
 */
export default function ResourceForm({ onSubmit, submitLabel = 'Publicar', submittingLabel = 'Enviando…', children, idPrefix = 'res' }) {
  const [lastLanguage, setLastLanguage] = useState('python');
  const [draft, setDraft] = useState(() => emptyDraft('python'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div role="tablist" aria-label="Tipo de recurso" className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-ink-850">
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
            placeholder={draft.type === 'link' ? 'Documentación oficial de…' : 'Ej.: Bucle for con range()'}
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
          {draft.type === 'code' ? 'Código' : draft.type === 'task' ? 'Enunciado' : 'URL'}
        </label>
        {draft.type === 'link' ? (
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

      <button type="submit" className="btn-primary w-full" disabled={submitting || !draft.content.trim()}>
        <Send className="h-4 w-4" />
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
