/** @type {import('tailwindcss').Config} */

// Los colores se declaran como variables CSS (ver src/index.css) para que el
// modo oscuro intercambie los tokens sin duplicar clases en cada componente.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Tokens de marca (los 7 del sistema) ---
        brand: {
          DEFAULT: token('--c-brand'),
          light: token('--c-brand-light'),
        },
        accent: {
          DEFAULT: token('--c-accent'),
          deep: token('--c-accent-deep'),
        },
        warm: token('--c-warm'),
        ink: {
          DEFAULT: token('--c-ink'),
          soft: token('--c-ink-soft'),
        },
        cream: token('--c-bg'),
        surface: {
          DEFAULT: token('--c-surface'),
          soft: token('--c-surface-soft'),
        },
        border: token('--c-border'),
        txt: {
          DEFAULT: token('--c-txt'),
          soft: token('--c-txt-soft'),
        },
        success: token('--c-success'),
        error: token('--c-error'),

        // --- Paleta categorica de familias profesionales ---
        // Excepcion deliberada al sistema de 7 tokens: cada familia necesita un
        // color propio distinguible. Tonos apagados, en el mismo registro calido.
        // Todos verificados a >= 4.5:1 con texto blanco (WCAG AA texto pequeno),
        // porque se usan de fondo en los badges de familia.
        familia: {
          informatica: '#4c77a5',
          sanidad: '#39816e',
          administracion: '#8268a4',
          electricidad: '#a96427',
          imagen: '#b45776',
          hosteleria: '#976e30',
          sociocultural: '#527e51',
          mecanica: '#6b7280',
          comercio: '#a8563f',
          automocion: '#7a5c3d',
          deportes: '#2b7a86',
          quimica: '#7a4f7d',
          instalacion: '#5a6e8c',
          textil: '#a04f6a',
        },

        // --- Paleta de los arquetipos vocacionales ---
        // Misma excepcion y misma regla: verificados a >= 4.5:1 con texto blanco.
        arquetipo: {
          creador: '#8a5cd6',
          guardian: '#297a6c',
          engranajes: '#9c5a2a',
          estratega: '#3d6ea8',
          explorador: '#4a7f3c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 4px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 24px rgb(26 26 26 / 0.10)',
      },
      borderRadius: {
        card: '12px',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
