/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        jro: {
          gold: "#efcd2f",   // CTA, cursos y elemento activo
          sage: "#a9cabb",   // másteres
          terra: "#e39f7d",  // módulos
          ink: "#111111",
          cream: "#FAF9F5",
          line: "#E5E7EB",
          mute: "#6B7280"
        }
      },
      fontFamily: { sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] }
    }
  }
};
