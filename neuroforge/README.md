# NeuroForge · Aprende IA jugando

Juego educativo en el estilo de CodeForge / CyberOtero para el **módulo optativo de Inteligencia Artificial** (18 años).
Sin cuentas, sin servidor y **sin dependencias**: HTML + CSS + JavaScript (módulos ES) y `<canvas>`. El progreso se guarda en `localStorage`.

```bash
cd neuroforge
python3 -m http.server 8080     # o: npx serve .   → http://localhost:8080
node test/ml.test.mjs           # pruebas del núcleo de IA (algoritmos reales)
NODE_PATH=$(npm root -g) node test/smoke.cjs   # recorre toda la app en Chromium (Playwright)
NODE_PATH=$(npm root -g) node test/e2e.cjs     # juega de verdad los niveles clave
```

## Parte 1 · Academia (10 lecciones)
Cada lección: pasos con ejemplos, «Concepto clave», widgets interactivos y test (el compañero NEO da pistas).

| # | Lección | Contenido |
|---|---|---|
| 1 | ¿Qué es la IA? | IA ⊃ ML ⊃ DL, IA estrecha vs general, programar vs entrenar, historia |
| 2 | Datos | dataset, features, etiquetas, limpieza, train/val/test, fuga de datos |
| 3 | Cómo aprende una máquina | supervisado, no supervisado, refuerzo, autosupervisado, k-means |
| 4 | Clasificar con k-NN | vecinos, elección de k, matriz de confusión, precisión/recall |
| 5 | Regresión y descenso de gradiente | pérdida, tasa de aprendizaje, momentum, mínimos locales |
| 6 | Neuronas y redes | perceptrón, activaciones, capas, XOR, backpropagation |
| 7 | Sobreajuste | overfitting/underfitting, sesgo-varianza, regularización, dropout |
| 8 | Lenguaje y LLMs | tokens, embeddings, atención, temperatura, RLHF, alucinaciones, RAG, prompts |
| 9 | Ética y sociedad | sesgos y proxies, privacidad, deepfakes, AI Act, uso responsable |
| 10 | IA que juega | búsqueda, minimax y poda α-β, Q-learning, reward hacking |

## Parte 2 · Misiones (cada una se desbloquea con su lección)
| Misión | Juego | Qué se aprende jugando |
|---|---|---|
| 1 🃏 IA o no IA | cartas arcade con combo y contrarreloj | distinguir ML, reglas y «no IA» |
| 2 🧹 Limpia el dataset | caza filas y columnas tóxicas | valores imposibles, duplicados, etiquetas erróneas, fuga de datos |
| 3 🛸 La flota alienígena | k-means paso a paso, método del codo | clustering e inicialización (k-means++) |
| 4 👾 Monstruos k-NN | regiones de decisión en vivo + examen | k, ruido, sobreajuste |
| 5 ⛰️ La bola y el valle | descenso de gradiente animado | tasa de aprendizaje, divergencia, momentum |
| 6 🕸️ Neuronas y redes | sliders, perceptrón y cablear XOR | pesos, entrenamiento, capas ocultas |
| 7 📈 Memorizar vs. aprender | ajuste polinómico train vs. test | complejidad y regularización |
| 8 💬 Laboratorio LLM | temperatura, caza-alucinaciones, prompts | cómo «piensa» un LLM |
| 9 ⚖️ Auditoría de sesgos | regresión logística real sobre un banco | proxies, brecha de aprobación, re-etiquetado |
| 10 🎮 IA que juega | tres en raya minimax, robot Q-learning, reward hacking | búsqueda y refuerzo |
| ☠️ Jefe SKYNET-18 | duelo de 12 preguntas, 3 vidas | repaso de todo el temario + certificado |

Todo lo que se ve en los minijuegos lo calculan algoritmos reales de [`js/ml.js`](js/ml.js) (k-NN, k-means, descenso de gradiente, perceptrón, mínimos cuadrados, regresión logística, minimax con poda α-β y Q-learning).

## Despliegue
Es estático: en Netlify usa *Base directory* `neuroforge` (hay un `netlify.toml`) o sube la carpeta tal cual.
