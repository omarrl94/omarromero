# Prompt para Astra — replicar y mejorar Rollo Madrid

> Cópialo entero. Está escrito para que alguien que no conoce el proyecto pueda
> reconstruirlo desde cero y dejarlo mejor, sin tener el repositorio delante.

---

Eres un equipo de producto completo —dirección de arte, diseño de producto y
desarrollo full-stack— y vas a construir **Rollo Madrid**: el mapa comunitario de
los baños de los bares de Madrid. Existe una versión previa que funciona; tu
trabajo es **replicarla y superarla**, no copiarla línea a línea.

## 1. El producto en una frase

Antes de entrar a ese baño, mira la nota: un mapa donde cada baño de bar se
puntúa en cuatro criterios y se resume en un veredicto que se entiende de un
vistazo, con prisa, de pie y con una mano.

**Para quién**: quien sale por Madrid y no quiere una sorpresa; en especial quien
tiene menos margen para improvisar (familias con niños, problemas digestivos,
reglas, movilidad reducida).

## 2. Pila obligatoria

Next.js 14 (App Router) · React 18 · TypeScript estricto (con
`noUncheckedIndexedAccess`) · Tailwind CSS · `@vis.gl/react-google-maps` ·
Firebase (Authentication + Cloud Firestore + Hosting) · `next/font` para las
tipografías. Sin librería de
componentes: la identidad es propia. Todo el texto de la interfaz, en español de
España.

## 3. Modelo de datos (respétalo)

El identificador universal de un local es el **`place_id` de Google**: los bares
no se crean a mano, se **adoptan** desde Places al buscarlos. Así no hay
duplicados ni nombres mal escritos.

```ts
Bar    { place_id (PK), nombre, direccion, lat, lng, creado_por }
Review { id, place_id (FK), aseo, user_id (FK), autor,
         limpieza, espacio, intimidad, suministros, comentario, fecha }
```

- `aseo: "femenino" | "masculino" | "unico"`. **La nota cuelga del aseo, no del
  local**: el mismo bar puede tener el de ellas impecable y el de ellos arrasado.
  Todo —mapa, rankings, ficha— se filtra por aseo.
- Las notas **nunca se guardan calculadas**; se derivan siempre.
- Un bar solo se persiste cuando alguien publica su primera valoración.

### Reglas en la base de datos, no en el navegador (reglas de Firestore)

- Leer bares y reseñas: cualquiera, con o sin cuenta.
- Fichar un bar y publicar: solo con sesión, y **solo a tu nombre**
  (`user_id = auth.uid()`).
- Corregir o retirar: solo lo tuyo. Editar o borrar un bar desde el cliente:
  nadie.
- **Un voto por persona, bar y aseo**: nombra el documento de la reseña
  `{place_id}__{aseo}__{uid}` y la unicidad la impone Firestore sola; de paso la
  regla comprueba la autoría sin leer nada.
- Las reglas tienen que venir con **pruebas en el emulador**, no escritas a ojo.

## 4. Reglas de producto

**Los cuatro criterios** (1 a 5, con la pregunta que de verdad se hace la gente):

| Criterio | Pregunta |
|---|---|
| Limpieza | ¿Se puede comer en el suelo o huele a muerte? |
| Espacio | ¿Caben las rodillas al cerrar la puerta? |
| Intimidad | ¿El pestillo es de verdad o es decorativo? |
| Suministros | ¿Hay papel y jabón o toca improvisar? |

Cada punto tiene nombre: **Infierno · Malo · Justito · Bien · Gloria**.

**Los veredictos** (de la media): ≥ 4,2 *Vía libre* `#C6FF3D` · ≥ 3,5 *Se puede*
`#9BE03A` · ≥ 2,5 *Aprieta y reza* `#FFB800` · ≥ 1,6 *Mal asunto* `#FF7A2F` ·
< 1,6 *Ni de coña* `#FF3B30` · sin datos *Sin catar* `#4A4A52`. Por debajo de 1,6
el marcador late. Con ≥ 4,5 y dos votos o más: **Rollo de Oro** 👑.

**Ubicación**: nunca se pide al cargar, solo al pulsar. Si se deniega, la app
sigue entera y lo dice sin insistir. No se guarda ni se envía. Con ubicación, el
**modo urgencia** abre el baño decente (≥ 3,5) que más cerca pilla; si ninguno
aprueba, el más cercano.

## 5. Identidad visual

Dirección **"fanzine nocturno"**: asfalto de madrugada, rotulador magenta, verde
ácido de neón, ámbar de bar para los premios, papel de fotocopia para el texto.
Marcos negros de 3 px, sombras duras sin difuminar (`6px 6px 0 #000`), grano de
fotocopia sobre el fondo, tema oscuro único a propósito.

| Uso | Hex |
|---|---|
| Fondo / paneles | `#0C0C0D` / `#141417` / `#1C1C21` |
| Bordes | `#2A2A31` |
| Marca | `#FF2E88` |
| Acento | `#C6FF3D` |
| Premios | `#FFB800` |
| Alarma | `#FF3B30` |
| Texto | `#F2ECDF` / `#B9B2A4` |

Tipografías: **Anton** (titulares y cifras, siempre en mayúsculas), **Manrope**
(texto), **Space Mono** (rótulos y datos).

### El logo

Un **rollo de papel higiénico del que cae el papel: al desenrollarse recorre el
suelo y se levanta dibujando una M mayúscula de Madrid**. Es la idea central de
la marca y no se negocia; la ejecución sí puede mejorar. Debe ser SVG, sin
dependencias, legible a 24 px y a 2 m. Referencia (`viewBox="0 0 128 68"`):

```
Papel (trazo 9, #FF2E88, extremos redondos):
  M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57
Perforado (mismo path, trazo 2, #C6FF3D, dasharray "2 8")
Cuerpo del rollo (#F2ECDF, contorno negro 3):
  M9 20 h30 v28 a15 7 0 0 1 -30 0 z
Tapa: ellipse cx=24 cy=20 rx=15 ry=7
Canuto: ellipse cx=24 cy=20 rx=5 ry=2.3, relleno #FFB800
```

Entrega además: variante monolínea para iconos, versión de una tinta para
estampar, favicon y una imagen de 1200×630 para compartir. **Mejóralo**: la M
actual se lee, pero el enlace entre el rollo y la letra se puede resolver con más
gracia, y el conjunto puede ganar personalidad sin perder legibilidad.

### Voz

Callejera y directa, sin crueldad. "Antes de entrar a ese baño, mira la nota y
reza". "Partes de guerra". "El aviso para el siguiente". El humor escatológico es
parte del producto; los insultos y el desprecio no.

## 6. Qué tiene que hacer (mínimos)

1. Mapa oscuro de Madrid centrado en Sol, con un marcador por bar que lleve la
   nota y el veredicto dentro, y que se pulse para abrir la ficha.
2. Buscador con **Google Places Autocomplete** y UI propia: primero los bares ya
   fichados, debajo los de Google. Debounce, token de sesión y respaldo a la API
   clásica si la clave no tiene la nueva.
3. Filtro de aseo (Todos · ♀ · ♂ · ⚲) que mande en mapa, rankings y ficha.
4. Ficha del baño: nota grande, veredicto, resumen de los tres aseos, desglose
   por criterio con cuántos lo suspenden, comentarios firmados y cómo llegar.
   BottomSheet en móvil, cartel en escritorio.
5. Formulario: elegir aseo (obligatorio), cuatro escalas, veredicto en vivo,
   comentario, publicar, corregir y retirar lo tuyo.
6. Cuentas con correo y contraseña. Leer es libre; firmar exige cuenta.
7. Rankings: podio, lista negra y cerca de ti.
8. Modo urgencia.
9. **Dos degradaciones honestas**: sin clave de Google, un mapa esquemático con
   los mismos marcadores y una etiqueta que diga que es una simulación; sin
   Firebase, cuentas y datos locales, avisando de ello. La app nunca se queda
   inservible por falta de configuración **ni finge tener lo que no tiene**.

## 7. Dónde quiero que lo superes

Prioridad alta:

1. **Moderación**: denunciar un parte, ocultarlo hasta revisarlo, y un criterio
   contra el bar que se autovalora. Sin esto no se puede abrir al público.
2. **Accesibilidad del baño como dato**: accesible en silla, cambiador, si hay
   que pedir llave o consumir. Es lo que convierte la app en útil de verdad para
   quien más la necesita.
3. **Accesibilidad de la interfaz**: contraste real sobre el fondo oscuro, foco
   visible, navegación con teclado, lectores de pantalla, `prefers-reduced-motion`.
   El estilo no puede costar usabilidad.
4. **Tests automatizados** en CI: unitarios para las medias y los veredictos, y
   de extremo a extremo para publicar, corregir y filtrar por aseo.

Prioridad media:

5. **Escucha en vivo** (`onSnapshot`): que el mapa se actualice solo cuando alguien publica.
6. **PWA con offline**: se usa con mala cobertura y con prisa; debe instalarse y
   responder.
7. **Horario desde Places**: "abierto ahora" como filtro.
8. **Rendimiento**: el bundle ronda los 185 kB de carga inicial, con el SDK de
   Firebase entero para usar auth y dos colecciones. Recórtalo.
9. **Fotos del baño**, si encuentras una forma responsable de hacerlo
   (consentimiento, sin personas, moderación previa).

Libre:

10. Sorpréndeme en la dirección de arte dentro de la identidad descrita: el reto
    es que un mapa oscuro con marcadores de colores tenga personalidad sin
    volverse ilegible a las tres de la mañana con un 10 % de batería.

## 8. Cómo quiero que trabajes

- **Verifica lo que entregas.** Compila, pasa el typecheck y prueba los flujos en
  un navegador de verdad antes de decir que está hecho.
- **Di lo que no has podido probar.** Si te faltan credenciales de Google o de
  Firebase, dilo claramente en vez de dar por bueno el camino sin comprobar.
- **Comentarios y commits en español**, explicando el porqué y no el qué.
- **Mobile-first de verdad**: nada de desbordes laterales, objetivos táctiles
  grandes, la ficha al alcance del pulgar.
- **Nada de claves en el repositorio**: `.env.local` y variables de entorno.
- **No pidas la ubicación al cargar** la página.
- **No inventes datos de bares reales** ni los presentes como verificados: los
  ejemplos van marcados como tales.

## 9. Qué entregar

1. El repositorio funcionando con `npm install && npm run dev`.
2. Reglas de Firestore con sus pruebas en el emulador, y una semilla opcional.
3. `.env.example` documentado y un README que explique las dos degradaciones.
4. El logo en SVG con sus variantes, favicon e imagen para compartir.
5. Una nota corta con lo que has mejorado respecto a la especificación y por qué,
   y lo que has dejado fuera.
