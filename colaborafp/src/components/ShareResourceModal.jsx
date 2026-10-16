import { Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CENTRO } from '../config/centro';
import { useRoomFeed } from '../hooks/useRoomFeed';
import { MAX_ALIAS_LENGTH } from '../utils/constants';
import Modal from './Modal';
import ResourceForm from './ResourceForm';

const ALIAS_KEY = 'colaborafp:alias';

export default function ShareResourceModal({ open, onClose }) {
  const { requestShare } = useRoomFeed();
  const [alias, setAlias] = useState(() => localStorage.getItem(ALIAS_KEY) || '');
  const [sent, setSent] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleClose = () => {
    setSent(false);
    onClose();
  };

  const handleSubmit = async (draft) => {
    if (!accepted) throw new Error('Marca la casilla para confirmar que puedes compartir este contenido.');
    localStorage.setItem(ALIAS_KEY, alias.trim());
    await requestShare(draft, alias);
    setSent(true);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Compartir recurso con la clase">
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sun-100 dark:bg-sun-400/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-sun-400/20" />
            <Clock className="h-8 w-8 text-sun-700 dark:text-sun-300" />
          </span>
          <p className="text-lg font-bold">Esperando aprobación del profesor…</p>
          <p className="mt-1 max-w-sm text-sm text-stone-600 dark:text-stone-400">
            Tu aportación ha llegado a la bandeja del profesor. Si la aprueba, aparecerá en el muro de la clase.
            Puedes seguir su estado en «Mis aportaciones».
          </p>
          <div className="mt-6 flex gap-2">
            <button className="btn-secondary" onClick={() => setSent(false)}>
              <Plus className="h-4 w-4" />
              Enviar otro
            </button>
            <button className="btn-primary" onClick={handleClose}>
              Volver al muro
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            El profesor revisará tu aportación antes de publicarla en el muro común.
          </p>
          <ResourceForm onSubmit={handleSubmit} submitLabel="Enviar al profesor" idPrefix="share">
            <div>
              <label className="label" htmlFor="share-alias">
                Nombre o alias <span className="font-normal text-stone-600 dark:text-stone-400">(opcional)</span>
              </label>
              <input
                id="share-alias"
                className="input"
                maxLength={MAX_ALIAS_LENGTH}
                placeholder="Anónimo"
                autoComplete="nickname"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                aria-describedby="share-alias-help"
              />
              <p id="share-alias-help" className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">
                Usa un alias o solo tu nombre de pila. No escribas apellidos ni otros datos personales.
              </p>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 text-sm dark:border-ink-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                Confirmo que el contenido es mío o tengo permiso para compartirlo, que no incluye datos personales ni imágenes de
                otras personas, y acepto las{' '}
                <Link to="/condiciones" target="_blank" className="font-semibold text-brand-700 underline dark:text-brand-300">condiciones de uso</Link>.
              </span>
            </label>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              <strong>Protección de datos:</strong> {CENTRO.nombre} trata tu aportación y tu alias para la actividad de clase. Se borran
              automáticamente con la sala. Puedes ejercer tus derechos según la{' '}
              <Link to="/privacidad" target="_blank" className="underline">política de privacidad</Link>.
            </p>
          </ResourceForm>
        </>
      )}
    </Modal>
  );
}
