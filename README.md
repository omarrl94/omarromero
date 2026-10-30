# Campus Virtual · FP José Ramón Otero

Puerta de entrada a toda la formación del centro. Un catálogo con **cursos, másteres, módulos y talleres**;
cada alumno ve en **Mi campus** las formaciones a las que tiene acceso y puede **comprar** o pedir las demás.
Cada formación sigue teniendo su propia plataforma: el campus las reúne, gestiona quién entra en cuál y
cobra las matrículas.

**Para publicarlo, sigue [DESPLIEGUE.md](DESPLIEGUE.md). Para que las plataformas de cada formación
comprueben el acceso contra el campus, [INTEGRACION.md](INTEGRACION.md).**

## Las tres formaciones de partida

| Tipo | Formación | Rama del repositorio | Precio inicial |
| --- | --- | --- | --- |
| Curso | Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude (60 h) | `curso-claude` | 149 € |
| Máster | Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma (300 h) | `feature/master-ia-post-dam-v2` (`master-ia/`) | 1.290 € |
| Módulo | Seguridad y Alta Disponibilidad (ASIR) | `claude/dreamy-noether-v2sbqv` (`asir-lms/`) | 79 €, incluido para el alumnado `@jrotero.es` |

Los textos, temarios y horas salen de cada plataforma (`src/catalogo.js`). **Precios y direcciones son
orientativos**: cámbialos desde *Panel → Catálogo → Editar* antes de abrir la matrícula. El módulo SAD aún
no tiene dirección publicada; mientras tanto su ficha dice «Plataforma disponible en breve».

## Cómo consigue un alumno el acceso

| Vía | Quién la inicia | Cómo funciona |
| --- | --- | --- |
| **Compra online** | Alumno | Stripe Checkout. El webhook firmado crea el pedido y la matrícula. |
| **Gratuita** | Alumno | Formaciones de precio 0 con matrícula abierta (correo verificado). |
| **Código de acceso** | Centro → alumno | Becas, convenios, grupos o pagos por transferencia. Usos máximos y caducidad. |
| **Solicitud** | Alumno → centro | «Solicitar matrícula» o «Avisadme»; el centro la acepta y da acceso. |
| **Asignada** | Centro | Desde *Panel → Matrículas → Dar acceso*. |
| **Incluida para el centro** | Automática | Si la formación lo marca, cualquier cuenta `@jrotero.es` verificada entra sin pagar. |

Sin `STRIPE_SECRET_KEY` el botón «Comprar» se convierte en «Solicitar matrícula» y todo lo demás funciona.

## Qué incluye

- **Catálogo público** con buscador, filtro por tipo (colores del centro: oro cursos, salvia másteres,
  terracota módulos) y ficha de cada formación: descripción, datos, qué aprenderás, temario y requisitos.
- **Mi campus**: mis formaciones con «Entrar a la plataforma», avisos del centro, canje de códigos,
  solicitudes, compras y recomendaciones.
- **Panel del campus** (`omar.romero@jrotero.es`):
  - Resumen con alumnado, matrículas, ingresos y matrículas por formación.
  - Catálogo editable (alta, edición, borrado y carga del catálogo inicial).
  - Matrículas: dar acceso, revocar, reactivar y CSV.
  - Solicitudes y alumnado.
  - Códigos de acceso, avisos (para todo el campus o para una formación) y pedidos con CSV.
- **Entrada conectada a las tres plataformas**: «Entrar a la plataforma» lleva al alumno identificado.
  - Curso de Claude y módulo SAD: enlace firmado, válido 1 h.
  - Máster: código de admisión generado en su Firebase.
  - Ver [INTEGRACION.md](INTEGRACION.md).
- **API de acceso** para consultas desde servidor (`/.netlify/functions/campus`).
- **Protección de datos**: cláusula de primera capa, política completa, condiciones de contratación,
  exportar datos (JSON) y eliminar la cuenta. Los justificantes de pago se conservan.

## Estructura

```
src/
  app.js                 interfaz y rutas (#/, #/formacion/<id>, #/mi-campus, #/admin/<pestaña>…)
  catalogo.js            catálogo inicial (curso, máster y módulo)
  estado.js              caché de datos y regla de acceso (motivoAcceso)
  backend-firebase.js    Authentication + Firestore (producción)
  backend-local.js       modo demostración (localStorage, pago simulado)
  constantes.js          centro, administración, tipos y estados
netlify/functions/
  campus.mjs             pago (Stripe Checkout), canje de códigos y consulta de acceso
  stripe-webhook.mjs     confirma los pagos y crea pedido + matrícula
netlify/lib/             Firebase Admin compartido por las funciones
firebase/                reglas de Firestore
scripts/                 compilación, servidor local y pruebas de reglas
```

## Desarrollo

```bash
npm install
npm run dev:demo         # modo demostración en http://localhost:8000 (accesos rápidos, pago simulado)
npm run dev              # contra Firebase (variables FIREBASE_* o firebase.web.json)
npm run probar:reglas    # 32 pruebas de las reglas de Firestore en el emulador
```

En la demostración hay tres cuentas: **Administración**, **Lucía** (alumna del centro, con el curso de
Claude asignado y el módulo SAD incluido) y **Marcos** (externo, sin nada). Prueba a comprar con Marcos
y a canjear el código `JRO-DEMO-2026`, que da acceso al máster.

## Seguridad

- Las **reglas de Firestore** imponen los permisos:
  - Nadie se matricula solo en una formación de pago ni falsea el origen de la matrícula.
  - Los pedidos solo los escribe el webhook.
  - Los códigos no los puede leer el alumnado.
  - Nadie se nombra administrador.
- El **webhook** comprueba la firma de Stripe y es idempotente: un reintento no duplica pedidos.
- La **API de acceso** exige `X-Campus-Key` y solo responde sí o no, con el motivo.
- **CSP estricta**: sin scripts en línea ni recursos de terceros; fuentes alojadas en la propia web.
