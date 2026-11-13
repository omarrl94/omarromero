/** Ayuda de atajos del lienzo: ratón y teclado. */
import { createPortal } from 'react-dom';

const MOUSE: [string, string][] = [
  ['Clic en un terminal', 'Empieza un cable'],
  ['Clic en el lienzo (con un cable en curso)', 'Fija un codo: el cable gira ahí'],
  ['Clic en otro terminal', 'Termina el cable'],
  ['Clic sobre otro cable', 'Termina el cable con un empalme automático'],
  ['Arrastrar de un terminal a otro', 'Cable directo'],
  ['Rueda sobre un componente', 'Lo gira 90° (también sobre toda la selección)'],
  ['Rueda en el lienzo · Ctrl + rueda', 'Zoom · zoom aunque haya un componente debajo'],
  ['Arrastrar el fondo · botón central', 'Mover la vista'],
  ['Mayús + arrastrar', 'Seleccionar con recuadro'],
  ['Mayús + clic', 'Añadir o quitar de la selección'],
  ['Cuadraditos de un cable seleccionado', 'Arrastrar para mover sus codos'],
  ['Clic derecho', 'Cancela el cable en curso'],
];
const KEYS: [string, string][] = [
  ['Ctrl + C · X · V', 'Copiar · cortar · pegar (se pega donde está el cursor)'],
  ['Ctrl + D', 'Duplicar la selección'],
  ['Ctrl + A', 'Seleccionar todo'],
  ['Supr · Retroceso', 'Borrar la selección'],
  ['Ctrl + Z · Ctrl + Y', 'Deshacer · rehacer'],
  ['R · Mayús + R', 'Girar 90° · girar al revés'],
  ['Flechas · Mayús + flechas', 'Mover un cuadro · cinco cuadros'],
  ['Espacio (cableando)', 'Cambia el sentido del siguiente tramo'],
  ['Retroceso (cableando)', 'Quita el último codo'],
  ['Esc', 'Cancela el cable o la selección'],
  ['F', 'Ajustar el circuito a la pantalla'],
  ['?', 'Abre o cierra esta ayuda'],
];
const Row = ({ k, v }: { k: string; v: string }) => <li><kbd>{k}</kbd><span>{v}</span></li>;

export function Shortcuts({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="Atajos del lienzo" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="omi-box keys-box">
        <header><h2>Atajos del lienzo</h2><button className="ghost" onClick={onClose}>Cerrar</button></header>
        <div className="keys-grid">
          <section><h3>Ratón</h3><ul>{MOUSE.map(([k, v]) => <Row key={k} k={k} v={v} />)}</ul></section>
          <section><h3>Teclado</h3><ul>{KEYS.map(([k, v]) => <Row key={k} k={k} v={v} />)}</ul><p className="note">En Mac, Cmd en lugar de Ctrl.</p></section>
        </div>
      </div>
    </div>, document.body);
}
