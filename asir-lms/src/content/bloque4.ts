import type { TopicContent } from "./types";

// Bloque 4 · Alta disponibilidad (temas 12-14).
export const bloque4: Record<number, TopicContent> = {
  12: {
    theory: [
      {
        title: "Qué es la alta disponibilidad",
        paragraphs: [
          "La alta disponibilidad (HA) busca que un servicio siga funcionando aunque falle alguno de sus componentes. Se mide en porcentaje de tiempo activo: el famoso «cinco nueves» (99,999 %) equivale a apenas unos minutos de caída al año.",
          "El enemigo es el punto único de fallo (SPOF): un componente que, si cae, tumba todo el servicio. La HA lo combate con redundancia: duplicar los elementos críticos.",
        ],
        bullets: [
          "Disponibilidad = tiempo en servicio / tiempo total.",
          "SPOF: punto único de fallo que hay que eliminar.",
          "Redundancia: duplicar fuentes de alimentación, discos, servidores, red.",
          "Tolerancia a fallos: el sistema sigue pese a un fallo.",
        ],
      },
      {
        title: "Redundancia de hardware y RAID",
        paragraphs: [
          "A nivel físico, la HA empieza por duplicar lo que puede fallar: fuentes de alimentación redundantes, SAI (para cortes eléctricos) y RAID para los discos.",
          "RAID combina varios discos para tolerar el fallo de uno o más. RAID 1 (espejo) duplica los datos; RAID 5 y 6 reparten datos y paridad. RAID mejora la disponibilidad, pero no sustituye a las copias de seguridad.",
        ],
      },
      {
        title: "Clústeres",
        paragraphs: [
          "Un clúster agrupa varios servidores (nodos) que trabajan como uno. En un clúster activo-pasivo, un nodo atiende y otro espera para tomar el relevo si el primero falla. En activo-activo, todos atienden y reparten la carga.",
        ],
      },
      {
        title: "Clustering con quorum, fencing y mantenimiento predictivo",
        only: "SUPERIOR",
        paragraphs: [
          "Software como Pacemaker y Corosync gestiona clústeres en Linux: vigila los nodos y mueve los servicios al nodo sano cuando detecta un fallo. El quorum evita el «cerebro dividido» (dos nodos que se creen activos a la vez), y el fencing aísla al nodo problemático para que no corrompa los datos.",
          "El mantenimiento predictivo aplica modelos de IA sobre las métricas del hardware (temperatura, errores de disco SMART, vibración) para anticipar un fallo antes de que ocurra y sustituir el componente de forma planificada.",
        ],
      },
    ],
    labs: [
      {
        title: "Simular redundancia con RAID por software",
        goal: "Crear y probar un RAID 1 por software para comprobar la tolerancia al fallo de un disco.",
        environment: ["VM Ubuntu del laboratorio", "Dos discos virtuales adicionales de 1 GB", "mdadm"],
        steps: [
          { title: "Añadir dos discos a la VM", detail: "Con la VM apagada, añade en VirtualBox dos discos virtuales de 1 GB. Arranca y localízalos.", code: "lsblk" },
          { title: "Instalar mdadm", detail: "Instala la herramienta de RAID por software.", code: "sudo apt update && sudo apt install -y mdadm" },
          { title: "Crear el RAID 1", detail: "Crea un espejo con los dos discos nuevos (ajusta los nombres).", code: "sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc" },
          { title: "Formatear y montar", detail: "Crea un sistema de archivos y móntalo.", code: "sudo mkfs.ext4 /dev/md0\nsudo mkdir /mnt/raid && sudo mount /dev/md0 /mnt/raid" },
          { title: "Simular el fallo de un disco", detail: "Marca un disco como fallido y comprueba que los datos siguen accesibles.", code: "sudo mdadm /dev/md0 --fail /dev/sdb\ncat /proc/mdstat" },
          { title: "Documentar", detail: "Anota el estado del RAID antes y después del fallo simulado y crea la instantánea «12-raid»." },
        ],
        check: "El RAID 1 sigue dando acceso a los datos tras marcar un disco como fallido, y sabes interpretar /proc/mdstat.",
      },
      {
        title: "Explorar un clúster activo-pasivo",
        only: "SUPERIOR",
        goal: "Montar un clúster de dos nodos con Pacemaker/Corosync y observar la conmutación de un recurso.",
        environment: ["Dos VM Ubuntu del laboratorio en la red ASIR-LAB", "Pacemaker, Corosync, pcs"],
        steps: [
          { title: "Preparar los dos nodos", detail: "Clona la VM Ubuntu para tener nodo1 y nodo2, con nombres e IPs fijas, y comprueba que se hacen ping." },
          { title: "Instalar el software de clúster", detail: "En ambos nodos instala los paquetes.", code: "sudo apt install -y pacemaker corosync pcs" },
          { title: "Autenticar y crear el clúster", detail: "Configura el clúster de dos nodos con pcs (usuario hacluster) siguiendo la guía del profesor." },
          { title: "Definir una IP virtual", detail: "Crea un recurso de IP virtual que el clúster mantenga en el nodo activo." },
          { title: "Provocar la conmutación", detail: "Pon el nodo activo en modo standby y comprueba que la IP virtual se mueve al otro nodo.", code: "sudo pcs node standby nodo1\nsudo pcs status" },
          { title: "Reflexión", detail: "Explica el papel del quorum y el fencing y cómo el mantenimiento predictivo evitaría llegar al fallo." },
        ],
        check: "La IP virtual conmuta al nodo sano cuando el activo entra en standby, y sabes explicar quorum y fencing.",
      },
    ],
    activities: [
      { title: "Detecta los SPOF", description: "Sobre el diagrama de una pequeña infraestructura, señala todos los puntos únicos de fallo y propón cómo eliminarlos." },
      { title: "Elige el RAID", description: "Para tres escenarios (velocidad, máxima seguridad de datos, equilibrio), indica qué nivel de RAID usarías y por qué." },
      { title: "Calcula la disponibilidad", description: "Si un servicio estuvo caído 4 horas en un año, calcula su porcentaje de disponibilidad y di a cuántos «nueves» corresponde." },
      { title: "Activo-activo vs. activo-pasivo", only: "SUPERIOR", description: "Compara ambos modelos de clúster indicando ventajas, inconvenientes y un caso de uso para cada uno." },
    ],
    projects: [
      {
        title: "Propuesta de redundancia para una pyme",
        only: "MEDIO",
        description: "Una empresa quiere que su servidor de ficheros no se caiga. Propón medidas de redundancia (RAID, SAI, fuentes) explicadas de forma sencilla.",
        deliverables: ["Documento con las medidas propuestas", "Diagrama del antes y el después"],
        evaluation: ["Medidas adecuadas (50%)", "Justificación (30%)", "Presentación (20%)"],
      },
      {
        title: "Diseño de un servicio en alta disponibilidad",
        only: "SUPERIOR",
        description: "Diseña una arquitectura HA para un servicio web crítico: clúster, IP virtual, redundancia de red y almacenamiento, con previsión de mantenimiento predictivo.",
        deliverables: ["Diagrama de la arquitectura HA", "Descripción de la conmutación ante fallos", "Plan de mantenimiento predictivo"],
        evaluation: ["Eliminación de SPOF (35%)", "Mecanismo de conmutación (35%)", "Mantenimiento predictivo (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué es un SPOF?", options: ["Un tipo de copia de seguridad", "Un punto único de fallo que puede tumbar el servicio", "Un protocolo de red", "Un antivirus"], answer: 1, explanation: "Single Point Of Failure: un componente cuyo fallo detiene todo el servicio." },
      { question: "¿Qué busca la alta disponibilidad?", options: ["Más velocidad de disco", "Que el servicio siga funcionando aunque falle un componente", "Cifrar los datos", "Reducir el consumo eléctrico"], answer: 1, explanation: "La HA persigue la continuidad del servicio mediante redundancia." },
      { question: "¿Qué aporta un RAID 1?", options: ["Duplica los datos en espejo para tolerar el fallo de un disco", "Acelera la CPU", "Cifra el disco", "Sustituye a las copias de seguridad"], answer: 0, explanation: "RAID 1 mantiene una copia espejo; si un disco falla, el otro conserva los datos." },
      { question: "En un clúster activo-pasivo…", options: ["Todos los nodos atienden a la vez", "Un nodo atiende y otro espera para relevarlo", "No hay redundancia", "Solo se usa para copias"], answer: 1, explanation: "El nodo pasivo toma el relevo si el activo falla." },
      { question: "El RAID, respecto a las copias de seguridad…", options: ["Las sustituye por completo", "No las sustituye: protege ante fallo de disco, no ante borrados o ransomware", "Es lo mismo", "Solo sirve para velocidad"], answer: 1, explanation: "RAID da disponibilidad ante fallo físico, pero no protege de errores lógicos ni ataques." },
      { question: "¿Para qué sirve el quorum en un clúster?", only: "SUPERIOR", options: ["Acelerar la red", "Evitar el «cerebro dividido» decidiendo qué partición sigue activa", "Cifrar los nodos", "Hacer copias"], answer: 1, explanation: "El quorum impide que dos nodos se crean activos a la vez y corrompan los datos." },
      { question: "El mantenimiento predictivo con IA…", only: "SUPERIOR", options: ["Sustituye a los clústeres", "Anticipa fallos de hardware analizando métricas como SMART o temperatura", "Elimina la necesidad de RAID", "Cifra los discos"], answer: 1, explanation: "Predice averías antes de que ocurran para sustituir el componente de forma planificada." },
    ],
  },

  13: {
    theory: [
      {
        title: "Balanceo de carga",
        paragraphs: [
          "Un balanceador de carga reparte las peticiones entre varios servidores, de modo que ninguno se sature y, si uno cae, los demás siguen atendiendo. Es una pieza clave tanto para el rendimiento como para la disponibilidad.",
          "Los balanceadores comprueban la salud de los servidores (health checks) y dejan de enviar tráfico a los que no responden.",
        ],
        bullets: [
          "Reparte peticiones: round-robin, menos conexiones, por peso…",
          "Health checks: detecta servidores caídos y los saca de rotación.",
          "Mejora rendimiento y disponibilidad a la vez.",
        ],
      },
      {
        title: "Virtualización y contenedores",
        paragraphs: [
          "La virtualización permite ejecutar varias máquinas virtuales sobre un mismo hardware, aprovechándolo mejor y facilitando copias y migraciones. Los contenedores (Docker) van más allá: empaquetan una aplicación y sus dependencias de forma ligera y portable.",
          "Contenedores y balanceo se combinan para desplegar servicios que escalan según la demanda.",
        ],
      },
      {
        title: "Proxy inverso",
        paragraphs: [
          "Un proxy inverso (como NGINX) se sitúa delante de los servidores y recibe las peticiones de los clientes, pudiendo repartir carga, terminar el cifrado TLS y cachear contenido.",
        ],
      },
      {
        title: "Orquestación, autoescalado y predicción de demanda",
        only: "SUPERIOR",
        paragraphs: [
          "Kubernetes orquesta contenedores a gran escala: los despliega, los reinicia si fallan y los escala. El autoescalado añade o quita instancias según la carga (CPU, peticiones).",
          "El escalado predictivo usa modelos de IA que anticipan los picos de demanda (por hora, por campaña) y provisionan recursos antes de que lleguen, evitando tanto la saturación como el gasto innecesario.",
        ],
      },
    ],
    labs: [
      {
        title: "Balanceo de carga con NGINX y contenedores",
        goal: "Repartir peticiones entre dos servidores web en contenedores usando NGINX como balanceador.",
        environment: ["VM Ubuntu del laboratorio", "Docker instalado", "Instantánea previa"],
        steps: [
          { title: "Instalar Docker", detail: "Instala Docker en la VM.", code: "sudo apt update && sudo apt install -y docker.io\nsudo systemctl enable --now docker" },
          { title: "Levantar dos webs", detail: "Arranca dos contenedores web que devuelvan páginas distintas para distinguirlos.", code: "sudo docker run -d --name web1 -p 8081:80 nginx\nsudo docker run -d --name web2 -p 8082:80 nginx" },
          { title: "Personalizar cada web", detail: "Cambia el index de cada contenedor para que uno diga «Servidor 1» y otro «Servidor 2»." },
          { title: "Configurar NGINX como balanceador", detail: "Crea una configuración upstream con los dos servidores y recarga NGINX (usa la plantilla del profesor)." },
          { title: "Probar el reparto", detail: "Haz varias peticiones y observa cómo alternan las respuestas.", code: "for i in $(seq 1 6); do curl -s http://localhost | grep -o \"Servidor [12]\"; done" },
          { title: "Simular una caída", detail: "Detén un contenedor y comprueba que el balanceador sigue respondiendo con el otro.", code: "sudo docker stop web1" },
        ],
        check: "Las peticiones se reparten entre los dos servidores y el servicio sigue disponible al detener uno.",
      },
      {
        title: "Autoescalado y predicción de demanda (estudio)",
        only: "SUPERIOR",
        goal: "Analizar cómo un orquestador escala un servicio y cómo la IA anticiparía la demanda.",
        environment: ["Datos de ejemplo de peticiones por hora (CSV)", "Hoja de cálculo o cuaderno"],
        steps: [
          { title: "Observar el patrón de carga", detail: "Representa las peticiones por hora e identifica los picos (mañana, tarde, campañas)." },
          { title: "Definir reglas de autoescalado", detail: "Propón reglas reactivas: si la CPU supera el 70 % durante 5 minutos, añade una instancia; si baja del 30 %, quita una." },
          { title: "Diseñar un escalado predictivo", detail: "Explica cómo un modelo entrenado con el histórico provisionaría recursos antes del pico previsto." },
          { title: "Comparar", detail: "Enumera ventajas del escalado predictivo frente al reactivo y sus riesgos (predicción errónea, sobreaprovisionamiento)." },
          { title: "Conclusión", detail: "Redacta una recomendación sobre cuándo merece la pena el escalado predictivo." },
        ],
        check: "Distingues escalado reactivo y predictivo, con reglas concretas y una recomendación justificada.",
      },
    ],
    activities: [
      { title: "Para qué un balanceador", description: "Explica con un ejemplo cómo un balanceador mejora a la vez el rendimiento y la disponibilidad de una web." },
      { title: "VM vs. contenedor", description: "Elabora una tabla comparativa entre máquinas virtuales y contenedores: peso, arranque, aislamiento y casos de uso." },
      { title: "Health check", description: "Explica qué es un health check y qué pasa cuando un servidor no lo supera." },
      { title: "Orquestación", only: "SUPERIOR", description: "Resume qué problemas resuelve Kubernetes que no cubre lanzar contenedores a mano." },
    ],
    projects: [
      {
        title: "Web repartida en dos servidores",
        only: "MEDIO",
        description: "Documenta cómo montar una web servida por dos servidores con un balanceador delante, explicando qué ocurre si uno falla.",
        deliverables: ["Esquema del montaje", "Documento con la prueba de caída de un servidor"],
        evaluation: ["Montaje correcto (50%)", "Prueba de disponibilidad (30%)", "Documentación (20%)"],
      },
      {
        title: "Servicio escalable con contenedores",
        only: "SUPERIOR",
        description: "Diseña el despliegue de un servicio con contenedores, balanceo y autoescalado, incluyendo una propuesta de escalado predictivo con IA.",
        deliverables: ["Arquitectura del despliegue", "Reglas de autoescalado", "Propuesta de escalado predictivo"],
        evaluation: ["Arquitectura (35%)", "Autoescalado (35%)", "Escalado predictivo (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué hace un balanceador de carga?", options: ["Cifra el tráfico", "Reparte las peticiones entre varios servidores", "Hace copias de seguridad", "Actualiza el sistema"], answer: 1, explanation: "Distribuye la carga y saca de rotación a los servidores caídos." },
      { question: "¿Qué es un health check?", options: ["Un antivirus", "Una comprobación de que un servidor responde correctamente", "Un tipo de RAID", "Una copia de seguridad"], answer: 1, explanation: "Permite al balanceador dejar de enviar tráfico a servidores que no responden." },
      { question: "¿Qué ventaja tienen los contenedores frente a las máquinas virtuales?", options: ["Son más pesados", "Son ligeros, arrancan rápido y son portables", "No aíslan nada", "Necesitan más hardware"], answer: 1, explanation: "Empaquetan la app y sus dependencias de forma ligera y rápida de desplegar." },
      { question: "Un proxy inverso puede…", options: ["Solo cifrar discos", "Repartir carga, terminar TLS y cachear contenido", "Sustituir al RAID", "Hacer copias"], answer: 1, explanation: "Se sitúa delante de los servidores y ofrece balanceo, TLS y caché." },
      { question: "El balanceo mejora la disponibilidad porque…", options: ["Usa menos servidores", "Si un servidor cae, los demás siguen atendiendo", "Cifra el tráfico", "Reduce la RAM"], answer: 1, explanation: "Al repartir entre varios servidores, la caída de uno no detiene el servicio." },
      { question: "¿Qué hace un orquestador como Kubernetes?", only: "SUPERIOR", options: ["Cifrar el disco", "Desplegar, reiniciar y escalar contenedores automáticamente", "Sustituir al cortafuegos", "Hacer copias en cinta"], answer: 1, explanation: "Gestiona el ciclo de vida de los contenedores a escala." },
      { question: "El escalado predictivo con IA…", only: "SUPERIOR", options: ["Reacciona solo cuando ya hay saturación", "Anticipa la demanda y provisiona recursos antes del pico", "Elimina los contenedores", "Cifra las peticiones"], answer: 1, explanation: "Usa el histórico para adelantarse a los picos, en lugar de reaccionar tarde." },
    ],
  },

  14: {
    theory: [
      {
        title: "Copias de seguridad: la red de seguridad",
        paragraphs: [
          "Las copias de seguridad permiten recuperar la información tras un borrado, un fallo o un ataque de ransomware. Sin copias, un incidente puede ser irreversible. La regla 3-2-1 resume la buena práctica: al menos 3 copias, en 2 soportes distintos, con 1 fuera de las instalaciones.",
          "Hacer copias no basta: hay que probarlas restaurando, o podrían no servir cuando más se necesitan.",
        ],
        bullets: [
          "3-2-1: tres copias, dos soportes, una externa.",
          "Tipos: completa, incremental y diferencial.",
          "Probar la restauración periódicamente.",
          "Una copia externa o desconectada protege frente a ransomware.",
        ],
      },
      {
        title: "Tipos de copia",
        paragraphs: [
          "La copia completa duplica todo cada vez (más espacio, restauración simple). La incremental guarda solo lo cambiado desde la última copia (rápida y ligera, pero la restauración necesita la cadena completa). La diferencial guarda lo cambiado desde la última completa (equilibrio entre ambas).",
        ],
      },
      {
        title: "Continuidad de negocio",
        paragraphs: [
          "Un Plan de Continuidad de Negocio (BCP) y un Plan de Recuperación ante Desastres (DRP) definen cómo seguir operando y cómo recuperar los sistemas tras un incidente grave. Dos métricas clave los guían: el RPO (cuántos datos se puede permitir perder) y el RTO (cuánto puede tardar en recuperarse el servicio).",
        ],
      },
      {
        title: "Copias inmutables y detección de ransomware con IA",
        only: "SUPERIOR",
        paragraphs: [
          "Las copias inmutables no pueden modificarse ni borrarse durante un periodo, lo que las protege incluso si el ransomware alcanza el sistema de copias. Es una defensa cada vez más habitual.",
          "Los sistemas de copia y almacenamiento pueden incorporar IA que detecta patrones de cifrado anómalo (muchos archivos cambiando de golpe), lanzando una alerta temprana de un posible ataque de ransomware en curso.",
        ],
      },
    ],
    labs: [
      {
        title: "Estrategia de copias y prueba de restauración",
        goal: "Realizar copias completa e incremental de una carpeta y restaurarlas para verificar que funcionan.",
        environment: ["VM Ubuntu del laboratorio", "rsync y tar (incluidos)"],
        steps: [
          { title: "Preparar datos", detail: "Crea una carpeta con varios archivos que simulen datos importantes.", code: "mkdir -p ~/datos && echo v1 > ~/datos/a.txt && echo v1 > ~/datos/b.txt" },
          { title: "Copia completa", detail: "Haz una copia completa comprimida con fecha.", code: "tar czf ~/backup-full-$(date +%F).tar.gz -C ~ datos" },
          { title: "Modificar datos", detail: "Cambia un archivo y añade otro para simular actividad.", code: "echo v2 > ~/datos/a.txt && echo nuevo > ~/datos/c.txt" },
          { title: "Copia incremental con rsync", detail: "Sincroniza solo los cambios a una carpeta de copia.", code: "rsync -av ~/datos/ ~/backup-inc/" },
          { title: "Probar la restauración", detail: "Borra la carpeta original y restáurala desde la copia completa; comprueba el contenido.", code: "rm -rf ~/datos\ntar xzf ~/backup-full-*.tar.gz -C ~\nls ~/datos" },
          { title: "Documentar", detail: "Anota qué copia usarías según el caso y por qué probar la restauración es imprescindible." },
        ],
        check: "Has creado copias, restaurado los datos y sabes explicar la diferencia entre completa e incremental.",
      },
      {
        title: "RPO/RTO y copias inmutables (diseño)",
        only: "SUPERIOR",
        goal: "Definir la estrategia de copias de un servicio a partir de sus objetivos RPO y RTO.",
        environment: ["Caso de una tienda online (documento del profesor)", "Hoja de cálculo"],
        steps: [
          { title: "Fijar RPO y RTO", detail: "Para la tienda, decide cuántos datos se puede permitir perder (RPO) y cuánto tiempo de caída (RTO), justificándolo." },
          { title: "Elegir frecuencia y tipo", detail: "Define la frecuencia y el tipo de copia (completa/incremental/diferencial) que cumplen ese RPO." },
          { title: "Aplicar 3-2-1", detail: "Especifica dónde estarían las tres copias y qué soporte externo usarías." },
          { title: "Añadir inmutabilidad", detail: "Explica cómo unas copias inmutables protegerían frente a un ransomware que alcanzara el servidor de copias." },
          { title: "Detección con IA", detail: "Describe cómo la detección de cifrado anómalo daría una alerta temprana del ataque." },
        ],
        check: "La estrategia cumple el RPO/RTO fijados, aplica 3-2-1 e incorpora inmutabilidad y detección de anomalías.",
      },
    ],
    activities: [
      { title: "Aplica la regla 3-2-1", description: "Diseña la estrategia de copias de tus propios trabajos del ciclo cumpliendo la regla 3-2-1." },
      { title: "Elige el tipo de copia", description: "Para tres escenarios (poco espacio, restauración rápida, datos que cambian mucho) indica qué tipo de copia usarías y por qué." },
      { title: "Prueba de restauración", description: "Explica por qué una copia que nunca se ha restaurado no puede considerarse fiable, con un ejemplo." },
      { title: "RPO y RTO", only: "SUPERIOR", description: "Para dos servicios distintos (correo interno y pasarela de pago), propón un RPO y un RTO razonables y justifícalos." },
    ],
    projects: [
      {
        title: "Plan de copias de seguridad de una oficina",
        only: "MEDIO",
        description: "Diseña el plan de copias de una pequeña oficina: qué se copia, cada cuánto, dónde y cómo se prueba la restauración.",
        deliverables: ["Documento del plan de copias", "Calendario de copias y pruebas"],
        evaluation: ["Cumple la regla 3-2-1 (40%)", "Plan de pruebas (30%)", "Claridad (30%)"],
      },
      {
        title: "Plan de continuidad y recuperación ante desastres",
        only: "SUPERIOR",
        description: "Elabora un BCP/DRP para una empresa con tienda online: RPO/RTO, estrategia de copias inmutables, procedimiento de recuperación y detección de ransomware.",
        deliverables: ["Documento BCP/DRP", "Tabla de RPO/RTO por servicio", "Procedimiento de recuperación paso a paso"],
        evaluation: ["Coherencia RPO/RTO y copias (35%)", "Procedimiento de recuperación (35%)", "Medidas anti-ransomware (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué dice la regla 3-2-1 de copias?", options: ["3 discos, 2 servidores, 1 red", "3 copias, en 2 soportes, con 1 fuera de las instalaciones", "3 días, 2 horas, 1 minuto", "3 usuarios, 2 claves, 1 admin"], answer: 1, explanation: "Tres copias, dos tipos de soporte y una copia externa." },
      { question: "¿Por qué hay que probar las restauraciones?", options: ["Para gastar espacio", "Porque una copia que no se restaura puede no servir cuando se necesita", "Para acelerar la red", "No hace falta probarlas"], answer: 1, explanation: "Solo probando la restauración se confirma que la copia es válida." },
      { question: "La copia incremental guarda…", options: ["Todo cada vez", "Solo lo cambiado desde la última copia", "Solo los archivos borrados", "Nada"], answer: 1, explanation: "Guarda únicamente los cambios desde la copia anterior; es rápida y ligera." },
      { question: "¿Qué protege mejor frente a un ransomware?", options: ["Una copia siempre conectada al servidor", "Una copia externa o desconectada", "No hacer copias", "Guardar todo en el mismo disco"], answer: 1, explanation: "Una copia fuera de línea no puede ser cifrada por el ransomware." },
      { question: "El RTO indica…", options: ["Cuántos datos se pueden perder", "Cuánto tiempo puede tardar en recuperarse el servicio", "El tamaño de la copia", "El número de servidores"], answer: 1, explanation: "El Recovery Time Objective es el tiempo máximo de recuperación aceptable." },
      { question: "¿Qué son las copias inmutables?", only: "SUPERIOR", options: ["Copias que se borran solas", "Copias que no pueden modificarse ni borrarse durante un periodo", "Copias cifradas", "Copias incrementales"], answer: 1, explanation: "Al no poder alterarse, resisten incluso a un ransomware que alcance el sistema de copias." },
      { question: "El RPO define…", only: "SUPERIOR", options: ["El tiempo de recuperación", "Cuántos datos (tiempo) se puede permitir perder la organización", "El número de copias", "La velocidad de red"], answer: 1, explanation: "El Recovery Point Objective marca la pérdida de datos máxima asumible y guía la frecuencia de copia." },
    ],
  },
};
