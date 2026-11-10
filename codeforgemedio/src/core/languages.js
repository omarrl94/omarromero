// Metadatos de cada lenguaje: sintaxis, resaltado, autocompletado y su "personalidad".

export const LANGUAGES = {
  python: {
    id: 'python',
    name: 'Python',
    ext: 'py',
    color: '#ffd43b',
    accent: 'text-yellow-300',
    comment: '#',
    paradigm: 'El más fácil de leer: casi no hay símbolos raros y se escribe como si fuera inglés sencillo. Es el favorito para aprender.',
    tagline: 'Con Python se hace inteligencia artificial, se analizan datos y se automatizan tareas aburridas.',
    badge: '⭐ ideal para empezar',
    real: 'Instagram, Spotify y YouTube usan Python. También es el lenguaje con el que se entrena la inteligencia artificial.',
    keywords: ['def', 'return', 'if', 'elif', 'else', 'for', 'in', 'while', 'break', 'continue', 'pass', 'class', 'import', 'from', 'as', 'and', 'or', 'not', 'is', 'None', 'True', 'False', 'lambda', 'async', 'await', 'with', 'try', 'except', 'self', 'super', 'global'],
    types: ['int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple'],
    builtins: ['print', 'len', 'range', 'enumerate', 'sorted', 'min', 'max', 'sum', 'abs', 'set', 'dict', 'list', 'int', 'float', 'str', 'asyncio'],
    snippets: {
      for: 'for i in range(n):\n    ',
      if: 'if condicion:\n    ',
      def: 'def nombre(param):\n    return ',
      while: 'while condicion:\n    ',
      class: 'class Nombre(Base):\n    def __init__(self):\n        super().__init__()',
    },
  },
  js: {
    id: 'js',
    name: 'JavaScript',
    ext: 'js',
    color: '#f7df1e',
    accent: 'text-yellow-200',
    comment: '//',
    paradigm: 'El lenguaje de las páginas web: corre en todos los navegadores del planeta, también en el que estás usando ahora.',
    tagline: 'Con JavaScript las páginas web cobran vida: botones, animaciones, juegos…',
    badge: '🌐 el de la web',
    real: 'Casi todas las webs que visitas usan JavaScript. Este juego está hecho con él.',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of', 'in', 'while', 'class', 'extends', 'constructor', 'super', 'this', 'new', 'async', 'await', 'null', 'undefined', 'true', 'false', 'typeof', 'import', 'export'],
    types: ['Number', 'String', 'Boolean', 'Array', 'Object', 'Map', 'Set', 'Promise', 'BigInt'],
    builtins: ['console', 'log', 'length', 'push', 'Math', 'JSON', 'setTimeout', 'has', 'add'],
    snippets: {
      for: 'for (let i = 0; i < n; i++) {\n  \n}',
      if: 'if (condicion) {\n  \n}',
      function: 'function nombre(param) {\n  return ;\n}',
      class: 'class Nombre extends Base {\n  \n}',
    },
  },
  java: {
    id: 'java',
    name: 'Java',
    ext: 'java',
    color: '#f89820',
    accent: 'text-orange-300',
    comment: '//',
    paradigm: 'Más estricto: te obliga a decir de qué tipo es cada dato. A cambio, avisa de muchos errores antes de ejecutar. Es el que se estudia en los grados superiores DAM y DAW.',
    tagline: 'Con Java se hacen apps de Android y los programas de bancos y grandes empresas.',
    badge: '🎓 el del grado superior',
    real: 'Minecraft (la edición Java) está escrito en Java, igual que miles de apps de Android.',
    keywords: ['public', 'private', 'protected', 'static', 'final', 'class', 'extends', 'implements', 'interface', 'abstract', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'void', 'this', 'super', 'null', 'true', 'false', 'try', 'catch', 'throws', 'import', 'synchronized'],
    types: ['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'String', 'var', 'Integer', 'Long', 'Double', 'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet', 'Thread', 'AtomicInteger'],
    builtins: ['System.out.println', 'System.out.printf', 'Math.max', 'Math.min', 'Math.abs', 'Arrays.sort', '@Override'],
    snippets: {
      for: 'for (int i = 0; i < n; i++) {\n    \n}',
      if: 'if (condicion) {\n    \n}',
      while: 'while (condicion) {\n    \n}',
      class: 'class Nombre extends Base {\n    \n}',
    },
  },
};

export const LANG_ORDER = ['python', 'js', 'java'];

export const camelToSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Nombre idiomático de un identificador en un lenguaje (snake_case en Python y Rust). */
export const idiom = (name, lang) => (lang === 'python' || lang === 'rust' ? camelToSnake(name) : name);

/** Nombre idiomático de una FUNCIÓN: como idiom, pero en C# los métodos van en PascalCase. */
export const fnIdiom = (name, lang) => (lang === 'csharp' ? name[0].toUpperCase() + name.slice(1) : idiom(name, lang));
