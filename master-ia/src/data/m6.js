// M6 · IA en apps multiplataforma y puesta en producción (40 h · semanas 11–12)

SESIONES.push({
  n: 11,
  semana: '11',
  fechas: '10 – 14 dic 2029',
  corto: 'IA en Android, Flutter, web y escritorio',
  titulo: c`IA en Apps Android (Kotlin), Multiplataforma (Flutter), Web y Escritorio: Modelos en el Dispositivo y Experiencia de Usuario`,
  duracion: 'Semana 11 · 20 h',
  resumen: c`Integración de funciones de IA en apps Android con Kotlin y Jetpack Compose, Flutter, web y escritorio Java; modelos que se ejecutan en el propio dispositivo con ONNX Runtime; voz en tiempo real; y diseño de la experiencia de usuario de las funciones de IA.`,
  stack: [
    'Kotlin + Jetpack Compose',
    'Flutter',
    'ONNX Runtime (Android, Java, Web)',
    'Optimum',
    'Retrofit / Ktor',
    'faster-whisper',
    'WebSockets'
  ],
  teoria: {
    intro: c`Aquí converge tu título de DAM con todo lo anterior: llevar la IA <strong>dentro</strong> de la aplicación. Hay dos caminos que se combinan: llamar a un servicio de IA en la nube (lo que construiste en M3-M5) o ejecutar el modelo <strong>en el propio dispositivo</strong> para ganar privacidad, funcionamiento sin conexión y latencia mínima.`,
    bloques: [
      [
        '1. Arquitectura: dispositivo, nube o híbrida',
        c`<p><strong>Nube</strong>: modelos grandes, actualizables sin publicar versión, pero con latencia de red, coste por uso y datos que salen del dispositivo. <strong>Dispositivo</strong>: privacidad y sin conexión, limitado a modelos pequeños. <strong>Híbrida</strong>: el dispositivo resuelve lo frecuente o sensible (clasificar, detectar, transcribir) y la nube lo complejo. La app nunca debe contener claves de API de proveedores: llama a tu backend.</p>`
      ],
      [
        '2. ONNX como formato de intercambio',
        c`<p>ONNX describe el grafo del modelo de forma independiente del framework. Un modelo de PyTorch o scikit-learn exportado a ONNX se ejecuta con <strong>ONNX Runtime</strong> en Android, iOS, Windows, Linux, macOS, navegador (WebGPU/WASM) y JVM, con aceleradores por plataforma (NNAPI, XNNPACK, CoreML, DirectML).</p>`
      ],
      [
        '3. Optimizar para el dispositivo',
        c`<p>Cuantización dinámica o estática a INT8 (×4 menos tamaño, 2-3× más velocidad en CPU), modelos pequeños por diseño (MiniLM, MobileBERT, modelos de 0,5-3B para texto generativo), y medición en dispositivo real: tamaño del APK, RAM, batería y latencia en gama media.</p>`
      ],
      [
        '4. Arquitectura en Android',
        c`<p>El modelo va en <code>assets/</code> o se descarga bajo demanda. La sesión de ONNX Runtime se crea una vez (costosa) y se reutiliza; la inferencia se ejecuta fuera del hilo principal con corrutinas (<code>Dispatchers.Default</code>) y el resultado se expone con <code>StateFlow</code> a la UI de Compose.</p>`
      ],
      [
        '5. LLMs en el dispositivo',
        c`<p>Modelos de 0,5-4B cuantizados a 4 bits funcionan en móviles recientes con llama.cpp (vía JNI), MediaPipe LLM Inference o ONNX Runtime GenAI; también existen modelos integrados en el sistema operativo en algunos dispositivos. Úsalos para tareas acotadas (resumir, clasificar, autocompletar) y combina con la nube para lo complejo (arquitectura híbrida).</p>`
      ],
      [
        '6. Experiencia de usuario de las funciones de IA',
        c`<ul>
<li><strong>Transparencia</strong>: indicar que una respuesta o contenido lo genera una IA (art. 50 del Reglamento de IA).</li>
<li><strong>Streaming y estados</strong>: mostrar el texto a medida que llega, con indicador de progreso y opción de cancelar.</li>
<li><strong>Control</strong>: el usuario revisa y confirma antes de que la IA actúe (enviar, comprar, borrar).</li>
<li><strong>Errores y degradación</strong>: mensaje útil si no hay red o el modelo falla, y funcionamiento básico sin IA.</li>
<li><strong>Feedback</strong>: botones de útil / no útil que alimentan la evaluación continua (semana 12).</li>
<li><strong>Accesibilidad</strong>: anunciar el contenido que llega en streaming a lectores de pantalla y permitir voz y texto.</li>
</ul>`
      ],
      [
        '7. Voz en tiempo real',
        c`<p><strong>VAD</strong> (detección de actividad de voz) decide cuándo el usuario ha terminado → <strong>STT</strong> transcribe → <strong>LLM</strong> genera en streaming → se trocea en frases → <strong>TTS</strong> sintetiza cada frase y se reproduce mientras se genera la siguiente.</p>`
      ],
      [
        '8. Presupuesto de latencia',
        c`<p>Fin de habla detectado (~300 ms de silencio) + STT (100-300 ms con GPU) + primer token del LLM (300-800 ms) + primera frase de TTS (100-200 ms) + red. Objetivo: &lt; 1,5 s hasta el primer audio. Optimizaciones: modelos STT pequeños con GPU, LLM rápido y bajo esfuerzo de razonamiento, TTS local y envío de la primera frase lo antes posible.</p>`
      ]
    ],
    flujo: [
      'Modelo PyTorch / sklearn',
      'Exportar a ONNX (Optimum)',
      'Cuantizar INT8',
      'assets/ del APK',
      'OrtSession (una vez)',
      'Corrutina: tokenizar → run()',
      'StateFlow → Compose'
    ],
    tabla: {
      cap: 'Opciones de inferencia en el dispositivo',
      head: ['Tecnología', 'Plataformas', 'Ideal para'],
      rows: [
        ['ONNX Runtime Mobile', 'Android, iOS', 'Clasificadores, embeddings, visión'],
        [
          'ONNX Runtime (Java/JVM)',
          'Escritorio Windows/Linux/macOS',
          'Apps de escritorio Java/Kotlin, Compose Desktop'
        ],
        ['ONNX Runtime Web', 'Navegador (WASM/WebGPU)', 'PWAs sin servidor'],
        [
          'LiteRT (TensorFlow Lite)',
          'Android, iOS, microcontroladores',
          'Modelos de visión y audio optimizados'
        ],
        ['llama.cpp / MediaPipe LLM', 'Android, iOS, escritorio', 'LLMs pequeños cuantizados']
      ]
    },
    claves: [
      'Crea la sesión una vez; nunca en el hilo principal.',
      'Mide en un móvil de gama media real, no solo en el emulador.',
      'On-device es también una decisión de privacidad: documéntala.',
      'Ninguna app distribuida debe llevar dentro claves de API de proveedores de IA.'
    ]
  },
  taller: {
    entorno: 'Python (exportación) · Android Studio + Kotlin + Jetpack Compose · Flutter 3 · IntelliJ (escritorio)',
    pasos: [
      {
        t: 'Exportar y cuantizar un clasificador de texto a ONNX',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
uv init mia-s19-edge; cd mia-s19-edge
uv add "optimum[onnxruntime]" transformers onnxruntime
# Modelo de clasificación multilingüe ajustado para detectar la categoría de una duda (ejemplo)
uv run optimum-cli export onnx --model ./clasificador-dudas-dam --task text-classification onnx/
uv run python -c "from onnxruntime.quantization import quantize_dynamic, QuantType; quantize_dynamic('onnx/model.onnx', 'onnx/model_int8.onnx', weight_type=QuantType.QInt8)"
Get-ChildItem onnx | Select-Object Name, Length`
      },
      {
        t: 'Verificar paridad en Python antes de llevarlo al móvil',
        lang: 'python',
        file: 'verificar.py',
        code: c`
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("./clasificador-dudas-dam")
etiquetas = ["Acceso a Datos", "PMDM", "PSP", "Interfaces", "Otros"]

for ruta in ("onnx/model.onnx", "onnx/model_int8.onnx"):
    s = ort.InferenceSession(ruta, providers=["CPUExecutionProvider"])
    enc = tok("¿Cómo hago una consulta con JDBC usando PreparedStatement?", return_tensors="np")
    logits = s.run(None, {k: v.astype(np.int64) for k, v in enc.items() if k in {i.name for i in s.get_inputs()}})[0]
    print(ruta, etiquetas[int(logits.argmax())], np.round(logits, 2))`
      },
      {
        t: 'Dependencias Android (Gradle Kotlin DSL)',
        lang: 'kotlin',
        file: 'app/build.gradle.kts',
        code: c`
dependencies {
    implementation("com.microsoft.onnxruntime:onnxruntime-android:1.20.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
android {
    androidResources { noCompress += "onnx" }   // el modelo se mapea sin descomprimir
}`
      },
      {
        t: 'Clasificador on-device en Kotlin',
        lang: 'kotlin',
        file: 'ClasificadorDudas.kt',
        code: c`
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
}`
      },
      {
        t: 'ViewModel + Compose',
        lang: 'kotlin',
        file: 'DudasScreen.kt',
        code: c`
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
}`
      },
      {
        t: 'Llamar al backend de IA desde Android con streaming',
        d: c`El asistente de M3 expone <code>/chat</code> con SSE. En Android leemos el flujo línea a línea con OkHttp y actualizamos la UI con <code>StateFlow</code>.`,
        lang: 'kotlin',
        file: 'AsistenteRepository.kt',
        code: c`
class AsistenteRepository(private val http: OkHttpClient, private val baseUrl: String, private val token: () -> String) {

    fun preguntar(texto: String): Flow<String> = flow {
        val cuerpo = """{"mensajes":[{"role":"user","content":\${JSONObject.quote(texto)}}]}"""
            .toRequestBody("application/json".toMediaType())
        val peticion = Request.Builder()
            .url("$baseUrl/chat")
            .header("Authorization", "Bearer " + token())        // token de TU backend, nunca la clave del proveedor
            .post(cuerpo).build()
        http.newCall(peticion).execute().use { resp ->
            if (!resp.isSuccessful) throw IOException("Error " + resp.code)
            val fuente = resp.body!!.source()
            while (!fuente.exhausted()) {
                val linea = fuente.readUtf8Line() ?: break
                if (linea.startsWith("data:")) {
                    val dato = JSONObject(linea.removePrefix("data:").trim())
                    if (dato.has("t")) emit(dato.getString("t"))
                }
            }
        }
    }.flowOn(Dispatchers.IO)
}`
      },
      {
        t: 'Flutter: reutilizar el motor nativo vía MethodChannel',
        lang: 'dart',
        file: 'lib/clasificador.dart',
        code: c`
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
//       result.success(mapOf("modulo" to m, "prob" to p)) } }`
      },
      {
        t: 'Escritorio: el mismo modelo en Java 21',
        lang: 'java',
        file: 'ClasificadorEscritorio.java',
        code: c`
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
}`
      },
      {
        t: 'Asistente de voz: servidor WebSocket (para app y web)',
        lang: 'python',
        file: 'src/servidor_voz.py',
        code: c`
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
        pass                                                     # no se conserva el audio del usuario`
      }
    ]
  },
  prompts: [
    {
      t: 'Revisor de rendimiento de inferencia móvil',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Eres ingeniero de rendimiento Android especializado en ML on-device.
Revisa el código Kotlin que te paso y señala:
- creación de sesiones o tensores dentro de bucles o en el hilo principal,
- tensores no cerrados (fugas de memoria nativa),
- copias innecesarias de arrays,
- falta de reutilización de buffers.
Para cada problema: línea, impacto estimado (alto/medio/bajo) y corrección en Kotlin.`
    },
    {
      t: 'Arquitectura híbrida dispositivo/nube',
      tipo: 'Plantilla de decisión',
      lang: 'markdown',
      code: c`
Para la funcionalidad "{funcionalidad}" de una app multiplataforma, decide qué se
ejecuta en el dispositivo y qué en la nube. Considera: privacidad de los datos,
necesidad de funcionar sin conexión, latencia aceptable, tamaño del modelo frente al
APK, coste por usuario y frecuencia de actualización del modelo.
Devuelve una tabla Componente | Dónde | Modelo | Justificación y un diagrama de secuencia en Mermaid.`
    },
    {
      t: 'System prompt para respuestas habladas',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Tus respuestas se convertirán en voz.
- Frases cortas (máximo 20 palabras) y lenguaje oral natural.
- Nada de listas, tablas, emojis, Markdown ni código: descríbelo con palabras.
- Escribe los números y siglas como se pronuncian ("dos mil veintiséis", "de a eme").
- Si la pregunta necesita una respuesta larga, ofrece enviarla por escrito.
- Si no has entendido la transcripción, pide que se repita.`
    }
  ],
  actividad: {
    tipo: 'semanal',
    titulo: 'Entrega semanal: función de IA en el dispositivo dentro de una app',
    contexto: c`Integra en una app Android, Flutter o de escritorio una función de IA que se ejecute en el dispositivo y otra que llame a tu backend, con buena experiencia de usuario.`,
    requisitos: [
      'Modelo exportado a ONNX y cuantizado, ejecutado en el dispositivo sin bloquear la interfaz.',
      'Llamada a tu backend de IA con streaming, sin claves de proveedores dentro de la app.',
      'Al menos 4 de las pautas de experiencia de usuario de la teoría aplicadas y mostradas en capturas.'
    ],
    entregables: ['Proyecto de la app y README con capturas', 'Medición de latencia y tamaño del modelo'],
    rubrica: [
      ['Modelo en el dispositivo', 35],
      ['Integración con el backend', 35],
      ['Experiencia de usuario', 30]
    ]
  },
  faq: [
    [
      'El APK pesa demasiado con el modelo.',
      c`Usa INT8, un modelo más pequeño, descarga el modelo en el primer arranque (con verificación de hash) o Play Asset Delivery. Divide el APK por ABI.`
    ],
    [
      'Los resultados en Android difieren de Python.',
      c`Casi siempre es el tokenizador (distinto vocabulario, minúsculas, acentos, tokens especiales) o el preprocesado. Compara los <code>input_ids</code> generados en ambos lados para la misma frase antes de comparar logits.`
    ],
    [
      '¿NNAPI siempre acelera?',
      c`No: depende del dispositivo y de los operadores soportados; a veces es más lento que XNNPACK en CPU. Mide con y sin aceleración en varios dispositivos y deja configurable el proveedor.`
    ],
    [
      '¿Puedo ejecutar un LLM completo en el móvil?',
      c`Modelos de 1-4B cuantizados a 4 bits, sí, en dispositivos recientes con 8 GB de RAM o más, a velocidades de lectura humana. Para tareas complejas, la arquitectura híbrida (local para lo sensible o sin conexión, nube para lo complejo) es lo más práctico.`
    ],
    [
      'Whisper transcribe "Kotlin" como "cotlin" o inventa frases en silencios.',
      c`Usa <code>initial_prompt</code> con el vocabulario técnico, activa <code>vad_filter=True</code> para descartar silencios (evita alucinaciones en audio vacío) y corrige con un glosario o un LLM rápido.`
    ]
  ]
});

SESIONES.push({
  n: 12,
  semana: '12',
  fechas: '17 – 21 dic 2029',
  corto: 'Puesta en producción y LLMOps',
  titulo: c`Puesta en Producción: Contenedores, Despliegue en la Nube, Escalado, Observabilidad, Evaluación Continua y Costes (LLMOps)`,
  duracion: 'Semana 12 · 20 h',
  resumen: c`Empaquetado con Docker, despliegue en la nube, escalado y colas, pasarela de modelos con presupuestos y fallbacks, observabilidad con trazas, evaluación continua, control de costes y seguridad en producción. Proyecto del módulo M6. Esta semana se aprueba el anteproyecto del Proyecto Final.`,
  stack: [
    'Docker',
    'Google Cloud Run (u otro proveedor)',
    'LiteLLM',
    'Redis + arq',
    'Langfuse',
    'Prometheus / Grafana',
    'GitHub Actions'
  ],
  teoria: {
    intro: c`Pasar de un prototipo a un servicio que usan cientos de personas exige lo que ya conoces de DAM (contenedores, CI/CD, monitorización) más problemas propios de la IA: GPUs escasas, latencias de segundos, límites de tasa de proveedores y costes variables.`,
    bloques: [
      [
        '1. Contenedores para IA',
        c`<p>Imágenes multi-stage (dependencias de compilación fuera de la imagen final), usuario no root, modelos fuera de la imagen (volumen o descarga en el arranque con caché), healthchecks que comprueban que el modelo está cargado. Para GPU: NVIDIA Container Toolkit y <code>--gpus all</code> / <code>deploy.resources.reservations.devices</code>.</p>`
      ],
      [
        '2. Pasarela de modelos (LiteLLM)',
        c`<p>Un proxy único con API compatible OpenAI frente a todos los modelos (nube y locales): claves virtuales por aplicación, presupuestos, límites de tasa, <strong>fallbacks</strong> entre proveedores, balanceo entre réplicas, caché y registro de costes. Las aplicaciones no conocen las claves reales de los proveedores.</p>`
      ],
      [
        '3. Colas de inferencia',
        c`<p>Tareas largas (procesar 500 documentos, generar informes) no deben mantener abierta una petición HTTP. Patrón: la API encola el trabajo (Redis), devuelve un id, workers procesan con concurrencia controlada y el cliente consulta el estado o recibe un webhook.</p>`
      ],
      [
        '4. MLOps: versionado y despliegue',
        c`<p>Versiona prompts, modelos (registro con hash), índices vectoriales y configuración. Despliegues canary o A/B con las métricas de la evaluación continua y rollback rápido. La infraestructura como código (Compose, Helm) forma parte del entregable.</p>`
      ],
      [
        '5. Despliegue en la nube',
        c`<p>Para un backend de IA sin GPU (que llama a APIs de modelos), los servicios de contenedores gestionados (Google Cloud Run, Azure Container Apps, AWS App Runner) son la opción más sencilla: despliegas una imagen, escala a cero cuando no hay uso y pagas por petición. Para modelos propios con GPU, máquinas con GPU o Kubernetes. Elige región en la UE cuando trates datos personales.</p>`
      ],
      [
        '6. Observabilidad',
        c`<p>Cada petición genera una <strong>traza</strong> con sus <em>spans</em>: recuperación, reranking, llamadas al LLM (prompt, respuesta, tokens, latencia, coste), herramientas. Langfuse añade sesiones, usuarios (seudonimizados), feedback y evaluaciones online sobre tráfico real. Cuidado con registrar datos personales en los prompts: aplica minimización y enmascaramiento.</p>`
      ],
      [
        '7. Evaluaciones en CI',
        c`<p>Los tests de LLM se ejecutan como tests (pytest/DeepEval) con umbrales: si la fidelidad media baja de 0,85, el pipeline falla. Ejecuta un subconjunto rápido en cada PR y el conjunto completo antes de cada despliegue.</p>`
      ],
      [
        '8. Costes',
        c`<p>Mide coste por petición y por usuario, cachea prompts repetidos, elige el modelo más pequeño que cumpla la calidad, limita la salida y pon presupuestos por aplicación con alertas. El panel de monitorización debe mostrar coste junto a latencia y errores.</p>`
      ],
      [
        '9. Seguridad en producción: guardrails',
        c`<p><strong>Entrada</strong>: detección de PII, temas fuera de alcance, intentos de inyección. <strong>Salida</strong>: validación de esquema, detección de PII o secretos, enlaces no permitidos, escape HTML antes de renderizar. <strong>Herramientas</strong>: autorización por usuario, listas blancas, límites de tasa y coste.</p>`
      ]
    ],
    flujo: [
      'Apps del centro',
      'LiteLLM Proxy (claves virtuales, presupuestos)',
      'Claude | Gemini | vLLM local',
      'API de documentos',
      'Cola Redis',
      'Workers',
      'Prometheus → Grafana'
    ],
    tabla: {
      cap: 'Estrategias de escalado',
      head: ['Problema', 'Solución', 'Herramienta'],
      rows: [
        ['Límites de tasa del proveedor', 'Balanceo entre claves/regiones y fallbacks', 'LiteLLM'],
        ['Picos de trabajos pesados', 'Cola + workers con concurrencia limitada', 'Redis + arq / Celery'],
        ['GPU infrautilizada', 'Continuous batching', 'vLLM'],
        ['Coste descontrolado', 'Presupuestos por clave y alertas', 'LiteLLM + Grafana'],
        ['Arranque lento del modelo', 'Réplicas mínimas y caché del modelo en volumen', 'Kubernetes PVC']
      ]
    },
    claves: [
      'Las aplicaciones nunca tienen las claves de los proveedores: hablan con la pasarela.',
      'Todo trabajo de más de ~30 s va a una cola.',
      'Escala por la métrica que limita (cola, concurrencia), no solo por CPU.',
      'Coste, latencia, errores y calidad: las cuatro métricas del panel de una app con IA.'
    ]
  },
  taller: {
    entorno: c`PowerShell 7 · Docker Desktop · kind o k3d (Kubernetes local) · GPU opcional · cuenta en un proveedor cloud con créditos educativos`,
    pasos: [
      {
        t: 'Dockerfile multi-stage de la API de IA',
        lang: 'dockerfile',
        file: 'Dockerfile',
        code: c`
FROM python:3.12-slim AS build
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src

FROM python:3.12-slim
RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY --from=build /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]`
      },
      {
        t: 'Configuración de LiteLLM Proxy',
        lang: 'yaml',
        file: 'litellm/config.yaml',
        code: c`
model_list:
  - model_name: asistente-general
    litellm_params:
      model: anthropic/claude-sonnet-5-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: asistente-general
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GEMINI_API_KEY
  - model_name: soberano
    litellm_params:
      model: hosted_vllm/Qwen/Qwen2.5-7B-Instruct-AWQ
      api_base: http://vllm:8000/v1

router_settings:
  routing_strategy: simple-shuffle
  num_retries: 2
  timeout: 120
  fallbacks:
    - asistente-general: ["soberano"]

litellm_settings:
  drop_params: true

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL       # necesario para claves virtuales y presupuestos`
      },
      {
        t: 'Stack completo con Docker Compose (GPU incluida)',
        lang: 'yaml',
        file: 'docker-compose.yml',
        code: c`
services:
  api:
    build: .
    environment:
      LLM_BASE_URL: http://litellm:4000
      LLM_API_KEY: \${LITELLM_VIRTUAL_KEY}
      REDIS_URL: redis://redis:6379
    depends_on: [litellm, redis]
    ports: ["8000:8000"]
  worker:
    build: .
    command: ["arq", "src.worker.WorkerSettings"]
    environment: { REDIS_URL: "redis://redis:6379", LLM_BASE_URL: "http://litellm:4000", LLM_API_KEY: "\${LITELLM_VIRTUAL_KEY}" }
    deploy: { replicas: 2 }
  litellm:
    image: ghcr.io/berriai/litellm:main-stable
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    volumes: ["./litellm/config.yaml:/app/config.yaml:ro"]
    env_file: .env
    depends_on: [postgres]
  vllm:
    image: vllm/vllm-openai:latest
    command: ["--model", "Qwen/Qwen2.5-7B-Instruct-AWQ", "--max-model-len", "8192"]
    volumes: ["hf-cache:/root/.cache/huggingface"]
    deploy:
      resources:
        reservations:
          devices: [{ driver: nvidia, count: 1, capabilities: [gpu] }]
  redis: { image: "redis:7-alpine" }
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: "\${POSTGRES_PASSWORD}", POSTGRES_DB: litellm }
volumes:
  hf-cache: {}`
      },
      {
        t: 'Cola de inferencia asíncrona con arq',
        lang: 'python',
        file: 'src/worker.py',
        code: c`
import os
from arq import create_pool
from arq.connections import RedisSettings
from openai import AsyncOpenAI

llm = AsyncOpenAI(base_url=os.environ["LLM_BASE_URL"], api_key=os.environ["LLM_API_KEY"])   # habla con LiteLLM


async def resumir_memoria(ctx, documento_id: str, texto: str) -> dict:
    r = await llm.chat.completions.create(model="asistente-general", max_tokens=1500,
        messages=[{"role": "user", "content": f"Resume esta memoria de prácticas en 10 líneas:\n{texto}"}])
    return {"documento_id": documento_id, "resumen": r.choices[0].message.content}


class WorkerSettings:
    functions = [resumir_memoria]
    redis_settings = RedisSettings.from_dsn(os.environ["REDIS_URL"])
    max_jobs = 8                     # concurrencia por worker: protege los límites de tasa
    job_timeout = 300


# En la API (FastAPI):
#   pool = await create_pool(RedisSettings.from_dsn(os.environ["REDIS_URL"]))
#   job = await pool.enqueue_job("resumir_memoria", doc_id, texto)   → devolver job.job_id (202 Accepted)
#   estado: await Job(job_id, pool).status() / .result(timeout=0)`
      },
      {
        t: 'Desplegar la API en la nube (ejemplo: Google Cloud Run en Madrid)',
        d: 'La clave del proveedor de IA se guarda en el gestor de secretos, no en la imagen ni en variables en claro.',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
gcloud auth login
gcloud config set project mi-proyecto-mia
gcloud services enable run.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com
"sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-
gcloud run deploy api-ia --source . --region europe-southwest1 --allow-unauthenticated --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest --min-instances 0 --max-instances 3 --memory 1Gi
gcloud run services describe api-ia --region europe-southwest1 --format "value(status.url)"`
      },
      {
        t: 'Langfuse self-hosted (los datos no salen del centro)',
        lang: 'powershell',
        file: 'PowerShell',
        code: c`
git clone https://github.com/langfuse/langfuse.git
cd langfuse
docker compose up -d                       # interfaz en http://localhost:3000
cd ..
uv add langfuse ragas deepeval langchain-anthropic pytest
[Environment]::SetEnvironmentVariable("LANGFUSE_HOST", "http://localhost:3000", "User")
# Crea un proyecto en la interfaz y guarda LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY como variables de usuario`
      },
      {
        t: 'Instrumentar el pipeline RAG con trazas',
        lang: 'python',
        file: 'src/rag_observado.py',
        code: c`
import hashlib
from langfuse import get_client, observe
from recuperadores import Hibrido
from rerank import reordenar
from responder import client, SISTEMA

langfuse = get_client()


def seudonimo(usuario: str) -> str:
    return hashlib.sha256(("sal-jro-" + usuario).encode()).hexdigest()[:12]


@observe(name="recuperacion")
def recuperar(h: Hibrido, pregunta: str):
    return reordenar(pregunta, [h.frags[i] for i in h.buscar(pregunta, 40)], top=6)


@observe(name="generacion", as_type="generation")
def generar(pregunta: str, contexto: list[dict]) -> str:
    bloques = "\n\n".join(f"[{i+1}] {c['texto']}" for i, c in enumerate(contexto))
    r = client.messages.create(model="claude-opus-5-5", max_tokens=3000, system=SISTEMA,
                               messages=[{"role": "user", "content": f"<fragmentos>{bloques}</fragmentos>\n{pregunta}"}])
    langfuse.update_current_generation(model="claude-opus-5-5",
        usage_details={"input": r.usage.input_tokens, "output": r.usage.output_tokens})
    return r.content[0].text


@observe(name="consulta-normativa")
def consultar(h: Hibrido, pregunta: str, usuario: str) -> str:
    langfuse.update_current_trace(user_id=seudonimo(usuario), tags=["rag", "v2.3"])
    return generar(pregunta, recuperar(h, pregunta))`
      },
      {
        t: 'Job de CI con umbrales',
        lang: 'yaml',
        file: '.github/workflows/evals.yml',
        code: c`
name: evals
on:
  pull_request:
    paths: ["src/**", "prompts/**", "eval/**"]
jobs:
  calidad-llm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync
      - run: uv run pytest tests/test_rag_calidad.py -q --maxfail=5
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}`
      }
    ]
  },
  prompts: [
    {
      t: 'Revisor de Dockerfiles y manifiestos de IA',
      tipo: 'System Prompt',
      lang: 'markdown',
      code: c`
Revisa estos ficheros de despliegue (Dockerfile, compose, manifiestos K8s) de un
servicio de IA. Comprueba: usuario no root, secretos fuera de la imagen, modelos
fuera de la imagen, healthchecks/readiness que reflejan la carga del modelo, límites
de recursos (GPU, memoria), versiones de imagen fijadas y exposición de puertos mínima.
Devuelve una tabla Fichero | Problema | Riesgo | Corrección, ordenada por riesgo.`
    },
    {
      t: 'Runbook de incidencia "proveedor LLM caído"',
      tipo: 'Plantilla',
      lang: 'markdown',
      file: 'RUNBOOK.md',
      code: c`
## Incidencia: errores 5xx/529 del proveedor principal
1. Confirmar en Grafana: tasa de error por modelo en LiteLLM > 5 % durante 5 min.
2. Verificar que el fallback a "soberano" está activo (logs de LiteLLM).
3. Si vLLM local está saturado: escalar réplicas o activar cola con mensajes de espera.
4. Comunicar en el canal del claustro si la degradación supera 15 min.
5. Post-mortem: duración, impacto (peticiones fallidas), acciones preventivas.`
    },
    {
      t: 'Clasificador de fallos de producción',
      tipo: 'Structured Output',
      lang: 'python',
      code: c`
from typing import Literal
from pydantic import BaseModel


class DiagnosticoFallo(BaseModel):
    componente: Literal["recuperacion", "reranking", "generacion", "prompt", "datos_fuente", "fuera_de_alcance"]
    tipo: Literal["alucinacion", "omision", "cita_erronea", "no_abstencion", "abstencion_indebida", "formato"]
    nuevo_caso_golden: bool
    explicacion: str
# Entrada: traza de Langfuse con feedback negativo → diagnóstico automático → revisión humana`
    }
  ],
  actividad: {
    tipo: 'proyecto',
    titulo: 'Proyecto del módulo M6: app multiplataforma con IA desplegada en la nube y con panel de monitorización',
    contexto: c`Integra en una app multiplataforma (Android, Flutter, web o escritorio) una funcionalidad de IA servida por un backend desplegado en la nube, con monitorización de uso, coste, latencia, errores y calidad.`,
    requisitos: [
      'App funcional con al menos una función de IA y buena experiencia de usuario (semana 11).',
      'Backend contenerizado y desplegado en la nube con secretos gestionados y HTTPS.',
      'Pasarela o capa de control con presupuesto, reintentos y fallback.',
      'Panel de monitorización (Langfuse, Grafana o similar) con coste, latencia, errores y feedback de usuarios.',
      'Evaluación continua: batería de pruebas en CI que bloquea despliegues con regresiones.',
      'Vídeo de defensa de 5 minutos.'
    ],
    entregables: [
      'Repositorio de la app y del backend',
      'URL del servicio desplegado (o instrucciones reproducibles)',
      'Capturas del panel',
      'Enlace al vídeo de defensa (5 min)'
    ],
    rubrica: [
      ['Funcionamiento', 30],
      ['Calidad técnica', 30],
      ['Documentación', 20],
      ['Vídeo de defensa (5 min)', 20]
    ]
  },
  faq: [
    [
      'El contenedor no ve la GPU.',
      c`Instala el driver NVIDIA en el host y NVIDIA Container Toolkit; en Windows usa Docker Desktop con WSL2 y drivers NVIDIA para WSL. Comprueba con <code>docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi</code>.`
    ],
    [
      'La imagen pesa 15 GB.',
      c`No incluyas los pesos del modelo ni toolchains de compilación: multi-stage, imágenes slim, y modelos en volúmenes o descargados en el arranque. Las imágenes con CUDA son grandes por naturaleza: usa la variante <em>runtime</em>, no <em>devel</em>.`
    ],
    [
      '¿LiteLLM añade latencia?',
      c`Unos pocos milisegundos, despreciables frente a la latencia del LLM. A cambio obtienes control de costes, fallbacks y un único punto de observabilidad y seguridad.`
    ],
    [
      '¿Necesito Kubernetes?',
      c`Para un centro educativo, Docker Compose en uno o dos servidores suele bastar. Kubernetes compensa con múltiples servicios, escalado automático y equipos de operación. Aprenderlo te prepara para el entorno empresarial.`
    ],
    [
      '¿Puedo registrar los prompts completos en Langfuse?',
      c`Solo si no contienen datos personales innecesarios o si los enmascaras antes (Presidio, M7). Con Langfuse self-hosted los datos no salen del centro, pero siguen siendo un tratamiento con plazos de conservación definidos.`
    ]
  ]
});
