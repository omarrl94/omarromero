/** @type {import('tailwindcss').Config} */
// Paleta oficial FP José Ramón Otero. El CSS se genera en el build y se incrusta
// en index.html: la plataforma no depende del CDN de Tailwind en tiempo de ejecución.
export default {
  content: ['./src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        jro: {
          gold: '#efcd2f', sage: '#a9cabb', terra: '#e39f7d',
          ink: '#111111', cream: '#FAF9F5',
          'sage-deep': '#3f6b58', 'terra-deep': '#9a4f2e', 'gold-deep': '#8a7408'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Playfair Display"', 'Georgia', 'serif']
      }
    }
  }
};
