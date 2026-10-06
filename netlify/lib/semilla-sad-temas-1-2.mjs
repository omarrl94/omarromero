/**
 * Examen de ejemplo que se carga la primera vez (Cuestionario SAD · Temas 1 y 2).
 *
 * Este archivo SOLO vive en el servidor: contiene las soluciones (`c`)
 * y los criterios de corrección de las abiertas (`groups`, `exp`).
 * Al navegador únicamente le llega el enunciado (ver lib/examenes.mjs).
 *
 * Abiertas: `groups` es una lista de conceptos; cada concepto se da por
 * mencionado si aparece cualquiera de sus raíces (sin tildes ni mayúsculas).
 * `full` conceptos → Bien (1 punto) · `partial` conceptos → Casi (0,5).
 */
export default {
  id: "sad-temas-1-2",
  modulo: "Seguridad y Alta Disponibilidad",
  ciclo: "ASIR",
  titulo: "Cuestionario · Temas 1 y 2",
  subtitulo: "Marco legal y normativo · Hacking ético y metodologías · Herramientas del auditor",
  mc: [
    {t:"Según el RGPD (Reglamento General de Protección de Datos), un dato personal es…",o:["Solo el DNI y el número de la Seguridad Social","Cualquier información sobre una persona identificada o identificable","Únicamente los datos de salud e ideología","Cualquier dato de una empresa"],c:1},
    {t:"¿En qué plazo máximo hay que notificar a la AEPD (Agencia Española de Protección de Datos) una brecha con riesgo para las personas?",o:["24 horas","72 horas","7 días","30 días"],c:1},
    {t:"¿Cuál es la sanción máxima que contempla el RGPD?",o:["6.000 € por incidente","El 1 % de la facturación anual","20 millones de euros o el 4 % de la facturación anual global","No hay sanción económica, solo apercibimiento"],c:2},
    {t:"El Esquema Nacional de Seguridad (ENS) es obligatorio sobre todo para…",o:["Cualquier persona que tenga un ordenador","El sector público y sus proveedores","Solo los bancos","Las empresas de videojuegos"],c:1},
    {t:"La Directiva NIS2 destaca, entre otras cosas, porque…",o:["Elimina el RGPD","Solo afecta a Estados Unidos","Amplía las obligaciones a más sectores esenciales e implica a la dirección de la organización","Prohíbe usar antivirus"],c:2},
    {t:"Según el AI Act (Reglamento Europeo de IA), puntuar a los ciudadanos por su conducta («social scoring») es un uso de…",o:["Riesgo mínimo","Riesgo de transparencia","Alto riesgo","Riesgo inaceptable (prohibido)"],c:3},
    {t:"Según el AI Act, una IA que criba currículums o decide admisiones se considera de…",o:["Riesgo mínimo","Alto riesgo (permitida con controles estrictos)","Riesgo inaceptable","Sin clasificar"],c:1},
    {t:"Según el AI Act, un chatbot o un vídeo generado por IA (deepfake) es de riesgo de transparencia, lo que obliga a…",o:["Prohibir su uso","Avisar de que es una IA o de que el contenido está generado","Pagar una tasa al Estado","Nada, no tiene ninguna obligación"],c:1},
    {t:"¿Qué diferencia principalmente a un hacker ético de un atacante delincuente?",o:["Que usa herramientas distintas","Que trabaja más rápido","La autorización por escrito, la intención de proteger y la confidencialidad","Que no cobra por su trabajo"],c:2},
    {t:"¿Cuál es la primera fase de una auditoría, la que nunca puede faltar?",o:["Recolección de información","El acuerdo previo (alcance y autorización)","El informe","El retest"],c:1},
    {t:"¿Qué produce la fase de informe de una auditoría?",o:["El contrato firmado","Un inventario de puertos abiertos","Un documento con los riesgos priorizados y las recomendaciones","Una copia de seguridad"],c:2},
    {t:"En una auditoría de caja negra, el auditor…",o:["Recibe el código fuente y las credenciales","No recibe ninguna información y empieza como un atacante externo","Recibe una cuenta de usuario normal","Solo audita la red wifi"],c:1},
    {t:"En una auditoría de caja blanca, el auditor…",o:["No sabe nada del objetivo","Recibe información completa: código fuente, credenciales y arquitectura","Solo puede mirar la web desde fuera","Trabaja sin autorización"],c:1},
    {t:"¿Cómo debe ser el laboratorio donde se practican las técnicas?",o:["Sistemas reales en producción","Máquinas vulnerables a propósito, aisladas y sin salida a Internet","Los servidores del centro en horario de clase","Cualquier web que encuentres en Internet"],c:1},
    {t:"¿Qué metodología es la de referencia para la seguridad de aplicaciones web?",o:["OSSTMM","PTES","OWASP","RGPD"],c:2},
    {t:"El footprinting (OSINT, Open Source Intelligence) sirve para…",o:["Borrar los registros del sistema","Recoger información pública del objetivo sin acceder a sus sistemas","Instalar un antivirus","Cifrar el disco duro"],c:1},
    {t:"¿Qué herramienta se usa para capturar y analizar el tráfico de red (sniffing)?",o:["Wireshark","John the Ripper","Aircrack-ng","Nmap"],c:0},
    {t:"Metasploit Framework se utiliza principalmente en la fase de…",o:["Acuerdo previo","Verificación o explotación controlada del impacto de una vulnerabilidad","Redacción del contrato","Copia de seguridad"],c:1}
  ],
  open: [
    {act:"Actividad 1 · ¿Es dato personal?",t:"Elige DOS ejemplos que sean «categoría especial» de datos y explica por qué lo son.",groups:[["salud","medic"],["biometr","huella","facial"],["sindic"],["ideolog","politic"],["religi"],["etni","raza","origen"],["genetic"],["orientaci","sexual"]],full:2,partial:1,exp:"Categorías especiales: salud, datos biométricos, afiliación sindical, ideología, religión, origen étnico/racial, datos genéticos, vida/orientación sexual."},
    {act:"Actividad 1 · ¿Es dato personal?",t:"¿Por qué la «nota media anónima de la clase» NO es un dato personal? ¿Qué tendría que pasar para que sí lo fuera?",groups:[["anonim"],["no identif","no se puede identif","no permite identif","sin identif","nadie","no se sabe quien"],["agregad","media","conjunto","global"]],full:2,partial:1,exp:"No identifica a ninguna persona (dato agregado/anónimo). Sería personal si pudiera asociarse a un alumno concreto."},
    {act:"Actividad 2 · Ordena la auditoría y elige la caja",t:"Escribe las 6 fases de una auditoría en el orden correcto.",groups:[["acuerdo","contrato","autoriz"],["recolec","informacion","reconoc"],["analisis","vulnerab"],["verific","explot","intrusion"],["informe"],["retest","comprob","correcc","revis"]],full:5,partial:3,exp:"Orden: 1) Acuerdo previo, 2) Recolección de información, 3) Análisis de vulnerabilidades, 4) Verificación controlada, 5) Informe, 6) Retest."},
    {act:"Actividad 2 · Ordena la auditoría y elige la caja",t:"Una empresa no te da ninguna información (como un atacante externo). ¿Qué tipo de caja elegiste y por qué?",groups:[["negra"],["sin informacion","ninguna informacion","nada","no sabe","atacante externo","desde fuera","a ciegas","cero"]],full:2,partial:1,exp:"Caja negra: el auditor parte sin ninguna información, igual que un atacante externo real."},
    {act:"Actividad 2 · Ordena la auditoría y elige la caja",t:"¿Qué documento debe firmarse antes de empezar y qué tres cosas, como mínimo, debe incluir?",groups:[["contrato","acuerdo","documento firmad"],["alcance"],["autoriz","permiso"],["confidencial"],["contacto"]],full:3,partial:2,exp:"El contrato/encargo firmado, con alcance (qué sistemas, horario, técnicas), autorización, confidencialidad y persona de contacto."},
    {act:"Actividad 3 · Footprinting: ¿cuánta información expones?",t:"¿Qué objetivo autorizado elegiste y qué TRES hallazgos públicos encontraste sobre él?",groups:[["dominio","subdominio","web"],["correo","email","@"],["nombre","cargo","empleado","persona"],["metadat","documento","pdf"],["foto","imagen","exif","ubicaci","geoloc"],["tecnolog","servidor","software"]],full:3,partial:2,exp:"Hallazgos públicos posibles: dominio/subdominios, correos con patrón, nombres y cargos, documentos con metadatos, fotos con ubicación, tecnologías."},
    {act:"Actividad 3 · Footprinting: ¿cuánta información expones?",t:"Para uno de esos hallazgos: ¿es dato personal?, ¿qué riesgo supone y qué recomendarías para reducir la exposición?",groups:[["personal"],["riesgo","phishing","expone","expos","peligro","suplant"],["recomend","minimiz","limpiar","quitar","eliminar","alias","rol generic","cifrar","exif","no public"]],full:3,partial:2,exp:"Debe indicar si es dato personal, el riesgo (p. ej. facilita phishing) y una recomendación concreta (limpiar metadatos, buzones de rol, quitar EXIF…)."},
    {act:"Actividad 3 · Footprinting: ¿cuánta información expones?",t:"¿Por qué esta práctica es OSINT «pasivo» y por qué es importante no pasar de ahí sin autorización?",groups:[["public","abierta","fuentes abiertas"],["no acceder","sin acceder","no interactu","no entrar","no tocar","solo observ","solo mirar"],["autoriz","permiso","legal","delito","ilegal","codigo penal"]],full:2,partial:1,exp:"Es pasivo porque solo consulta información pública sin interactuar con los sistemas; acceder sin autorización sería delito (Tema 1)."}
  ]
};
