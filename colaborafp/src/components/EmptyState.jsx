export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white/50 dark:bg-transparent px-6 py-12 text-center dark:border-ink-700">
      {Icon && <Icon className="mb-3 h-10 w-10 text-brand-300 dark:text-ink-600" />}
      <p className="font-semibold text-stone-700 dark:text-stone-200">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">{children}</div>}
    </div>
  );
}
