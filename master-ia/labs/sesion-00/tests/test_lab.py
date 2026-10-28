import numpy as np

from datos_sinteticos import COLUMNAS, generar_alumnado
from primer_modelo import entrenar
from verificar_entorno import comprobar_python, version_tupla


def test_datos_tienen_forma_y_son_reproducibles():
    X1, y1, columnas = generar_alumnado(n=200, semilla=7)
    X2, y2, _ = generar_alumnado(n=200, semilla=7)
    assert X1.shape == (200, len(COLUMNAS)) and columnas == COLUMNAS
    assert np.array_equal(X1, X2) and np.array_equal(y1, y2)
    assert set(np.unique(y1)) <= {0, 1}


def test_datos_respetan_rangos():
    X, _, _ = generar_alumnado(n=500)
    assert X[:, 0].min() >= 0 and X[:, 0].max() <= 10          # nota
    assert X[:, 1].min() >= 0                                    # faltas
    assert set(np.unique(X[:, 3])) <= {0.0, 1.0}                 # trabaja


def test_el_modelo_aprende_mejor_que_el_azar():
    _, exactitud, _ = entrenar()
    assert exactitud > 0.7


def test_version_tupla():
    assert version_tupla("openjdk 21.0.4 2024-07-16") == (21, 0, 4)
    assert version_tupla("v22.11.0") == (22, 11, 0)
    assert version_tupla("git version 2.47.1.windows.1") == (2, 47, 1)
    assert version_tupla("21") == (21,)
    assert version_tupla("sin versión") == ()


def test_python_cumple_minimo():
    assert comprobar_python().ok
