import { config, perfilPorId } from '../../config/ffe.config';
import { SelectorPerfil } from '../components/SelectorPerfil';
import { useAlumno } from '../lib/alumno';
import { useSesion } from '../lib/sesion';

export function Portada() {
  const [alumno, setAlumno] = useAlumno();
  const { usuario, estado } = useSesion();
  const rol = estado?.verificado ? estado.rol : null;
  const cambiar = (c: Partial<typeof alumno>) => setAlumno((prev) => ({ ...prev, ...c }));
  const listo = alumno.ciclo && alumno.perfiles.length > 0 && alumno.modalidad;

  return (
    <div className="grid gap-10">
      <section className="relative overflow-hidden rounded-3xl border-2 border-tinta bg-amarillo px-5 py-8 sm:px-10 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-terracota sm:size-72" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-24 size-40 rounded-full bg-salvia sm:size-56" />
        <div className="relative max-w-2xl">
          <p className="chip mb-4 border-tinta bg-papel">2.º DAM · 2.º ASIR · Curso {config.curso}</p>
          <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-6xl">Tu plaza de Formación en Empresa empieza aquí.</h1>
          <p className="mt-4 max-w-xl text-lg">
            Empresas de Madrid revisadas una a una, un correo de presentación listo para editar y ofertas de prácticas y primer empleo de tu perfil.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {!usuario ? (
              <>
                <a href="#/entrar" className="btn-primario">Crear cuenta o entrar</a>
                <span className="self-center text-sm font-semibold">Alumnado con @a.jrotero.es · profesorado con @jrotero.es</span>
              </>
            ) : rol === 'tutor' || rol === 'superadmin' ? (
              <>
                <a href="#/tutores" className="btn-primario">Ir a la sección de tutores</a>
                {rol === 'superadmin' && <a href="#/admin" className="btn-secundario">Usuarios y roles</a>}
              </>
            ) : rol === 'alumno' ? (
              <button type="button" className="btn-primario" onClick={() => { const el = document.getElementById('elige'); el?.scrollIntoView(); el?.querySelector('input')?.focus({ preventScroll: true }); }}>
                Elegir mi perfil <span aria-hidden="true">↓</span>
              </button>
            ) : (
              <a href="#/entrar" className="btn-primario">Continuar con mi cuenta</a>
            )}
          </div>
        </div>
      </section>

      {(rol === 'alumno' || !usuario) && (
      <section id="elige" aria-labelledby="titulo-elige" className="scroll-mt-24">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <h2 id="titulo-elige" className="text-3xl font-extrabold">Cuéntanos qué buscas</h2>
          <p className="text-tinta-suave">Cuatro clics. Se guarda solo en este dispositivo.</p>
        </div>
        <div className="tarjeta p-5 sm:p-8">
          <SelectorPerfil alumno={alumno} cambiar={cambiar} numerado />
          <div className="mt-8 flex flex-col gap-3 border-t-2 border-dashed border-linea pt-6 sm:flex-row sm:items-center">
            <a href="#/empresas" className={`btn-primario ${listo ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!listo} tabIndex={listo ? undefined : -1}>
              Ver empresas para mí
            </a>
            <a href="#/ofertas" className={`btn-secundario ${listo ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!listo} tabIndex={listo ? undefined : -1}>
              Ver ofertas
            </a>
            <p className="text-sm text-tinta-suave" aria-live="polite">
              {listo
                ? `Perfil: ${alumno.ciclo} · ${alumno.perfiles.map((p) => perfilPorId(p)?.nombre).join(', ')}`
                : 'Elige ciclo, al menos un perfil y tu modalidad para continuar.'}
            </p>
          </div>
        </div>
      </section>

      )}

      <section aria-labelledby="titulo-como" className="grid gap-4">
        <h2 id="titulo-como" className="text-2xl font-extrabold">Cómo funciona</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ['Encuentra', 'Empresas reales con su fuente y fecha de verificación, ordenadas por encaje con tu perfil.', 'bg-salvia-claro'],
            ['Escribe', 'Un correo personalizado que tú revisas y envías desde tu cuenta, con tu tutor/a en copia y tu CV adjunto.', 'bg-amarillo-claro'],
            ['Sigue', 'Apunta a quién has escrito y en qué punto está cada candidatura. Todo queda en tu dispositivo.', 'bg-terracota-claro'],
          ].map(([t, d, c], i) => (
            <li key={t} className={`rounded-2xl border-2 border-tinta p-5 ${c}`}>
              <span className="font-display text-4xl font-extrabold" aria-hidden="true">0{i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{t}</h3>
              <p className="mt-1">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
