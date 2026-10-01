export const APP_NAME = 'ColaboraFP';
export const CENTER_NAME = 'Centro de Formación Profesional José Ramón Otero';
export const CENTER_SHORT = 'FP José Ramón Otero';

export const TEACHER_AUTHOR = 'teacher';

export const RESOURCE_TYPES = {
  code: { label: 'Código', description: 'Fragmento de código con resaltado' },
  task: { label: 'Enunciado', description: 'Texto, ejercicio o instrucciones' },
  link: { label: 'Enlace', description: 'URL a documentación o recurso' },
};

export const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'bash', label: 'Bash' },
  { value: 'markup', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'php', label: 'PHP' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'yaml', label: 'YAML' },
  { value: 'text', label: 'Texto plano' },
];

export const languageLabel = (value) =>
  LANGUAGES.find((l) => l.value === value)?.label ?? value ?? 'Texto';


export const PIN_LENGTH = 6;
export const MAX_CONTENT_LENGTH = 20000;
export const MAX_ALIAS_LENGTH = 30;
