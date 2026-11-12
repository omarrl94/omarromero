# ⚡ Guardia 24 h

Videojuego web educativo para el **CFGS Sistemas Electrotécnicos y Automatizados**, módulo **0518 · Técnicas y Procesos en Instalaciones Eléctricas** (C.F.P. José Ramón Otero). Vive en la carpeta `guardia-24h/` del repositorio, independiente de CodeForge.

**Estado: Fase 1.** Núcleo de evaluación jugable (opción múltiple, V/F, numérico, selector de cita), Distrito 1 con 26 ítems en borrador (N1–N5), pistas, 3 intentos, notas por RA y final, y panel docente mínimo con CSV (modo local). Ver `README_DOCENTE.md`.

## Comandos
```bash
npm install
npm run dev            # servidor local (modo local si no hay .env.local)
npm test               # unitarios (nota, biblioteca)
npm run content:validar
npm run build          # valida contenido + tipos + build
npm run e2e            # recorrido de un alumno con Playwright
npm run test:rules     # reglas de Firestore con emulador (necesita Java)
```

## Modos de datos
- **Local (por defecto):** IndexedDB, un solo dispositivo.
- **Firebase:** copia `.env.example` a `.env.local` y rellena `VITE_FIREBASE_*`. Activa **Authentication → Anónimo** (alumnos) y **Correo/contraseña** (profesores), crea Firestore en `eur3`, copia `.firebaserc.example` a `.firebaserc` y ejecuta `npm run desplegar:reglas`. Colecciones con prefijo `guardia_` para convivir con CodeForge en el mismo proyecto: **no despliegues estas reglas encima de las de CodeForge; fusiona los bloques `match`**.
- Las clases (`guardia_classes/{CODIGO}` con `profesorUid`) las crea el profesor; el panel docente llega en la Fase 1.

## Despliegue (Netlify)
Directorio base `guardia-24h`, comando `npm run build`, publicar `dist`, variables `VITE_FIREBASE_*`. Añade el dominio en Firebase → Authentication → Dominios autorizados.

## Reglas de contenido
Ningún valor normativo vive en el código: todo en `content/` con `fuente` y `verificado:false` hasta validarlo. Ver `README_DOCENTE.md`.
