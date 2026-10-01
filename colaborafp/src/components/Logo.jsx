import { APP_NAME, CENTER_SHORT } from '../utils/constants';

export function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-brand-700" />
      <path d="M24 20 12 32l12 12M40 20l12 12-12 12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="4" className="fill-accent-400" />
    </svg>
  );
}

export default function Logo({ size = 'md' }) {
  const big = size === 'lg';
  return (
    <span className="flex items-center gap-3">
      <BrandMark className={big ? 'h-14 w-14' : 'h-9 w-9'} />
      <span className="leading-tight">
        <span className={`block font-extrabold tracking-tight ${big ? 'text-3xl' : 'text-lg'}`}>
          Colabora<span className="text-brand-600 dark:text-brand-400">FP</span>
          <span className="sr-only"> — {APP_NAME}</span>
        </span>
        <span className={`block font-medium text-slate-500 dark:text-slate-400 ${big ? 'text-sm' : 'text-[11px]'}`}>
          {CENTER_SHORT}
        </span>
      </span>
    </span>
  );
}
