"""Sesión 0 · Tu primer modelo de machine learning.

Ciclo completo: datos -> entrenamiento -> evaluación -> inferencia.
Ejecuta: uv run python primer_modelo.py
"""

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text

from datos_sinteticos import generar_alumnado


def entrenar(semilla: int = 42) -> tuple[DecisionTreeClassifier, float, list[str]]:
    X, y, columnas = generar_alumnado(n=1000, semilla=semilla)       # datos + resultado esperado
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=semilla, stratify=y)

    modelo = DecisionTreeClassifier(max_depth=3, random_state=semilla)  # el modelo
    modelo.fit(X_train, y_train)                                       # entrenamiento
    return modelo, modelo.score(X_test, y_test), columnas              # evaluación con datos no vistos


if __name__ == "__main__":
    modelo, exactitud, columnas = entrenar()
    print(f"Exactitud con datos nunca vistos: {exactitud:.1%}")
    print("\nReglas aprendidas (¡no las hemos escrito nosotros!):")
    print(export_text(modelo, feature_names=columnas))

    nueva = [[7.5, 2, 10, 1]]  # nota 7,5 · 2 faltas · 10 h de estudio · trabaja
    print("Alumno nuevo -> ¿promociona?", "sí" if modelo.predict(nueva)[0] == 1 else "no")
    print(f"Probabilidad estimada: {modelo.predict_proba(nueva)[0][1]:.0%}")
