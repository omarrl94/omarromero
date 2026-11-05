# CLAUDE.md · Reglas del proyecto Conecta FFE

Aplicación web del C.F.P. José Ramón Otero (Madrid) para que el alumnado de 2.º de DAM y ASIR
consiga plaza de Formación en Empresa (FFE) y encuentre ofertas relacionadas con su perfil.
Idioma de la interfaz, el código de dominio y la documentación: **español de España**.

## Reglas de datos (no negociables)

1. **Calidad antes que cantidad.** Un correo inventado es un fallo crítico.
2. Solo correos **corporativos** publicados por la **propia empresa** o una **fuente oficial**.
3. **Nunca** deducir ni construir correos a partir de patrones (`nombre.apellido@`, `rrhh@` «porque suele existir», etc.).
4. **Nunca** correos personales de empleados (nombre y apellido en la parte local).
5. Sin correo verificable → formulario oficial de contacto o empleo. Sin ninguno → la empresa se descarta.
6. Una empresa solo pasa a `data/empresas.json` si `npm run verificar:empresas` la ha validado:
   la URL responde, el correo aparece literalmente en esa URL y el dominio tiene registros MX.
7. Nunca presentar como «oferta de prácticas» lo que la empresa no ha publicado: es **candidatura espontánea**.
8. Nada de ofertas simuladas en producción. Los datos de `tests/fixtures/` usan dominios reservados
   (`.test`, `example.com`) y el servidor se niega a cargarlos fuera del modo de pruebas.

## Fuentes de ofertas

- Sin scraping de LinkedIn, Indeed, Glassdoor, Tecnoempleo, Welcome to the Jungle ni de ningún sitio cuyas
  condiciones lo prohíban, ni a través de scrapers de terceros (Apify y similares). Para ellos: **enlaces profundos**.
- Solo APIs oficiales o feeds públicos (Adzuna, InfoJobs, Greenhouse, Lever, Ashby).
- Claves solo en variables de entorno del servidor (`process.env` en `netlify/functions`). Nunca `VITE_*` para secretos.

## Privacidad y seguridad

- No se suben ni almacenan CV. Los datos del alumno viven solo en `localStorage` (clave `conecta-ffe:*`) con botón de borrado.
- Sin analítica ni registro de usuarios.
- El directorio de empresas se entrega solo desde `/api/empresas` tras validar el código de acceso en el servidor
  (cookie HttpOnly firmada + limitación de intentos). **Ningún correo de empresa puede aparecer en `dist/`**:
  lo comprueba `npm run comprobar:bundle`.
- `noindex` en meta, cabecera `X-Robots-Tag` y `robots.txt`.
- Sin envíos automáticos ni masivos: cada correo lo revisa y lo envía el alumno desde su cliente.

## Arquitectura

- `config/ffe.config.ts`: **único** archivo con datos editables (modalidades, horas, tutores, perfiles, límites, enlaces profundos).
- `shared/`: esquemas Zod y lógica pura compartida entre cliente y funciones (encaje, normalización de ofertas, correo).
- `src/`: React + TypeScript + Vite + Tailwind v4.
- `netlify/functions/`: API (`acceso`, `empresas`, `ofertas`) y función programada `ofertas-actualizar`. Las retiradas llegan por Netlify Forms (formulario `retirada`).
- `.github/workflows/verificar-empresas.yml`: verifica las candidatas con Internet (al cambiarlas y cada mes) y guarda el resultado en la rama.
- `server/`: código solo de servidor (almacén Blobs con alternativa local, sesión, límite de intentos, fuentes de ofertas).
- `data/empresas.candidatas.json`: investigación **sin verificar**. Nunca se sirve.
- `data/empresas.json`: solo empresas verificadas. Lo genera el script; se edita a mano solo para retiradas.

## Forma de trabajar

- Commits pequeños y descriptivos en español.
- No afirmar que algo funciona sin haberlo ejecutado. Antes de entregar: `npm run check`
  (lint, typecheck, unitarias, build, comprobación del bundle) y `npm run e2e`.
- Accesibilidad AA: contraste comprobado, foco visible, etiquetas en todos los controles, `axe` en E2E.
- Colores de marca: amarillo `#efcd2f`, verde salvia `#a9cabb`, terracota `#e39f7d`.
  Sobre ellos el texto va en tinta oscura (`#1d1d1b`); nunca texto blanco sobre amarillo o salvia.
