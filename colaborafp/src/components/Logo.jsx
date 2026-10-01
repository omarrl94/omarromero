import { APP_NAME } from '../utils/constants';

// Isotipo de Formación Profesional José Ramón Otero (vectorizado del original).
// La "gota" es transparente: funciona sobre fondo claro y oscuro.
const MARK_PATH =
  'M 371 0.608 C 297.372 5.766, 233.379 27.239, 174.500 66.541 C 152.889 80.967, 124.654 104.129, 126.550 105.875 C 129.825 108.890, 195.070 159.298, 207 168.030 C 250.583 199.931, 294.180 226.810, 342.731 251.711 C 386.840 274.335, 402.227 280.959, 492 315.980 C 529.370 330.558, 561.386 343.667, 568.117 347.145 C 611.348 369.482, 641.400 410.042, 651.173 459.245 C 654.194 474.453, 654.417 502.584, 651.635 517.500 C 631.574 625.038, 515.112 683.827, 418.433 635.218 C 388.877 620.357, 361.174 592.015, 346.549 561.676 C 344.117 556.629, 324.520 506.150, 303.002 449.500 C 260.395 337.331, 255.085 324.161, 241.918 298 C 211.358 237.281, 174.183 187.069, 120.252 133.665 L 108.300 121.830 100.623 130.459 C -60.340 311.374, -23.551 590.200, 178.722 722.381 C 359.891 840.771, 604.080 789.067, 722.344 607.278 C 758.341 551.944, 781.203 484.710, 784.679 423.955 C 785.026 417.889, 785.690 412.692, 786.155 412.404 C 786.620 412.117, 787 402.882, 787 391.882 C 787 378.803, 786.654 372.096, 786 372.500 C 785.377 372.885, 785 370.927, 784.999 367.309 C 784.996 352.359, 779.608 318.195, 773.571 294.845 C 755.790 226.070, 721.478 166.314, 670.563 115.457 C 606.251 51.216, 526.011 12.577, 436 2.503 C 422.132 0.951, 382.571 -0.203, 371 0.608';

// Gota aislada, para el sello cuadrado del logotipo institucional
const DROP_PATH =
  'M 107.645 103.007 C 103.755 106.422, 102.378 111.235, 104.041 115.607 C 104.638 117.177, 114.670 128.145, 126.334 139.981 C 179.037 193.457, 211.944 238.445, 241.918 298 C 255.085 324.161, 260.395 337.331, 303.002 449.500 C 324.520 506.150, 344.117 556.629, 346.549 561.676 C 361.174 592.015, 388.877 620.357, 418.433 635.218 C 492.273 672.344, 582.089 647.601, 627.950 577.500 C 654.069 537.576, 660.917 484.704, 645.921 438.745 C 633.145 399.587, 604.623 366.007, 568.117 347.145 C 561.386 343.667, 529.370 330.558, 492 315.980 C 402.227 280.959, 386.840 274.335, 342.731 251.711 C 276.660 217.824, 233.291 189.336, 157.500 130.039 C 138.250 114.979, 121.375 102.061, 120 101.334 C 115.775 99.100, 111.423 99.689, 107.645 103.007';

export function BrandMark({ className = 'h-9 w-9', color = '#e39f7d', title }) {
  return (
    <svg viewBox="0 0 786 786" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d={MARK_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
}

/** Sello cuadrado del logotipo institucional (cuadrado negro con la gota). */
export function CenterSeal({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 786 786" className={className} aria-hidden="true">
      <rect width="786" height="786" rx="150" className="fill-ink-950 dark:fill-stone-100" />
      <g transform="translate(-40 -40) scale(1.06)">
        <path d={DROP_PATH} className="fill-[#faf8f6] dark:fill-ink-950" />
      </g>
      <path d="M0 0 L120 95 L95 120 Z" className="fill-[#faf8f6] dark:fill-ink-950" />
    </svg>
  );
}

/** Logotipo institucional: sello + "Formación Profesional / JOSÉ RAMÓN OTERO". */
export function CenterLockup({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CenterSeal className="h-8 w-8 shrink-0" />
      <span className="leading-[1.05] text-ink-950 dark:text-stone-100">
        <span className="block text-[11px] tracking-tight">Formación Profesional</span>
        <span className="block text-[12.5px] font-medium tracking-tight">JOSÉ RAMÓN OTERO</span>
      </span>
    </span>
  );
}

/** Marca de la plataforma: isotipo + ColaboraFP. */
export default function Logo({ size = 'md' }) {
  const big = size === 'lg';
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className={big ? 'h-14 w-14' : 'h-9 w-9'} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold tracking-tight text-ink-950 dark:text-white ${big ? 'text-4xl' : 'text-[1.35rem]'}`}>
          Colabora<span className="text-brand-600 dark:text-brand-400">FP</span>
          <span className="sr-only"> — {APP_NAME}</span>
        </span>
        {big && <span className="mt-1.5 block text-sm font-medium text-stone-500 dark:text-stone-400">FP José Ramón Otero</span>}
      </span>
    </span>
  );
}
