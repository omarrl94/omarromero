const P: Record<string, string> = {
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14',
  book: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
  chart: 'M4 20V10 M10 20V4 M16 20v-8 M22 20H2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
  check: 'M5 12l5 5 9-10',
  play: 'M7 4l13 8-13 8z',
  doc: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',
  tools: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z',
  conduit: 'M3 8h12a4 4 0 0 1 0 8H9 M3 12h4',
  home: 'M3 11l9-8 9 8 M5 10v10h14V10 M10 20v-6h4v6',
  panel: 'M5 3h14v18H5z M8 7h3v4H8z M13 7h3v4h-3z M8 14h3v4H8z M13 14h3v4h-3z',
  factory: 'M3 21V10l6 4V10l6 4V6h6v15z M7 21v-3 M12 21v-3 M17 21v-3',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2',
  gauge: 'M4 17a8 8 0 1 1 16 0 M12 17l4-5 M4 17h2 M18 17h2',
  clip: 'M9 4h6v3H9z M7 5H5v16h14V5h-2 M9 12h6 M9 16h6',
  sound: 'M4 9v6h4l5 4V5L8 9z M16 9a4 4 0 0 1 0 6',
  mute: 'M4 9v6h4l5 4V5L8 9z M17 9l5 6 M22 9l-5 6',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  flag: 'M5 21V4 M5 4h12l-2 4 2 4H5',
  x: 'M6 6l12 12 M18 6L6 18',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z',
  redo: 'M4 12a8 8 0 1 0 3-6.2 M4 4v5h5',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-5-5',
};
export type IconName = keyof typeof P;

export function Icon({ n, className = 'h-5 w-5' }: { n: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[n]!.split(' M').map((d, i) => <path key={i} d={(i ? 'M' : '') + d} />)}
    </svg>
  );
}
export const ICONO_DISTRITO: Record<number, IconName> = { 1: 'tools', 2: 'conduit', 3: 'home', 4: 'panel', 5: 'factory', 6: 'gear', 7: 'gauge', 8: 'clip' };
