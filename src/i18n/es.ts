/** Cadenas de la interfaz (es-ES). Para otro idioma: copiar este archivo y registrarlo en i18n/index.ts */
export const es = {
  app: 'CircuitosSEA',
  tagline: 'Taller virtual de electrotecnia',
  undo: 'Deshacer', redo: 'Rehacer', rotate: 'Girar', delete: 'Eliminar', duplicate: 'Duplicar',
  newProject: 'Nuevo', open: 'Abrir…', save: 'Guardar', examples: 'Ejemplos',
  animate: 'Corriente animada', labels: 'Etiquetas V / I', heat: 'Mapa de calor',
  palette: 'Componentes', search: 'Buscar…',
  props: 'Propiedades', nothingSelected: 'Selecciona un componente para editar sus valores.',
  checks: 'Avisos', allOk: 'Sin avisos: el circuito es correcto.',
  theme: 'Tema', help: 'Ayuda',
  wireHint: 'Pulsa en otro terminal para terminar el cable (Esc cancela).',
  placeHint: 'Arrastra componentes desde la paleta al lienzo. Pulsa en un terminal para tirar un cable.',
} as const;
export type Strings = typeof es;
