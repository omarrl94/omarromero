/** Símbolos del esquema con aspecto «vivo»: brillos, giro, humo, estados de avería. */
import type { Component } from '../model/types';
import type { Live } from '../model/netlist';
import { defOf } from '../model/library';

interface P { c: Component; live?: Live }
const LED_HUE = ['#ff3b30', '#2ecc71', '#3b82f6', '#ffd60a'];

/** Símbolo con su marca (NH, PV…) en horizontal aunque el componente esté girado. */
export function Symbol({ c, live }: P) {
  const d = defOf(c.type);
  const off = c.rot % 180 === 0 ? d.h / 2 + 6 : d.w / 2 + 6;
  return (
    <g>
      <SymbolBody c={c} live={live} />
      {d.mark && <text transform={`rotate(${-c.rot})`} y={-off} textAnchor="middle" fontSize={9} fontWeight={800} fill="var(--accent)" stroke="none" style={{ letterSpacing: '.04em' }}>{d.mark}</text>}
    </g>
  );
}

function SymbolBody({ c, live }: P) {
  const t = defOf(c.type).sym ?? c.type;
  const model = defOf(c.type).model;
  const sw = { stroke: 'var(--ink)', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const par = c.params;
  const dead = live?.state; // 'blown' | 'tripped' | 'burnt'
  const p = live?.p ?? 0;
  const lead = <path d="M-40 0H-26M26 0H40" />;

  switch (t) {
    case 'battery':
      return (
        <g {...sw}>
          {dead && <circle r={26} className="burnt-glow" />}
          <path d="M-40 0H-8M8 0H40" />
          <path d="M-8 -16V16" strokeWidth={3.5} /><path d="M8 -9V9" strokeWidth={3.5} />
          <path d="M-8 -16V16M8 -9V9" stroke="var(--terracota)" strokeWidth={1} opacity={0.6} />
          <text x={-34} y={-8} fontSize={13} fill="var(--ink)" stroke="none" fontWeight={700}>+</text>
          <text x={26} y={-8} fontSize={13} fill="var(--ink)" stroke="none" fontWeight={700}>−</text>
        </g>
      );
    case 'acsource':
      return (<g {...sw}><path d="M-40 0H-18M18 0H40" /><circle r={18} fill="var(--fill-b)" /><path d="M-10 0q5 -12 10 0t10 0" strokeWidth={2.5} stroke="var(--accent)" />
        <text x={-34} y={-8} fontSize={9} fill="var(--ink)" stroke="none">L</text><text x={26} y={-8} fontSize={9} fill="var(--ink)" stroke="none">N</text></g>);
    case 'isource':
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle r={16} fill="var(--fill-b)" /><path d="M-8 0H8M3 -5L8 0L3 5" /></g>);
    case 'resistor': {
      const hot = p > Number(par.pmax);
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill={hot ? 'var(--err)' : 'var(--fill-a)'} className={hot ? 'pulse' : ''} /></g>);
    }
    case 'pot': {
      const x = (Number(par.pos) - 0.5) * 48;
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill="var(--fill-a)" />
        <path d={`M0 20V14`} /><path d={`M${x} 20V10`} transform="" strokeWidth={0} />
        <path d={`M${x} 22V9M${x - 4} 14L${x} 9L${x + 4} 14`} stroke="var(--accent)" strokeWidth={2.5} />
        <path d={`M0 20H${x}`} stroke="var(--accent)" /></g>);
    }
    case 'capacitor':
      return (<g {...sw}><path d="M-40 0H-6M6 0H40" /><path d="M-6 -16V16M6 -16V16" strokeWidth={3.5} />
        <rect x={-6} y={-16} width={12} height={32} fill="var(--fill-b)" stroke="none" opacity={0.7} /></g>);
    case 'inductor':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><path d="M-26 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0" /></g>);
    case 'ntc': case 'ptc':
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill="var(--fill-a)" />
        <path d={t === 'ntc' ? 'M-30 14L-16 14L22 -14' : 'M-30 14L8 14L22 -14'} stroke="var(--accent)" />
        <text x={-8} y={-12} fontSize={9} fill="var(--ink)" stroke="none">{t === 'ntc' ? 't° −' : 't° +'}</text></g>);
    case 'ldr': {
      const lux = Math.min(1, Number(par.lux) / 1000);
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><circle r={18} fill="var(--fill-a)" /><rect x={-14} y={-6} width={28} height={12} fill="var(--panel)" />
        <g stroke="var(--mostaza)" strokeWidth={2.5} opacity={0.35 + 0.65 * lux}><path d="M-26 -22L-14 -12M-18 -26L-6 -16" /><path d="M-14 -12l-1 -5M-14 -12l5 1M-6 -16l-1 -5M-6 -16l5 1" /></g></g>);
    }
    case 'diode':
      return (<g {...sw}><path d="M-40 0H-12M12 0H40" /><path d="M-12 -14L12 0L-12 14Z" fill={live?.on ? 'var(--mostaza)' : 'var(--fill-a)'} /><path d="M12 -14V14" strokeWidth={3} /></g>);
    case 'zener':
      return (<g {...sw}><path d="M-40 0H-12M12 0H40" /><path d="M-12 -14L12 0L-12 14Z" fill={live?.on || p > 0.01 ? 'var(--salvia)' : 'var(--fill-a)'} /><path d="M7 -14H12V14H17" strokeWidth={3} /></g>);
    case 'led': {
      const hue = LED_HUE[Number(par.color)] ?? LED_HUE[0];
      const imax = Number(par.imax) / 1000;
      const k = live?.on && !dead ? Math.min(1, Math.abs(live.i) / (imax * 0.6)) : 0;
      return (<g {...sw}>
        {k > 0.01 && <circle cx={0} cy={-6} r={18 + 14 * k} fill={hue} opacity={0.15 + 0.5 * k} style={{ filter: 'blur(7px)' }} stroke="none" />}
        <path d="M-40 0H-12M12 0H40" />
        <path d="M-12 -14L12 0L-12 14Z" fill={dead ? '#444' : k > 0.01 ? hue : 'var(--fill-a)'} />
        <path d="M12 -14V14" strokeWidth={3} />
        <path d="M2 -16L12 -28M10 -12L20 -24M12 -28l-6 1M12 -28l-1 6M20 -24l-6 1M20 -24l-1 6" stroke={hue} strokeWidth={1.6} />
        {dead && <path d="M-9 -9L9 9M-9 9L9 -9" stroke="var(--err)" strokeWidth={3} />}
      </g>);
    }
    case 'switch': {
      const closed = Boolean(par.closed);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={closed ? 'M-16 0L16 0' : 'M-16 0L10 -17'} strokeWidth={3.5} stroke={closed ? 'var(--accent)' : 'var(--ink)'} style={{ transition: 'all .15s' }} /></g>);
    }
    case 'pushNO': case 'pushNC': {
      const pressed = Boolean(par.pressed);
      const closed = t === 'pushNO' ? pressed : !pressed;
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={closed ? 'M-16 0L16 0' : 'M-16 0L12 -12'} strokeWidth={3} stroke={closed ? 'var(--accent)' : 'var(--ink)'} />
        <path d={`M0 ${pressed ? -6 : -16}V-6`} strokeDasharray="3 3" />
        <rect x={-9} y={pressed ? -14 : -24} width={18} height={8} rx={3} fill={pressed ? 'var(--terracota)' : 'var(--fill-a)'} />
        {t === 'pushNC' && <path d="M-6 -6L6 6" strokeWidth={0} />}</g>);
    }
    case 'spdt': {
      const up = Number(par.pos) < 0.5;
      return (<g {...sw}><path d="M-40 0H-16M16 -20H40M16 20H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} cy={-20} r={3} fill="var(--ink)" /><circle cx={16} cy={20} r={3} fill="var(--ink)" />
        <path d={up ? 'M-16 0L16 -20' : 'M-16 0L16 20'} strokeWidth={3.5} stroke="var(--accent)" style={{ transition: 'all .15s' }} /></g>);
    }
    case 'fuse':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><rect x={-26} y={-9} width={52} height={18} rx={3} fill="var(--fill-a)" />
        {dead ? (<><path d="M-26 0H-6M6 0H26" stroke="var(--err)" /><path d="M-6 0L-2 -6L2 6L6 0" stroke="var(--err)" opacity={0.5} />
          {[0, 1, 2].map((k) => <circle key={k} cx={-6 + 6 * k} cy={-10} r={4} className="smoke" style={{ animationDelay: `${k * 0.5}s` }} />)}</>) : <path d="M-26 0H26" strokeWidth={1.6} />}</g>);
    case 'breaker':
      return (<g {...sw}><path d="M-40 0H-20M20 0H40" /><rect x={-20} y={-20} width={40} height={40} rx={4} fill="var(--fill-b)" />
        <circle cx={-10} cy={6} r={2.5} fill="var(--ink)" /><circle cx={10} cy={6} r={2.5} fill="var(--ink)" />
        <path d={dead ? 'M-10 6L8 -2' : 'M-10 6L10 6'} strokeWidth={3} stroke={dead ? 'var(--err)' : 'var(--accent)'} />
        <path d="M-8 -12L-2 -6M-2 -12L-8 -6" strokeWidth={1.4} /><text x={4} y={-8} fontSize={8} fill="var(--ink)" stroke="none">{dead ? 'OFF' : 'ON'}</text></g>);
    case 'lamp': {
      const pn = Number(par.pn);
      const k = dead ? 0 : Math.min(1.2, p / pn);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" />
        {k > 0.02 && <circle r={18 + 14 * Math.min(1, k)} fill="var(--lamp)" opacity={Math.min(0.9, 0.2 + k * 0.7)} style={{ filter: 'blur(7px)' }} stroke="none" />}
        <circle r={16} className={k > 1.15 ? 'flicker' : ''} fill={dead ? '#4a4540' : k > 1.15 ? '#fffbe0' : k > 0.02 ? 'var(--lamp)' : 'var(--fill-a)'} fillOpacity={k > 0.02 ? 0.35 + 0.6 * Math.min(1, k) : 1} />
        {dead && <circle r={20} className="burnt-glow" />}
        <path d="M-11 -11L11 11M-11 11L11 -11" stroke={dead ? 'var(--err)' : 'var(--ink)'} /></g>);
    }
    case 'heater': {
      const k = Math.min(1, p / Number(par.pn));
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" />
        {k > 0.02 && <rect x={-30} y={-18} width={60} height={36} rx={8} fill="#ff5a1f" opacity={0.15 + 0.5 * k} style={{ filter: 'blur(6px)' }} stroke="none" />}
        <rect x={-26} y={-14} width={52} height={28} rx={3} fill={k > 0.02 ? `color-mix(in srgb, #ff5a1f ${Math.round(100 * k)}%, var(--fill-a))` : 'var(--fill-a)'} />
        <path d="M-20 8L-14 -8L-6 8L2 -8L10 8L16 -8" /></g>);
    }
    case 'buzzer': {
      const on = !dead && p > 0.2 * Number(par.pn);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle r={16} fill={on ? 'var(--mostaza)' : 'var(--fill-a)'} />
        <path d="M-6 -5H-2L5 -10V10L-2 5H-6Z" fill="var(--ink)" />
        {on && [0, 1].map((k) => <path key={k} d={`M${10 + 5 * k} -6Q${14 + 5 * k} 0 ${10 + 5 * k} 6`} className="wave" style={{ animationDelay: `${k * 0.25}s` }} />)}</g>);
    }
    case 'motor': {
      const k = Math.min(1.5, Math.abs(live?.v ?? 0) / Number(par.vn));
      const dir = (live?.i ?? 0) >= 0 ? 'normal' : 'reverse';
      return (<g {...sw}><path d="M-40 0H-22M22 0H40" /><circle r={22} fill="var(--fill-b)" />
        <g className={k > 0.03 ? 'spin' : ''} style={{ animationDuration: `${Math.max(0.15, 1.6 / Math.max(0.05, k))}s`, animationDirection: dir }}>
          <path d="M0 -16V16M-16 0H16" strokeWidth={2.5} stroke="var(--accent)" /><circle r={3} fill="var(--ink)" /></g>
        <circle r={22} fill="none" /><text x={-6} y={-24} fontSize={11} fill="var(--ink)" stroke="none" fontWeight={700} transform="">M</text></g>);
    }

    case 'vsrc':
      return (<g {...sw}><path d="M-40 0H-18M18 0H40" /><circle r={18} fill="var(--fill-b)" /><path d="M-10 0H-2M-6 -4V4" strokeWidth={2} /><path d="M3 0H11" strokeWidth={2} />
        <text x={-34} y={-8} fontSize={11} fill="var(--ink)" stroke="none" fontWeight={700}>+</text><text x={26} y={-8} fontSize={11} fill="var(--ink)" stroke="none" fontWeight={700}>−</text></g>);
    case 'pv': {
      const k = Math.min(1, Number(par.irr) / 1000);
      return (<g {...sw}><path d="M-40 0H-24M24 0H40" /><rect x={-24} y={-16} width={48} height={32} fill="#bcd0e6" />
        <path d="M-24 -5H24M-24 5H24M-8 -16V16M8 -16V16" strokeWidth={1} />
        <g stroke="var(--mostaza)" strokeWidth={2.2} opacity={0.3 + 0.7 * k}><circle cx={-30} cy={-20} r={4} fill="var(--mostaza)" /><path d="M-30 -28V-26M-38 -20H-36M-36 -26L-34 -24" /></g></g>);
    }
    case 'polcap':
      return (<g {...sw}><path d="M-40 0H-6M10 0H40" /><path d="M-6 -16V16" strokeWidth={3.5} /><path d="M10 -16Q4 0 10 16" strokeWidth={3} />
        <text x={-22} y={-8} fontSize={12} fill="var(--ink)" stroke="none" fontWeight={700}>+</text></g>);
    case 'capvar':
      return (<g {...sw}><path d="M-40 0H-6M6 0H40" /><path d="M-6 -16V16M6 -16V16" strokeWidth={3.5} /><path d="M-18 20L18 -20M10 -20H18V-12" stroke="var(--accent)" /></g>);
    case 'capbank':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40M-26 -14V14M-26 0H26" /><path d="M-10 -14V14M-4 -14V14M12 -14V14M18 -14V14" strokeWidth={3} /><path d="M-26 -14H26M-26 14H26" strokeWidth={0} /></g>);
    case 'indcore':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><path d="M-26 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0" /><path d="M-28 -12H28M-28 -15H28" strokeWidth={1.6} /></g>);
    case 'indvar':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><path d="M-26 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0" /><path d="M-24 18L24 -18M16 -18H24V-10" stroke="var(--accent)" /></g>);
    case 'solenoid':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><rect x={-26} y={-12} width={52} height={24} rx={4} fill="var(--fill-b)" /><path d="M-18 -8a5 8 0 0 1 10 0a5 8 0 0 1 10 0a5 8 0 0 1 10 0a5 8 0 0 1 10 0" transform="translate(0 8)" strokeWidth={1.8} /></g>);
    case 'zbox':
      return (<g {...sw}>{lead}<rect x={-26} y={-12} width={52} height={24} fill="var(--fill-a)" /><text y={4} textAnchor="middle" fontSize={11} fill="var(--ink)" stroke="none" fontWeight={700}>Z</text></g>);
    case 'load':
      return (<g {...sw}>{lead}<rect x={-26} y={-12} width={52} height={24} rx={3} fill="var(--fill-a)" /><path d="M-20 0h6l2 -6l4 12l4 -12l2 6h6" strokeWidth={1.6} /></g>);
    case 'rheo': case 'trim': {
      const x = (Number(par.pos) - 0.5) * 44;
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill="var(--fill-a)" />
        {t === 'rheo' ? <path d="M-22 20L22 -20M14 -20H22V-12" stroke="var(--accent)" strokeWidth={2.2} /> : <path d={`M${x} -22V-9M${x - 4} -14L${x} -9L${x + 4} -14`} stroke="var(--accent)" strokeWidth={2.2} />}</g>);
    }
    case 'shunt':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><rect x={-26} y={-10} width={52} height={20} fill="var(--fill-a)" /><path d="M-12 -10V-18M12 -10V-18" /><path d="M-26 0H26" strokeWidth={4} stroke="var(--ink)" /></g>);
    case 'gauge':
      return (<g {...sw}>{lead}<rect x={-26} y={-12} width={52} height={24} fill="var(--fill-a)" /><path d="M-20 8V-8H-12V8H-4V-8H4V8H12V-8H20" strokeWidth={1.5} /></g>);
    case 'rnet':
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill="var(--fill-a)" /><path d="M-14 -8V8M-2 -8V8M10 -8V8" strokeWidth={1} /></g>);
    case 'borne':
      return (<g {...sw}><path d="M-40 0H-14M14 0H40" /><rect x={-14} y={-12} width={28} height={24} rx={3} fill="var(--fill-b)" /><circle r={5} fill="var(--panel)" /><path d="M-4 -4L4 4" strokeWidth={1.6} /></g>);
    case 'jumper': case 'connector': {
      const on = Boolean(par.closed);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        {t === 'jumper' ? <path d={on ? 'M-16 0V-12H16V0' : 'M-16 0V-12H-4M4 -12H16V0'} stroke={on ? 'var(--accent)' : 'var(--ink)'} strokeWidth={3} /> :
          <><path d={on ? 'M-16 0H0' : 'M-16 0H-8'} strokeWidth={4} /><path d={on ? 'M0 -9V9' : 'M8 -9V9'} /><path d={on ? 'M0 0H16' : 'M8 0H16'} strokeWidth={4} /></>}</g>);
    }
    case 'pica':
      return (<g {...sw}><path d="M0 -20V4M-12 4H12M0 4V24" /><path d="M-6 24L0 32L6 24Z" fill="var(--ink)" /><path d="M-8 12H8M-5 18H5" strokeWidth={1.4} /></g>);
    case 'socket': case 'plug':
      return (<g {...sw}><path d="M-40 0H-18M18 0H40" /><rect x={-18} y={-16} width={36} height={32} rx={t === 'socket' ? 16 : 4} fill="var(--fill-b)" />
        <circle cx={-6} cy={0} r={2.5} fill="var(--ink)" /><circle cx={6} cy={0} r={2.5} fill="var(--ink)" /><path d="M-3 11H3" strokeWidth={2} /></g>);
    case 'usb':
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><rect x={-16} y={-14} width={32} height={28} rx={3} fill="var(--fill-b)" /><path d="M-8 4H8M-4 -2L0 -8L4 -2" strokeWidth={1.8} /><circle cx={-8} cy={4} r={2} fill="var(--ink)" /></g>);
    case 'gang': {
      const nP = model.kind === 'GANG' ? model.n : model.kind === 'RCD' ? model.poles : 1;
      const off = nP > 2 ? -1 : 0;
      const closedAt = (i: number) => (model.kind === 'GANG' ? model.closed(par, i) : model.kind === 'RCD' ? Boolean(par.closed) && !dead : true);
      return (<g {...sw}>{Array.from({ length: nP }, (_, i) => { const y = (i + off) * 20; const cl = closedAt(i);
        return <g key={i}><path d={`M-40 ${y}H-16M16 ${y}H40`} /><circle cx={-16} cy={y} r={3} fill="var(--ink)" /><circle cx={16} cy={y} r={3} fill="var(--ink)" />
          <path d={cl ? `M-16 ${y}L16 ${y}` : `M-16 ${y}L10 ${y - 14}`} strokeWidth={3.2} stroke={cl ? 'var(--accent)' : 'var(--ink)'} /></g>; })}
        <path d={`M0 ${off * 20 - 6}V${(nP - 1 + off) * 20 - 6}`} strokeDasharray="3 3" strokeWidth={1.2} /></g>);
    }
    case 'push2': {
      const pr = Boolean(par.pressed);
      return (<g {...sw}>{[0, 1].map((i) => { const y = i * 20; const cl = i === 0 ? pr : !pr;
        return <g key={i}><path d={`M-40 ${y}H-16M16 ${y}H40`} /><circle cx={-16} cy={y} r={3} fill="var(--ink)" /><circle cx={16} cy={y} r={3} fill="var(--ink)" />
          <path d={cl ? `M-16 ${y}L16 ${y}` : `M-16 ${y}L12 ${y - 12}`} strokeWidth={3} stroke={cl ? 'var(--accent)' : 'var(--ink)'} />{i === 1 && <path d={`M4 ${y - 11}L4 ${y - 3}`} strokeWidth={1.6} />}</g>; })}
        <rect x={-9} y={pr ? -14 : -24} width={18} height={8} rx={3} fill={pr ? 'var(--terracota)' : 'var(--fill-a)'} /><path d={`M0 ${pr ? -6 : -16}V4`} strokeDasharray="3 3" /></g>);
    }
    case 'cross': {
      const x = Number(par.pos) >= 0.5;
      return (<g {...sw}><path d="M-40 -20H-16M16 -20H40M-40 20H-16M16 20H40" />{[[-16, -20], [-16, 20], [16, -20], [16, 20]].map(([cx2, cy2], i) => <circle key={i} cx={cx2} cy={cy2} r={3} fill="var(--ink)" />)}
        <path d={x ? 'M-16 -20L16 20M-16 20L16 -20' : 'M-16 -20L16 -20M-16 20L16 20'} strokeWidth={3.2} stroke="var(--accent)" /></g>);
    }
    case 'estop':
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={par.pressed ? 'M-16 0L10 -14' : 'M-16 0L16 0'} strokeWidth={3} stroke={par.pressed ? 'var(--ink)' : 'var(--accent)'} />
        <path d="M0 -8V-16" /><ellipse cx={0} cy={-20} rx={13} ry={7} fill="#d33" stroke="#7a1010" strokeWidth={1.5} /></g>);
    case 'sel3': {
      const pos = Math.round(Number(par.pos));
      return (<g {...sw}><path d="M-40 0H-16M16 -20H40M16 20H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} cy={-20} r={3} fill="var(--ink)" /><circle cx={16} cy={20} r={3} fill="var(--ink)" />
        <path d={pos === 0 ? 'M-16 0L16 -20' : pos === 2 ? 'M-16 0L16 20' : 'M-16 0L14 0'} strokeWidth={3.2} stroke={pos === 1 ? 'var(--ink)' : 'var(--accent)'} /></g>);
    }
    case 'disc': {
      const on = Boolean(par.closed);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={on ? 'M-16 0L16 0' : 'M-16 0L10 -17'} strokeWidth={3.2} stroke={on ? 'var(--accent)' : 'var(--ink)'} /><path d="M0 -12V-4M-4 -12H4" strokeWidth={0} /><path d={on ? 'M0 -2V-8M-5 -8H5' : 'M0 -2V-2'} strokeWidth={1.6} /></g>);
    }
    case 'sensor': {
      const closed = model.kind === 'SW' ? model.closed(par) : Boolean(par.act) !== Boolean(par.nc);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={closed ? 'M-16 0L16 0' : 'M-16 0L12 -12'} strokeWidth={3} stroke={closed ? 'var(--accent)' : 'var(--ink)'} />
        <path d="M-16 -14L0 -22L16 -14L0 -6Z" fill={par.act ? 'var(--mostaza)' : 'var(--fill-a)'} strokeWidth={1.4} transform="translate(0 -4)" />{par.nc && <path d="M6 -14L10 -6" strokeWidth={1.4} />}</g>);
    }
    case 'relay': {
      const m = model.kind === 'RELAY' ? model : null;
      if (!m) return null;
      const on = !!live?.on;
      const nC = m.nNO + m.nNC;
      return (<g {...sw}>
        <path d="M-40 -20H-30M-40 20H-30" />
        <rect x={-30} y={-28} width={26} height={56} rx={3} fill={on ? 'var(--mostaza)' : 'var(--fill-b)'} />
        <path d="M-24 -8a5 6 0 0 1 10 0a5 6 0 0 1 10 0M-24 6a5 6 0 0 1 10 0a5 6 0 0 1 10 0" strokeWidth={1.6} transform="translate(0 0)" />
        <text x={-17} y={-14} textAnchor="middle" fontSize={7} fill="var(--ink)" stroke="none" fontWeight={700}>A1</text>
        <text x={-17} y={24} textAnchor="middle" fontSize={7} fill="var(--ink)" stroke="none" fontWeight={700}>A2</text>
        <path d={`M-2 0H${20 + 20 * (nC - 1) + 8}`} strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
        {Array.from({ length: nC }, (_, j) => { const x = 20 + 20 * j; const no = j < m.nNO; const closed = no === on;
          return <g key={j}><path d={`M${x} -40V-20M${x} 40V20`} /><circle cx={x} cy={-20} r={2.4} fill="var(--ink)" /><circle cx={x} cy={20} r={2.4} fill="var(--ink)" />
            <path d={closed ? `M${x} 20V-20` : `M${x} 20L${x + 9} -12`} strokeWidth={3} stroke={closed ? 'var(--accent)' : 'var(--ink)'} style={{ transition: 'all .15s' }} />
            {!no && <path d={`M${x - 5} -4L${x + 5} -12`} strokeWidth={1.2} />}</g>; })}
      </g>);
    }
    case 'xfmr': {
      const ts = defOf(c.type).terminals;
      const auto = model.kind === 'XFMR' && model.mode === 'auto';
      const ys = ts.map((q) => q.y), top = Math.min(...ys) - 6, bot = Math.max(...ys.filter((_, i) => !auto || i < 2)) + 14;
      const coil = (x: number) => { const n = Math.max(2, Math.round((bot - top) / 14)); const h = (bot - top) / n; return Array.from({ length: n }, (_, i) => `M${x} ${top + i * h}a${h * 0.45} ${h / 2} 0 0 ${x < 0 ? 0 : 1} 0 ${h}`).join(''); };
      return (<g {...sw}>
        {ts.map((q, i) => (auto ? <path key={i} d={q.x === 0 ? `M0 ${q.y}V${bot}` : `M${q.x} ${q.y}H${q.x < 0 ? -10 : 10}`} /> : <path key={i} d={`M${q.x} ${q.y}H${q.x < 0 ? -24 : 24}`} />))}
        {auto ? <g><path d={coil(-0)} strokeWidth={2} /><path d={`M-10 ${ts[0].y}V${top}M10 ${ts[1].y}V${top + 18}`} /></g>
          : <><path d={coil(-16)} /><path d={coil(16)} /><path d={`M-5 ${top}V${bot}M5 ${top}V${bot}`} strokeWidth={1.6} />
            {ts.map((q, i) => <path key={'c' + i} d={`M${q.x < 0 ? -24 : 24} ${q.y}V${q.y > (top + bot) / 2 ? bot : top}`} opacity={0.0} />)}</>}
      </g>);
    }
    case 'src3': {
      const ts = defOf(c.type).terminals; const y0 = ts[0].y, y1 = ts[ts.length - 1].y; const ym = (y0 + y1) / 2;
      return (<g {...sw}><circle cx={-12} cy={ym} r={22} fill="var(--fill-b)" /><path d={`M-24 ${ym}q4 -9 8 0t8 0`} strokeWidth={2.2} stroke="var(--accent)" />
        <text x={-12} y={ym + 15} textAnchor="middle" fontSize={9} fill="var(--ink)" stroke="none" fontWeight={800}>3~</text>
        <path d={`M10 ${ym}H24M24 ${y0}V${y1}`} />{ts.map((q, i) => <path key={i} d={`M24 ${q.y}H40`} />)}
        {ts.map((q, i) => <text key={'t' + i} x={34} y={q.y - 3} fontSize={7} fill="var(--ink)" stroke="none">{q.name}</text>)}</g>);
    }
    case 'load3': case 'motor3': {
      const ts = defOf(c.type).terminals; const y0 = ts[0].y, y1 = ts[ts.length - 1].y; const ym = (y0 + y1) / 2;
      return (<g {...sw}>{ts.map((q, i) => <path key={i} d={`M-40 ${q.y}H-24`} />)}<path d={`M-24 ${y0}V${y1}M-24 ${ym}H-14`} />
        {t === 'motor3' ? <><circle cx={6} cy={ym} r={22} fill="var(--fill-b)" /><text x={6} y={ym + 4} textAnchor="middle" fontSize={13} fill="var(--ink)" stroke="none" fontWeight={800}>M</text><text x={6} y={ym + 17} textAnchor="middle" fontSize={8} fill="var(--ink)" stroke="none">3~</text></>
          : <><rect x={-14} y={ym - 16} width={44} height={32} fill="var(--fill-a)" /><path d={`M-8 ${ym}h5l2 -7l4 14l4 -14l2 7h5`} strokeWidth={1.6} /></>}
        {ts.map((q, i) => <text key={'t' + i} x={-38} y={q.y - 3} fontSize={7} fill="var(--ink)" stroke="none">{q.name}</text>)}</g>);
    }
    case 'ground':
      return (<g {...sw}><path d="M0 -20V0M-14 0H14M-9 6H9M-4 12H4" /></g>);
    case 'junction':
      return <circle r={4.5} fill="var(--ink)" />;
    default:
      return <rect x={-20} y={-10} width={40} height={20} {...sw} />;
  }
}
