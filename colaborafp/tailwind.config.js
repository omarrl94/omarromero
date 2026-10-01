/** @type {import('tailwindcss').Config} */
// Identidad visual: Formación Profesional José Ramón Otero
//   Terracota #e39f7d · Salvia #a9cabb · Amarillo #efcd2f
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Terracota — color principal de marca (logotipo)
        brand: {
          50: '#fdf6f2',
          100: '#fae9df',
          200: '#f4d0bd',
          300: '#ecb89b',
          400: '#e39f7d',
          500: '#d9845c',
          600: '#c66b43',
          700: '#a55435',
          800: '#864530',
          900: '#6d3a2a',
          950: '#3b1c13',
        },
        // Salvia — aportaciones del alumnado, estados positivos
        accent: {
          50: '#f3f8f5',
          100: '#e3efe9',
          200: '#c9dfd5',
          300: '#a9cabb',
          400: '#86b19d',
          500: '#659680',
          600: '#4f7a67',
          700: '#416354',
          800: '#375146',
          900: '#2f443b',
        },
        // Amarillo — avisos, pendientes, resaltados
        sun: {
          50: '#fefbe8',
          100: '#fdf5c4',
          200: '#fbe98c',
          300: '#f6d84c',
          400: '#efcd2f',
          500: '#d9b01a',
          600: '#b88a13',
          700: '#936513',
          800: '#7a5117',
          900: '#684319',
        },
        // Superficies oscuras cálidas (salas en modo oscuro)
        ink: {
          950: '#100e0d',
          900: '#171413',
          850: '#1e1a18',
          800: '#28231f',
          700: '#3b342e',
          600: '#574d45',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(16 14 13 / 0.04), 0 4px 16px -4px rgb(16 14 13 / 0.08)',
        lift: '0 2px 4px rgb(16 14 13 / 0.04), 0 16px 40px -12px rgb(16 14 13 / 0.18)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Resalte de un recurso recién llegado en directo
        arrive: {
          // Solo brillo, sin desplazamiento: los botones no se mueven mientras se pulsan
          '0%': { boxShadow: '0 0 0 0 rgb(239 205 47 / 0)' },
          '20%': { boxShadow: '0 0 0 4px rgb(239 205 47 / 0.8)' },
          '100%': { boxShadow: '0 0 0 0 rgb(239 205 47 / 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        arrive: 'arrive 2.4s cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
