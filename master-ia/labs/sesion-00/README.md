# Sesión 0 · Introducción a la IA y hoja de ruta del Máster

Laboratorio del **Módulo Introductorio** del Máster en Ingeniería de IA (FP José Ramón Otero).
Objetivo: dejar el entorno listo para todo el Máster y recorrer por primera vez el ciclo
*datos → modelo → inferencia*, primero con machine learning clásico y después con un LLM.

## Contenido

| Fichero | Qué hace | Necesita |
|---|---|---|
| `verificar_entorno.py` | Comprueba Python, uv, Git, JDK 21, Node, Docker, Ollama, GPU y disco, e indica cómo resolver lo que falte | — |
| `datos_sinteticos.py` | Genera alumnado de FP **ficticio** (nunca datos reales) | — |
| `primer_modelo.py` | Entrena un árbol de decisión, muestra las reglas aprendidas y predice un caso nuevo | — |
| `hola_ia_local.py` | Primera llamada a un LLM local con Ollama (API compatible con OpenAI) | Ollama + `qwen2.5:1.5b` |
| `java/HolaIA.java` | Lo mismo desde Java 21 sin dependencias (`HttpClient`, `record`, text blocks) | Ollama + JDK 21 |
| `hola_ia_claude.py` | Opcional: la misma pregunta a un modelo de frontera para comparar | `ANTHROPIC_API_KEY` |
| `tests/test_lab.py` | Tests del laboratorio | — |

## Pasos (PowerShell)

```powershell
cd master-ia/labs/sesion-00
uv sync
uv run python verificar_entorno.py      # resuelve lo que salga en ✘ antes de seguir
uv run python primer_modelo.py
ollama pull qwen2.5:1.5b
uv run python hola_ia_local.py "¿Qué es un embedding?"
java -Dstdout.encoding=UTF-8 java/HolaIA.java "¿Qué es un embedding?"
uv run pytest                           # 5 tests
```

Variables opcionales: `OLLAMA_URL` (por defecto `http://localhost:11434`) y `MODELO_LOCAL`
(por defecto `qwen2.5:1.5b`) para usar otro servidor u otro modelo, por ejemplo `qwen2.5:7b`.

## Qué observar

- **primer_modelo.py:** las reglas del árbol no las ha escrito nadie: las ha deducido de los datos.
  La exactitud no es del 100 % porque los datos tienen ruido, igual que la realidad.
- **hola_ia_local.py vs. hola_ia_claude.py:** compara calidad, latencia y tokens. Un modelo de
  1,5B parámetros en tu portátil frente a un modelo de frontera en la nube: esa decisión
  (coste, privacidad, calidad) aparece en todo el Máster.

## Entrega

Ver la pestaña *Actividad práctica* de la Sesión 0 en la plataforma: repositorio `mia-portafolio`
con la salida de la verificación, los resultados de este laboratorio, la comparativa de modelos,
un mapa conceptual y tres ideas iniciales de TFM.
