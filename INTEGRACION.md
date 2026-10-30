# Conectar una plataforma con el campus

Cada formación (curso de Claude, máster, módulo SAD…) mantiene su plataforma y sus cuentas. El campus
decide **quién tiene acceso a qué**. Para que una plataforma solo deje entrar a quien tenga acceso,
pregunta al campus cuando el alumno se registra o inicia sesión.

## 1. Datos que necesita la plataforma

En la plataforma (Netlify → Environment variables, ámbito «Functions»):

```
CAMPUS_URL=https://campus.jrotero.es          # dirección del campus
CAMPUS_API_KEY=<la misma clave que en el campus>
CAMPUS_FORMACION=curso-claude                 # id de la formación (master-ia-dam, modulo-sad…)
```

La clave **nunca** va al navegador: la consulta se hace desde una función de servidor.

## 2. La consulta

```
GET  {CAMPUS_URL}/.netlify/functions/campus?email=<correo>&formacion=<id>
     X-Campus-Key: <CAMPUS_API_KEY>

200  { "acceso": true,  "motivo": "compra" }      // compra · gratuita · codigo · asignada · centro · admin
200  { "acceso": false, "motivo": null }
401  clave incorrecta
```

Ejemplo para una función de Netlify (Node 20+), como `correo.mjs` del curso o la del máster:

```js
async function accesoCampus(email) {
  const url = new URL("/.netlify/functions/campus", process.env.CAMPUS_URL);
  url.searchParams.set("email", email);
  url.searchParams.set("formacion", process.env.CAMPUS_FORMACION);
  const r = await fetch(url, { headers: { "X-Campus-Key": process.env.CAMPUS_API_KEY } });
  if (!r.ok) throw new Error(`Campus: ${r.status}`);
  return (await r.json()).acceso;
}
```

## 3. Dónde engancharlo en cada plataforma

| Plataforma | Rama | Punto de control sugerido |
| --- | --- | --- |
| Curso de Claude | `curso-claude` | En el registro, aceptar al alumno si `accesoCampus(email)` es `true`, además de las vías actuales (correo `@jrotero.es` o código de aula). |
| Máster IA | `feature/master-ia-post-dam-v2` | El campus sustituye a la «reserva o pago» que hoy genera el código de admisión: si `accesoCampus` es `true`, la matrícula queda validada. |
| Módulo SAD | `claude/dreamy-noether-v2sbqv` | En la acción de registro (`register/actions.ts`), crear la cuenta solo si `accesoCampus` es `true`. |

El alumno usa **el mismo correo** en el campus y en la plataforma; así se identifica.
Si el campus no responde, cada plataforma decide si deja pasar con sus reglas de siempre o espera.
