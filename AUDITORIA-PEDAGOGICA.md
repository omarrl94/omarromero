# Auditoría pedagógica de CyberOps: Operación Otero

Revisión completa del juego con una pregunta: **¿aprenden de verdad los alumnos?**
Cada medida se apoya en principios conocidos del diseño instruccional y, siempre que se puede,
en una **comprobación automática** (`npm test` y `npm run test:e2e`), para que no se pierda en futuras versiones.

## 1. Hallazgos y correcciones

| # | Hallazgo | Riesgo para el aprendizaje | Corrección | Cómo se comprueba |
|---|---|---|---|---|
| 1 | Los retos de terminal pedían comandos (`grep`, `base64`, `crontab`, `find`, `systemctl`, `ps`, `kill`, `iptables`) que algunos equipos no habían visto. | Frustración; se avanza copiando el «¿Cómo?» sin entender. | Las lecciones comunes enseñan todo lo que luego se pide, con ejemplos de terminal. | **Auditoría pedagógica** en `npm test`: 4896 usos de comandos, todos enseñados antes en una lección del equipo. |
| 2 | Los exámenes podían preguntar contenido de la lección de otro equipo. | Evaluación injusta: mide lo que no se ha enseñado. | Banco de examen **por equipo**: la lección común más los test de sus propias misiones. | `npm test` genera los exámenes de cada equipo con 40 semillas. |
| 3 | Tests y clasificaciones se podían resolver probando a ciegas. | Se acierta sin comprender. | **Corrección que enseña**: al segundo fallo se explica el porqué y se marca la respuesta. Los errores restan puntos. | Prueba visual en el navegador. |
| 4 | No se decía qué se iba a aprender. | Sin organizador previo, el alumno no sabe qué es lo importante. | **Objetivos de aprendizaje** por tema (en el mapa y en el resumen) y «Al terminar esta misión sabrás» en cada expediente. | `npm test`: ≥ 3 objetivos por tema. |
| 5 | Se podía pasar de tema sin dominarlo. | Lagunas que se arrastran hasta el final. | **Aprendizaje por dominio**: para desbloquear el tema siguiente hay que aprobar el examen con al menos un 5. El examen se puede repetir y las preguntas cambian. | `npm test`: con un 4 el tema siguiente sigue cerrado y con un 5 se abre. |
| 6 | Lo aprendido no volvía a aparecer. | Olvido rápido (curva del olvido). | **Repaso intercalado**: cada examen incluye 2 preguntas de temas anteriores. Entrenamientos con datos nuevos en cada partida. | `npm test` comprueba la estructura de cada examen. |
| 7 | Vocabulario técnico sin definir (IOC, IDOR, DMARC, C2, EDR…). | El alumno se pierde en la jerga. | **Glosario** por tema (en los Apuntes y en el resumen). | `npm test`: ≥ 5 términos por tema. |
| 8 | Al terminar un reto de terminal no se veía la forma experta. | Se consolidan rodeos o malas prácticas. | Panel **«Así lo resolvería un profesional»** con cada comando explicado. | Visual. |
| 9 | No había material para estudiar fuera del juego. | Sin repaso autónomo. | **Resumen descargable por tema** (HTML imprimible o PDF): objetivos, lecciones, chuleta, glosario, consejos del equipo y autoevaluación con soluciones. | `npm test` (30 resúmenes) y `test:e2e` (descarga real). |
| 10 | En la autoevaluación del resumen, la respuesta correcta era siempre la A. | Se aprende el patrón, no el contenido. | Opciones barajadas. | `npm test`: las soluciones no son todas la misma letra. |
| 11 | Conceptos usados sin explicar en algunas misiones de equipo (capas de defensa para Morado, EDR, caducidad de contraseñas). | Huecos puntuales. | Lección común ampliada, glosario y un elemento sustituido. | Revisión manual tema a tema. |

## 2. Cómo está construido el aprendizaje en cada tema

1. **Objetivos** del tema: qué serás capaz de hacer.
2. **Lección** en diapositivas: idea clave, ejemplo de terminal, visual y resumen.
3. **Misión común**, contada desde la perspectiva de tu equipo, con pistas («¿Cómo?» y pistas cuestan estrellas).
4. **Misión de tu equipo**, el mismo contenido aplicado a tu rol (Rojo: analizar; Azul: defender; Morado: conectar ataque y detección).
5. **Entrenamiento**: datos aleatorios en cada partida; no se puede memorizar, hay que razonar.
6. **Examen del tema**: 8 preguntas del tema + 2 de repaso + un reto práctico. Hace falta un 5 para seguir.
7. **Resumen descargable** para estudiar y **boletín de notas** para el seguimiento.

Durante todo el proceso, **Apuntes** (tecla A): lección, comandos y glosario, sin coste.

## 3. Rigor del contenido

- Datos legales: art. 197 bis del Código Penal (acceso ilícito) y art. 33 del RGPD (notificación en 72 h).
- Marcos: NIST SP 800-61 (respuesta a incidentes), CVSS (bandas 0,1-3,9 / 4-6,9 / 7-8,9 / 9-10), OWASP Top 10, MITRE ATT&CK (TA0043, T1110, T1078, T1053, T1496), CWE-89 / 79 / 639 / 798.
- Criptografía: longitudes de hash correctas, y MD5, SHA-1 y SHA-256 implementados de verdad (el hash que calcula el juego es el mismo que en Linux).
- Seguridad del propio juego: escenario 100 % ficticio (dominios `.lab`, IPs de documentación RFC 5737). El Equipo Rojo trabaja siempre con autorización y no se enseñan técnicas de explotación contra sistemas reales.

## 4. Lo que no puede garantizar el software

- **Probarlo con alumnos reales**: el boletín (CSV) muestra en qué temas baja la nota; esas lecciones son las primeras que hay que reforzar.
- **La puesta en común en clase**: los consejos de equipo y las preguntas de autoevaluación del resumen sirven de guion para debatir.
- **La práctica en laboratorio real**: el juego prepara. Para pasar a máquinas virtuales propias hace falta siempre un entorno aislado y autorizado.
