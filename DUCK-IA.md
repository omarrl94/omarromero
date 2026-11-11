# El pato con IA (tutor) · puesta en marcha

El pato de CodeForge puede responder con un modelo de Claude. Funciona así:

```
jugador (con cuenta en la nube) → /api/duck (función de Netlify) → API de Anthropic
```

- La **clave de Anthropic solo vive en Netlify**. No está en el navegador ni en la app de Android.
- Solo responde a jugadores con **sesión de Firebase** (se comprueba su token).
- Hay un **límite diario por jugador** (30 por defecto) y uno **global** (3000) para controlar el gasto.
- La primera respuesta de la IA de cada misión es gratis; las siguientes cuentan como pista (pierdes ★ autonomía).
- Si la IA no está disponible (sin clave, sin red, sin cuota…), el pato clásico responde igual.
- El pato **nunca da la solución**: su instrucción es hacer preguntas guía. Nunca se envía la solución de la misión al modelo.

## Paso a paso

1. **Consigue una clave de API**: entra en <https://platform.claude.com> → *API keys* → *Create key*. Pon un límite de gasto mensual en *Billing → Limits* (recomendado).
2. **Netlify** → tu sitio → *Site configuration* → *Environment variables* → *Add a variable*:

   | Nombre | Valor | Nota |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | tu clave | marca **Contains secret values** |
   | `DUCK_DAILY_LIMIT` | `30` | preguntas por jugador y día (opcional) |
   | `DUCK_GLOBAL_DAILY_LIMIT` | `3000` | tope diario de todo el sitio (opcional) |
   | `DUCK_MODEL` | `claude-opus-5-5` | opcional, ver costes abajo |

3. **Vuelve a desplegar** (*Deploys → Trigger deploy → Deploy site*). Las variables solo se aplican en despliegues nuevos.
4. Abre el juego con una cuenta en la nube, entra en una misión y pulsa el pato: verás «Tutor con IA» abajo.
5. **App de Android**: en GitHub → *Settings → Secrets and variables → Actions* crea el secreto `VITE_DUCK_API_URL` con `https://TU-SITIO.netlify.app/api/duck` y vuelve a lanzar la compilación. (En la web no hace falta.)

## Costes (orientativos)

Una pregunta típica son ~1.500 tokens de entrada y ~200 de salida.

| Modelo (`DUCK_MODEL`) | Coste aproximado por pregunta |
|---|---|
| `claude-opus-5-5` (por defecto, el más capaz) | ~0,01 US$ |
| `claude-sonnet-5-5` | ~0,005 US$ |
| `claude-haiku-5-5` (el más barato, suficiente para un tutor) | ~0,0004 US$ |

Con 30 preguntas diarias por jugador, el peor caso con Opus son ~0,30 US$ por jugador y día; con Haiku, ~0,01 US$. Ajusta `DUCK_MODEL` y los límites según tu presupuesto. Los precios cambian: comprueba los vigentes en tu consola de Anthropic.

## Seguridad y privacidad

- Es obligatorio que la política de privacidad lo explique (ya está en `public/privacidad.html`) y, en Google Play, marcarlo en *Seguridad de los datos* (ver `GOOGLE-PLAY.md`).
- Las preguntas y el código se envían a Anthropic para generar la respuesta. El servidor no guarda las conversaciones; solo guarda un contador diario por jugador (Netlify Blobs).
- Pruebas: `npm run test:duck` (autenticación, límites, recorte de datos, CORS y que no se filtre la solución).
