# CyberOps: Operación Fénix

> Aprende ciberseguridad desde cero hasta nivel avanzado **jugando**: elige equipo (Rojo, Azul o Morado) y vive el temario desde tu perspectiva.

SPA gamificada (React + Vite + Tailwind + Framer Motion + Lucide) para alumnado de FP y cualquier
persona que empiece en ciberseguridad. Todo ocurre en un **laboratorio simulado**: la empresa cliente
(Nébula Logística), sus dominios `.lab` y sus IPs (rangos de documentación RFC 5737) son ficticios.
Ningún comando sale del navegador.

## Ver el juego en local

| Opción | Cómo |
|---|---|
| **Un solo HTML** (sin instalar nada) | Abre [`preview/cyberops-preview.html`](preview/cyberops-preview.html) con doble clic. Es el juego completo en un fichero: cuentas y progreso en el navegador. Se regenera con `npm run preview:html`. |
| **Servidor de desarrollo** | `npm install` y `npm run dev` → <http://localhost:5173>, con recarga en caliente. |
| **Versión compilada** | `npm run build` y `npm run preview` → <http://localhost:4173>, igual que en Netlify. |
| **Con la nube, sin tocar la nube** | `npm run emuladores` (Auth y Firestore de Firebase en local, requiere Java) y, en otra terminal, `npm run dev:emuladores`. |

```bash
npm test            # verifica las 40 misiones (571 comprobaciones)
npm run test:rules  # 24 pruebas de las reglas de Firestore en el emulador (requiere Java)
```

## Tres equipos, un temario

Al empezar eliges equipo y haces el **juramento del agente** (permiso, alcance, divulgación responsable).
Los 10 módulos son comunes, pero cada uno tiene una **misión común** contada desde tu perspectiva y una **misión propia de tu equipo**.
Cada equipo guarda su progreso, su XP y su rango por separado: puedes jugar los tres.

| Equipo | Perspectiva | Rangos |
|---|---|---|
| 🔴 **Rojo** | Piensa como el adversario, con permiso: reglas de enfrentamiento, superficie de ataque, revisión de código y configuraciones, CVSS e informes. | Recluta → … → Líder Red Team |
| 🔵 **Azul** | Proteger, detectar, responder: bastionado, logs, caza de amenazas, parches, código seguro e incidentes. | Vigía → … → CISO |
| 🟣 **Morado** | Une ataque y defensa con MITRE ATT&CK: de cada hallazgo, una detección y una mejora. | Enlace → … → Director de ciberseguridad |

## Los 10 módulos (de cero a experto)

| # | Módulo | Nivel | Contenido |
|---|---|---|---|
| 1 | Inducción | Iniciación | Terminal básica, tríada CIA, ética y ley (art. 197 bis CP), alcance, MITRE ATT&CK |
| 2 | Linux y permisos | Iniciación | `ls -l`, notación octal, `chmod`, `find -perm`, sudoers, mínimo privilegio |
| 3 | Reconocimiento pasivo | Básico | OSINT, `whois`, `dig` (A, MX, NS, TXT), metadatos con `exiftool`, SPF/DMARC |
| 4 | Redes y servicios | Básico | Puertos, saludo TCP, `ss -tulpn`, inventarios, detectar escaneos en logs, `iptables`, `systemctl` |
| 5 | Vulnerabilidades | Intermedio | CVE, CWE, CVSS, priorización, gestión de parches |
| 6 | Seguridad web | Intermedio | OWASP Top 10, revisión de código (SQLi, XSS, IDOR), correcciones, logs web, WAF |
| 7 | Criptografía | Intermedio | Codificar vs cifrar vs hash, Base64, ROT13, `sha256sum`, Argon2/bcrypt, MFA, cadena de suministro |
| 8 | Ingeniería social | Avanzado | Phishing, cabeceras de correo, IOC, simulacros éticos, métricas |
| 9 | Detección (SOC) | Avanzado | `auth.log`, fuerza bruta, procesos, persistencia en cron, mapa ATT&CK |
| 10 | Operación Fénix | Experto | Ciclo NIST, evidencias, RGPD 72 h, informe final, incidente en vivo y ejercicio morado |

**40 misiones** en total (20 por equipo), con 6 tipos de reto:

- **Terminal simulada**: shell con sistema de ficheros virtual, tuberías (`|`), `;`, `&&`, redirecciones, autocompletado con Tab e historial. Comandos: `ls cd cat grep wc sort uniq cut awk find chmod ps kill ss systemctl crontab iptables whois dig base64 sha256sum exiftool`…
- **Test** con explicación de cada respuesta.
- **Clasificar** (por ejemplo, permitido o prohibido, o severidad).
- **Ordenar** (fases, ciclos, informes).
- **Revisión de código**: localizar la línea y elegir el impacto o la corrección.
- **Análisis de registros**: marcar las líneas sospechosas, con falsos positivos y negativos.

Cada misión: **expediente** → **lección paso a paso** (con visuales animados) → retos → **informe** con lo aprendido y un consejo de tu equipo.

## Gamificación

- **3 estrellas por misión**: superada · sin pistas · precisión (como mucho un error).
- **XP** (100 + 50 por estrella extra), **8 rangos por equipo**, **insignias** por módulo y **rachas** diarias.
- **Ranking** de agentes y «guerra de equipos» por XP acumulada.
- Módulos que se desbloquean en orden.

## Interfaz

Fondo de red viva en canvas (nodos y paquetes del color de tu equipo), secuencia de arranque, títulos con efecto glitch,
tarjetas de equipo con inclinación 3D, mapa de operaciones con nodos hexagonales de progreso y eje luminoso animado,
terminal con efecto CRT, informe con estrellas y confeti. Todo el tema cambia de color con el equipo. Se adapta al móvil
y respeta `prefers-reduced-motion`.

## Cuentas y nube

Registro con **nick, correo, contraseña y avatar**. Con Firebase configurado (variables `VITE_FIREBASE_*`), las cuentas y el
progreso se sincronizan en la nube. Sin ellas, funciona en **modo local**. Ver [FIREBASE.md](FIREBASE.md) y
[DESPLIEGUE-NETLIFY.md](DESPLIEGUE-NETLIFY.md).

## Estructura

```
src/
  core/        shell.js (terminal simulada) · vfs.js · crypto.js (MD5, SHA-1/256, Base64…) · teams.js · progress.js
  campaign/    index.js (módulos) · m01-m03 · m04-m05 · m06-m07 · m08-m10 · helpers.js (objetivos)
  world/       nebula.js (escenario ficticio: WHOIS, DNS, IPs)
  components/  Intro · AuthScreen · TeamSelect · CampaignMap · MissionView · challenges/* · Profile · Leaderboard · fx
  services/    accounts.js · firebase.js
scripts/       verify-campaign.mjs · build-preview.mjs · test-firestore-rules.mjs
preview/       cyberops-preview.html (juego en un solo fichero)
```

## Añadir una misión

Las misiones son datos. Añade un objeto al array del módulo con `id`, `module`, `teams`, `title`, `story`
(un texto o `{ red, blue, purple }`), `lesson`, `challenges`, `learned` y `tip`. En los retos de terminal,
cada objetivo tiene `check` (función sobre el estado de la shell) o `answer` (respuestas válidas), y el reto
lleva `solution`: `npm test` comprueba que la solución cumple todos los objetivos y que no se cumplen sin hacer nada.

## Enfoque ético

El juego enseña **cómo piensa un atacante para defender mejor**. El Equipo Rojo trabaja siempre con
autorización y alcance: analiza superficies, revisa código y configuraciones, prioriza y escribe informes.
No incluye instrucciones de explotación contra sistemas reales.
