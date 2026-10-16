import { Download } from 'lucide-react';
import { useState } from 'react';
import { downloadBackup } from '../utils/backup';
import Modal from './Modal';

/** Descarga una copia de seguridad de la sala al equipo del profesor. */
export default function BackupModal({ room, onClose }) {
  const [includeStudents, setIncludeStudents] = useState(false);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setError(null);
    setDone(null);
    setProgress({ n: 0, total: 0 });
    try {
      const count = await downloadBackup(room, { includeStudents, onProgress: (n, total) => setProgress({ n, total }) });
      setDone(count);
    } catch (e) {
      setError(e.message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Modal open onClose={onClose} title="Copia de seguridad de la sala" size="md">
      <div className="space-y-4">
        <p className="text-sm text-stone-700 dark:text-stone-300">
          Descarga a tu equipo un archivo <strong>.colaborafp</strong> con todo lo publicado en «{room.name}»: código, enunciados, enlaces y
          archivos. El curso que viene podrás crear una sala nueva con ese contenido desde <strong>Mis salas → Restaurar desde una copia</strong>.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={includeStudents} onChange={(e) => setIncludeStudents(e.target.checked)} />
          <span>
            Incluir también las aportaciones aprobadas del alumnado
            <span className="block text-xs text-stone-600 dark:text-stone-400">Llevan su alias. Inclúyelas solo si las necesitas: es un dato personal.</span>
          </span>
        </label>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Las peticiones pendientes no se copian. Guarda el archivo en un lugar seguro del centro (por ejemplo, tu OneDrive).
        </p>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {done !== null && (
          <p role="status" className="rounded-xl bg-accent-100 px-3 py-2 text-sm text-accent-800 dark:bg-accent-300/15 dark:text-accent-300">
            Copia descargada con {done} {done === 1 ? 'recurso' : 'recursos'}. Búscala en tu carpeta de descargas.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn-primary" onClick={run} disabled={!!progress}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {progress ? `Preparando… ${progress.total ? `${progress.n}/${progress.total}` : ''}` : 'Descargar copia'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
