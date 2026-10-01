import QRCode from 'react-qr-code';
import { formatPin } from '../utils/ids';
import { roomJoinUrl } from '../utils/format';
import Logo, { CenterLockup } from './Logo';

/** QR + PIN pensados para proyectarse en la pizarra digital. */
export default function RoomQRCode({ room, size = 'md' }) {
  const url = roomJoinUrl(room.pin);
  const giant = size === 'giant';
  return (
    <div className={`flex flex-col items-center ${giant ? 'gap-10 lg:flex-row lg:items-center lg:gap-16' : 'gap-4'}`}>
      <div className={`relative rounded-[2rem] bg-white shadow-lift ring-1 ring-stone-200 ${giant ? 'p-7' : 'p-3'}`}>
        <QRCode
          value={url}
          size={512}
          level="M"
          fgColor="#171413"
          style={{ width: giant ? 'min(70vw, 50vh)' : '11rem', height: 'auto', display: 'block' }}
          aria-label={`Código QR para unirse a la sala ${room.name}`}
        />
      </div>
      <div className={`text-center ${giant ? 'lg:text-left' : ''}`}>
        {giant && (
          <div className="mb-8 flex justify-center lg:justify-start">
            <Logo />
          </div>
        )}
        <p className={`font-display font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 ${giant ? 'text-lg' : 'text-xs'}`}>
          PIN de la sala
        </p>
        <p className={`relative inline-block whitespace-nowrap font-mono font-extrabold tracking-[0.12em] text-ink-950 dark:text-white ${giant ? 'mt-2 text-7xl sm:text-8xl' : 'text-4xl'}`}>
          <span className="relative z-10">{formatPin(room.pin)}</span>
          {giant && <span className="absolute inset-x-0 bottom-2 z-0 h-5 rounded bg-sun-400/70" aria-hidden="true" />}
        </p>
        <p className={`mt-4 text-stone-600 dark:text-stone-400 ${giant ? 'text-xl' : 'text-xs'}`}>
          Escanea el QR o entra en{' '}
          <span className="font-mono font-semibold text-brand-700 dark:text-brand-400">{window.location.host}</span>
        </p>
        {giant && (
          <>
            <p className="mt-8 max-w-md font-display text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white">{room.name}</p>
            {room.module && <p className="mt-1 text-lg text-stone-500 dark:text-stone-400">{room.module}</p>}
            <div className="mt-10 flex justify-center lg:justify-start">
              <CenterLockup />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
