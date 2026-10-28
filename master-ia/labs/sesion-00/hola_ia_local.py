"""Sesión 0 · Primera llamada a un LLM local (Ollama), sin claves ni coste.

Requisitos: Ollama en ejecución y el modelo descargado (ollama pull qwen2.5:1.5b).
Ejecuta: uv run python hola_ia_local.py ["tu pregunta"]
"""

import os
import sys
import time

from openai import APIConnectionError, OpenAI

URL = os.environ.get("OLLAMA_URL", "http://localhost:11434") + "/v1"
MODELO = os.environ.get("MODELO_LOCAL", "qwen2.5:1.5b")
SISTEMA = "Eres un tutor de IA. Responde en español, en menos de 120 palabras."


def preguntar(pregunta: str) -> None:
    cliente = OpenAI(base_url=URL, api_key="ollama")   # Ollama ignora la clave
    inicio = time.perf_counter()
    respuesta = cliente.chat.completions.create(
        model=MODELO,
        messages=[{"role": "system", "content": SISTEMA}, {"role": "user", "content": pregunta}],
    )
    segundos = time.perf_counter() - inicio
    print(respuesta.choices[0].message.content)
    print(f"\n[{MODELO}] {respuesta.usage.prompt_tokens} tokens de entrada, "
          f"{respuesta.usage.completion_tokens} de salida, {segundos:.1f} s")


if __name__ == "__main__":
    texto = " ".join(sys.argv[1:]) or "Soy titulado en DAM. Explícame con una analogía de programación qué es un LLM."
    try:
        preguntar(texto)
    except APIConnectionError:
        sys.exit(f"No hay conexión con Ollama en {URL}. ¿Está arrancado? Prueba: ollama run {MODELO}")
