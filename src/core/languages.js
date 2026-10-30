// Metadatos de cada lenguaje: sintaxis, resaltado, autocompletado y su "personalidad".

export const LANGUAGES = {
  python: {
    id: 'python',
    name: 'Python',
    ext: 'py',
    color: '#ffd43b',
    accent: 'text-yellow-300',
    comment: '#',
    paradigm: 'Dinámico, interpretado, multiparadigma. Tipado en tiempo de ejecución e indentación significativa.',
    tagline: 'Legible como pseudocódigo. Enteros de precisión arbitraria.',
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
  java: {
    id: 'java',
    name: 'Java',
    ext: 'java',
    color: '#f89820',
    accent: 'text-orange-300',
    comment: '//',
    paradigm: 'Orientado a objetos, tipado estático y fuerte. Compila a bytecode para la JVM.',
    tagline: 'Todo vive dentro de una clase. Los tipos se declaran siempre.',
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
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    ext: 'kt',
    color: '#a97bff',
    accent: 'text-violet-300',
    comment: '//',
    paradigm: 'Multiparadigma sobre la JVM: POO + funcional. Inferencia de tipos y null-safety en el sistema de tipos.',
    tagline: 'Java sin ceremonia. Clases finales por defecto, corrutinas de serie.',
    keywords: ['fun', 'val', 'var', 'return', 'if', 'else', 'for', 'in', 'until', 'downTo', 'step', 'while', 'when', 'class', 'open', 'override', 'abstract', 'interface', 'object', 'this', 'super', 'null', 'true', 'false', 'suspend', 'launch', 'async', 'runBlocking', 'coroutineScope'],
    types: ['Int', 'Long', 'Double', 'Float', 'Boolean', 'String', 'Char', 'IntArray', 'List', 'MutableList', 'Map', 'MutableMap', 'Set', 'Unit'],
    builtins: ['println', 'mutableListOf', 'listOf', 'mutableMapOf', 'mapOf', 'mutableSetOf', 'IntArray', 'maxOf', 'minOf', 'repeat', 'delay', 'awaitAll'],
    snippets: {
      for: 'for (i in 0 until n) {\n    \n}',
      if: 'if (condicion) {\n    \n}',
      fun: 'fun nombre(param: Int): Int {\n    return \n}',
      class: 'class Nombre : Base() {\n    \n}',
    },
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    ext: 'swift',
    color: '#ff6b4a',
    accent: 'text-red-300',
    comment: '//',
    paradigm: 'Multiparadigma orientado a protocolos. Tipado estático, seguro por diseño: el overflow detiene el programa.',
    tagline: 'Seguridad primero: opcionales, value types y concurrencia estructurada.',
    keywords: ['func', 'let', 'var', 'return', 'if', 'else', 'guard', 'for', 'in', 'while', 'repeat', 'switch', 'case', 'class', 'struct', 'protocol', 'override', 'init', 'self', 'super', 'nil', 'true', 'false', 'inout', 'async', 'await', 'actor', 'Task'],
    types: ['Int', 'Int32', 'Int64', 'Double', 'Float', 'Bool', 'String', 'Character', 'Array', 'Dictionary', 'Set'],
    builtins: ['print', 'max', 'min', 'abs', 'stride', 'enumerated', 'append', 'count', 'contains', 'insert', 'withTaskGroup'],
    snippets: {
      for: 'for i in 0..<n {\n    \n}',
      if: 'if condicion {\n    \n}',
      func: 'func nombre(_ param: Int) -> Int {\n    return \n}',
      class: 'class Nombre: Base {\n    \n}',
    },
  },
  c: {
    id: 'c',
    name: 'C',
    ext: 'c',
    color: '#5c9dff',
    accent: 'text-blue-300',
    comment: '//',
    paradigm: 'Imperativo y procedimental. Cerca del metal: memoria manual, punteros y sin red de seguridad.',
    tagline: 'Tú eres el recolector de basura. Cada malloc necesita su free.',
    keywords: ['int', 'long', 'char', 'float', 'double', 'void', 'struct', 'typedef', 'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'sizeof', 'const', 'unsigned', 'static', 'NULL', 'include', 'bool', 'true', 'false'],
    types: ['int', 'long', 'long long', 'short', 'char', 'float', 'double', 'bool', 'size_t', 'int32_t', 'int64_t', 'uint8_t'],
    builtins: ['printf', 'malloc', 'calloc', 'free', 'sizeof', 'memset', 'qsort'],
    snippets: {
      for: 'for (int i = 0; i < n; i++) {\n    \n}',
      if: 'if (condicion) {\n    \n}',
      while: 'while (condicion) {\n    \n}',
      malloc: 'int *p = malloc(n * sizeof(int));\n',
    },
  },
};

export const LANG_ORDER = ['python', 'java', 'kotlin', 'swift', 'c'];

export const camelToSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Nombre idiomático de un identificador en un lenguaje (snake_case en Python). */
export const idiom = (name, lang) => (lang === 'python' ? camelToSnake(name) : name);
