# Conexión del campus con las plataformas

El Campus Virtual decide **quién tiene acceso a qué**. Cada formación mantiene su plataforma y sus
cuentas. Cuando un alumno con acceso pulsa **«Entrar a la plataforma»**, el campus le lleva a ella ya
identificado, sin códigos de aula ni esperas de aprobación. Las tres plataformas actuales ya están
conectadas.

| Plataforma | Rama | Cómo entra el alumno desde el campus |
| --- | --- | --- |
| Curso de Claude | `curso-claude` | Enlace firmado → se registra sin correo `@jrotero.es` ni código de aula, con el correo ya verificado |
| Máster IA | `feature/master-ia-post-dam-v2` | El campus le crea un **código de admisión** en el Firebase del máster y lo trae puesto en el formulario |
| Módulo SAD | `claude/dreamy-noether-v2sbqv` | Enlace firmado → la cuenta queda aprobada al momento (o se activa si ya existía) |

Sin las variables de abajo, cada plataforma funciona exactamente como antes.

## 1. Enlace firmado (curso de Claude y módulo SAD)

El campus añade `?campus=<token>` a la dirección de la plataforma. El token lleva el correo, el nombre,
la formación y el motivo del acceso, caduca en **1 hora** y va firmado con HMAC-SHA256 y `CAMPUS_API_KEY`
(`netlify/lib/token-campus.mjs`). La plataforma comprueba la firma **en su servidor**, que la formación
es la suya y que el correo coincide con la cuenta.

| Dónde | Variable | Valor |
| --- | --- | --- |
| Campus y plataforma | `CAMPUS_API_KEY` | la misma clave en los dos sitios (`openssl rand -hex 32`, secreta) |
| Plataforma | `CAMPUS_FORMACION` | `curso-claude` o `modulo-sad` |
| Plataforma | `CAMPUS_URL` | dirección del campus (enlace de vuelta) |

El curso de Claude, además, necesita subir sus reglas (`npm run desplegar:reglas`), porque añaden
`accesoCampus`.

## 2. Código de admisión (máster)

El máster está en Firebase Hosting, sin servidor propio, y matricula con códigos de admisión de un solo
uso. El campus crea un código normal en el Firestore del máster, con la nota «Campus Virtual · motivo
· correo». Si el alumno vuelve a entrar sin haberlo usado, reutiliza el mismo. Si ya lo usó, el alumno
está matriculado y entra sin código.

1. Google Cloud → proyecto del máster → **IAM** → **Conceder acceso** a la cuenta de servicio del campus
   (`firebase-adminsdk-…@<proyecto-del-campus>.iam.gserviceaccount.com`) con el rol
   **Usuario de Cloud Datastore**. No hace falta una segunda clave secreta.
2. En el campus (Netlify, Functions):
   `PLATAFORMAS_CODIGO={"master-ia-dam":{"proyecto":"<id-del-proyecto-del-máster>","prefijo":"MIA"}}`

## 3. Consulta de acceso (opcional, para servidores)

```
GET  {CAMPUS_URL}/.netlify/functions/campus?email=<correo>&formacion=<id>
     X-Campus-Key: <CAMPUS_API_KEY>
200  { "acceso": true, "motivo": "compra" }    // compra · gratuita · codigo · asignada · centro · admin
```

Sirve para comprobar más adelante si un acceso sigue vigente, por ejemplo al renovar o revocar.
La clave nunca va al navegador.
