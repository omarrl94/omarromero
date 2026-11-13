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
  wireHint: 'Clic en el lienzo fija un codo · clic en otro terminal (o sobre un cable, con empalme) lo termina · Espacio cambia el sentido · Esc cancela.',
  placeHint: 'Arrastra componentes desde la paleta. Clic en un terminal para tirar un cable · rueda sobre un componente lo gira · Ctrl+C / V copia y pega · ? muestra todos los atajos.',
} as const;
export type Strings = typeof es;
