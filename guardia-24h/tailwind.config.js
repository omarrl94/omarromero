/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { amarillo: '#EFCD2F', menta: '#A9CABB', salmon: '#E39F7D', tinta: '#1A1A1A', crema: '#FFF6D6', noche: '#12171a', ok: '#2FB872', mal: '#E5484D', azul: '#8FB4F5' },
      fontFamily: { titulo: ['"Trebuchet MS"', '"Arial Rounded MT Bold"', 'system-ui', 'sans-serif'] },
      keyframes: {
        pop: { '0%': { transform: 'scale(.4)', opacity: 0 }, '70%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-8px)' }, '75%': { transform: 'translateX(8px)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        slideup: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        glow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(239,205,47,.8)' }, '50%': { boxShadow: '0 0 0 14px rgba(239,205,47,0)' } },
        fall: { from: { transform: 'translateY(-20px) rotate(0)', opacity: 1 }, to: { transform: 'translateY(110vh) rotate(720deg)', opacity: 0.9 } },
        flicker: { '0%,100%': { opacity: 1 }, '45%': { opacity: 0.55 }, '50%': { opacity: 1 }, '55%': { opacity: 0.7 } },
      },
      animation: {
        pop: 'pop .45s cubic-bezier(.2,1.4,.4,1) both', shake: 'shake .4s', floaty: 'floaty 3s ease-in-out infinite',
        slideup: 'slideup .3s ease-out both', glow: 'glow 1.8s infinite', fall: 'fall 2.6s linear forwards', flicker: 'flicker 2.5s infinite',
      },
    },
  },
  plugins: [],
};
