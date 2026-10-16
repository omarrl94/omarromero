import { Upload } from 'lucide-react';
import { useState } from 'react';
import { readBackup, restoreBackup } from '../utils/backup';
import { formatDate } from '../utils/format';
import { defaultExpiry } from '../utils/retention';
import Modal from './Modal';
import RetentionPicker from './RetentionPicker';

const TYPE_LABELS = { code: 'código', task: 'enunciados', link: 'enlaces', file: 'archivos' };

/** Crea una sala nueva a partir de una copia .colaborafp. */
export default function RestoreModal({ teacherId, onClose, onRestored }) {
  const [backup, setBackup] = useState(null);
  const [name, setName] = useState('');
  const [expireAt, setExpireAt] = useState(() => defaultExpiry());
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const pick = async (e) => {
    setError(null);
    setBackup(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b = await readBackup(file);
      setBackup(b);
      setName(b.name);
    } catch (err) {
      setError(err.message);
    }
  };

  const restore = async (e) => {
    e.preventDefault();
    if (!backup || !name.trim()) return;
    setError(null);
    setProgress({ n: 0, total: backup.resources.length });
    try {
      const room = await restoreBackup(backup, { name, expireAt, teacherId, onProgress: (n, total) => setProgress({ n, total }) });
      onRestored(room);
    } catch (err) {
      setError(`No se pudo restaurar: ${err.message}`);
      setProgress(null);
    }
  };

  const counts = backup
    ? Object.entries(backup.resources.reduce((acc, r) => ({ ...acc, [r.type]: (acc[r.type] || 0) + 1 }), {}))
        .map(([t, n]) => `${n} ${TYPE_LABELS[t]}`)
        .join(' · ')
    : '';

  return (
    <Modal open onClose={progress ? () => {} : onClose} title="Restaurar desde una copia" size="md">
      <form onSubmit={restore} className="space-y-4">
        <div>
          <label className="label" htmlFor="restore-file">Archivo de copia (.colaborafp)</label>
          <input id="restore-file" type="file" accept=".colaborafp,application/json" className="input" onChange={pick} disabled={!!progress} />
        </div>
        {backup && (
          <>
            <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm dark:bg-ink-800">
              <strong>{backup.resources.length}</strong> recursos{counts && ` (${counts})`}
              {backup.exportedAt && <> · copia del {formatDate(Date.parse(backup.exportedAt))}</>}
              {backup.skipped > 0 && <span className="block text-xs text-stone-600 dark:text-stone-400">Se omiten {backup.skipped} elementos no válidos.</span>}
            </p>
            <div>
              <label className="label" htmlFor="restore-name">Nombre de la sala nueva</label>
              <input id="restore-name" className="input" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} disabled={!!progress} />
            </div>
            <RetentionPicker id="restore-expiry" value={expireAt} onChange={setExpireAt} />
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Se crea una sala nueva, <strong>cerrada</strong> y con un PIN nuevo. Ábrela cuando vayas a usarla.
            </p>
          </>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={!!progress}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={!backup || !name.trim() || !!progress}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {progress ? `Restaurando… ${progress.n}/${progress.total}` : 'Crear sala con la copia'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
