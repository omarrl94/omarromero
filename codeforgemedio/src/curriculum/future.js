// «Tu futuro»: conecta lo que el jugador va aprendiendo con el mundo real y con
// los estudios que puede hacer después del grado medio.

/** Lo que ya sabes hacer al terminar cada módulo… y dónde se usa de verdad. */
export const REAL_WORLD = {
  1: { skill: 'Guardar datos en variables y mostrarlos', real: 'El marcador de puntos, las vidas y el nombre de tu personaje en cualquier videojuego son variables como las que acabas de usar.' },
  2: { skill: 'Crear funciones que calculan', real: 'Cada botón de una app llama a una función: «añadir al carrito», «enviar mensaje» o «calcular el total» son funciones como las tuyas.' },
  3: { skill: 'Hacer que el programa decida', real: '¿Contraseña correcta? ¿Te queda saldo? ¿Has chocado con un enemigo? Cada comprobación que hace una app o un juego es un if.' },
  4: { skill: 'Repetir con bucles', real: 'Cuando deslizas una lista de vídeos, un bucle pinta uno detrás de otro. Un juego entero es un bucle que se repite unas 60 veces por segundo.' },
  5: { skill: 'Manejar listas de datos', real: 'Tu lista de reproducción, tus contactos, los mensajes de un chat y el ranking de este juego son listas que alguien recorre con un bucle.' },
  6: { skill: 'Combinarlo todo para resolver un problema', real: 'Has resuelto FizzBuzz, una prueba clásica de las entrevistas de trabajo para programadores. Eso ya no es jugar: es programar.' },
};

/** Grados superiores de informática a los que se puede acceder con el título de grado medio. */
export const DEGREES = [
  {
    id: 'dam', short: 'DAM', name: 'Desarrollo de Aplicaciones Multiplataforma', color: '#22e4ff',
    what: 'Aprendes a crear aplicaciones para móviles y ordenadores: programación, bases de datos, interfaces y apps móviles.',
    like: 'Te pega si lo que más te ha gustado es construir cosas que funcionan: apps, programas, videojuegos.',
    world: 'java',
  },
  {
    id: 'daw', short: 'DAW', name: 'Desarrollo de Aplicaciones Web', color: '#f7df1e',
    what: 'Aprendes a crear páginas y aplicaciones web completas: lo que se ve en el navegador y lo que ocurre en el servidor.',
    like: 'Te pega si te gusta que lo que haces se vea, se pueda enseñar con un enlace y lo use gente desde cualquier sitio.',
    world: 'js',
  },
  {
    id: 'asir', short: 'ASIR', name: 'Administración de Sistemas Informáticos en Red', color: '#a3ff3d',
    what: 'Aprendes a montar y cuidar servidores, redes y sistemas, y a mantenerlos seguros. También se programa: se escriben scripts para automatizar tareas.',
    like: 'Te pega si prefieres los sistemas, las redes y la seguridad, y quieres que el ordenador haga solo el trabajo repetitivo.',
    world: 'python',
  },
];

/** Cursos de especialización que existen después de un grado superior. */
export const SPECIALIZATIONS = ['Desarrollo de videojuegos y realidad virtual', 'Ciberseguridad', 'Inteligencia artificial y big data'];

/** Trabajos en los que se programa a diario. */
export const JOBS = [
  { name: 'Desarrollo web', text: 'Crear las páginas y tiendas online que usa todo el mundo.' },
  { name: 'Apps móviles', text: 'Hacer las aplicaciones que llevas en el bolsillo.' },
  { name: 'Videojuegos', text: 'Programar las reglas, los enemigos y la física de un juego.' },
  { name: 'Pruebas (testing)', text: 'Buscar los fallos de un programa antes de que los encuentren los usuarios.' },
  { name: 'Sistemas y redes', text: 'Mantener en marcha los servidores y automatizar tareas con scripts.' },
  { name: 'Ciberseguridad', text: 'Proteger sistemas y datos frente a ataques.' },
  { name: 'Datos e IA', text: 'Sacar conclusiones de montañas de datos y entrenar modelos.' },
];
