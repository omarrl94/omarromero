# ColaboraFP

Plataforma de **sincronización de recursos en tiempo real para el aula** (código, enunciados, enlaces y archivos) del
**Centro de Formación Profesional José Ramón Otero**, abierta a todos los ciclos formativos.

- **Profesorado** (correo del centro verificado): crea salas, proyecta un QR/PIN, publica recursos y modera las aportaciones.
- **Alumnado** (sin cuenta): entra con el QR o el PIN, recibe el contenido al instante y **propone** aportaciones que el profesor aprueba.
- **Calendarios de clase**: uno por aula o grupo durante todo el curso (exámenes, entregas, avisos, festivos); el alumnado lo consulta con un código o QR, en tiempo real, y puede exportarlo a .ics.

## Stack

React 18 + Vite 6 · Tailwind CSS 3 · react-router-dom 6 · Firebase (Auth + Cloud Firestore, plan gratuito Spark) ·
react-qr-code · react-syntax-highlighter · tipografías autoalojadas (@fontsource) · despliegue en Netlify.

```bash
cd colaborafp
npm install
npm run dev        # http://localhost:5173 (modo demo si no hay VITE_FIREBASE_CONFIG)
npm run build
```

## Puesta en producción

1. **Firebase** (console.firebase.google.com): proyecto en plan Spark, *Authentication → Correo electrónico/contraseña*,
   *Firestore* en ubicación europea (`eur3`), y publicar [`firebase/firestore.rules`](firebase/firestore.rules).
2. **Netlify**: base directory `colaborafp`; variables de entorno de [`.env.example`](.env.example)
   (`VITE_FIREBASE_CONFIG`, `VITE_TEACHER_EMAIL_DOMAINS` y los datos `VITE_CENTRO_*`).
3. **Correos de la cuenta** (verificación y nueva contraseña): salen desde un buzón del Microsoft 365 del centro
   con [`netlify/functions/correo.mjs`](netlify/functions/correo.mjs): SMTP del Microsoft 365 (igual que la web de exámenes), Resend o Microsoft Graph. Variables en `.env.example`.
   Las cuentas también las puede activar un administrador desde «Altas del profesorado».
4. ¿Salas perdidas de la versión anterior? Ver [`scripts/recuperar-salas.mjs`](scripts/recuperar-salas.mjs) (se ejecuta en Google Cloud Shell).
5. Pasos de cumplimiento (encargo de tratamiento, TTL, etc.): ver [`docs/Cumplimiento_ColaboraFP.docx`](docs/Cumplimiento_ColaboraFP.docx).

## Seguridad y protección de datos (resumen)

| Medida | Dónde |
| --- | --- |
| Solo profesorado con correo `@jrotero.es` **verificado** (y la cuenta del administrador como única excepción) gestiona salas | `firestore.rules` (`isTeacher`) + registro |
| Todo el contenido vive **dentro de su sala** (`rooms/{id}/resources`, `/chunks`, `/reports`): no se puede listar entre salas | modelo de datos + reglas |
| PIN alfanumérico de 6 caracteres (31⁶ ≈ 887 M), generado con `crypto.getRandomValues`; los PIN no se pueden listar | `utils/ids.js` + reglas |
| La sala se **cierra sola a las 12 h**; el alumnado solo aporta con la sala abierta | `closes_at` + reglas |
| **Borrado automático** de toda sala y su contenido en la fecha que elige el profesor (60 días por defecto, máx. 1 año; `expire_at`, apto para TTL) | panel del profesor + reglas + TTL |
| Supresión: «Eliminar mi cuenta y mis datos» | `AccountPanel` |
| Copias de seguridad de una sala (archivo `.colaborafp` en el equipo del profesor) y restauración en una sala nueva | `utils/backup.js` |
| Canal de **notificación de contenidos** (LSSI art. 16) | botón «Notificar contenido» → panel del profesor |
| Aceptación de **condiciones de uso** al registrarse y al compartir | registro / «Compartir recurso» |
| Aviso legal, privacidad, condiciones y declaración de accesibilidad | `/aviso-legal`, `/privacidad`, `/condiciones`, `/accesibilidad` |
| Sin conexiones a terceros salvo Firebase: fuentes autoalojadas, sin cookies ni analítica | `main.jsx` |
| CSP, HSTS, Permissions-Policy, X-Frame-Options… | `netlify.toml` |
| WCAG 2.1 AA: 0 incumplimientos en axe-core (40 pantallas, claro/oscuro, escritorio/móvil); foco en diálogos, enlace de salto, movimiento reducido | auditoría |

## Estructura

```
src/
├── components/   Tarjetas, formularios, modales, ReportButton, ReportsPanel, AccountPanel, LegalLayout…
├── config/       centro.js (datos del titular desde VITE_CENTRO_*)
├── context/      AuthContext, RoomContext (motor de la sala), ThemeContext
├── hooks/        useRoomFeed, useAuth, useNow, useNewArrivals…
├── pages/        Home, StudentLiveFeed, Login, Register, TeacherDashboard, RoomControlPanel, legal/*
├── services/     backend.js · firebaseBackend.js · mockBackend.js (misma interfaz)
└── utils/        constantes (plazos, dominio), PIN, formato, archivos
```
