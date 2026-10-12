/** Avisos de la casa, en bucle. Decorativo: no aporta nada al lector de pantalla. */
const AVISOS = [
  "Lleva papel de casa",
  "El pestillo decorativo existe y está en Malasaña",
  "Nadie limpia a las 3 de la mañana",
  "Si huele desde la barra, no bajes",
  "Un baño limpio salva una cita",
  "Puntúa lo que te encuentres, no lo que te cuenten",
];

export function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 overflow-hidden whitespace-nowrap border-b-[3px] border-black bg-marca text-[#10040A]"
    >
      {/* Dos copias seguidas: el bucle salta al -50% sin costura */}
      <div className="inline-flex animate-correr">
        {[0, 1].map((copia) => (
          <span key={copia} className="grito py-1.5 text-[15px] tracking-wider">
            {AVISOS.map((aviso) => (
              <span key={aviso}>
                {aviso}
                <span className="px-4 opacity-60">✺</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
