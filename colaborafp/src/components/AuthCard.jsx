import { BrandMark, CenterLockup } from './Logo';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid max-w-5xl items-stretch gap-0 px-4 py-10 sm:py-16 lg:grid-cols-2">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden rounded-l-3xl bg-brand-400 p-10 text-ink-950 lg:flex lg:flex-col lg:justify-between">
        <BrandMark className="absolute -bottom-24 -right-24 h-80 w-80 opacity-30" color="#fff" />
        <span className="absolute -left-10 top-1/2 h-24 w-24 rounded-full bg-sun-400" aria-hidden="true" />
        <span className="absolute bottom-10 left-16 h-14 w-14 rounded-full bg-accent-300" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-950/70">Panel del profesorado</p>
          <p className="mt-4 font-display text-3xl font-extrabold leading-tight">
            Comparte código con tu grupo en tiempo real.
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-950/75">
            Crea una sala, proyecta el QR y modera las aportaciones del alumnado desde un único panel.
          </p>
        </div>
        <div className="relative rounded-2xl bg-[#faf8f6]/90 p-3 backdrop-blur">
          <CenterLockup />
        </div>
      </aside>

      <div className="card flex flex-col justify-center p-6 sm:p-10 lg:rounded-l-none">
        <div className="mb-8 lg:hidden">
          <CenterLockup />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 dark:text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-stone-100 pt-5 text-sm text-stone-600 dark:border-ink-800 dark:text-stone-400">{footer}</div>}
      </div>
    </div>
  );
}
