// MÓDULO 4 · Fine-Tuning, Adaptación de Modelos, IA en Dispositivos Móviles (Edge AI) y Multimodalidad (Sesiones 17 a 20)

SESIONES.push({
  n: 17,
  corto: 'Datasets sintéticos y QLoRA',
  titulo: 'Datasets Sintéticos y Fine-Tuning Eficiente (PEFT, LoRA y QLoRA)',
  duracion: '7 h',
  resumen: c`Creación de datasets de instrucciones en formato Alpaca/chat con control de calidad, y entrenamiento de adaptadores LoRA sobre modelos cuantizados a 4 bits con Unsloth en GPUs de consumo o Colab.`,
  stack: ['Unsloth', 'Hugging Face TRL', 'PEFT', 'bitsandbytes', 'datasets', 'Claude Batches API', 'Google Colab / Kaggle'],
  teoria: {
    intro: c`El fine-tuning <strong>no</strong> es la forma de añadir conocimiento actualizado (para eso está RAG). Sirve para enseñar <strong>formato, estilo, tareas especializadas y comportamiento</strong> consistente, o para que un modelo pequeño y barato iguale a uno grande en una tarea concreta.`,
    bloques: [
      ['1. ¿Prompting, RAG o fine-tuning?', c`<p>Primero prompting (barato, rápido de iterar). Si falta conocimiento → RAG. Si el modelo sabe pero no lo hace como quieres (formato, tono, una tarea muy concreta a gran volumen) → fine-tuning. A menudo, la solución final combina RAG + un modelo ajustado.</p>`],
      ['2. LoRA', c`<p>En lugar de actualizar la matriz de pesos <code>W (d×k)</code>, se aprende una actualización de bajo rango <code>ΔW = B·A</code> con <code>B (d×r)</code> y <code>A (r×k)</code>, <code>r ≪ d</code>. Se entrena &lt; 1 % de parámetros, el adaptador ocupa megabytes y se puede combinar o intercambiar en caliente.</p>`],
      ['3. QLoRA', c`<p>El modelo base se carga cuantizado a 4 bits (NF4) y congelado; solo los adaptadores LoRA se entrenan en bf16. Permite ajustar un modelo de 7-8B en una GPU de 16 GB (T4 de Colab) y uno de 14B en 24 GB. Unsloth añade kernels optimizados que reducen VRAM y tiempo.</p>`],
      ['4. Datos: la variable que más importa', c`<p>500-5 000 ejemplos de alta calidad superan a 50 000 mediocres. Formato <strong>Alpaca</strong> (<code>instruction</code>, <code>input</code>, <code>output</code>) o conversacional (<code>messages</code>). Los datos sintéticos generados con un modelo grande requieren: diversidad (semillas de temas), filtrado automático (validadores, LLM-as-a-Judge), deduplicación y revisión humana de una muestra.</p>`],
      ['5. Licencias y términos de uso', c`<p>Comprueba que la licencia del modelo base permite tu uso y que los <strong>términos del proveedor</strong> del modelo generador permiten usar sus salidas para entrenar (algunos prohíben entrenar modelos que compitan con el suyo). Documenta procedencia de datos (EU AI Act, art. 53 para modelos de propósito general).</p>`]
    ],
    formula: c`W' = W + (α / r) · B·A &nbsp;&nbsp; parámetros entrenables por capa = r·(d + k)<br>Ej.: d = k = 4096, r = 16 → 131 072 frente a 16,7 M (0,8 %)`,
    flujo: ['Semillas de temas', 'Generación sintética (LLM grande)', 'Validación + juez + dedup', 'Dataset chat/Alpaca', 'QLoRA con Unsloth', 'Evaluación vs. base', 'Exportar GGUF → Ollama'],
    tabla: {
      cap: 'Hiperparámetros de partida para QLoRA',
      head: ['Parámetro', 'Valor inicial', 'Efecto'],
      rows: [
        ['r (rango)', '16', 'Capacidad del adaptador'],
        ['lora_alpha', '16-32', 'Escala de la actualización'],
        ['target_modules', 'q,k,v,o,gate,up,down', 'Capas adaptadas (todas las lineales suele ser mejor)'],
        ['learning_rate', '2e-4', 'Demasiado alto → olvido catastrófico'],
        ['épocas', '1-3', 'Más épocas → sobreajuste en datasets pequeños'],
        ['batch efectivo', '16 (2 × 8 acumulación)', 'Estabilidad del gradiente']
      ]
    },
    claves: ['Define la evaluación antes de entrenar: sin línea base no hay mejora demostrable.', 'Entrena solo con la respuesta (no con el prompt) para no aprender a repetir instrucciones.', 'Usa la misma plantilla de chat en entrenamiento e inferencia.']
  },
  taller: {
    entorno: 'Generación de datos: PowerShell + Python local · Entrenamiento: Google Colab (GPU T4/L4) o GPU NVIDIA ≥ 16 GB',
    pasos: [
      { t: 'Generar ejemplos sintéticos diversos con Batches API', d: 'La API de lotes procesa miles de peticiones de forma asíncrona con descuento. Cada petición parte de una semilla distinta para garantizar diversidad.', lang: 'python', file: 'datos/generar.py', code: c`
import json
import random
import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

client = anthropic.Anthropic()
modulos = ["Acceso a Datos", "PMDM", "PSP", "Desarrollo de Interfaces", "Programación", "Bases de Datos"]
tipos = ["explicar un error de compilación", "revisar un fragmento de código", "proponer un ejercicio", "explicar un concepto"]
niveles = ["primer curso", "segundo curso", "titulado DAM"]

SISTEMA = """Genera UN ejemplo de entrenamiento para un tutor de DAM que responde con el estilo del centro:
diagnóstico breve, explicación, código corregido en un bloque y una pregunta final para comprobar comprensión.
Devuelve JSON: {"instruction": "...", "input": "...", "output": "..."}. Usa datos ficticios."""

peticiones = []
for i in range(2000):
    semilla = f"Módulo: {random.choice(modulos)}. Tarea: {random.choice(tipos)}. Nivel: {random.choice(niveles)}."
    peticiones.append(Request(custom_id=f"ej-{i:05d}", params=MessageCreateParamsNonStreaming(
        model="claude-sonnet-5-5", max_tokens=3000, system=SISTEMA,
        messages=[{"role": "user", "content": semilla}])))

lote = client.messages.batches.create(requests=peticiones)
print("Lote enviado:", lote.id)        # consultar con client.messages.batches.retrieve(lote.id)` },
      { t: 'Recoger, validar, juzgar y deduplicar', lang: 'python', file: 'datos/filtrar.py', code: c`
import json
import hashlib
import anthropic

client = anthropic.Anthropic()
LOTE_ID = "msgbatch_..."
vistos, buenos = set(), []

for res in client.messages.batches.results(LOTE_ID):          # llegan en cualquier orden: usa custom_id
    if res.result.type != "succeeded":
        continue
    try:
        ej = json.loads(res.result.message.content[0].text)
        assert all(k in ej and len(ej[k]) > 0 for k in ("instruction", "output"))
    except (json.JSONDecodeError, AssertionError, IndexError):
        continue
    huella = hashlib.md5(ej["instruction"].lower().strip().encode()).hexdigest()
    if huella in vistos:
        continue
    vistos.add(huella)
    buenos.append(ej)

print(f"{len(buenos)} ejemplos válidos y únicos")
# Juez sobre una muestra o sobre todo el conjunto (ver Biblioteca de Prompts) y revisión humana de 100 ejemplos
with open("tutor_dam.jsonl", "w", encoding="utf-8") as f:
    for ej in buenos:
        f.write(json.dumps({"messages": [
            {"role": "system", "content": "Eres el tutor de programación del CFP José Ramón Otero."},
            {"role": "user", "content": ej["instruction"] + ("\n\n" + ej["input"] if ej.get("input") else "")},
            {"role": "assistant", "content": ej["output"]}]}, ensure_ascii=False) + "\n")` },
      { t: 'Cargar el modelo base en 4 bits y añadir LoRA (Colab)', lang: 'python', file: 'entrenar_qlora.ipynb · celda 1', code: c`
# !pip install unsloth
from unsloth import FastLanguageModel

modelo, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-7B-Instruct-bnb-4bit",   # licencia Apache 2.0
    max_seq_length=2048,
    load_in_4bit=True,
)
modelo = FastLanguageModel.get_peft_model(
    modelo,
    r=16, lora_alpha=16, lora_dropout=0, bias="none",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing="unsloth",
    random_state=3407,
)
modelo.print_trainable_parameters()` },
      { t: 'Entrenar con SFTTrainer (solo sobre las respuestas)', lang: 'python', file: 'entrenar_qlora.ipynb · celda 2', code: c`
from datasets import load_dataset
from trl import SFTConfig, SFTTrainer
from unsloth.chat_templates import train_on_responses_only

ds = load_dataset("json", data_files="tutor_dam.jsonl", split="train").train_test_split(test_size=0.05, seed=42)
formatear = lambda lote: {"text": [tokenizer.apply_chat_template(m, tokenize=False) for m in lote["messages"]]}
ds = ds.map(formatear, batched=True)

trainer = SFTTrainer(
    model=modelo,
    processing_class=tokenizer,
    train_dataset=ds["train"],
    eval_dataset=ds["test"],
    args=SFTConfig(
        dataset_text_field="text", max_seq_length=2048,
        per_device_train_batch_size=2, gradient_accumulation_steps=8,
        num_train_epochs=2, learning_rate=2e-4, warmup_ratio=0.03, lr_scheduler_type="cosine",
        optim="adamw_8bit", weight_decay=0.01, logging_steps=10,
        eval_strategy="steps", eval_steps=50, output_dir="salidas", seed=3407, report_to="none",
    ),
)
trainer = train_on_responses_only(trainer,
    instruction_part="<|im_start|>user\n", response_part="<|im_start|>assistant\n")
trainer.train()` },
      { t: 'Probar, guardar el adaptador y exportar a GGUF para Ollama', lang: 'python', file: 'entrenar_qlora.ipynb · celda 3', code: c`
FastLanguageModel.for_inference(modelo)
prompt = tokenizer.apply_chat_template(
    [{"role": "user", "content": "Me sale NullPointerException al leer un fichero con BufferedReader"}],
    tokenize=False, add_generation_prompt=True)
salida = modelo.generate(**tokenizer(prompt, return_tensors="pt").to("cuda"), max_new_tokens=512)
print(tokenizer.decode(salida[0], skip_special_tokens=True))

modelo.save_pretrained("tutor-dam-lora")              # adaptador (~80 MB)
tokenizer.save_pretrained("tutor-dam-lora")
modelo.save_pretrained_gguf("tutor-dam-gguf", tokenizer, quantization_method="q4_k_m")
# En local: ollama create tutor-dam -f Modelfile  (FROM ./tutor-dam-gguf/unsloth.Q4_K_M.gguf)` }
    ]
  },
  prompts: [
    { t: 'Juez de calidad de ejemplos sintéticos', tipo: 'LLM-as-a-Judge', lang: 'markdown', code: c`
Evalúa este ejemplo de entrenamiento para un tutor de programación de DAM.
<ejemplo>{json_ejemplo}</ejemplo>
Criterios (0-2 cada uno):
- correccion: el código y la explicación son técnicamente correctos.
- estilo: sigue el formato diagnóstico → explicación → código → pregunta.
- realismo: la duda es plausible para el nivel indicado.
- seguridad: sin datos personales reales ni código peligroso.
Devuelve JSON {"correccion": n, "estilo": n, "realismo": n, "seguridad": n, "descartar": bool}.
descartar = true si algún criterio es 0.` },
    { t: 'Ficha de dataset (datasheet)', tipo: 'Plantilla', lang: 'markdown', file: 'DATASET_CARD.md', code: c`
# Dataset tutor-dam-v1
- Propósito: ajustar el estilo de tutoría del CFP José Ramón Otero.
- Origen: sintético, generado con {modelo} el {fecha}; términos de uso revisados.
- Tamaño: {n} ejemplos tras filtrado ({descartados} descartados).
- Proceso de calidad: validación de esquema, juez automático, deduplicación, revisión humana de 100 ejemplos.
- Datos personales: ninguno (nombres ficticios).
- Sesgos conocidos: sobrerrepresentación de Java frente a Kotlin.
- Licencia del dataset: CC BY 4.0 (uso educativo).` }
  ],
  actividad: {
    titulo: 'Tutor DAM especializado: dataset sintético + QLoRA + evaluación',
    contexto: c`Ajusta un modelo abierto de 3-8B para que responda dudas de programación con el estilo pedagógico del centro y demuestra que supera al modelo base en tu tarea.`,
    requisitos: [
      'Dataset de ≥ 1 500 ejemplos con pipeline de generación, filtrado y revisión documentado.',
      'Entrenamiento QLoRA con curvas de pérdida de entrenamiento y validación.',
      'Evaluación ciega (juez + 20 revisiones humanas) del modelo base frente al ajustado sobre 100 preguntas no vistas.',
      'Exportación a GGUF y servicio con Ollama.',
      'Análisis de licencias (modelo base, generador de datos) y ficha del dataset.'
    ],
    entregables: ['Notebook de entrenamiento', 'Dataset (o muestra) y <code>DATASET_CARD.md</code>', '<code>MODEL_CARD.md</code> con resultados'],
    rubrica: [['Calidad del dataset y pipeline', 30], ['Entrenamiento correcto', 25], ['Evaluación comparativa rigurosa', 30], ['Documentación y licencias', 15]]
  },
  faq: [
    ['Tras el fine-tuning el modelo ha "olvidado" cosas básicas.', c`Olvido catastrófico: learning rate demasiado alto, demasiadas épocas o dataset muy homogéneo. Baja el LR, reduce épocas, mezcla un 10-20 % de datos generales y evalúa también capacidades generales.`],
    ['CUDA out of memory en Colab.', c`Reduce <code>max_seq_length</code>, <code>per_device_train_batch_size</code> a 1 (subiendo la acumulación), usa un modelo más pequeño y comprueba que <code>load_in_4bit=True</code> y el gradient checkpointing están activos.`],
    ['¿Puedo ajustar Claude o Gemini?', c`Los modelos cerrados de frontera ofrecen opciones limitadas de ajuste, según proveedor y plataforma. En el Máster ajustamos modelos abiertos, que además puedes desplegar con soberanía de datos.`],
    ['¿Cuánto cuesta?', c`Un QLoRA de 7B con 2 000 ejemplos tarda 20-60 minutos en una T4/L4. La generación sintética de 2 000 ejemplos con la Batches API cuesta poco en comparación con el tiempo de revisión humana, que es el verdadero coste.`]
  ]
});

SESIONES.push({
  n: 18,
  corto: 'Alineamiento y destilación',
  titulo: 'Alineamiento de Modelos (DPO / ORPO) y Destilación de Conocimiento',
  duracion: '7 h',
  resumen: c`Optimización por preferencias sin modelo de recompensa (DPO, ORPO) y destilación Teacher→Student: un modelo grande genera y evalúa, uno pequeño aprende la tarea a una fracción del coste.`,
  stack: ['TRL (DPOTrainer, ORPOTrainer)', 'Unsloth', 'PEFT', 'PyTorch (pérdida KD)', 'Claude como Teacher/juez', 'Qwen 0.5B-3B como Student'],
  teoria: {
    intro: c`El SFT enseña a imitar respuestas; el <strong>alineamiento</strong> enseña a <em>preferir</em> unas respuestas sobre otras (más útiles, más seguras, con el formato correcto). La <strong>destilación</strong> transfiere la habilidad de un modelo grande a uno pequeño que puedes ejecutar en tu servidor o en un móvil.`,
    bloques: [
      ['1. De RLHF a DPO', c`<p>RLHF entrena un modelo de recompensa y optimiza con PPO: potente pero inestable y caro. <strong>DPO</strong> (Direct Preference Optimization) obtiene el mismo objetivo con una pérdida de clasificación sobre pares <code>(prompt, elegida, rechazada)</code> y un modelo de referencia congelado. <code>β</code> controla cuánto puede alejarse de la referencia.</p>`],
      ['2. ORPO', c`<p>Odds Ratio Preference Optimization combina SFT y preferencia en una sola fase sin modelo de referencia: menos memoria y un paso de entrenamiento menos. Útil cuando partes de un modelo base sin ajuste por instrucciones.</p>`],
      ['3. Construir pares de preferencia', c`<p>Fuentes: anotación humana (la mejor), un juez LLM que compara dos respuestas del propio modelo (<em>RLAIF</em>), o respuestas "rechazadas" construidas a propósito (incumplen el formato, alucinan, son inseguras). La calidad de la diferencia entre elegida y rechazada es lo que se aprende.</p>`],
      ['4. Destilación', c`<p><strong>Por secuencias</strong> (la más usada con APIs): el Teacher genera respuestas de alta calidad y el Student se entrena con SFT sobre ellas. <strong>Por logits</strong> (KD clásica): el Student imita la distribución completa del Teacher con divergencia KL a temperatura <code>T</code>; requiere acceso a los logits y tokenizador compatible.</p>`],
      ['5. Evaluar el alineamiento', c`<p>Tasa de victorias (win rate) frente al modelo previo con un juez ciego, métricas específicas (cumplimiento de formato, rechazos indebidos, seguridad) y comprobación de que no se degrada la capacidad general.</p>`]
    ],
    formula: c`L_DPO = −log σ( β·[ log π(y_w|x)/π_ref(y_w|x) − log π(y_l|x)/π_ref(y_l|x) ] )<br>L_KD = T² · KL( softmax(z_teacher/T) ‖ softmax(z_student/T) )`,
    flujo: ['Prompts reales', 'Student genera 2 respuestas', 'Teacher/juez elige', 'Pares (elegida, rechazada)', 'DPO / ORPO', 'Win rate vs. versión anterior'],
    tabla: {
      cap: 'Técnicas de adaptación',
      head: ['Técnica', 'Datos', 'Modelo de referencia', 'Uso típico'],
      rows: [
        ['SFT', 'Prompt → respuesta', 'No', 'Enseñar tarea y formato'],
        ['DPO', 'Prompt, elegida, rechazada', 'Sí (congelado)', 'Refinar preferencias tras SFT'],
        ['ORPO', 'Prompt, elegida, rechazada', 'No', 'SFT + preferencias en una fase'],
        ['KTO', 'Respuesta + me gusta/no me gusta', 'Sí', 'Feedback binario de usuarios'],
        ['Destilación por secuencias', 'Salidas del Teacher', 'No', 'Modelo pequeño especializado']
      ]
    },
    claves: ['Primero SFT, después preferencias.', 'β bajo = más cambio respecto a la referencia (más riesgo).', 'Un Student de 1-3B bien destilado puede resolver una tarea estrecha casi como el Teacher, con latencia y coste mínimos.']
  },
  taller: {
    entorno: 'Google Colab (L4/A100) o GPU NVIDIA ≥ 16 GB · Python 3.12',
    pasos: [
      { t: 'Construir pares de preferencia con un juez', lang: 'python', file: 'preferencias/construir.py', code: c`
import json
from typing import Literal
import anthropic
from pydantic import BaseModel
from openai import OpenAI

juez = anthropic.Anthropic()
student = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")   # modelo SFT de la Sesión 17


class Veredicto(BaseModel):
    mejor: Literal["A", "B", "empate"]
    motivo: str


def generar(prompt: str) -> str:
    r = student.chat.completions.create(model="tutor-dam", temperature=1.0,
                                        messages=[{"role": "user", "content": prompt}])
    return r.choices[0].message.content


pares = []
for prompt in [json.loads(l)["prompt"] for l in open("prompts_reales.jsonl", encoding="utf-8")]:
    a, b = generar(prompt), generar(prompt)
    v = juez.messages.parse(
        model="claude-opus-5-5", max_tokens=1000, output_format=Veredicto,
        messages=[{"role": "user", "content": f"Pregunta de un alumno de DAM:\n{prompt}\n\n<A>{a}</A>\n<B>{b}</B>\n"
                   "¿Qué respuesta es más correcta, pedagógica y concisa? Si son equivalentes, empate."}],
    ).parsed_output
    if v.mejor != "empate":
        elegida, rechazada = (a, b) if v.mejor == "A" else (b, a)
        pares.append({"prompt": prompt, "chosen": elegida, "rejected": rechazada})

with open("pares_dpo.jsonl", "w", encoding="utf-8") as f:
    f.writelines(json.dumps(p, ensure_ascii=False) + "\n" for p in pares)` },
      { t: 'Entrenar con DPO (TRL + LoRA)', lang: 'python', file: 'dpo.ipynb', code: c`
from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOConfig, DPOTrainer

base = "tutor-dam-merged"               # modelo SFT fusionado (Sesión 17)
tok = AutoTokenizer.from_pretrained(base)
modelo = AutoModelForCausalLM.from_pretrained(base, torch_dtype="bfloat16", device_map="auto")
ds = load_dataset("json", data_files="pares_dpo.jsonl", split="train")

trainer = DPOTrainer(
    model=modelo,
    ref_model=None,                     # con LoRA, la referencia es el modelo sin adaptador
    args=DPOConfig(output_dir="dpo-salidas", beta=0.1, learning_rate=5e-6, num_train_epochs=1,
                   per_device_train_batch_size=2, gradient_accumulation_steps=8,
                   max_length=2048, max_prompt_length=512, logging_steps=10, report_to="none"),
    train_dataset=ds,
    processing_class=tok,
    peft_config=LoraConfig(r=16, lora_alpha=32, target_modules="all-linear", task_type="CAUSAL_LM"),
)
trainer.train()
trainer.save_model("tutor-dam-dpo")
# Métricas a vigilar en los logs: rewards/accuracies (↑) y rewards/margins (↑)` },
      { t: 'Alternativa en una fase: ORPO', lang: 'python', file: 'orpo.py', code: c`
from trl import ORPOConfig, ORPOTrainer

trainer = ORPOTrainer(
    model=modelo,                                  # puede partir de un modelo base sin SFT
    args=ORPOConfig(output_dir="orpo-salidas", beta=0.1, learning_rate=8e-6, num_train_epochs=2,
                    per_device_train_batch_size=2, gradient_accumulation_steps=8, max_length=2048,
                    report_to="none"),
    train_dataset=ds,
    processing_class=tok,
    peft_config=LoraConfig(r=16, lora_alpha=32, target_modules="all-linear", task_type="CAUSAL_LM"),
)
trainer.train()` },
      { t: 'Destilación por logits (KD) en PyTorch', d: 'Para Teacher y Student abiertos con el mismo tokenizador (p. ej. Qwen 7B → Qwen 0.5B).', lang: 'python', file: 'destilacion_kd.py', code: c`
import torch
import torch.nn.functional as F
from transformers import AutoModelForCausalLM, AutoTokenizer

tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
teacher = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B-Instruct", torch_dtype=torch.bfloat16, device_map="auto").eval()
student = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct", torch_dtype=torch.bfloat16).cuda()
opt = torch.optim.AdamW(student.parameters(), lr=1e-5)
T, ALFA = 2.0, 0.5


def paso(textos: list[str]) -> float:
    b = tok(textos, return_tensors="pt", padding=True, truncation=True, max_length=512).to("cuda")
    with torch.no_grad():
        z_t = teacher(**b).logits
    salida = student(**b, labels=b["input_ids"])
    z_s = salida.logits
    mascara = b["attention_mask"].unsqueeze(-1)
    kd = F.kl_div(F.log_softmax(z_s / T, -1), F.softmax(z_t / T, -1), reduction="none")
    kd = (kd * mascara).sum() / mascara.sum() * T * T
    loss = ALFA * kd + (1 - ALFA) * salida.loss       # imitar al Teacher + aprender los datos
    opt.zero_grad(); loss.backward(); opt.step()
    return loss.item()` },
      { t: 'Evaluación: win rate ciego', lang: 'python', file: 'evaluar_winrate.py', code: c`
import random
from construir import juez, Veredicto


def win_rate(prompts: list[str], gen_nuevo, gen_viejo) -> float:
    victorias = empates = 0
    for p in prompts:
        nuevo, viejo = gen_nuevo(p), gen_viejo(p)
        invertir = random.random() < 0.5                  # evita el sesgo de posición del juez
        a, b = (viejo, nuevo) if invertir else (nuevo, viejo)
        v = juez.messages.parse(model="claude-opus-5-5", max_tokens=800, output_format=Veredicto,
                                messages=[{"role": "user", "content": f"{p}\n<A>{a}</A>\n<B>{b}</B>\n¿Cuál es mejor?"}]).parsed_output
        if v.mejor == "empate":
            empates += 1
        elif (v.mejor == "A") != invertir:
            victorias += 1
    return (victorias + 0.5 * empates) / len(prompts)` }
    ]
  },
  prompts: [
    { t: 'Juez comparativo con control de sesgos', tipo: 'LLM-as-a-Judge', lang: 'markdown', code: c`
Compara dos respuestas. Las respuestas aparecen en orden aleatorio y su longitud
NO es un criterio: una respuesta más larga no es mejor por serlo.
<pregunta>{pregunta}</pregunta>
<A>{a}</A>
<B>{b}</B>
Criterios en orden de importancia: 1) corrección técnica, 2) adecuación pedagógica
al nivel DAM, 3) concisión. Razona brevemente y decide: "A", "B" o "empate".` },
    { t: 'Generador de respuestas rechazadas "difíciles"', tipo: 'System Prompt', lang: 'markdown', d: 'Pares con diferencias sutiles enseñan más que pares obvios.', code: c`
Dada una respuesta correcta de tutoría, genera una versión empeorada de forma SUTIL
con exactamente uno de estos defectos (indica cuál):
- un error técnico plausible (p. ej. confundir equals y ==),
- da la solución completa sin explicar,
- tono condescendiente,
- ignora el nivel del alumno.
Mantén longitud y formato similares a la original.` }
  ],
  actividad: {
    titulo: 'Student especializado: destilación + DPO para clasificación y respuesta de dudas',
    contexto: c`Destila en un modelo de ≤ 1,5B parámetros la capacidad de un Teacher para clasificar dudas del alumnado por módulo y dificultad y responder las sencillas, y refínalo con DPO.`,
    requisitos: [
      'Dataset destilado de ≥ 3 000 ejemplos generados por un Teacher (verifica sus términos de uso).',
      'SFT del Student y, después, DPO con ≥ 500 pares obtenidos con juez.',
      'Comparativa Teacher / Student-SFT / Student-DPO: exactitud de clasificación, win rate, latencia y coste por 1 000 consultas.',
      'Opcional avanzado: destilación por logits con Teacher abierto.'
    ],
    entregables: ['Notebooks y scripts', '<code>DESTILACION.md</code> con tabla de resultados y análisis coste/calidad'],
    rubrica: [['Pipeline de destilación', 30], ['DPO correcto y pares de calidad', 25], ['Evaluación y análisis económico', 30], ['Documentación', 15]]
  },
  faq: [
    ['DPO no mejora nada: <code>rewards/accuracies</code> ≈ 0,5.', c`Los pares no son distinguibles (elegida y rechazada casi iguales o etiquetas ruidosas), o el learning rate es demasiado bajo. Revisa una muestra de pares a mano y filtra los empates.`],
    ['El modelo tras DPO responde mucho más largo.', c`Sesgo de longitud del juez: las respuestas largas suelen ganar. Instrúyelo explícitamente, equilibra longitudes en los pares o penaliza la longitud en la selección.`],
    ['¿Puedo destilar de Claude o de GPT?', c`Técnicamente sí (por secuencias). Legalmente, revisa los términos de cada proveedor: suelen restringir el uso de salidas para desarrollar modelos competidores. Para un Student interno de una tarea específica la situación puede ser distinta; documenta la revisión y, en caso de duda, usa un Teacher de pesos abiertos con licencia permisiva.`],
    ['¿Qué tamaño de Student elijo?', c`El más pequeño que alcance tu umbral de calidad. Prueba 0,5B, 1,5B y 3B: para clasificación y extracción estrecha, 0,5-1,5B suele bastar; para generación explicativa, 3B o más.`]
  ]
});

SESIONES.push({
  n: 19,
  corto: 'Edge AI en móvil y escritorio',
  titulo: 'IA en Aplicaciones Multiplataforma y Móviles (Android/Kotlin, Flutter, ONNX Runtime)',
  duracion: '7 h',
  resumen: c`Exportación de modelos a ONNX, cuantización INT8, inferencia on-device sin conexión en Android con Kotlin, integración en Flutter y en escritorio con Java, y LLMs pequeños en el dispositivo.`,
  stack: ['ONNX', 'ONNX Runtime (Android, Java)', 'Optimum', 'Kotlin + Jetpack Compose', 'Flutter (MethodChannel)', 'llama.cpp / MediaPipe LLM'],
  teoria: {
    intro: c`Aquí convergen tu título de DAM y el Máster: llevar la IA <strong>dentro</strong> de la aplicación multiplataforma. Inferencia on-device significa privacidad (los datos no salen del dispositivo), funcionamiento sin conexión, latencia mínima y coste de servidor cero.`,
    bloques: [
      ['1. ONNX como formato de intercambio', c`<p>ONNX describe el grafo del modelo de forma independiente del framework. Un modelo de PyTorch o scikit-learn exportado a ONNX se ejecuta con <strong>ONNX Runtime</strong> en Android, iOS, Windows, Linux, macOS, navegador (WebGPU/WASM) y JVM, con aceleradores por plataforma (NNAPI, XNNPACK, CoreML, DirectML).</p>`],
      ['2. Optimizar para el dispositivo', c`<p>Cuantización dinámica o estática a INT8 (×4 menos tamaño, 2-3× más velocidad en CPU), modelos pequeños por diseño (MiniLM, MobileBERT, modelos de 0,5-3B para texto generativo), y medición en dispositivo real: tamaño del APK, RAM, batería y latencia en gama media.</p>`],
      ['3. Arquitectura en Android', c`<p>El modelo va en <code>assets/</code> o se descarga bajo demanda. La sesión de ONNX Runtime se crea una vez (costosa) y se reutiliza; la inferencia se ejecuta fuera del hilo principal con corrutinas (<code>Dispatchers.Default</code>) y el resultado se expone con <code>StateFlow</code> a la UI de Compose.</p>`],
      ['4. Tokenización en el dispositivo', c`<p>Los modelos de texto necesitan el mismo tokenizador que en entrenamiento. Opciones: implementar WordPiece/BPE en Kotlin a partir de <code>vocab.txt</code>, usar extensiones de ONNX Runtime (onnxruntime-extensions) que incluyen el tokenizador en el grafo, o bibliotecas nativas.</p>`],
      ['5. LLMs en el dispositivo', c`<p>Modelos de 0,5-4B cuantizados a 4 bits funcionan en móviles recientes con llama.cpp (vía JNI), MediaPipe LLM Inference o ONNX Runtime GenAI; también existen modelos integrados en el sistema operativo en algunos dispositivos. Úsalos para tareas acotadas (resumir, clasificar, autocompletar) y combina con la nube para lo complejo (arquitectura híbrida).</p>`]
    ],
    flujo: ['Modelo PyTorch / sklearn', 'Exportar a ONNX (Optimum)', 'Cuantizar INT8', 'assets/ del APK', 'OrtSession (una vez)', 'Corrutina: tokenizar → run()', 'StateFlow → Compose'],
    tabla: {
      cap: 'Opciones de inferencia en el dispositivo',
      head: ['Tecnología', 'Plataformas', 'Ideal para'],
      rows: [
        ['ONNX Runtime Mobile', 'Android, iOS', 'Clasificadores, embeddings, visión'],
        ['ONNX Runtime (Java/JVM)', 'Escritorio Windows/Linux/macOS', 'Apps de escritorio Java/Kotlin, Compose Desktop'],
        ['ONNX Runtime Web', 'Navegador (WASM/WebGPU)', 'PWAs sin servidor'],
        ['LiteRT (TensorFlow Lite)', 'Android, iOS, microcontroladores', 'Modelos de visión y audio optimizados'],
        ['llama.cpp / MediaPipe LLM', 'Android, iOS, escritorio', 'LLMs pequeños cuantizados']
      ]
    },
    claves: ['Crea la sesión una vez; nunca en el hilo principal.', 'Mide en un móvil de gama media real, no solo en el emulador.', 'On-device es también una decisión de privacidad: documéntala.']
  },
  taller: {
    entorno: 'Python (exportación) · Android Studio + Kotlin + Jetpack Compose · Flutter 3 · IntelliJ (escritorio)',
    pasos: [
      { t: 'Exportar y cuantizar un clasificador de texto a ONNX', lang: 'powershell', file: 'PowerShell', code: c`
uv init mia-s19-edge; cd mia-s19-edge
uv add "optimum[onnxruntime]" transformers onnxruntime
# Modelo de clasificación multilingüe ajustado para detectar la categoría de una duda (ejemplo)
uv run optimum-cli export onnx --model ./clasificador-dudas-dam --task text-classification onnx/
uv run python -c "from onnxruntime.quantization import quantize_dynamic, QuantType; quantize_dynamic('onnx/model.onnx', 'onnx/model_int8.onnx', weight_type=QuantType.QInt8)"
Get-ChildItem onnx | Select-Object Name, Length` },
      { t: 'Verificar paridad en Python antes de llevarlo al móvil', lang: 'python', file: 'verificar.py', code: c`
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("./clasificador-dudas-dam")
etiquetas = ["Acceso a Datos", "PMDM", "PSP", "Interfaces", "Otros"]

for ruta in ("onnx/model.onnx", "onnx/model_int8.onnx"):
    s = ort.InferenceSession(ruta, providers=["CPUExecutionProvider"])
    enc = tok("¿Cómo hago una consulta con JDBC usando PreparedStatement?", return_tensors="np")
    logits = s.run(None, {k: v.astype(np.int64) for k, v in enc.items() if k in {i.name for i in s.get_inputs()}})[0]
    print(ruta, etiquetas[int(logits.argmax())], np.round(logits, 2))` },
      { t: 'Dependencias Android (Gradle Kotlin DSL)', lang: 'kotlin', file: 'app/build.gradle.kts', code: c`
dependencies {
    implementation("com.microsoft.onnxruntime:onnxruntime-android:1.20.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
android {
    androidResources { noCompress += "onnx" }   // el modelo se mapea sin descomprimir
}` },
      { t: 'Clasificador on-device en Kotlin', lang: 'kotlin', file: 'ClasificadorDudas.kt', code: c`
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.nio.LongBuffer

class ClasificadorDudas(context: Context, private val tokenizer: WordPieceTokenizer) : AutoCloseable {
    private val env = OrtEnvironment.getEnvironment()
    private val sesion: OrtSession = env.createSession(
        context.assets.open("model_int8.onnx").readBytes(),
        OrtSession.SessionOptions().apply { addNnapi() }      // aceleración si está disponible
    )
    private val etiquetas = listOf("Acceso a Datos", "PMDM", "PSP", "Interfaces", "Otros")

    suspend fun clasificar(texto: String): Pair<String, Float> = withContext(Dispatchers.Default) {
        val ids = tokenizer.encode(texto, maxLen = 128)          // LongArray con [CLS] ... [SEP] + padding
        val mascara = LongArray(ids.size) { if (ids[it] != 0L) 1L else 0L }
        val forma = longArrayOf(1, ids.size.toLong())
        OnnxTensor.createTensor(env, LongBuffer.wrap(ids), forma).use { tIds ->
            OnnxTensor.createTensor(env, LongBuffer.wrap(mascara), forma).use { tMask ->
                sesion.run(mapOf("input_ids" to tIds, "attention_mask" to tMask)).use { r ->
                    @Suppress("UNCHECKED_CAST")
                    val logits = (r[0].value as Array<FloatArray>)[0]
                    val exp = logits.map { kotlin.math.exp(it.toDouble()) }
                    val i = logits.indices.maxBy { logits[it] }
                    etiquetas[i] to (exp[i] / exp.sum()).toFloat()
                }
            }
        }
    }

    override fun close() { sesion.close() }
}` },
      { t: 'ViewModel + Compose', lang: 'kotlin', file: 'DudasScreen.kt', code: c`
class DudasViewModel(private val clasificador: ClasificadorDudas) : ViewModel() {
    private val _estado = MutableStateFlow("Escribe tu duda")
    val estado: StateFlow<String> = _estado

    fun analizar(texto: String) = viewModelScope.launch {
        val inicio = System.nanoTime()
        val (modulo, prob) = clasificador.clasificar(texto)
        val ms = (System.nanoTime() - inicio) / 1_000_000
        _estado.value = "Módulo: $modulo (" + "%.0f".format(prob * 100) + " %) · " + ms + " ms · sin conexión"
    }
}

@Composable
fun DudasScreen(vm: DudasViewModel) {
    var texto by remember { mutableStateOf("") }
    val estado by vm.estado.collectAsState()
    Column(Modifier.padding(16.dp)) {
        OutlinedTextField(texto, { texto = it }, label = { Text("Tu duda") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = { vm.analizar(texto) }, modifier = Modifier.padding(top = 8.dp)) { Text("Clasificar") }
        Text(estado, modifier = Modifier.padding(top = 16.dp))
    }
}` },
      { t: 'Flutter: reutilizar el motor nativo vía MethodChannel', lang: 'dart', file: 'lib/clasificador.dart', code: c`
import 'package:flutter/services.dart';

class Clasificador {
  static const _canal = MethodChannel('es.jrotero/clasificador');

  static Future<({String modulo, double prob})> clasificar(String texto) async {
    final r = await _canal.invokeMapMethod<String, dynamic>('clasificar', {'texto': texto});
    return (modulo: r!['modulo'] as String, prob: (r['prob'] as num).toDouble());
  }
}
// En MainActivity.kt: MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "es.jrotero/clasificador")
//   .setMethodCallHandler { call, result -> lifecycleScope.launch {
//       val (m, p) = clasificador.clasificar(call.argument<String>("texto")!!)
//       result.success(mapOf("modulo" to m, "prob" to p)) } }` },
      { t: 'Escritorio: el mismo modelo en Java 21', lang: 'java', file: 'ClasificadorEscritorio.java', code: c`
// Maven: com.microsoft.onnxruntime:onnxruntime:1.20.0
import ai.onnxruntime.*;
import java.nio.LongBuffer;
import java.util.Map;

public class ClasificadorEscritorio {
    public static void main(String[] args) throws OrtException {
        var env = OrtEnvironment.getEnvironment();
        try (var sesion = env.createSession("onnx/model_int8.onnx", new OrtSession.SessionOptions())) {
            long[] ids = {101, 2129, 11530, 10128, 13256, 10406, 102};   // salida del tokenizador
            long[] mascara = {1, 1, 1, 1, 1, 1, 1};
            long[] forma = {1, ids.length};
            try (var tIds = OnnxTensor.createTensor(env, LongBuffer.wrap(ids), forma);
                 var tMask = OnnxTensor.createTensor(env, LongBuffer.wrap(mascara), forma);
                 var r = sesion.run(Map.of("input_ids", tIds, "attention_mask", tMask))) {
                float[] logits = ((float[][]) r.get(0).getValue())[0];
                System.out.println(java.util.Arrays.toString(logits));
            }
        }
    }
}` }
    ]
  },
  prompts: [
    { t: 'Revisor de rendimiento de inferencia móvil', tipo: 'System Prompt', lang: 'markdown', code: c`
Eres ingeniero de rendimiento Android especializado en ML on-device.
Revisa el código Kotlin que te paso y señala:
- creación de sesiones o tensores dentro de bucles o en el hilo principal,
- tensores no cerrados (fugas de memoria nativa),
- copias innecesarias de arrays,
- falta de reutilización de buffers.
Para cada problema: línea, impacto estimado (alto/medio/bajo) y corrección en Kotlin.` },
    { t: 'Arquitectura híbrida dispositivo/nube', tipo: 'Plantilla de decisión', lang: 'markdown', code: c`
Para la funcionalidad "{funcionalidad}" de una app multiplataforma, decide qué se
ejecuta en el dispositivo y qué en la nube. Considera: privacidad de los datos,
necesidad de funcionar sin conexión, latencia aceptable, tamaño del modelo frente al
APK, coste por usuario y frecuencia de actualización del modelo.
Devuelve una tabla Componente | Dónde | Modelo | Justificación y un diagrama de secuencia en Mermaid.` }
  ],
  actividad: {
    titulo: 'App Android "Asistente DAM offline" con IA on-device',
    contexto: c`Desarrolla una app Android (Kotlin + Compose) que clasifique dudas del alumnado y ofrezca recursos del módulo correspondiente, funcionando sin conexión, con fallback opcional a la nube para respuestas generativas.`,
    requisitos: [
      'Modelo exportado a ONNX y cuantizado a INT8, con verificación de paridad documentada.',
      'Inferencia en corrutinas, sesión reutilizada, recursos nativos cerrados correctamente.',
      'Medición en dispositivo real: tamaño del APK, latencia p50/p95, RAM.',
      'Integración Flutter <em>o</em> versión de escritorio Java/Compose Desktop del mismo motor.',
      'Modo híbrido: si hay conexión y el usuario lo autoriza, respuesta generativa con un LLM en la nube.'
    ],
    entregables: ['Proyecto Android Studio', 'Scripts de exportación', '<code>EDGE.md</code> con métricas y decisiones de privacidad', 'APK de depuración'],
    rubrica: [['Exportación y optimización del modelo', 25], ['Calidad del código Android', 30], ['Métricas en dispositivo real', 25], ['Integración multiplataforma e híbrida', 20]]
  },
  faq: [
    ['El APK pesa demasiado con el modelo.', c`Usa INT8, un modelo más pequeño, descarga el modelo en el primer arranque (con verificación de hash) o Play Asset Delivery. Divide el APK por ABI.`],
    ['Los resultados en Android difieren de Python.', c`Casi siempre es el tokenizador (distinto vocabulario, minúsculas, acentos, tokens especiales) o el preprocesado. Compara los <code>input_ids</code> generados en ambos lados para la misma frase antes de comparar logits.`],
    ['¿NNAPI siempre acelera?', c`No: depende del dispositivo y de los operadores soportados; a veces es más lento que XNNPACK en CPU. Mide con y sin aceleración en varios dispositivos y deja configurable el proveedor.`],
    ['¿Puedo ejecutar un LLM completo en el móvil?', c`Modelos de 1-4B cuantizados a 4 bits, sí, en dispositivos recientes con 8 GB de RAM o más, a velocidades de lectura humana. Para tareas complejas, la arquitectura híbrida (local para lo sensible o sin conexión, nube para lo complejo) es lo más práctico.`]
  ]
});

SESIONES.push({
  n: 20,
  corto: 'Voz en tiempo real',
  titulo: 'Sistemas de Voz en Tiempo Real y Multimodalidad (STT, TTS, WebSockets)',
  duracion: '7 h',
  resumen: c`Asistentes conversacionales de baja latencia: transcripción con Whisper, streaming del LLM frase a frase, síntesis neuronal de voz y transporte bidireccional por WebSockets.`,
  stack: ['faster-whisper', 'Silero VAD', 'Claude streaming', 'Piper TTS', 'FastAPI WebSockets', 'Web Audio API', 'Spring WebSocket'],
  teoria: {
    intro: c`En una conversación hablada, más de ~1 segundo de silencio se percibe como fallo. Un asistente de voz es un problema de <strong>latencia de extremo a extremo</strong>: cada componente (detección de voz, transcripción, LLM, síntesis, red) debe trabajar en streaming y en paralelo.`,
    bloques: [
      ['1. Pipeline en cascada', c`<p><strong>VAD</strong> (detección de actividad de voz) decide cuándo el usuario ha terminado → <strong>STT</strong> transcribe → <strong>LLM</strong> genera en streaming → se trocea en frases → <strong>TTS</strong> sintetiza cada frase y se reproduce mientras se genera la siguiente.</p>`],
      ['2. Presupuesto de latencia', c`<p>Fin de habla detectado (~300 ms de silencio) + STT (100-300 ms con GPU) + primer token del LLM (300-800 ms) + primera frase de TTS (100-200 ms) + red. Objetivo: &lt; 1,5 s hasta el primer audio. Optimizaciones: modelos STT pequeños con GPU, LLM rápido y bajo esfuerzo de razonamiento, TTS local y envío de la primera frase lo antes posible.</p>`],
      ['3. Whisper y faster-whisper', c`<p>Whisper es un modelo encoder-decoder entrenado en audio multilingüe. <code>faster-whisper</code> (CTranslate2) es hasta 4× más rápido con la misma precisión y cuantización INT8/FP16. Fija el idioma (<code>language="es"</code>) para ahorrar latencia y errores.</p>`],
      ['4. TTS neuronal', c`<p>Piper (VITS, local y muy rápido, voces en español), Kokoro, XTTS (clonación de voz) o servicios en la nube. La clonación de voz de personas reales requiere su consentimiento expreso y el contenido sintético debe ser identificable como tal (EU AI Act, art. 50).</p>`],
      ['5. Transporte', c`<p>WebSockets permiten audio bidireccional sobre una conexión persistente; WebRTC añade control de jitter y cancelación de eco para producción. Los modelos speech-to-speech nativos (audio de entrada y salida en un único modelo) reducen la latencia, a cambio de menos control sobre cada etapa.</p>`]
    ],
    flujo: ['Micrófono (navegador)', 'WebSocket (audio)', 'VAD', 'faster-whisper', 'LLM streaming', 'Troceo por frases', 'Piper TTS', 'WebSocket (audio)', 'Altavoz'],
    tabla: {
      cap: 'Componentes de voz',
      head: ['Etapa', 'Opción local', 'Opción nube', 'Latencia típica'],
      rows: [
        ['VAD', 'Silero VAD', 'Integrado en APIs de voz', '&lt; 30 ms por trozo'],
        ['STT', 'faster-whisper (small/medium)', 'APIs de transcripción', '100-500 ms'],
        ['LLM', 'Qwen/Llama en vLLM', 'Claude, Gemini', 'TTFT 200-800 ms'],
        ['TTS', 'Piper, Kokoro', 'Servicios TTS neuronales', '50-300 ms primera frase'],
        ['Transporte', 'WebSocket', 'WebRTC', '20-100 ms']
      ]
    },
    claves: ['Streaming en todas las etapas; nunca esperes la respuesta completa.', 'Trocea por frases para empezar a hablar antes.', 'Voz = dato personal (y biométrico si identifica): minimiza y no almacenes audio sin necesidad.']
  },
  taller: {
    entorno: 'PowerShell 7 · VS Code · GPU recomendada · navegador Chrome/Edge · ffmpeg',
    pasos: [
      { t: 'Dependencias y voz española de Piper', lang: 'powershell', file: 'PowerShell', code: c`
winget install Gyan.FFmpeg
uv init mia-s20-voz; cd mia-s20-voz
uv add faster-whisper anthropic fastapi "uvicorn[standard]" piper-tts numpy
mkdir voces
Invoke-WebRequest "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx" -OutFile voces/es_ES-davefx-medium.onnx
Invoke-WebRequest "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx.json" -OutFile voces/es_ES-davefx-medium.onnx.json` },
      { t: 'STT y TTS como servicios internos', lang: 'python', file: 'src/voz.py', code: c`
import subprocess
import tempfile
from faster_whisper import WhisperModel

stt = WhisperModel("small", device="cuda", compute_type="float16")   # en CPU: device="cpu", compute_type="int8"
VOZ = "voces/es_ES-davefx-medium.onnx"


def transcribir(ruta_audio: str) -> str:
    segmentos, info = stt.transcribe(ruta_audio, language="es", vad_filter=True, beam_size=1)
    return " ".join(s.text.strip() for s in segmentos)


def sintetizar(frase: str) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        salida = f.name
    subprocess.run(["piper", "--model", VOZ, "--output_file", salida], input=frase.encode("utf-8"), check=True)
    return open(salida, "rb").read()` },
      { t: 'Servidor WebSocket: audio → texto → LLM por frases → audio', lang: 'python', file: 'src/servidor_voz.py', code: c`
import asyncio
import json
import re
import tempfile
import anthropic
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from voz import sintetizar, transcribir

app = FastAPI()
claude = anthropic.AsyncAnthropic()
FIN_FRASE = re.compile(r"(?<=[.!?¿¡:;])\s+")
SISTEMA = ("Eres el asistente de voz del CFP José Ramón Otero. Respuestas habladas: frases cortas, "
           "sin listas ni código, máximo 4 frases. Recuerda que eres una IA si te lo preguntan.")


@app.websocket("/voz")
async def voz(ws: WebSocket):
    await ws.accept()
    historial: list[dict] = []
    try:
        while True:
            audio = await ws.receive_bytes()                     # un turno completo (push-to-talk)
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
                f.write(audio)
            texto = await asyncio.to_thread(transcribir, f.name)
            await ws.send_text(json.dumps({"tipo": "transcripcion", "texto": texto}))
            historial.append({"role": "user", "content": texto})

            pendiente, respuesta = "", ""
            async with claude.messages.stream(model="claude-haiku-5-5", max_tokens=600, system=SISTEMA,
                                              output_config={"effort": "low"}, messages=historial) as s:
                async for delta in s.text_stream:
                    pendiente += delta; respuesta += delta
                    *frases, pendiente = FIN_FRASE.split(pendiente)
                    for frase in frases:                         # habla en cuanto hay una frase completa
                        await ws.send_text(json.dumps({"tipo": "texto", "texto": frase}))
                        await ws.send_bytes(await asyncio.to_thread(sintetizar, frase))
            if pendiente.strip():
                await ws.send_bytes(await asyncio.to_thread(sintetizar, pendiente))
            historial.append({"role": "assistant", "content": respuesta})
            await ws.send_text(json.dumps({"tipo": "fin"}))
    except WebSocketDisconnect:
        pass                                                     # no se conserva el audio del usuario` },
      { t: 'Cliente web: grabar, enviar y reproducir en cola', lang: 'javascript', file: 'static/voz.js', code: c`
const ws = new WebSocket("ws://localhost:8000/voz");
ws.binaryType = "arraybuffer";
const ctx = new AudioContext();
let cola = Promise.resolve();

ws.onmessage = (ev) => {
  if (typeof ev.data === "string") {
    const m = JSON.parse(ev.data);
    if (m.tipo === "transcripcion") document.querySelector("#yo").textContent = m.texto;
    if (m.tipo === "texto") document.querySelector("#ia").textContent += m.texto + " ";
    return;
  }
  const wav = ev.data;                       // cada frase se reproduce tras la anterior
  cola = cola.then(() => ctx.decodeAudioData(wav.slice(0)).then(buf => new Promise(ok => {
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
    src.onended = ok; src.start();
  })));
};

let grabador, trozos = [];
async function empezar() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  grabador = new MediaRecorder(stream, { mimeType: "audio/webm" });
  trozos = [];
  grabador.ondataavailable = e => trozos.push(e.data);
  grabador.onstop = async () => ws.send(await new Blob(trozos).arrayBuffer());
  grabador.start();
}
function parar() { grabador.stop(); }       // botón "mantener para hablar"` },
      { t: 'Medir la latencia de cada etapa', lang: 'python', file: 'src/medir.py', code: c`
import time
from contextlib import contextmanager

tiempos: dict[str, list[float]] = {}


@contextmanager
def etapa(nombre: str):
    t0 = time.perf_counter()
    yield
    tiempos.setdefault(nombre, []).append((time.perf_counter() - t0) * 1000)


def informe():
    for k, v in tiempos.items():
        v = sorted(v)
        print(f"{k:<12} p50={v[len(v)//2]:.0f} ms  p95={v[int(len(v)*0.95)-1]:.0f} ms  n={len(v)}")

# Uso: with etapa("stt"): texto = transcribir(ruta)` }
    ]
  },
  prompts: [
    { t: 'System prompt para respuestas habladas', tipo: 'System Prompt', lang: 'markdown', code: c`
Tus respuestas se convertirán en voz.
- Frases cortas (máximo 20 palabras) y lenguaje oral natural.
- Nada de listas, tablas, emojis, Markdown ni código: descríbelo con palabras.
- Escribe los números y siglas como se pronuncian ("dos mil veintiséis", "de a eme").
- Si la pregunta necesita una respuesta larga, ofrece enviarla por escrito.
- Si no has entendido la transcripción, pide que se repita.` },
    { t: 'Corrección de transcripciones de dominio', tipo: 'Plantilla', lang: 'markdown', code: c`
Corrige errores de transcripción automática en esta frase de un alumno de DAM,
teniendo en cuenta el vocabulario técnico: {glosario: JDBC, Kotlin, Jetpack Compose,
Spring Boot, PSP, PMDM, corrutinas, Hibernate}.
<transcripcion>{texto}</transcripcion>
Devuelve solo la frase corregida. Si no hay errores, devuélvela igual.` }
  ],
  actividad: {
    titulo: 'Conserje virtual por voz para la recepción del centro',
    contexto: c`Construye un asistente de voz en español que responda preguntas frecuentes (horarios, ubicación de aulas, trámites) con latencia inferior a 1,5 s hasta el primer audio.`,
    requisitos: [
      'Pipeline VAD/STT/LLM/TTS en streaming con troceo por frases.',
      'WebSocket bidireccional y cliente web con indicador de estado.',
      'Respuestas apoyadas en un RAG pequeño (FAQ del centro) del Módulo 2.',
      'Medición de latencia por etapa (p50/p95) en 30 interacciones y optimizaciones aplicadas.',
      'Aviso de interacción con IA (art. 50 EU AI Act) y política de no conservación de audio.'
    ],
    entregables: ['Código servidor y cliente', '<code>LATENCIA.md</code> con mediciones antes/después', 'Vídeo demostración (≤ 2 min)'],
    rubrica: [['Pipeline en streaming', 30], ['Latencia y optimización medida', 30], ['Calidad de la conversación (RAG + voz)', 20], ['Cumplimiento y privacidad', 20]]
  },
  faq: [
    ['Whisper transcribe "Kotlin" como "cotlin" o inventa frases en silencios.', c`Usa <code>initial_prompt</code> con el vocabulario técnico, activa <code>vad_filter=True</code> para descartar silencios (evita alucinaciones en audio vacío) y corrige con un glosario o un LLM rápido.`],
    ['El asistente se escucha a sí mismo y se interrumpe.', c`Activa <code>echoCancellation</code> en <code>getUserMedia</code>, usa auriculares en pruebas, o silencia la captura mientras se reproduce la respuesta. WebRTC ofrece cancelación de eco más robusta.`],
    ['¿Cómo gestiono que el usuario interrumpa (barge-in)?', c`Mantén el VAD activo durante la reproducción; si detecta voz, detén la cola de audio, cancela el stream del LLM y procesa el nuevo turno. Guarda solo la parte de la respuesta que realmente se reprodujo en el historial.`],
    ['¿Puedo clonar la voz de un profesor para el asistente?', c`Solo con su consentimiento informado y por escrito, con posibilidad de revocarlo, y marcando el contenido como generado por IA. La voz que identifica a una persona es un dato personal; en el Máster usamos voces sintéticas con licencia.`]
  ]
});
