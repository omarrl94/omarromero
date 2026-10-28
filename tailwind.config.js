/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        jro: {
          gold: "#efcd2f",   // CTA, pestaña activa, insignias y sello del título
          sage: "#a9cabb",   // DAM
          terra: "#e39f7d",  // ASIR
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
