/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { amarillo: '#EFCD2F', menta: '#A9CABB', salmon: '#E39F7D', tinta: '#1A1A1A' },
      fontFamily: { titulo: ['"Trebuchet MS"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
