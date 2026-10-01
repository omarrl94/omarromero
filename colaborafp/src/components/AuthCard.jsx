import Logo from './Logo';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14">
      <Logo size="lg" />
      <div className="card mt-8 w-full p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">{footer}</div>}
    </div>
  );
}
