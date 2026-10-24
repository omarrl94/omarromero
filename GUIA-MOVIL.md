# 📱 Rollo Madrid en iOS y Android

Una sola base de código. La web se exporta estática y **Capacitor** la empaqueta
dentro de una app nativa: el HTML, el CSS y el JS viajan en el binario, así que
la app abre aunque no haya cobertura. Lo único que necesita red son los datos
(Firestore) y el mapa (Google).

```
Next.js  →  out/  →  Capacitor  →  Xcode / Android Studio  →  App Store / Google Play
```

---

## 1. Qué hace falta en tu máquina

| Para | Necesitas |
|---|---|
| Android | Android Studio (SDK 34+), JDK 17 |
| iOS | macOS, Xcode 15+, CocoaPods |

Esto **no se puede hacer desde un contenedor Linux**: la firma y la compilación
de iOS exigen macOS, y el APK necesita el SDK de Android instalado.

## 2. Crear los proyectos nativos

Las carpetas `ios/` y `android/` no están en el repositorio porque se generan:

```bash
npm install
npm run build                 # genera out/
npx cap add android
npx cap add ios               # solo en macOS
```

## 3. Iconos y pantalla de carga

Ya están dibujados a partir del logo, en `resources/`:

| Archivo | Para qué |
|---|---|
| `icon.png` | Icono general (1024) |
| `icon-foreground.png` / `icon-background.png` | Icono adaptativo de Android, en dos capas |
| `splash.png` / `splash-dark.png` | Pantalla de carga (2732, cuadrada) |

Para regenerarlos si cambia el logo: `npm run iconos`. Para repartirlos en todos
los tamaños que piden las tiendas:

```bash
npx @capacitor/assets generate --iconBackgroundColor "#0C0C0D" --splashBackgroundColor "#0C0C0D"
```

## 4. Compilar y abrir

```bash
npm run movil             # compila la web y la sincroniza con los proyectos
npm run movil:android     # abre Android Studio
npm run movil:ios         # abre Xcode
```

Desde ahí, *Run* en un emulador o en un dispositivo.

## 5. Las claves, en la app nativa

Esto es lo que más sorprende al pasar de web a app: **una app nativa no envía
cabecera `Referer`**, así que las restricciones por dominio de la clave de Google
Maps no valen tal cual.

La webview carga desde:

- **Android**: `https://localhost`
- **iOS**: `capacitor://localhost`

Dos caminos, y conviene el segundo:

1. **Rápido**: añade `https://localhost/*` y `capacitor://localhost/*` a las
   restricciones de sitio web de la clave que ya tienes.
2. **Recomendado**: crea **una clave por plataforma** en Google Cloud, con
   restricción de **aplicaciones para Android** (nombre del paquete
   `com.rollomadrid.app` + huella SHA-1) y de **apps para iOS** (ID del paquete).
   Así la clave de la web no viaja en el binario de la app.

De Firebase no hay que cambiar nada: las cuatro variables valen igual. Eso sí, en
**Authentication → Settings → Dominios autorizados** añade `localhost`.

## 6. Lo que ya está adaptado

- **Permiso de ubicación nativo**: dentro de la app lo pide el sistema operativo
  (plugin de Geolocation), no el navegador. Sigue pidiéndose solo al pulsar.
- **Botón atrás de Android**: cierra la ficha o el acceso antes de salir de la app.
- **Barra de estado** en claro sobre el asfalto, y **pantalla de carga** que se
  quita cuando ya hay datos que enseñar.
- **Vibración** corta al puntuar cada criterio.
- **Zonas seguras**: la ficha y el acceso respetan la barra de gestos y la muesca.
- **Sin rebote elástico, sin destello azul al tocar y sin zoom por doble toque.**
- **Abre sin cobertura**: si Firestore no contesta, la app enseña la última copia
  guardada en el dispositivo y avisa de que puede estar vieja.

## 7. Antes de subirla a las tiendas

- [ ] Permisos con texto en español: `NSLocationWhenInUseUsageDescription` en
      `ios/App/App/Info.plist` ("Para enseñarte los baños que tienes más cerca")
      y `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` en el manifiesto de
      Android.
- [ ] Política de privacidad publicada: las tiendas la exigen porque la app pide
      ubicación y guarda cuentas.
- [ ] Ficha de privacidad de App Store y formulario de seguridad de datos de
      Google Play: ubicación **no** se almacena ni se comparte; correo y alias,
      sí, para identificar la cuenta.
- [ ] Clasificación por edad: hay lenguaje coloquial y humor escatológico.
- [ ] Capturas de pantalla por tamaño de dispositivo (el reel vertical sirve de
      vídeo de presentación).
- [ ] Cuenta de prueba para la revisión de Apple, que exige poder entrar.
- [ ] Borrado de cuenta desde la propia app: **Apple lo exige** si hay registro.
      Todavía no está hecho.
