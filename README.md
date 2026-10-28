# Curso de Claude · FP José Ramón Otero

Plataforma LMS del curso **"Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude"** (Título Propio del Centro), para alumnado de Grado Superior de DAM y ASIR.

## Contenido

- `index.html`: la plataforma completa en un único archivo (HTML + JS + Tailwind por CDN).
- `logo-jrotero.png`: logotipo oficial. Si no carga, la página usa el SVG vectorial integrado (`LOGO_IMG_SRC` al inicio del script).

## Qué incluye

- Acceso y registro con correo `@jrotero.es` o código de aula (`CODIGO_AULA`), ciclo (DAM/ASIR) y curso (1º/2º).
- Cláusula de protección de datos de primera capa, política completa y los dos consentimientos obligatorios (privacidad y compromiso EU AI Act), desmarcados por defecto.
- 12 sesiones numeradas en 4 bloques, cada una con las pestañas Teoría · Taller paso a paso · Biblioteca de Prompts · Actividad práctica · Preguntas frecuentes.
- Actividades en tres bloques (DAM, ASIR y Sincronización DAM + ASIR) con formulario de entrega.
- Panel docente (`omar.romero@jrotero.es`): seguimiento, corrección con nota y comentarios, gestión de usuarios y emisión del Título Propio.
- Título Propio imprimible en A4 horizontal (o guardado en PDF) con código de verificación.
- Perfil del alumno: exportar datos en JSON y eliminar la cuenta.

## Cómo probarla

Abre `index.html` en el navegador, o sírvela con cualquier servidor estático:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

Los botones de acceso rápido (SuperAdmin, Alumno DAM, Alumna ASIR) se muestran con `DEMO_MODE = true`.

## Importante: es una versión de demostración

Todos los datos (usuarios, entregas, notas y títulos) se guardan en el `localStorage` de cada navegador. Nada se comparte entre equipos y cualquiera puede entrar como administrador con el acceso rápido. Para usarla con alumnos reales hace falta:

1. Un backend con autenticación real y base de datos (por ejemplo, Supabase como en otras ramas de este repositorio).
2. Poner `DEMO_MODE = false`.
3. Revisar la política de privacidad con el delegado de protección de datos del centro.
