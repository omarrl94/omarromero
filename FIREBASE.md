# CodeForge + Firebase

CodeForge guarda las cuentas y el progreso de los jugadores con **Firebase Authentication**
(correo + contraseña) y **Cloud Firestore**. Sin configuración, la app funciona en
**modo local**: las cuentas y el progreso viven solo en el navegador.

## Qué se guarda

| Ruta en Firestore | Contenido | Quién puede leer | Quién puede escribir |
|---|---|---|---|
| `codeforge_nicks/{nick en minúsculas}` | `{ uid }`: reserva única del nick | cualquiera (para comprobar si está libre) | solo su dueño, y solo para crearla o liberarla |
| `codeforge_players/{uid}` | nick, avatar, oro, XP, mundos completados, misiones conquistadas | jugadores con sesión (ranking) | solo su dueño, con valores validados |
| `codeforge_players/{uid}/private/progress` | correo y progreso completo (misiones, estrellas, borradores…) | solo su dueño | solo su dueño |

El registro hace en **una sola transacción** la reserva del nick, el perfil y el documento
privado: dos jugadores nunca pueden quedarse el mismo nick. Las reglas
([`firebase/firestore.rules`](firebase/firestore.rules)) además impiden leer el progreso o el correo de
otros, escribir campos extra y subir oro imposible (más de 8000).

Las colecciones llevan el prefijo `codeforge_`, así que pueden convivir con otra app en el
mismo proyecto. En ese caso **no despliegues este archivo tal cual**: añade estos bloques
`match` a las reglas que ya tengas, o desplegarás encima de ellas.

## Puesta en marcha (proyecto nuevo, recomendado)

1. En <https://console.firebase.google.com> crea un proyecto (por ejemplo `codeforge-engine`).
2. **Authentication → Sign-in method →** activa **Correo electrónico/contraseña**.
   En **Templates** puedes poner los correos (verificación y contraseña olvidada) en español.
3. **Firestore Database → Crear base de datos** (modo producción, región `eur3` o la que prefieras).
4. **Configuración del proyecto → Tus apps → Web (</>)**: registra la app y copia la configuración.
5. Copia `.env.example` como `.env.local` y rellena las variables `VITE_FIREBASE_*`.
6. Copia `.firebaserc.example` como `.firebaserc`, pon el id de tu proyecto y despliega las reglas:

   ```bash
   npx firebase login
   npm run desplegar:reglas
   ```

7. `npm run dev`: la pantalla de registro mostrará **«en la nube»**.

### Publicar

- **Netlify:** en *Site configuration → Environment variables* añade las mismas `VITE_FIREBASE_*`
  y vuelve a desplegar (son públicas por diseño: la seguridad la ponen las reglas).
  Añade tu dominio de Netlify en **Authentication → Settings → Authorized domains**.
- **Firebase Hosting:** `npm run desplegar:hosting`.

## Probar sin tocar la nube (emuladores oficiales)

Necesitas Java 11 o superior.

```bash
npm run test:rules        # 23 pruebas de seguridad de las reglas contra el emulador de Firestore
npm run emuladores        # Auth (9099) + Firestore (8080) en local
npm run dev:emuladores    # la app conectada a los emuladores (en otra terminal)
```

## Modo local

Si faltan las variables, la app usa el motor local con la misma interfaz: registro con nick,
correo, contraseña (guardada como hash SHA-256) y avatar; progreso por jugador y ranking con los
pilotos de ese navegador. Es el modo que usa la preview publicada, que no puede conectarse a
servidores externos.
