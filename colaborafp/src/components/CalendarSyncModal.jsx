import { Check, Copy, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { calendarFeedUrl, downloadIcs, googleSubscribeUrl, outlookSubscribeUrl, webcalUrl } from '../utils/calendar';
import Modal from './Modal';

/** Suscribirse al calendario desde Outlook (Microsoft 365), Google Calendar o el móvil. */
export default function CalendarSyncModal({ calendar, events, onClose }) {
  const [copied, setCopied] = useState(false);
  const feed = calendarFeedUrl(calendar.code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles: la dirección sigue visible para copiarla a mano */
    }
  };

  return (
    <Modal open onClose={onClose} title="Sincronizar con Outlook" size="md">
      <div className="space-y-5 text-sm">
        <p className="text-stone-700 dark:text-stone-300">
          Suscríbete y las fechas de <strong>{calendar.name}</strong> aparecerán en tu calendario de Outlook del centro. Cuando el profesorado añada,
          cambie o borre una fecha, se actualizará solo.
        </p>

        <a href={outlookSubscribeUrl(calendar.code, calendar.name)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Añadir a Outlook (Microsoft 365)
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <p className="-mt-3 text-xs text-stone-600 dark:text-stone-400">
          Se abre Outlook en el navegador con tu cuenta del centro: revisa el nombre y pulsa <strong>Importar</strong>. Aparecerá también en la app de
          Outlook del ordenador y del móvil.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <a href={webcalUrl(calendar.code)} className="btn-secondary">
            iPhone, Mac u Outlook de escritorio
          </a>
          <a href={googleSubscribeUrl(calendar.code)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Google Calendar <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div>
          <label className="label" htmlFor="feed-url">Dirección del calendario</label>
          <div className="flex gap-2">
            <input id="feed-url" className="input font-mono text-xs" readOnly value={feed} onFocus={(e) => e.target.select()} />
            <button type="button" className="btn-secondary shrink-0" onClick={copy}>
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copiada' : 'Copiar'}
            </button>
          </div>
        </div>

        <details className="rounded-xl border border-stone-200 p-3 dark:border-ink-700">
          <summary className="cursor-pointer font-semibold">Si el botón no funciona: hacerlo a mano en Outlook</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-700 dark:text-stone-300">
            <li>Abre <strong>Outlook</strong> (outlook.office.com) con tu cuenta del centro y ve a <strong>Calendario</strong>.</li>
            <li>Pulsa <strong>Agregar calendario</strong> → <strong>Suscribirse desde la web</strong>.</li>
            <li>Pega la dirección de arriba, ponle un nombre y pulsa <strong>Importar</strong>.</li>
          </ol>
        </details>

        <p className="rounded-xl bg-stone-100 px-3 py-2 text-xs text-stone-700 dark:bg-ink-800 dark:text-stone-300">
          Outlook revisa las suscripciones por su cuenta, normalmente cada pocas horas: un cambio puede tardar en verse allí. En ColaboraFP se ve al
          instante. Es de solo lectura: las fechas se cambian aquí, no en Outlook.
        </p>

        <button type="button" className="btn-ghost w-full text-xs" onClick={() => downloadIcs(calendar, events)}>
          <Download className="h-4 w-4" aria-hidden="true" /> Descargar una copia (.ics) que no se actualiza
        </button>
      </div>
    </Modal>
  );
}
