/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#D6E0DA', panel: '#F5F8F6', panel2: '#E6EDE9', line: '#A9B9B0', tx: '#1A1A1A', mute: '#4A5C54',
        acc: '#EFCD2F', acct: '#6F5600', ok: '#1F7F55', bad: '#B8362E', info: '#24604E', warn: '#A9552B',
        amarillo: '#EFCD2F', menta: '#A9CABB', salmon: '#E39F7D', tinta: '#1A1A1A',
      },
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'], mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'], display: ['"Barlow Condensed"', '"IBM Plex Sans"', 'sans-serif'] },
      keyframes: { fade: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } }, slideup: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } }, pulse2: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } } },
      animation: { fade: 'fade .25s ease-out both', slideup: 'slideup .22s ease-out both', pulse2: 'pulse2 1.6s infinite' },
    },
  },
  plugins: [],
};
