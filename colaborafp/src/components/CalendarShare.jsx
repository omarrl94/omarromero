import { Check, Copy, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { calendarJoinUrl } from '../utils/calendar';
import { formatPin } from '../utils/ids';
import Logo from './Logo';
import Modal from './Modal';

/** Código, QR y enlace del calendario para que el alumnado lo tenga siempre a mano. */
export default function CalendarShare({ calendar }) {
  const [big, setBig] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = calendarJoinUrl(calendar.code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el navegador no deja copiar: el enlace sigue visible */
    }
  };

  return (
    <>
      <div className="card flex flex-wrap items-center gap-4 p-4">
        <div className="rounded-xl bg-white p-2 ring-1 ring-stone-200">
          <QRCode value={url} size={256} level="M" fgColor="#171413" style={{ width: '5.5rem', height: 'auto', display: 'block' }} aria-label={`Código QR del calendario ${calendar.name}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">Código para el alumnado</p>
          <p className="font-mono text-2xl font-extrabold tracking-widest">{formatPin(calendar.code)}</p>
          <p className="truncate text-xs text-stone-600 dark:text-stone-400">{url}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={() => setBig(true)}>
            <Maximize2 className="h-4 w-4" aria-hidden="true" /> Proyectar
          </button>
        </div>
      </div>
      {big && (
        <Modal open onClose={() => setBig(false)} title={`Calendario · ${calendar.name}`} size="full">
          <div className="flex flex-col items-center gap-8 py-4 lg:flex-row lg:justify-center lg:gap-16">
            <div className="rounded-[2rem] bg-white p-6 shadow-lift ring-1 ring-stone-200">
              <QRCode value={url} size={512} level="M" fgColor="#171413" style={{ width: 'min(70vw, 50vh)', height: 'auto', display: 'block' }} aria-label={`Código QR del calendario ${calendar.name}`} />
            </div>
            <div className="text-center lg:text-left">
              <div className="mb-6 flex justify-center lg:justify-start"><Logo /></div>
              <p className="font-display text-lg font-bold uppercase tracking-[0.2em] text-stone-600 dark:text-stone-400">Calendario de clase</p>
              <p className="mt-2 font-mono text-7xl font-extrabold tracking-[0.12em] text-ink-950 dark:text-white">{formatPin(calendar.code)}</p>
              <p className="mt-4 text-xl text-stone-600 dark:text-stone-400">
                Escanea el QR o escribe el código en <span className="font-mono font-semibold text-brand-700 dark:text-brand-400">{window.location.host}</span>
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
