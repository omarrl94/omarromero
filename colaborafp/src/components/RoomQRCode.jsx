import QRCode from 'react-qr-code';
import { formatPin } from '../utils/ids';
import { roomJoinUrl } from '../utils/format';
import { BrandMark } from './Logo';

/** QR + PIN pensados para proyectarse en la pizarra digital. */
export default function RoomQRCode({ room, size = 'md' }) {
  const url = roomJoinUrl(room.pin);
  const giant = size === 'giant';
  return (
    <div className={`flex flex-col items-center ${giant ? 'gap-8 lg:flex-row lg:gap-16' : 'gap-4'}`}>
      <div className={`rounded-3xl bg-white shadow-xl ${giant ? 'p-6' : 'p-3'}`}>
        <QRCode
          value={url}
          size={512}
          level="M"
          fgColor="#0f1f4f"
          style={{ width: giant ? 'min(70vw, 52vh)' : '11rem', height: 'auto' }}
          aria-label={`Código QR para unirse a la sala ${room.name}`}
        />
      </div>
      <div className={`text-center ${giant ? 'lg:text-left' : ''}`}>
        {giant && (
          <div className="mb-6 flex items-center justify-center gap-3 lg:justify-start">
            <BrandMark className="h-12 w-12" />
            <span className="text-2xl font-extrabold">
              Colabora<span className="text-brand-400">FP</span>
            </span>
          </div>
        )}
        <p className={`font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${giant ? 'text-lg' : 'text-xs'}`}>
          PIN de la sala
        </p>
        <p className={`whitespace-nowrap font-mono font-extrabold tracking-[0.15em] text-brand-700 dark:text-brand-300 ${giant ? 'text-7xl sm:text-8xl' : 'text-4xl'}`}>
          {formatPin(room.pin)}
        </p>
        <p className={`mt-3 text-slate-500 dark:text-slate-400 ${giant ? 'text-xl' : 'text-xs'}`}>
          Escanea el QR o entra en <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{window.location.host}</span>
        </p>
        {giant && <p className="mt-6 max-w-md text-2xl font-bold">{room.name}</p>}
      </div>
    </div>
  );
}
