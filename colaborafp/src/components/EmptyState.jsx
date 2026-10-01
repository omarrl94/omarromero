export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center dark:border-ink-700">
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300 dark:text-ink-700" />}
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{children}</div>}
    </div>
  );
}
