import { Download, Eye, EyeOff, FileArchive, FileCode, FileImage, FileSpreadsheet, FileText, LoaderCircle, Paperclip, Presentation } from 'lucide-react';
import { useEffect, useState } from 'react';
import { backend } from '../services/backend';
import { base64ToBlob, downloadBlob, fileExtension, formatBytes, isPreviewableImage } from '../utils/files';
import CardShell from './CardShell';

const ICONS = [
  [['zip', 'rar', '7z', 'tar', 'gz'], FileArchive],
  [['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], FileImage],
  [['xls', 'xlsx', 'ods', 'csv'], FileSpreadsheet],
  [['ppt', 'pptx', 'odp'], Presentation],
  [['pdf', 'doc', 'docx', 'odt', 'txt', 'md'], FileText],
  [['py', 'js', 'ts', 'java', 'c', 'cpp', 'cs', 'php', 'html', 'css', 'sql', 'json', 'xml', 'sh', 'jar'], FileCode],
];
const iconFor = (name) => ICONS.find(([exts]) => exts.includes(fileExtension(name)))?.[1] ?? Paperclip;

export default function FileCard({ resource, actions, footer }) {
  const [busy, setBusy] = useState(null); // 'download' | 'preview'
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const Icon = iconFor(resource.content);
  const ext = fileExtension(resource.content);
  const canPreview = isPreviewableImage(resource.file_type);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const fetchBlob = async () => {
    const file = await backend.resources.getFile(resource);
    return base64ToBlob(file.data, resource.file_type);
  };

  const run = async (kind, fn) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const download = () => run('download', async () => downloadBlob(await fetchBlob(), resource.content));
  const togglePreview = () =>
    previewUrl
      ? setPreviewUrl(null)
      : run('preview', async () => setPreviewUrl(URL.createObjectURL(await fetchBlob())));

  return (
    <CardShell
      resource={resource}
      icon={Paperclip}
      typeLabel="Archivo"
      footer={footer}
      accent={resource.author === 'teacher' ? 'brand' : 'accent'}
      actions={actions}
    >
      <div className="px-6 pb-6 pt-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-ink-700 dark:bg-ink-850">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink-900 dark:text-stone-100" title={resource.content}>
              {resource.content}
            </span>
            <span className="block text-xs uppercase tracking-wide text-stone-500">
              {[ext, formatBytes(resource.file_size)].filter(Boolean).join(' · ')}
            </span>
          </span>
          <div className="flex gap-2">
            {canPreview && (
              <button type="button" onClick={togglePreview} className="btn-secondary btn-sm" disabled={!!busy}>
                {busy === 'preview' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : previewUrl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {previewUrl ? 'Ocultar' : 'Ver'}
              </button>
            )}
            <button type="button" onClick={download} className="btn btn-sm bg-ink-900 text-white hover:bg-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700" disabled={!!busy}>
              {busy === 'download' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Descargar
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {previewUrl && (
          <img src={previewUrl} alt={resource.title || resource.content} className="mt-4 max-h-[28rem] w-full rounded-xl border border-stone-200 bg-white object-contain dark:border-ink-700" />
        )}
      </div>
    </CardShell>
  );
}
