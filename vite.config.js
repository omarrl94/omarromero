import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      // Dirección pública del sitio (Netlify la da en URL) para las etiquetas de compartir en redes.
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', (process.env.URL || process.env.VITE_SITE_URL || '.').replace(/\/$/, '')),
    },
  ],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Las librerías cambian poco: en su propio archivo, el navegador las guarda entre versiones.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
          if (/node_modules\/(firebase|@firebase)\//.test(id)) return undefined;
          return 'vendor';
        },
      },
    },
  },
});
