# 🚀 Publicar Rollo Madrid en Firebase

Todo vive en un único proyecto de Firebase: las cuentas (Authentication), los
datos (Firestore) y la web (Hosting). El mapa es de Google Maps, que es el mismo
proyecto de Google Cloud, así que las claves salen del mismo sitio.

La app se exporta como **estática**, de modo que Hosting la sirve tal cual: no
hacen falta funciones ni el plan de pago.

---

## 1. Crear el proyecto

1. [console.firebase.google.com](https://console.firebase.google.com) → **Crear
   un proyecto**. Google Analytics es opcional; para esto no hace falta.
2. **Compilación → Authentication → Comenzar → Correo electrónico/contraseña →
   Habilitar**.
3. **Compilación → Firestore Database → Crear base de datos**, en **modo de
   producción** y con la ubicación `eur3 (europe-west)`. Las reglas no las toques
   desde la consola: vienen en este repositorio.
4. **⚙ Configuración del proyecto → Tus apps → Web (`</>`)**, registra la app y
   copia los cuatro valores de `firebaseConfig`.

## 2. Las claves del mapa

En [console.cloud.google.com](https://console.cloud.google.com), **con el mismo
proyecto seleccionado** (Firebase crea uno de Google Cloud por debajo):

1. **APIs y servicios → Biblioteca**: habilita **Maps JavaScript API** y
   **Places API (New)**.
2. **Credenciales → Crear credenciales → Clave de API**.
3. Restríngela: *Sitios web* con `http://localhost:3000/*` y tu dominio;
   *Restricciones de API* solo a esas dos.
4. **Google Maps Platform → Gestión de mapas → Crear ID de mapa**, tipo
   **JavaScript** y **vectorial**.

Google exige facturación activa para Maps aunque uses la capa gratuita.

## 3. En local

```bash
npm install
cp .env.example .env.local     # pega ahí las seis variables
npm run dev                    # http://localhost:3000
```

## 4. Semilla opcional

Para que el mapa no nazca vacío, cinco clásicos de Madrid:

```bash
npm i -D firebase-admin
GOOGLE_APPLICATION_CREDENTIALS=/ruta/clave-servicio.json npm run sembrar
```

La clave de cuenta de servicio sale de **⚙ Configuración del proyecto → Cuentas
de servicio → Generar nueva clave privada**. **Es secreta**: no la subas al
repositorio ni la pegues en un chat. Solo hace falta para sembrar, porque las
reseñas de ejemplo no tienen dueño y las reglas no dejan crear eso desde el
navegador.

## 5. Publicar

```bash
npx firebase-tools login          # la primera vez
npx firebase-tools use --add      # elige tu proyecto
npm run desplegar                 # compila, sube la web y las reglas
```

Queda en `https://TU-PROYECTO.web.app`. Acuérdate de añadir ese dominio a las
restricciones de la clave de Maps, y de que en **Authentication → Settings →
Dominios autorizados** esté incluido.

## 6. Probar las reglas antes de tocarlas

```bash
npm i -D firebase-tools @firebase/rules-unit-testing
npm run probar:reglas
```

Levanta el emulador de Firestore y comprueba 17 cosas: que leer es libre, que
escribir exige sesión, que nadie firma en nombre de otro ni toca partes ajenos,
que las notas fuera de rango se rechazan y que un bar fichado no se renombra ni
se borra. Necesita Java instalado.

---

## Problemas frecuentes

**"Firestore ha denegado la escritura"**
No hay sesión, o las reglas desplegadas no son las del repositorio. Sube las
reglas con `npm run desplegar` o `npx firebase-tools deploy --only firestore:rules`.

**La web publicada sale en modo local**
Las variables `NEXT_PUBLIC_*` se incrustan **al compilar**. Si las cambias
después, hay que volver a compilar y desplegar.

**"Falta activar el acceso por correo"**
Authentication → Sign-in method → Correo electrónico/contraseña.

**El mapa sale en gris o pide la clave**
Revisa que la clave tenga las dos APIs habilitadas, que el dominio esté en las
restricciones y que el proyecto tenga facturación activa.

**Los pines no aparecen pero el mapa sí**
Falta el Map ID, o no es de tipo JavaScript.
