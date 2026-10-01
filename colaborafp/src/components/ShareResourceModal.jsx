import { Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useRoomFeed } from '../hooks/useRoomFeed';
import { MAX_ALIAS_LENGTH } from '../utils/constants';
import Modal from './Modal';
import ResourceForm from './ResourceForm';

const ALIAS_KEY = 'colaborafp:alias';

export default function ShareResourceModal({ open, onClose }) {
  const { requestShare } = useRoomFeed();
  const [alias, setAlias] = useState(() => localStorage.getItem(ALIAS_KEY) || '');
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    setSent(false);
    onClose();
  };

  const handleSubmit = async (draft) => {
    localStorage.setItem(ALIAS_KEY, alias.trim());
    await requestShare(draft, alias);
    setSent(true);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Compartir recurso con la clase">
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/20" />
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-300" />
          </span>
          <p className="text-lg font-bold">Esperando aprobación del profesor…</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
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
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            El profesor revisará tu aportación antes de publicarla en el muro común.
          </p>
          <ResourceForm onSubmit={handleSubmit} submitLabel="Enviar al profesor" idPrefix="share">
            <div>
              <label className="label" htmlFor="share-alias">
                Nombre o alias <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="share-alias"
                className="input"
                maxLength={MAX_ALIAS_LENGTH}
                placeholder="Anónimo"
                autoComplete="nickname"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
          </ResourceForm>
        </>
      )}
    </Modal>
  );
}
