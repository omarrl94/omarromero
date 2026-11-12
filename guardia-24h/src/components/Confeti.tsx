const COLORES = ['#EFCD2F', '#A9CABB', '#E39F7D', '#ffffff', '#2FB872'];
/** Lluvia de confeti (decorativa). */
export function Confeti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => (
        <span key={i} className="absolute top-0 block h-3 w-2 animate-fall rounded-sm" style={{ left: `${(i * 97) % 100}%`, background: COLORES[i % COLORES.length], animationDelay: `${(i % 9) * 0.12}s`, animationDuration: `${2 + (i % 5) * 0.3}s` }} />
      ))}
    </div>
  );
}
