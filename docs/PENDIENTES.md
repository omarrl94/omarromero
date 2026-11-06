# Pendientes

## A. Estado y pendientes técnicos

**Hecho:** 128 empresas reales verificadas con GitHub Actions (13 con correo de RR. HH.) (ver `docs/INFORME-VERIFICACION.md`), auditoría de 10 al azar sin problemas, CI en verde y 3 portales con enlace comprobado (LinkedIn, InfoJobs web y Welcome to the Jungle).

| # | Pendiente | Por qué | Cómo completarlo |
|---|---|---|---|
| 1 | **Revisión humana del directorio** | El script comprueba la fuente, el correo y el MX. El sector, la zona, el tamaño y el motivo de encaje salen de la investigación | Lee `docs/INFORME-VERIFICACION.md` y abre 10 fuentes al azar en el navegador (30 min) |
| 2 | **Recuperar empresas descartadas por 403** | Muchas webs (GMV, Telefónica Tech, idealista, Seidor, S21sec…) bloquean a los robots desde los servidores de GitHub | Si te interesan, comprueba a mano su página de empleo. Si publican formulario o correo, se pueden incluir con una revisión manual documentada (ver `docs/GUIA-EMPRESAS.md`) |
| 3 | **Witrey** | En la comprobación de enlaces su web agotó el tiempo de espera, aunque minutos antes sí verificó | Vigilar en la próxima ejecución mensual; si vuelve a fallar, retirarla |
| 4 | **Indeed, Tecnoempleo y Glassdoor** | Bloquean a los robots (403): no se han podido probar y siguen ocultos | Pruébalos en el navegador y pon `probado: true` en `config/ffe.config.ts`. Confirma también a mano el filtro de Madrid de InfoJobs (`provinceIds=33`) |
| 5 | **Confirmar Adzuna en España y sus condiciones** | Prueba gratuita de 14 días; después hace falta licencia | Ver `docs/DESPLIEGUE.md`, paso 7 |
| 6 | **Confirmar parámetros de la API de InfoJobs** | Su documentación oficial no se pudo abrir | Revisa `server/fuentes/infojobs.ts` con la documentación de developer.infojobs.net |
| 7 | **Empresas activas en el registro** | El script comprueba la web, no el BORME | Para las pymes pequeñas, búscalas en el BORME o en informa.es |

## B. Lo que tienes que hacer tú

### Antes de publicar (obligatorio)

1. **Despliegue:** sigue `docs/DESPLIEGUE.md` (rama `conecta-ffe`).
2. **Crear el proyecto de Firebase** `conecta-ffe` y añadir sus variables y las del correo del centro (`docs/DESPLIEGUE.md`, pasos 1 y 4).
3. **Revisar el directorio verificado** (pendiente 1). La verificación se repite sola cada mes y cada vez que cambian las candidatas.
4. **Activar Netlify Forms** y la notificación por correo del formulario `retirada`.
5. **Revisar los textos legales** de `#/privacidad` con la persona responsable de protección de datos del centro. Ahora hay cuentas y datos en Firebase: hay que fijar el responsable del tratamiento, la base jurídica, el encargado (Google, región UE), los plazos de conservación y el de retirada (10 días hábiles).
6. **Primer acceso como superadmin** y comprobación final (`docs/DESPLIEGUE.md`, pasos 6 y 9).

### Datos de configuración que confirmar (`config/ffe.config.ts`)

- **Horas de ASIR (420):** marcadas como pendientes de confirmar (`horasPendientesDeConfirmar.ASIR`).
- **Tutor/a de ASIR:** está a `null`. Mientras tanto el correo sale sin copia y se avisa al alumno. Pon `{ nombre, email }` cuando se asigne.
- **Fechas de las modalidades:** se han puesto en 2027 (curso 2026-2027). Cámbialas cada curso.
- **Contacto de privacidad:** `centro.contactoPrivacidad` apunta a omar.romero@jrotero.es; cámbialo si debe ser otro buzón.

### Opcional

- **Claves de Adzuna** (`ADZUNA_APP_ID` y `ADZUNA_APP_KEY`): pide a Adzuna por escrito el uso educativo sin ánimo de lucro (pendiente 5).
- **Claves de InfoJobs** (`INFOJOBS_CLIENT_ID` y `INFOJOBS_CLIENT_SECRET`): registra la aplicación en developer.infojobs.net y acepta sus condiciones.
- **Dominio propio** (p. ej. `ffe.jrotero.es`) en Netlify.

## C. Mejoras propuestas para una siguiente versión

- **Panel docente**, protegido con otro código, para ver el informe de verificación y las solicitudes de retirada sin entrar en Netlify.
- **Lever UE:** soportar `api.eu.lever.co` para empresas con instancia europea.
- **Más feeds ATS** con API pública documentada (Workable, Personio, SmartRecruiters, Teamtailor), siempre que la propia web de la empresa los enlace.
- **Exportar e importar el seguimiento** a un archivo JSON, para cambiar de dispositivo sin servidor.
- **Plantillas de correo por perfil** (p. ej. un párrafo distinto para ciberseguridad o para videojuegos) editables en la configuración.
- **Recordatorio local** para insistir pasados 7 días sin respuesta.
- **Prueba automática de enlaces profundos** en CI, con navegador real y aceptación de cookies, para detectar cambios de formato de URL.
- **Ejecución programada del verificador** (p. ej. un GitHub Action mensual) que abra un PR con el diff de `data/empresas.json` para revisión humana.

## Actividades Comerciales (grado medio)

- [ ] **Horas de FFE**: en `config/ffe.config.ts` → `horas.ACOM` hay 500 h (total de 1.º y 2.º en el plan de Madrid). Pon las horas del periodo que corresponda en nuestro centro y cambia `horasPendientesDeConfirmar.ACOM` a `false`.
- [ ] **Tutor/a de FFE**: `tutores.ACOM` está en `null`; mientras tanto el correo del alumnado sale sin copia al tutor.
- [ ] **Fechas**: el ciclo usa las mismas modalidades A y B que DAM y ASIR. Si en grado medio son otras, avísame para separarlas.
- [ ] **Revisar los textos del correo** (`textosCorreoTutor.ciclos.ACOM` y `textosCorreoAlumno.ciclos.ACOM`), sobre todo el apartado de inteligencia artificial, que es una propuesta.

