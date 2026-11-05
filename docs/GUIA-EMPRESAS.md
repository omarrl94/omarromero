# Guía para añadir o revisar empresas

**Regla de oro:** los correos **nunca se escriben a mano**. Los extrae el script de la web de la empresa.
Si alguien te pasa un correo (un antiguo alumno, un anuncio de Indeed…), **no lo añadas**: añade la empresa
como candidata y deja que el script compruebe qué publica la propia empresa.

## Añadir una empresa

1. Abre `data/empresas.candidatas.json` y añade un objeto así:

   ```json
   {
     "id": "nombre-en-minusculas-con-guiones",
     "nombre": "Nombre comercial",
     "web": "https://www.empresa.es",
     "sector": "Desarrollo de software para logística",
     "tamano": "pyme",
     "zona": "sur",
     "direccion": "Getafe (opcional)",
     "perfiles": ["dam-web", "dam-backend"],
     "motivoEncaje": "Por qué encaja con DAM/ASIR, en una o dos frases.",
     "paginasContacto": ["https://www.empresa.es/trabaja-con-nosotros"],
     "tipoContactoEsperado": "general",
     "programaPracticasUrl": "https://www.empresa.es/becas (solo si la EMPRESA lo publica)"
   }
   ```

   - `tamano`: `pyme`, `consultora`, `startup` o `gran-empresa`.
   - `zona` y `perfiles`: los identificadores de `config/ffe.config.ts` (por ejemplo, `madrid`, `norte` o `asir-cloud`).
   - `paginasContacto`: páginas **oficiales** donde suele estar el correo o el formulario (contacto, empleo, aviso legal). Si no las conoces, pon la portada: el script sigue los enlaces.
   - `programaPracticasUrl`: solo si la empresa publica un programa de prácticas o becas. El script comprueba que la página lo menciona. Si no lo pones, la empresa aparece como **candidatura espontánea**.

2. Verifica solo esa empresa:

   ```bash
   npm run verificar:empresas -- --solo=nombre-en-minusculas-con-guiones
   ```

3. Lee la salida y `docs/INFORME-VERIFICACION.md`:
   - ✔ **válida**: comprueba en el navegador que el correo aparece en la URL de la fuente y que es un buzón para candidaturas.
   - ✖ **descartada**: el motivo explica por qué (sin correo válido, sin formulario, web caída…).

4. `npm run check` y commit.

## Revisar el directorio (recomendado cada trimestre y antes de cada periodo de FFE)

```bash
npm run verificar:empresas      # vuelve a verificar todas las candidatas desde cero
npm run auditar:muestra         # 10 empresas al azar, comprobación independiente
npm run comprobar:enlaces       # enlaces rotos y portales
```

Revisa el diff de `data/empresas.json` antes de hacer commit. Si una empresa cambia de correo, lo verás.

## Qué hace el verificador (y qué no)

| Comprueba | No comprueba (revisión humana) |
|---|---|
| Que la web responde | Que la empresa sigue activa en el Registro Mercantil (BORME). Si tienes dudas, búscala en el BORME o en informa.es |
| Que el correo aparece literalmente en la URL indicada | Que el sector, el tamaño y la zona son correctos |
| Que el correo es del mismo dominio, genérico y no de privacidad, prensa o ventas | Que la empresa acoge alumnado de FP (pregúntalo en el primer correo) |
| Que el dominio tiene registros MX | |
| Si hay formulario oficial de empleo o contacto | |
| Feeds públicos de Greenhouse, Lever y Ashby enlazados desde su web | |

**Confianza:**
- `alta`: buzón de prácticas, talento o RR. HH. publicado por la empresa.
- `media`: buzón general (`info@`, `contacto@`) o solo formulario.

## Retirar una empresa

Cuando una empresa lo pida (por el formulario de `#/privacidad`, que llega a Netlify Forms, o por correo):

1. Añádela a `data/retiradas.json`:
   ```json
   [{ "id": "id-de-la-empresa", "dominio": "empresa.es", "fecha": "2026-11-05", "motivo": "Solicitud de la empresa" }]
   ```
2. Quítala de `data/empresas.json` (o ejecuta `npm run verificar:empresas`, que ya la descarta).
3. `npm run check` (falla si una retirada sigue en el directorio), commit y despliegue.
4. Responde a la empresa y **borra la solicitud** en Netlify → Forms (es un dato personal).

Plazo comprometido en la web: 10 días hábiles.
