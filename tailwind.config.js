/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        void: { 950: '#05060a', 900: '#090b12', 850: '#0d1019', 800: '#121624', 700: '#1a2033', 600: '#252c45' },
        neon: { cyan: '#22e4ff', magenta: '#ff3df0', lime: '#a3ff3d', amber: '#ffb534', red: '#ff4767', violet: '#9d7bff' },
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(34,228,255,.35), 0 0 18px -2px rgba(34,228,255,.35)',
        'neon-m': '0 0 0 1px rgba(255,61,240,.35), 0 0 18px -2px rgba(255,61,240,.35)',
        'neon-l': '0 0 0 1px rgba(163,255,61,.35), 0 0 18px -2px rgba(163,255,61,.35)',
      },
      keyframes: {
        flicker: { '0%,100%': { opacity: 1 }, '45%': { opacity: 0.86 }, '50%': { opacity: 0.6 }, '55%': { opacity: 0.9 } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        flicker: 'flicker 3s infinite',
        scan: 'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
};
