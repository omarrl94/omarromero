/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0e1215', panel: '#161c20', panel2: '#1d252a', line: '#2b363c', tx: '#e7edef', mute: '#93a4ab',
        acc: '#EFCD2F', ok: '#3fb27f', bad: '#e5534b', info: '#A9CABB', warn: '#E39F7D',
        amarillo: '#EFCD2F', menta: '#A9CABB', salmon: '#E39F7D', tinta: '#1A1A1A',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'] },
      keyframes: { fade: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } }, slideup: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } }, pulse2: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } } },
      animation: { fade: 'fade .25s ease-out both', slideup: 'slideup .22s ease-out both', pulse2: 'pulse2 1.6s infinite' },
    },
  },
  plugins: [],
};
