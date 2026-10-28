"""Sesión 0 (opcional) · La misma pregunta a un modelo de frontera (Claude).

Requisitos: variable de entorno ANTHROPIC_API_KEY.
Ejecuta: uv run python hola_ia_claude.py ["tu pregunta"]
"""

import sys
import time

import anthropic

SISTEMA = "Eres un tutor de IA. Responde en español, en menos de 120 palabras."


def preguntar(pregunta: str) -> None:
    cliente = anthropic.Anthropic()   # lee ANTHROPIC_API_KEY del entorno
    inicio = time.perf_counter()
    respuesta = cliente.messages.create(
        model="claude-opus-5-5",
        max_tokens=1000,
        output_config={"effort": "low"},   # tarea sencilla: menos razonamiento, más rápido y barato
        system=SISTEMA,
        messages=[{"role": "user", "content": pregunta}],
    )
    segundos = time.perf_counter() - inicio
    if respuesta.stop_reason == "refusal":
        print("El modelo ha declinado la petición.")
    else:
        print("".join(b.text for b in respuesta.content if b.type == "text"))
    u = respuesta.usage
    print(f"\n[{respuesta.model}] {u.input_tokens} tokens de entrada, {u.output_tokens} de salida, {segundos:.1f} s")


if __name__ == "__main__":
    texto = " ".join(sys.argv[1:]) or "Soy titulado en DAM. Explícame con una analogía de programación qué es un LLM."
    try:
        preguntar(texto)
    except anthropic.AuthenticationError:
        sys.exit("Falta una clave válida en ANTHROPIC_API_KEY.")
    except anthropic.APIConnectionError:
        sys.exit("No hay conexión con la API de Anthropic.")
