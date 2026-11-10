// Explicaciones en lenguaje sencillo: qué hace una línea de código y qué significa un error.

const TYPE_WORDS = [
  [/^(number)$/, 'un número (en JavaScript todos son decimales de 64 bits)'],
  [/^(bigint)$/, 'un entero exacto de cualquier tamaño (BigInt)'],
  [/^(int|Int|Int32|i32|int32_t|Integer|int32)$/, 'un número entero (sin decimales, hasta ±2.147 millones)'],
  [/^(long|Long|Int64|i64|int64_t|long long|usize|u64|size_t|int64)$/, 'un número entero grande (64 bits)'],
  [/^(double|Double|float|Float|f64|f32|float64|float32)$/, 'un número con decimales'],
  [/^(boolean|Boolean|bool|Bool)$/, 'un valor sí/no (verdadero o falso)'],
  [/^(String|str|&str|char\s*\*|char\*|string)$/, 'un texto'],
  [/List|Array|\[\]|Vec|IntArray/, 'una lista de valores'],
  [/Map|dict|\[\w+\s*:\s*\w+\]|HashMap/, 'un diccionario (clave → valor)'],
  [/Set/, 'un conjunto (valores sin repetir)'],
];
const typeWord = (t) => {
  const s = (t || '').trim();
  const hit = TYPE_WORDS.find(([re]) => re.test(s));
  return hit ? hit[1] : `un valor de tipo ${s}`;
};

const valueWord = (v) => {
  const s = (v || '').trim().replace(/;$/, '');
  if (/^".*"$|^'.*'$/.test(s)) return `el texto ${s}`;
  if (/^-?[\d_]+\.\d+[fF]?$/.test(s)) return `el número decimal ${s}`;
  if (/^-?[\d_]+[lL]*$/.test(s)) return `el número ${s}`;
  if (/^(true|false|True|False)$/.test(s)) return `el valor ${s} (sí/no)`;
  if (/^malloc|^calloc/.test(s)) return 'un bloque de memoria nuevo pedido con malloc';
  if (/^\[\s*\]$|^\{\s*\}$|^\[:\]$|mutable\w*Of|new\s+\w+|Vec::new|HashMap::new|HashSet::new|set\(\)/.test(s)) return 'una colección vacía';
  return `el resultado de calcular ${s}`;
};

/** Explica en castellano llano qué hace una línea. */
export function explainLine(raw, lang) {
  const t = (raw || '').trim();
  if (!t) return 'Línea en blanco: solo separa el código para que se lea mejor.';
  let m;
  if (/^(#|\/\/)/.test(t) && !/^#include|^#\[/.test(t)) return `Comentario: el ordenador lo ignora. Es una nota para las personas que leen el código${/TODO/.test(t) ? '. Este marca algo que TIENES QUE HACER tú.' : /⚠/.test(t) ? '. Este avisa de que en esta zona hay un fallo que arreglar.' : '.'}`;
  if (/^\}\s*$/.test(t)) return 'Cierra el bloque que se abrió con { más arriba.';
  if (lang === 'csharp') {
    if (t === '{') return 'Abre un bloque: en C# la llave va en su propia línea (estilo de .NET).';
    if ((m = /^using\s+([\w.]+)\s*;/.exec(t))) return `Trae las herramientas del espacio de nombres ${m[1]}${m[1] === 'System' ? ' (ahí viven Console, Math…)' : /Collections/.test(m[1]) ? ' (List, Dictionary, HashSet…)' : /Tasks|Threading/.test(m[1]) ? ' (Task, para tareas en paralelo)' : ''}.`;
    if ((m = /^namespace\s+([\w.]+)/.exec(t))) return `Agrupa tu código bajo el nombre ${m[1]}, como una carpeta: evita choques con nombres de otras librerías.`;
    if (/^(?:(?:public|internal|static)\s+)*class\s+Program\b/.test(t)) return 'En C# todo el código vive dentro de una clase. Program es el contenedor del programa.';
    if (/\bstatic\s+(?:async\s+)?(?:void|int|Task)\s+Main\s*\(/.test(t)) return 'Aquí empieza el programa: Main (con mayúscula) es el primer método que ejecuta .NET.';
    if ((m = /^(?:(?:public|private|protected|internal|static|async|virtual|override|abstract|sealed)\s+)*(?:async\s+)?(void|[\w<>[\],\s]+?)\s+([A-Z]\w*)\s*\(([^)]*)\)\s*$/.exec(t))) {
      const mods = t.slice(0, t.indexOf(m[2]));
      const ret = m[1].trim();
      return `Define el método ${m[2]}${m[3].trim() ? ` (recibe ${m[3].trim()})` : ''}${ret === 'void' ? ', que no devuelve nada' : /^Task<(\w+)>/.test(ret) ? `, asíncrono: devuelve una tarea que acabará dando un ${/^Task<(\w+)>/.exec(ret)[1]}` : `, que devuelve un ${ret}`}.${/\bvirtual\b/.test(mods) ? ' virtual: las clases hijas pueden sobrescribirlo.' : ''}${/\boverride\b/.test(mods) ? ' override: reemplaza la versión virtual de la clase padre.' : ''}${/\babstract\b/.test(mods) ? ' abstract: no tiene cuerpo; cada hija DEBE escribir el suyo.' : ''}${/\bstatic\b/.test(mods) && !/override|virtual/.test(mods) ? ' static: se usa sin crear un objeto.' : ''}`;
    }
    if ((m = /^Console\.Write(Line)?\(\s*\$"/.exec(t))) return `Muestra un texto en la consola${m[1] ? ' y salta de línea' : ''}. El $ delante de las comillas permite meter valores entre llaves: {nombre} se sustituye por su valor.`;
    if ((m = /^Console\.Write(Line)?\(/.exec(t))) return `Muestra ${t.includes('()') ? 'una línea en blanco' : 'un valor'} en la consola${m[1] ? ' y salta de línea' : ' sin saltar de línea'}.`;
    if ((m = /^foreach\s*\(\s*(?:var|[\w<>]+)\s+(\w+|\([^)]*\))\s+in\s+(.+)\)/.exec(t))) return `Bucle: recorre ${m[2]} elemento a elemento; en cada vuelta, ${m[1]} vale el siguiente. No hay índice que se pueda salir del array.`;
    if ((m = /^var\s+(\w+)\s*=\s*(.+?);?$/.exec(t))) {
      const rhs = m[2];
      const what = /new\s+List</.test(rhs) ? 'una lista (List) que puede crecer' : /new\s+Dictionary</.test(rhs) ? 'un diccionario (Dictionary): etiquetas → valores' : /new\s+HashSet</.test(rhs) ? 'un conjunto (HashSet) sin repetidos' : /\bawait\b/.test(rhs) ? 'el resultado de esperar (await) una tarea' : `el resultado de ${rhs}`;
      return `Crea una variable ${m[1]} con ${what}. var: C# deduce el tipo solo, pero sigue siendo fijo.`;
    }
    if ((m = /^(\w+)\.Add\((.*)\);?$/.exec(t))) return `Añade ${m[2]} a ${m[1]}${/,/.test(m[2]) ? ' (en un Dictionary, Add falla si la clave ya existe)' : ''}.`;
    if (/GetValueOrDefault\(/.test(t)) return 'GetValueOrDefault(clave) lee el valor de la clave o 0 si no existe: así el contador no lanza KeyNotFoundException.';
    if ((m = /^lock\s*\((\w+)\)/.exec(t))) return `lock: solo un hilo a la vez puede entrar en este bloque (${m[1]} hace de candado). Evita que dos tareas pisen el mismo dato.`;
    if (/Task\.WhenAll\(/.test(t)) return 'Task.WhenAll espera a que terminen TODAS las tareas y junta sus resultados. Con await, el programa sigue cuando acaba la última.';
    if (/Task\.Run\(/.test(t)) return 'Task.Run lanza el trabajo en otro hilo y sigue sin esperar: devuelve una tarea que puedes esperar después.';
    if (/\.Select\(\s*\w+\s*=>/.test(t)) return 'Select aplica la función de la flecha (=>) a cada elemento y devuelve los resultados, uno por elemento.';
  }
  if (lang === 'c') {
    // C no tiene tipo string: el texto es un array de char terminado en '\0'.
    if ((m = /^(?:const\s+|static\s+)*(?:std::)?(string|String)\s+(\w+)/.exec(t))) return `En C NO existe el tipo ${m[1]}: esta línea no compila. Un texto en C es un array de char: escribe char ${m[2]}[] = "…";`;
    if ((m = /^(?:const\s+|static\s+)*char\s+(\w+)\s*\[\s*(\d*)\s*\]\s*=\s*"([^"]*)"/.exec(t))) {
      const need = m[3].length + 1;
      const cap = m[2] ? Number(m[2]) : need;
      return `Crea un array de char llamado ${m[1]} (así se guarda un texto en C) con las letras de "${m[3]}" y un '\\0' al final que marca dónde acaba: ${m[3].length} letras + '\\0' = ${need} char.${m[2] ? ` El array tiene ${cap} huecos${cap >= need ? `, así que sobran ${cap - need}.` : cap === m[3].length ? ': no cabe el \'\\0\' y C no sabrá dónde termina el texto.' : ': ¡no caben todas las letras!'}` : ' Al dejar [] vacío, C cuenta el tamaño por ti.'}`;
    }
    if ((m = /^(?:const\s+)?char\s*\*\s*(\w+)\s*=\s*"([^"]*)"/.exec(t))) return `Crea un puntero a char llamado ${m[1]}: apunta a la primera letra del texto "${m[2]}", guardado en memoria de solo lectura. Si quieres poder cambiar las letras, usa char ${m[1]}[] = "${m[2]}";`;
    if (/printf\s*\(.*%s/.test(t)) return 'Muestra un mensaje en la consola. %s se sustituye por un texto (un array de char): printf lo recorre letra a letra hasta encontrar el \'\\0\'.';
  }
  if (/^package\s+main/.test(t)) return 'Dice que este archivo pertenece al paquete main: el que se convierte en un programa ejecutable.';
  if (/^using\s+namespace\s+std/.test(t)) return 'Permite escribir cout o vector sin el prefijo std:: delante.';
  if (/^(public|private|protected):$/.test(t)) return 'Lo que viene debajo es ' + (t.startsWith('public') ? 'público: se puede usar desde fuera de la clase.' : 'privado: solo lo usa la propia clase.');
  if (/^#include|^import\b|^from\b|^use\b/.test(t)) return 'Trae herramientas de una librería para poder usarlas en este archivo.';
  if (/^#\[/.test(t)) return 'Atributo de Rust: da instrucciones extra al compilador sobre lo que viene debajo.';
  if (/^(public\s+)?class\s+Main\b/.test(t)) return 'En Java todo el código vive dentro de una clase. Esta es solo el «contenedor» del programa.';
  if (/(static\s+void\s+main|fun\s+main|int\s+main|fn\s+main|func\s+main)/.test(t)) return 'Aquí empieza el programa: main es la primera función que se ejecuta.';
  if ((m = /^(?:async\s+)?(?:def|fun|fn|func|function)\s+(\w+)\s*\(([^)]*)\)/.exec(t)) || (m = /^(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/.exec(t)) || (m = /^(?:static\s+|public\s+|private\s+)*(?:void|int|bool|boolean|long|double|Map<[^>]*>|String)\s+(\w+)\s*\(([^)]*)\)\s*\{/.exec(t))) {
    const params = m[2].trim();
    return `Define una función llamada ${m[1]}: un bloque de código con nombre que se puede llamar cuando haga falta.${params ? ` Recibe estos datos: ${params}.` : ''}`;
  }
  if ((m = /^(?:open\s+|abstract\s+|pub\s+)?(?:class|struct)\s+(\w+)\s*(?:\(\s*(\w+)\s*\)|extends\s+(\w+)|:\s*(\w+))?/.exec(t))) {
    const parent = m[2] || m[3] || m[4];
    return `Define ${/struct/.test(t) ? 'una estructura' : 'una clase'} llamada ${m[1]} (un molde para crear objetos)${parent && parent !== 'object' ? `. Hereda de ${parent}: recibe todo lo que ${parent} tiene.` : '.'}${/^open/.test(t) ? ' «open» permite que otras clases hereden de ella.' : ''}`;
  }
  if ((m = /^impl\s+(\w+)\s+for\s+(\w+)/.exec(t))) return `Hace que ${m[2]} cumpla el trait ${m[1]}: aquí se escribe cómo hace ${m[2]} cada cosa que ${m[1]} pide.`;
  if ((m = /^trait\s+(\w+)/.exec(t))) return `Define el trait ${m[1]}: una lista de cosas que deben saber hacer los tipos que lo implementen (como un contrato).`;
  if (/^(@Override|override\b)/.test(t)) return 'Reemplaza el método que viene de la clase padre por una versión propia de esta clase.';
  if ((m = /^for\s*\(?\s*(?:[\w<>[\]]+\s+)?(\w+)\s*(?:=\s*([^;]+);\s*\1\s*(<=?)\s*([^;]+);|in\s+(.+?)\s*[:{]?\s*$|:\s*(\w+))/.exec(t))) {
    if (m[2] !== undefined) return `Bucle: repite el bloque empezando con ${m[1]} = ${m[2].trim()} y sumando 1 cada vuelta, mientras ${m[1]} ${m[3]} ${m[4].trim()}. ${m[3] === '<=' ? 'Ojo: <= INCLUYE el último valor.' : 'Con < el último valor NO se incluye.'}`;
    if (m[6]) return `Bucle: recorre ${m[6]} elemento a elemento; en cada vuelta, ${m[1]} es el elemento actual.`;
    let r = m[5].trim();
    if ((r.match(/\)/g) || []).length > (r.match(/\(/g) || []).length) r = r.replace(/\)\s*$/, '').trim();
    let mm;
    if ((mm = /^range\(\s*([^,)]+)\s*\)$/.exec(r))) return `Bucle: repite ${mm[1]} veces. ${m[1]} vale 0, 1, 2… hasta ${mm[1]} − 1 (el ${mm[1]} no se incluye).`;
    if ((mm = /^range\((.+)\)$/.exec(r))) return `Bucle: ${m[1]} recorre los números de range(${mm[1]}); el último número no se incluye.`;
    if ((mm = /^(.+?)\s*(\.\.=|\.\.\.)\s*(.+)$/.exec(r))) return `Bucle: ${m[1]} va de ${mm[1]} a ${mm[3]}, AMBOS incluidos.`;
    if ((mm = /^(.+?)\s*(\.\.<|until|\.\.)\s*(.+)$/.exec(r))) {
      const incl = mm[2] === '..' && lang === 'kotlin';
      return `Bucle: ${m[1]} va de ${mm[1]} a ${mm[3]}, ${incl ? 'incluyendo el último (en Kotlin «..» es cerrado)' : 'sin incluir el último'}.`;
    }
    return `Bucle: recorre ${r} y en cada vuelta ${m[1]} toma el siguiente valor.`;
  }
  if ((m = /^while\s*\(?(.+?)\)?\s*[:{]?\s*$/.exec(t))) return `Bucle while: repite el bloque mientras se cumpla ${m[1]}. Si nunca deja de cumplirse, no termina.`;
  if ((m = /^(?:\}\s*)?(?:else\s+if|elif)\s*\(?(.+?)\)?\s*[:{]?\s*$/.exec(t))) return `Si lo anterior no se cumplió, comprueba otra condición: ${m[1]}.`;
  if (/^(?:\}\s*)?else\s*[:{]?\s*$/.test(t)) return 'else: este bloque se ejecuta cuando la condición del if NO se cumple.';
  if ((m = /^if\s*\(?(.+?)\)?\s*[:{]?\s*$/.exec(t))) {
    const c = m[1];
    const extra = /%\s*2\s*==\s*0/.test(c) ? ' (es decir, si el número es par)' : /%\s*2\s*(==\s*1|!=\s*0)/.test(c) ? ' (es decir, si el número es impar)' : '';
    return `Condición: el bloque de dentro solo se ejecuta si ${c} es verdadero${extra}.`;
  }
  if (/^return\b/.test(t)) return `Termina la función y devuelve ${t.replace(/^return\s*/, '').replace(/;$/, '') || 'nada'} a quien la llamó.`;
  if (/^(cout\s*<<|std::cout|console\.log|fmt\.Print)/.test(t)) return 'Muestra un mensaje en la consola (abajo a la derecha). Sirve para ver qué está pasando.';
  if ((m = /^(\w+(?:\s*,\s*\w+)*)\s*:=\s*(.+)$/.exec(t))) return m[1].includes(',') ? `Crea varias variables a la vez (${m[1]}) con los valores ${m[2]}.` : `Crea una caja llamada ${m[1]} y mete dentro ${valueWord(m[2])}. Con := Go deduce el tipo solo.`;
  if ((m = /^(?:var|const)\s+(\w+)\s+([\w[\]*]+)\s*=\s*(.+)$/.exec(t)) && lang === 'go') return `Crea una caja llamada ${m[1]} que guarda ${typeWord(m[2])} y mete dentro ${valueWord(m[3])}.`;
  if ((m = /^go\s+func/.exec(t))) return 'Lanza una goroutine: esta función se ejecuta en paralelo, sin esperar a que termine.';
  if (/<-/.test(t)) return /^\w+\s*<-/.test(t) ? 'Envía un valor por el canal (como meter una carta en un buzón).' : 'Recibe un valor del canal: espera hasta que alguien envíe uno.';
  if ((m = /^func\s*\(\s*(\w+)\s+(\*?)(\w+)\s*\)\s*(\w+)/.exec(t))) return `Define el método ${m[4]} del tipo ${m[3]}.${m[2] ? ' Con * recibe el original (puede modificarlo).' : ' Sin * recibe una COPIA: los cambios no se guardan.'}`;
  if (/^(delete\s*\[\]|delete\s)/.test(t)) return 'Devuelve al sistema la memoria pedida con new. Después no se debe volver a usar ese puntero.';
  if (/Promise\.all/.test(t)) return 'Lanza todas las tareas a la vez y espera a que terminen todas.';
  if (/^await\s|=\s*await\s/.test(t)) return 'await espera a que termine una tarea asíncrona antes de seguir.';
  if ((m = /^(?:System\.out\.)?(print(?:ln|f)?!?)\s*\(/.exec(t))) return 'Muestra un mensaje en la consola (abajo a la derecha). Sirve para ver qué está pasando.';
  if ((m = /^free\((\w+)\)/.exec(t))) return `Devuelve al sistema la memoria de ${m[1]}. Después de esto, ${m[1]} no se debe volver a usar.`;
  if ((m = /^baliza\((.+)\)/.exec(t))) return `Añade un punto a la ruta del dron en las coordenadas (${m[1]}).`;
  if (lang === 'python' && (m = /^(.+?,.+?)\s*=\s*(.+,.+)$/.exec(t))) return `Intercambia o reparte valores a la vez: ${m[1]} reciben ${m[2]}. Python calcula primero todo lo de la derecha, así que sirve para intercambiar sin variable temporal.`;
  if (lang === 'python' && (m = /^([\w.]+(?:\[[^\]]*\])?)\s*=\s*([^=].*)$/.exec(t)) && /\[/.test(m[1])) return `Guarda ${valueWord(m[2])} en ${m[1]} (una posición o clave concreta de la colección).`;
  if (lang === 'python' && (m = /^(\w+)\s*(?::\s*(\w+))?\s*=\s*([^=].*)$/.exec(t))) return `Crea (o actualiza) una caja llamada ${m[1]} y mete dentro ${valueWord(m[3])}.${/^["']/.test(m[3].trim()) && /^[\d."']+$/.test(m[3].trim()) ? ' Ojo: las comillas lo convierten en TEXTO aunque parezca un número.' : ''}`;
  // Declaraciones
  if (lang === 'js' && (m = /^(const|let|var)\s+(\w+)\s*=\s*(.+?);?$/.exec(t))) {
    return `Crea una caja llamada ${m[2]} y mete dentro ${valueWord(m[3])}${m[1] === 'const' ? ' (const: no se podrá reasignar)' : m[1] === 'let' ? ' (let: se puede cambiar después)' : ' (var: forma antigua, mejor let o const)'}.${/^["']/.test(m[3].trim()) && /^["'][\d.]+["']/.test(m[3].trim()) ? ' Ojo: las comillas lo convierten en TEXTO aunque parezca un número.' : ''}`;
  }
  if ((m = /^(?:val|var|let)\s+(mut\s+)?(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(.+)$/.exec(t))) {
    const kw = /^val|^let(?!\s+mut)/.test(t) && lang !== 'swift' ? ' (constante: no se podrá cambiar después)' : /^let/.test(t) && lang === 'swift' ? ' (constante)' : /mut|^var/.test(t) ? ' (variable: se puede cambiar después)' : '';
    return `Crea una caja llamada ${m[2]}${m[3] ? ` que guarda ${typeWord(m[3])}` : ''} y mete dentro ${valueWord(m[4])}${kw}.`;
  }
  if (lang !== 'python' && (m = /^(?:final\s+|const\s+|static\s+)*((?:long\s+long|unsigned\s+\w+|[A-Za-z_][\w<>, ]*?)(?:\[\])?)(\s*\*\s*|\s+)(\w+)\s*(\[[^\]]*\])?\s*=\s*(.+?);?$/.exec(t)) && !/^(return|if|for|while|else)$/.test(m[1])) {
    if (m[2].includes('*')) return `Crea un puntero llamado ${m[3]}: no guarda el dato, sino la DIRECCIÓN de memoria donde está. Apunta a ${valueWord(m[5])}.`;
    return `Crea una caja llamada ${m[3]} que guarda ${typeWord(m[1] + (m[4] ? '[]' : ''))}, y mete dentro ${valueWord(m[5])}.`;
  }
  if ((m = /^(\w+)\s*(?::\s*(\w+))?\s*=\s*([^=].*)$/.exec(t)) && lang === 'python') return `Guarda en la caja ${m[1]} ${valueWord(m[3])}. Si la caja no existía, Python la crea.`;
  if ((m = /^(.+?)\s*(\+=|-=)\s*(.+?);?$/.exec(t))) return `${m[2] === '+=' ? 'Suma' : 'Resta'} ${m[3]} a ${m[1]} (equivale a ${m[1]} = ${m[1]} ${m[2][0]} ${m[3]}).`;
  if ((m = /^(.+?)(\+\+|--);?$/.exec(t))) return `${m[2] === '++' ? 'Suma 1 a' : 'Resta 1 a'} ${m[1]}.`;
  if ((m = /^(.+?)\s*=\s*([^=].*?);?$/.exec(t))) return `Guarda en ${m[1]} ${valueWord(m[2])}.`;
  if (/^pass$/.test(t)) return 'pass: «no hacer nada». Python lo exige cuando un bloque está vacío.';
  return 'Ejecuta esta instrucción.';
}

/** Traduce un error técnico a: qué ha pasado, y cómo arreglarlo. */
export function plainError(err) {
  if (!err) return null;
  const L = err.line ? `en la línea ${err.line}` : '';
  const msg = err.message || '';
  const byCode = {
    index: {
      title: 'Te has salido de la lista',
      what: `El programa intentó leer o escribir una posición que no existe ${L}. Si una lista tiene 8 elementos, las posiciones van de 0 a 7: la 8 no existe.`,
      fix: 'Revisa hasta dónde llega el contador del bucle. Si usas [j + 1], j debe parar una posición antes del final.',
    },
    name: {
      title: 'Usas un nombre que no existe',
      what: `${L ? `${L[0].toUpperCase()}${L.slice(1)} usas` : 'Usas'} una variable o función que el programa no conoce.`,
      fix: 'Comprueba que está escrita exactamente igual que donde la creaste (mayúsculas y guiones bajos cuentan) y que la has creado antes de usarla.',
    },
    null: {
      title: 'Algo está vacío',
      what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} se usa una variable que no tiene valor (null / None / nil).`,
      fix: 'Asegúrate de darle un valor antes de usarla.',
    },
    timeout: {
      title: 'El programa no termina',
      what: 'Hay un bucle que se repite sin parar: su condición de salida nunca se cumple.',
      fix: 'Mira qué variable controla el bucle y si cambia en cada vuelta para acercarse al final.',
    },
    overflow: {
      title: 'El número no cabe',
      what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} el resultado es más grande de lo que cabe en ese tipo. Este lenguaje prefiere detener el programa antes que dar un número equivocado.`,
      fix: 'Usa un tipo de 64 bits y convierte los números antes de operar.',
    },
    heapoverflow: {
      title: 'Escribes fuera de tu bloque de memoria',
      what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} se usa una posición más allá del final del bloque que pediste con malloc.`,
      fix: 'malloc cuenta BYTES. Para n enteros pide n * sizeof(int).',
    },
    uaf: { title: 'Usas memoria que ya devolviste', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} se usa un bloque después de hacer free.`, fix: 'Mueve el free al final, cuando ya no necesites ese bloque.' },
    doublefree: { title: 'Liberas dos veces', what: 'Has hecho free dos veces del mismo bloque.', fix: 'Deja un solo free por cada malloc.' },
    recursion: { title: 'Una función se llama a sí misma sin fin', what: 'La función nunca llega a un caso en el que pare.', fix: 'Añade un caso base que devuelva un valor sin volver a llamarse.' },
    call: { title: 'Llamas a algo que no es una función', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} usas paréntesis () con algo que no es una función.`, fix: 'Revisa el nombre de la función.' },
    panic: { title: 'Rust ha detenido el programa (panic)', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} se ha llamado a panic!: el programa se para de forma controlada antes de hacer algo peligroso.`, fix: 'Lee el mensaje del panic para ver qué condición falló.' },
    keynotfound: { title: 'Esa clave no está en el diccionario', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} lees una clave que el Dictionary aún no tiene. En C# eso no da 0: detiene el programa (KeyNotFoundException).`, fix: err.hint || 'Usa dict.GetValueOrDefault(clave) o comprueba antes con ContainsKey(clave).' },
    dupkey: { title: 'Esa clave ya existe', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} usas Add con una clave que ya estaba en el diccionario.`, fix: err.hint || 'Para cambiar el valor de una clave, usa dict[clave] = valor.' },
    divzero: { title: 'División entre cero', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} se divide un entero entre 0, y eso no tiene resultado.`, fix: 'Comprueba que el divisor no sea 0 antes de dividir.' },
    borrow: { title: 'El compilador de Rust protege la memoria', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} usas un valor de una forma que podría ser insegura.`, fix: err.hint || 'Revisa quién es el dueño del valor y si necesitas mut.' },
  };
  if (byCode[err.code]) return byCode[err.code];
  if (err.code === 'type' || /incompatible types|lossy|does not conform|cannot convert|Cannot implicitly convert|mismatched types|too large/.test(msg)) {
    return {
      title: 'El tipo no encaja',
      what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} intentas guardar un valor en una caja de otro tipo (por ejemplo, un decimal en una caja de enteros).`,
      fix: err.hint || 'Cambia el tipo de la variable por uno que admita ese valor.',
    };
  }
  if (/expected ':'|expecting ':'/.test(msg)) return { title: 'Faltan los dos puntos', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} una línea que abre un bloque (if, for, def…) debe terminar en «:».`, fix: 'Añade «:» al final de esa línea.' };
  if (/Indentation/.test(msg)) return { title: 'La sangría no cuadra', what: `En Python los espacios al principio de la línea indican qué está dentro de qué. ${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} no encajan.`, fix: 'Usa 4 espacios por nivel: el contenido de un if, for o def va 4 espacios más a la derecha.' };
  if (/';' expected|expected ';'|; expected/.test(msg)) return { title: 'Falta un punto y coma', what: `${L ? `${L[0].toUpperCase()}${L.slice(1)}` : 'Aquí'} la instrucción no termina en «;».`, fix: 'En Java, C#, C y C++ cada instrucción acaba en «;». Añádelo al final de la línea.' };
  if (/'[)}\]]' esperado|se esperaba|sin apertura/.test(msg)) return { title: 'Paréntesis o llaves descompensados', what: 'Hay un ( [ { que no se cierra, o un cierre que sobra.', fix: err.hint || 'Cuenta las aperturas y los cierres: cada uno necesita su pareja.' };
  return { title: err.kind === 'runtime' ? 'El programa se ha detenido' : 'El código no compila', what: `Hay un problema ${L || 'en el código'}.`, fix: err.hint || 'Lee el mensaje técnico de abajo y compara la línea con los ejemplos de la lección.' };
}
