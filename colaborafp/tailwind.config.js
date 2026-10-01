/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Azul corporativo — identidad CFP José Ramón Otero / ColaboraFP
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebdff',
          400: '#5998fd',
          500: '#3373f8',
          600: '#1d54ed',
          700: '#1641d6',
          800: '#1936ad',
          900: '#1a3388',
          950: '#0f1f4f',
        },
        // Acento turquesa para estados positivos / acciones del alumnado
        accent: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        // Superficies del modo oscuro (salas)
        ink: {
          950: '#0a0f1c',
          900: '#0f172a',
          850: '#131c31',
          800: '#1a2540',
          700: '#26334f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
