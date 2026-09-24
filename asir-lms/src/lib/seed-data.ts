import { type PrismaClient, Level, Role } from "@prisma/client";
import bcrypt from "bcryptjs";


type TopicSeed = {
  number: number;
  title: string;
  description: string;
  level: Level;
  block: number;
  blockTitle: string;
  aiFocus: string;
  contentMedio?: string[];
  contentSuperior?: string[];
};

const BLOCKS: Record<number, string> = {
  1: "Fundamentos y marco legal",
  2: "Hacking ético y auditoría",
  3: "Defensa y hardening",
  4: "Alta disponibilidad",
  5: "Visibilidad y forense",
  6: "Informe y proyecto final",
};

// Temario oficial del módulo Seguridad y Alta Disponibilidad (ASIR) con enfoque IA
const topics: Omit<TopicSeed, "blockTitle">[] = [
  // Bloque 1 · Temas 0-1
  {
    number: 0,
    title: "Fundamentos de la seguridad informática",
    description: "Triada CIA, activos, amenazas, vulnerabilidades y gestión del riesgo.",
    level: Level.BOTH,
    block: 1,
    aiFocus: "Cómo la IA transforma el panorama de amenazas y de defensa.",
    contentMedio: ["Triada CIA con ejemplos cotidianos", "Amenaza, vulnerabilidad y riesgo", "Buenas prácticas: contraseñas, MFA y actualizaciones"],
    contentSuperior: ["Modelos de seguridad y Zero Trust", "Análisis de riesgos (MAGERIT)", "Marcos MITRE ATT&CK y MITRE ATLAS"],
  },
  {
    number: 1,
    title: "Marco legal y normativo",
    description: "RGPD, LOPDGDD, ENS, NIS2 y delitos informáticos.",
    level: Level.BOTH,
    block: 1,
    aiFocus: "Legislación sobre IA y privacidad: Reglamento Europeo de IA (AI Act) y datos personales en modelos.",
    contentMedio: ["Qué es un dato personal (RGPD)", "Usar asistentes de IA sin exponer datos confidenciales"],
    contentSuperior: ["RGPD, ENS y NIS2 aplicados a una organización", "AI Act: niveles de riesgo y obligaciones", "Autorización y alcance legal de una auditoría"],
  },

  // Bloque 2 · Temas 2-7 (profundidad máxima solo en Grado Superior)
  {
    number: 2,
    title: "Introducción al hacking ético y metodologías",
    description: "Fases de una auditoría y metodologías PTES, OSSTMM y OWASP.",
    level: Level.BOTH,
    block: 2,
    aiFocus: "Asistentes de IA para planificar y documentar auditorías autorizadas.",
    contentMedio: ["Qué es el hacking ético y por qué requiere autorización", "Fases de una auditoría en términos generales", "Laboratorios virtuales aislados"],
    contentSuperior: ["PTES, OSSTMM y OWASP Testing Guide", "Alcance y reglas de enfrentamiento", "Documentación de hallazgos con apoyo de IA"],
  },
  {
    number: 3,
    title: "Recolección de información",
    description: "Fuentes abiertas (OSINT) y análisis de la exposición de una organización.",
    level: Level.SUPERIOR,
    block: 2,
    aiFocus: "Uso de IA para recolección de información: correlación y resumen de fuentes abiertas.",
    contentSuperior: ["Principios de OSINT y su marco ético-legal", "Reducción de la huella digital de la organización"],
  },
  {
    number: 4,
    title: "Análisis de vulnerabilidades",
    description: "Escaneo, CVE/CVSS y priorización de la remediación.",
    level: Level.SUPERIOR,
    block: 2,
    aiFocus: "Detección de vulnerabilidades con IA: priorización por riesgo y triaje de falsos positivos.",
    contentSuperior: ["CVE, CVSS y EPSS", "Informes de escáneres y plan de remediación", "Revisión de código asistida por IA"],
  },
  {
    number: 5,
    title: "Pentesting asistido por IA",
    description: "Pruebas de intrusión en entornos de laboratorio autorizados.",
    level: Level.SUPERIOR,
    block: 2,
    aiFocus: "Pentesting con IA: posibilidades, límites, alucinaciones y responsabilidad ética del uso de LLMs.",
    contentSuperior: ["Ciclo de una prueba de intrusión en laboratorio", "Uso responsable de LLMs en auditorías", "Mitigaciones y verificación de parches"],
  },
  {
    number: 6,
    title: "Seguridad de aplicaciones web",
    description: "OWASP Top 10 y buenas prácticas de desarrollo seguro.",
    level: Level.SUPERIOR,
    block: 2,
    aiFocus: "OWASP Top 10 para aplicaciones con LLM (prompt injection, fuga de datos).",
    contentSuperior: ["OWASP Top 10 y ASVS", "OWASP Top 10 for LLM Applications", "Defensas: validación, cabeceras y WAF"],
  },
  {
    number: 7,
    title: "Ingeniería social y redes inalámbricas",
    description: "Factor humano, concienciación y seguridad Wi-Fi (WPA3).",
    level: Level.SUPERIOR,
    block: 2,
    aiFocus: "Deepfakes y fraude generado con IA: cómo detectarlos y concienciar a los usuarios.",
    contentSuperior: ["Programas de concienciación", "Configuración segura de redes Wi-Fi", "Detección de contenido sintético"],
  },

  // Bloque 3 · Temas 8-11
  {
    number: 8,
    title: "Hardening de sistemas Windows",
    description: "Directivas de grupo, CIS Benchmarks, Defender y cifrado de disco.",
    level: Level.BOTH,
    block: 3,
    aiFocus: "Hardening automatizado: generación y revisión de configuraciones con IA.",
    contentMedio: ["Cuentas, UAC y actualizaciones", "Configurar un firewall básico con ayuda de un asistente de IA"],
    contentSuperior: ["CIS Benchmarks y baselines de seguridad", "GPO, LAPS y BitLocker", "Scripts de bastionado revisados con IA"],
  },
  {
    number: 9,
    title: "Hardening de sistemas Linux",
    description: "Permisos, SSH seguro, SELinux/AppArmor y auditoría del sistema.",
    level: Level.BOTH,
    block: 3,
    aiFocus: "Detección de anomalías con Machine Learning en accesos y procesos.",
    contentMedio: ["Usuarios, grupos y permisos", "SSH con claves y fail2ban"],
    contentSuperior: ["SELinux/AppArmor y auditd", "Automatización del bastionado (Ansible)", "Detección de anomalías con ML"],
  },
  {
    number: 10,
    title: "Seguridad perimetral",
    description: "Cortafuegos, DMZ, IDS/IPS, proxies y VPN.",
    level: Level.BOTH,
    block: 3,
    aiFocus: "IDS/IPS con Machine Learning y generación asistida de reglas de firewall.",
    contentMedio: ["Qué es un cortafuegos y cómo se configura una regla", "VPN para teletrabajo"],
    contentSuperior: ["Diseño de DMZ y segmentación", "IDS/IPS (Suricata) con detección por ML", "VPN site-to-site"],
  },
  {
    number: 11,
    title: "Criptografía aplicada",
    description: "Cifrado simétrico y asimétrico, hash, firma digital, PKI y TLS.",
    level: Level.BOTH,
    block: 3,
    aiFocus: "IA y criptografía: detección de configuraciones débiles y criptografía post-cuántica.",
    contentMedio: ["Cifrado simétrico vs. asimétrico", "Certificados y HTTPS"],
    contentSuperior: ["PKI y ciclo de vida de certificados", "Configuración segura de TLS", "Criptografía post-cuántica"],
  },

  // Bloque 4 · Temas 12-14
  {
    number: 12,
    title: "Alta disponibilidad y clustering",
    description: "Redundancia, SPOF, clústeres activo-pasivo y activo-activo.",
    level: Level.BOTH,
    block: 4,
    aiFocus: "Predicción de fallos de hardware con modelos de IA (mantenimiento predictivo).",
    contentMedio: ["Qué es la alta disponibilidad y el SPOF", "RAID y fuentes redundantes"],
    contentSuperior: ["Clústeres con Pacemaker/Corosync", "Quorum y fencing", "Mantenimiento predictivo con IA"],
  },
  {
    number: 13,
    title: "Balanceo de carga y virtualización",
    description: "Balanceadores, proxies inversos, contenedores y orquestación.",
    level: Level.BOTH,
    block: 4,
    aiFocus: "Auto-escalado inteligente basado en predicción de demanda.",
    contentMedio: ["Qué hace un balanceador de carga", "Máquinas virtuales y contenedores"],
    contentSuperior: ["HAProxy/NGINX y health checks", "Kubernetes y autoescalado", "Escalado predictivo con IA"],
  },
  {
    number: 14,
    title: "Continuidad de negocio y copias de seguridad",
    description: "Estrategia 3-2-1, RPO/RTO, planes de recuperación ante desastres.",
    level: Level.BOTH,
    block: 4,
    aiFocus: "Verificación automática de copias y detección de ransomware con IA.",
    contentMedio: ["Regla 3-2-1 de copias de seguridad", "Tipos de copia: completa, incremental, diferencial", "Restaurar una copia"],
    contentSuperior: ["Plan de continuidad (BCP) y DRP", "RPO/RTO y copias inmutables", "Detección de cifrado anómalo con IA"],
  },

  // Bloque 5 · Temas 15-16
  {
    number: 15,
    title: "Monitorización y SIEM",
    description: "Gestión centralizada de logs, correlación de eventos y SOC.",
    level: Level.BOTH,
    block: 5,
    aiFocus: "Análisis de logs masivos con algoritmos de IA y UEBA.",
    contentMedio: ["Qué son los logs y dónde encontrarlos", "Alertas básicas de monitorización"],
    contentSuperior: ["SIEM (Wazuh/Elastic) y reglas de correlación", "UEBA y detección con ML", "Asistentes IA para el analista SOC"],
  },
  {
    number: 16,
    title: "Análisis forense digital",
    description: "Adquisición de evidencias, cadena de custodia y análisis de memoria y disco.",
    level: Level.SUPERIOR,
    block: 5,
    aiFocus: "IA para acelerar la clasificación de evidencias y la reconstrucción de líneas temporales.",
    contentSuperior: ["Cadena de custodia y validez legal", "Análisis de memoria (Volatility) y disco (Autopsy)", "Líneas temporales asistidas por IA"],
  },

  // Bloque 6 · Temas 17-18
  {
    number: 17,
    title: "Informe técnico y ejecutivo",
    description: "Redacción de informes de auditoría para perfiles técnicos y de dirección.",
    level: Level.BOTH,
    block: 6,
    aiFocus: "Redacción asistida con IA y revisión crítica de su contenido.",
    contentMedio: ["Estructura de un informe", "Explicar un problema de seguridad de forma clara"],
    contentSuperior: ["Informe ejecutivo vs. técnico", "Métricas de riesgo y plan de remediación"],
  },
  {
    number: 18,
    title: "Proyecto final",
    description: "Diseño e implantación de una infraestructura segura y de alta disponibilidad.",
    level: Level.BOTH,
    block: 6,
    aiFocus: "Integración de herramientas de IA defensiva en el proyecto.",
    contentMedio: ["Red segura con copias de seguridad y firewall", "Presentación del proyecto"],
    contentSuperior: ["Infraestructura HA con SIEM y hardening", "Defensa del proyecto ante tribunal"],
  },
];

const DEFAULTS: Record<string, string> = {
  SEED_ADMIN_PASSWORD: "admin123",
  SEED_SUPERIOR_PASSWORD: "omrolo.94",
  SEED_MEDIO_PASSWORD: "alumno123",
};

export async function seedDatabase(prisma: PrismaClient) {
  // Temario
  for (const t of topics) {
    const data = {
      title: t.title,
      description: t.description,
      level: t.level,
      block: t.block,
      blockTitle: BLOCKS[t.block],
      aiFocus: t.aiFocus,
      contentMedio: t.contentMedio?.join("\n") ?? null,
      contentSuperior: t.contentSuperior?.join("\n") ?? null,
    };
    await prisma.topic.upsert({ where: { number: t.number }, update: data, create: { number: t.number, ...data } });
  }

  // Cuentas del módulo. Las contraseñas se leen de .env (el repositorio es público).
  const users = [
    { name: "Administración ASIR", email: "admin.ia@jrotero.es", passwordEnv: "SEED_ADMIN_PASSWORD", role: Role.ADMIN },
    { name: "Omar Romero", email: "omar.romero@jrotero.es", passwordEnv: "SEED_SUPERIOR_PASSWORD", role: Role.STUDENT_SUPERIOR },
    { name: "Unai Elorrieta", email: "unai.elorrieta@jrotero.es", passwordEnv: "SEED_MEDIO_PASSWORD", role: Role.STUDENT_MEDIO },
  ];
  for (const { passwordEnv, ...u } of users) {
    const plain = process.env[passwordEnv] || DEFAULTS[passwordEnv];
    const password = await bcrypt.hash(plain, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password },
      create: { ...u, password },
    });
  }

  // Elimina las cuentas de demostración de la primera versión del MVP
  await prisma.user.deleteMany({
    where: { email: { in: ["profesor@jrotero.es", "medio@jrotero.es", "superior@jrotero.es"] } },
  });

  console.log(`Seed completado: ${topics.length} temas, ${users.length} usuarios.`);
}
