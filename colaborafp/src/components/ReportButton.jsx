import { Flag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CENTRO } from '../config/centro';
import { useRoomFeed } from '../hooks/useRoomFeed';
import Modal from './Modal';

export const REPORT_REASONS = {
  'datos-personales': 'Contiene datos personales o imágenes de personas',
  inapropiado: 'Contenido ofensivo, inapropiado o ilícito',
  derechos: 'Infringe derechos de autor',
  otro: 'Otro motivo',
};

/** Canal de notificación de contenidos (LSSI): llega al profesor de la sala y, por correo, al centro. */
export default function ReportButton({ resource }) {
  const { reportContent, room } = useRoomFeed();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setReason('');
      setDetails('');
      setState('idle');
      setError(null);
    }, 200);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setState('sending');
    try {
      await reportContent(resource.id, reason, details);
      setState('sent');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  const subject = encodeURIComponent(`ColaboraFP · Notificación de contenido (sala ${room.pin})`);
  const body = encodeURIComponent(`Sala: ${room.name} (PIN ${room.pin})\nRecurso: ${resource.title || resource.content.slice(0, 80)}\nId: ${resource.id}\nMotivo: `);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost btn-sm !px-2" title="Notificar contenido" aria-label="Notificar este contenido">
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <Modal open={open} onClose={close} title="Notificar contenido" size="md">
        {state === 'sent' ? (
          <div role="status" className="space-y-3 text-sm">
            <p className="font-semibold text-ink-900 dark:text-white">Gracias. Tu aviso ha llegado al profesor o profesora de la sala.</p>
            <p className="text-stone-700 dark:text-stone-300">Lo revisará y retirará el contenido si incumple las condiciones de uso. No guardamos quién envía el aviso.</p>
            <button className="btn-primary w-full" onClick={close}>Cerrar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-stone-700 dark:text-stone-300">
              Avisa si este recurso incumple las <Link to="/condiciones" target="_blank" className="font-semibold text-brand-700 underline dark:text-brand-300">condiciones de uso</Link>.
            </p>
            <fieldset>
              <legend className="label">Motivo</legend>
              <div className="space-y-2">
                {Object.entries(REPORT_REASONS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm dark:border-ink-700">
                    <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="h-4 w-4 accent-brand-700" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="label" htmlFor={`report-details-${resource.id}`}>
                Detalles <span className="font-normal text-stone-600 dark:text-stone-400">(opcional)</span>
              </label>
              <textarea id={`report-details-${resource.id}`} className="input min-h-[5rem]" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={!reason || state === 'sending'}>
              <Flag className="h-4 w-4" aria-hidden="true" />
              {state === 'sending' ? 'Enviando…' : 'Enviar aviso'}
            </button>
            {CENTRO.email && (
              <p className="text-xs text-stone-600 dark:text-stone-400">
                También puedes escribir al centro:{' '}
                <a className="font-semibold text-brand-700 underline dark:text-brand-300" href={`mailto:${CENTRO.email}?subject=${subject}&body=${body}`}>
                  {CENTRO.email}
                </a>
              </p>
            )}
          </form>
        )}
      </Modal>
    </>
  );
}
