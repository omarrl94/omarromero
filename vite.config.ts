import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * En desarrollo y en las pruebas E2E, enruta /api/* a las Netlify Functions reales
 * (mismo código que en producción), sin necesidad de la CLI de Netlify.
 */
function funcionesLocales(): Plugin {
  const rutas: Record<string, string> = {
    '/api/acceso': '/netlify/functions/acceso.mts',
    '/api/empresas': '/netlify/functions/empresas.mts',
    '/api/ofertas': '/netlify/functions/ofertas.mts',
  };
  const manejar = (server: ViteDevServer) => async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const ruta = req.url?.split('?')[0] ?? '';
    const archivo = rutas[ruta];
    if (!archivo) return next();
    try {
      const mod = await server.ssrLoadModule(archivo);
      const cuerpo = await new Promise<Buffer>((ok) => {
        const trozos: Buffer[] = [];
        req.on('data', (c) => trozos.push(c));
        req.on('end', () => ok(Buffer.concat(trozos)));
      });
      const peticion = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : new Uint8Array(cuerpo),
      });
      // En modo de pruebas, la cabecera x-test-ip simula IPs distintas (límite de intentos).
      const ipPrueba = process.env.CONECTA_MODO === 'pruebas' ? (req.headers['x-test-ip'] as string | undefined) : undefined;
      const respuesta: Response = await mod.default(peticion, { ip: ipPrueba ?? req.socket.remoteAddress });
      res.statusCode = respuesta.status;
      respuesta.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await respuesta.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Error en la función local' }));
    }
  };
  return {
    name: 'conecta-funciones-locales',
    configureServer(server) {
      server.middlewares.use(manejar(server));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), funcionesLocales()],
  build: {
    sourcemap: false,
    target: 'es2022',
    // La demostración de un solo archivo necesita todo el JS en un único bloque.
    rollupOptions: process.env.VITE_DEMO === 'true' ? { output: { inlineDynamicImports: true } } : {},
  },
  server: { port: 5173, strictPort: true },
});
