/** Iconos de línea (SVG) y avatar: sustituyen a los emoji de la interfaz. */
const P: Record<string, string> = {
  schematic: 'M2 12h4l1.5-4 3 8 3-8 1.5 4h5',
  multifilar: 'M3 7h18M3 12h18M3 17h18M7 5v4M7 10v4M7 15v4',
  unifilar: 'M3 12h18M12 8v8',
  real: 'M4 6h16v5H4zM4 13h16v5H4zM7 8.5h2M7 15.5h2',
  cuadro: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  plano: 'M4 4h16v16H4zM4 11h9M13 11V4M13 16h7',
  juego: 'M3 11l9-7 9 7M6 10v10h12V10M10 20v-6h4v6',
  averias: 'M14.5 6.5a4 4 0 0 0 4.9 4.9L21 13l-2 2-1.6-1.6a4 4 0 0 1-4.9-4.9L10 6 7 9l-5 5 3 3 5-5',
  boletin: 'M7 4h10v16H7zM9 4V2.5h6V4M9.5 11l1.6 1.6 3.4-3.6M9.5 16h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M6 6l12 12M18 6L6 18',
  pen: 'M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14.5 6.5l3 3',
  stop: 'M8 3h8l5 5v8l-5 5H8l-5-5V8zM8 12h8',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6z',
  warn: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  wave: 'M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0',
  ground: 'M12 3v9M4 12h16M7 16h10M10 20h4',
  rcd: 'M4 5h16v14H4zM9 9h6v6H9zM12 5V3M12 21v-2',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5',
};
export type IconName = keyof typeof P;
export function Icon({ name, size = 16, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  return <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={P[name] ?? P.check} /></svg>;
}

const HUES = [206, 24, 152, 340, 48, 268, 182, 8];
/** Avatar con las iniciales del cliente (sin emoji). */
export function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return <span className="avatar" style={{ width: size, height: size, background: `linear-gradient(145deg, hsl(${h} 55% 52%), hsl(${h} 60% 34%))`, fontSize: size * 0.4 }} aria-hidden>{ini}</span>;
}
