/** Símbolos del esquema (vista «esquema»). Dibujados en coordenadas locales. */
import type { Component } from '../model/types';

interface P { c: Component; closed?: boolean }

export function Symbol({ c }: P) {
  const sw = { stroke: 'var(--ink)', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };
  switch (c.type) {
    case 'battery':
      return (
        <g {...sw}>
          <path d="M-40 0H-6M6 0H40" />
          <path d="M-6 -14V14" strokeWidth={3} />
          <path d="M6 -8V8" strokeWidth={3} />
          <text x={-30} y={-8} fontSize={12} fill="var(--ink)" stroke="none">+</text>
          <text x={28} y={-8} fontSize={12} fill="var(--ink)" stroke="none">−</text>
        </g>
      );
    case 'isource':
      return (
        <g {...sw}>
          <path d="M-40 0H-16M16 0H40" />
          <circle r={16} />
          <path d="M-8 0H8M3 -5L8 0L3 5" />
        </g>
      );
    case 'resistor':
      return (
        <g {...sw}>
          <path d="M-40 0H-26M26 0H40" />
          <rect x={-26} y={-8} width={52} height={16} fill="var(--panel)" />
        </g>
      );
    case 'lamp':
      return (
        <g {...sw}>
          <path d="M-40 0H-16M16 0H40" />
          <circle r={16} fill="var(--panel)" />
          <path d="M-11 -11L11 11M-11 11L11 -11" />
        </g>
      );
    case 'switch':
      return (
        <g {...sw}>
          <path d="M-40 0H-16M16 0H40" />
          <circle cx={-16} r={2.5} fill="var(--ink)" />
          <circle cx={16} r={2.5} fill="var(--ink)" />
          {c.params.closed ? <path d="M-16 0L16 0" strokeWidth={3} /> : <path d="M-16 0L12 -16" strokeWidth={3} />}
        </g>
      );
    case 'ground':
      return (
        <g {...sw}>
          <path d="M0 -20V0M-14 0H14M-9 6H9M-4 12H4" />
        </g>
      );
    case 'junction':
      return <circle r={4.5} fill="var(--ink)" />;
    default:
      return <rect x={-20} y={-10} width={40} height={20} {...sw} />;
  }
}
