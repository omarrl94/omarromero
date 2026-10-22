import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

/** Campo de contraseña con botón para mostrarla u ocultarla. Admite las mismas props que <input>. */
export default function PasswordInput({ className = 'input', id, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} id={id} type={visible ? 'text' : 'password'} className={`${className} pr-11`} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        aria-controls={id}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-stone-600 transition hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-stone-400 dark:hover:text-white"
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
