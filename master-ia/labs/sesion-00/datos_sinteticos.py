"""Genera alumnado de FP ficticio para las prácticas.

Nunca se usan datos reales de personas: la relación entre variables está definida aquí,
así que sabemos qué "debería" aprender un modelo y podemos comprobarlo.
"""

import numpy as np

COLUMNAS = ["nota_media", "faltas_trimestre", "horas_estudio_semana", "trabaja"]


def generar_alumnado(n: int = 1000, semilla: int = 42) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Devuelve (X, y, columnas). y = 1 si el alumno promociona de curso."""
    rng = np.random.default_rng(semilla)
    nota = np.clip(rng.normal(6.2, 1.6, n), 0, 10)
    faltas = rng.poisson(6, n).clip(0, 40)
    horas = np.clip(rng.normal(8, 4, n), 0, 25)
    trabaja = rng.binomial(1, 0.3, n)

    # Regla "oculta" que el modelo tendrá que descubrir, más ruido aleatorio
    puntuacion = 1.1 * (nota - 5) - 0.18 * (faltas - 6) + 0.12 * (horas - 8) - 0.4 * trabaja
    probabilidad = 1 / (1 + np.exp(-puntuacion))
    y = rng.binomial(1, probabilidad)

    X = np.column_stack([nota.round(1), faltas, horas.round(1), trabaja]).astype(np.float64)
    return X, y, list(COLUMNAS)
