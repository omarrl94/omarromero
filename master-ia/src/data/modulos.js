// Definición de los 7 módulos del Máster. El color estructural sigue la guía de
// identidad: salvia para fundamentos, backend IA, RAG y agentes; terracota para
// adaptación de modelos, Edge AI, MLOps, seguridad, EU AI Act y TFM.
const c = String.raw;

const MODULOS = [
  { id: 0, nombre: 'Nivelación y Fundamentos Teórico-Prácticos en IA', corto: 'Fundamentos', color: 'sage', sesiones: [1, 4] },
  { id: 1, nombre: 'Ingeniería de LLMs, Integración Políglota (Python + Java 21) y Salidas Estructuradas', corto: 'Backend IA', color: 'sage', sesiones: [5, 8] },
  { id: 2, nombre: 'Sistemas RAG de Nivel Industrial y Bases de Datos Vectoriales', corto: 'RAG', color: 'sage', sesiones: [9, 12] },
  { id: 3, nombre: 'Agentes Autónomos, Protocolo MCP, Skills y Sistemas Multi-Agente', corto: 'Agentes', color: 'sage', sesiones: [13, 16] },
  { id: 4, nombre: 'Fine-Tuning, Adaptación de Modelos, Edge AI y Multimodalidad', corto: 'Fine-Tuning y Edge AI', color: 'terra', sesiones: [17, 20] },
  { id: 5, nombre: 'LLMOps, Evaluación Científica, Ciberseguridad IA y EU AI Act', corto: 'LLMOps y Seguridad', color: 'terra', sesiones: [21, 23] },
  { id: 6, nombre: 'Trabajo Fin de Máster (TFM) y Tribunal Académico', corto: 'TFM', color: 'terra', sesiones: [24, 28] }
];

const SESIONES = [];
