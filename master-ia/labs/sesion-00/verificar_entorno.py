"""Sesión 0 · Comprueba que el equipo tiene todo lo necesario para el Máster.

Ejecuta: uv run python verificar_entorno.py
Sale con código 1 si falta alguna herramienta obligatoria.
"""

import json
import platform
import re
import shutil
import subprocess
import sys
import urllib.request
from dataclasses import dataclass


@dataclass
class Resultado:
    nombre: str
    ok: bool
    detalle: str
    obligatorio: bool = True
    ayuda: str = ""


def version_tupla(texto: str) -> tuple[int, ...]:
    """Extrae la primera versión 'X.Y[.Z]' (o 'X') de un texto: 'openjdk 21.0.4' -> (21, 0, 4)."""
    m = re.search(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?", texto)
    if not m:
        return ()
    return tuple(int(g) for g in m.groups() if g is not None)


def ejecutar(*cmd: str) -> str | None:
    """Devuelve stdout+stderr del comando, o None si no existe o falla."""
    if not shutil.which(cmd[0]):
        return None
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return (r.stdout + r.stderr).strip() if r.returncode == 0 else None


def comprobar_version(nombre: str, cmd: list[str], minima: tuple[int, ...], ayuda: str,
                      obligatorio: bool = True, patron: str | None = None) -> Resultado:
    salida = ejecutar(*cmd)
    if salida is None:
        return Resultado(nombre, False, "no encontrado", obligatorio, ayuda)
    if patron:
        m = re.search(patron, salida)
        salida = m.group(1) if m else salida
    version = version_tupla(salida)
    texto = ".".join(map(str, version)) or salida.splitlines()[0]
    if version and version < minima:
        return Resultado(nombre, False, f"{texto} (se necesita ≥ {'.'.join(map(str, minima))})", obligatorio, ayuda)
    return Resultado(nombre, True, texto, obligatorio)


def comprobar_python() -> Resultado:
    v = sys.version_info
    ok = (v.major, v.minor) >= (3, 12)
    return Resultado("Python", ok, f"{v.major}.{v.minor}.{v.micro}", True, "uv python install 3.12")


def comprobar_docker() -> Resultado:
    if not shutil.which("docker"):
        return Resultado("Docker", False, "no encontrado", True, "winget install Docker.DockerDesktop")
    info = ejecutar("docker", "info", "--format", "{{.ServerVersion}}")
    if info is None:
        return Resultado("Docker", False, "instalado pero el motor no responde", True, "Abre Docker Desktop y espera a que arranque")
    return Resultado("Docker", True, f"motor {info.splitlines()[-1]}")


def comprobar_ollama(url: str = "http://localhost:11434") -> Resultado:
    try:
        with urllib.request.urlopen(url + "/api/tags", timeout=3) as r:
            modelos = [m["name"] for m in json.load(r).get("models", [])]
    except (OSError, ValueError):
        ayuda = "winget install Ollama.Ollama y después: ollama pull qwen2.5:1.5b"
        return Resultado("Ollama", False, "el servidor no responde en " + url, True, ayuda)
    if not modelos:
        return Resultado("Ollama", False, "sin modelos descargados", True, "ollama pull qwen2.5:1.5b")
    return Resultado("Ollama", True, f"{len(modelos)} modelo(s): {', '.join(modelos[:3])}")


def comprobar_gpu() -> Resultado:
    nvidia = ejecutar("nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader")
    if nvidia:
        return Resultado("GPU", True, "NVIDIA " + nvidia.splitlines()[0], obligatorio=False)
    if platform.system() == "Darwin" and platform.machine() == "arm64":
        return Resultado("GPU", True, "Apple Silicon (MPS)", obligatorio=False)
    return Resultado("GPU", False, "no detectada: usarás CPU y GPU en la nube (Colab/Kaggle)", obligatorio=False)


def comprobar_disco(minimo_gb: int = 40) -> Resultado:
    libre = shutil.disk_usage(".").free / 1e9
    return Resultado("Espacio en disco", libre >= minimo_gb, f"{libre:.0f} GB libres",
                     obligatorio=False, ayuda=f"Se recomiendan ≥ {minimo_gb} GB para modelos e imágenes Docker")


def comprobaciones() -> list[Resultado]:
    return [
        comprobar_python(),
        comprobar_version("uv", ["uv", "--version"], (0, 4), "irm https://astral.sh/uv/install.ps1 | iex"),
        comprobar_version("Git", ["git", "--version"], (2, 30), "winget install Git.Git"),
        comprobar_version("Java (JDK)", ["java", "-version"], (21,), "winget install EclipseAdoptium.Temurin.21.JDK",
                          patron=r'version "([^"]+)"'),
        comprobar_version("Node.js", ["node", "--version"], (20,), "winget install OpenJS.NodeJS.LTS"),
        comprobar_docker(),
        comprobar_ollama(),
        comprobar_version("VS Code", ["code", "--version"], (1,), "winget install Microsoft.VisualStudioCode",
                          obligatorio=False),
        comprobar_gpu(),
        comprobar_disco(),
    ]


def main() -> int:
    print(f"Máster IA · FP José Ramón Otero · Verificación del entorno ({platform.system()} {platform.machine()})\n")
    resultados = comprobaciones()
    for r in resultados:
        marca = "✔" if r.ok else ("✘" if r.obligatorio else "·")
        print(f" {marca} {r.nombre:<17} {r.detalle}")
        if not r.ok and r.ayuda:
            print(f"   {'':<17} → {r.ayuda}")
    faltan = [r.nombre for r in resultados if r.obligatorio and not r.ok]
    print("\n" + ("Entorno listo para el Máster." if not faltan else "Falta por resolver: " + ", ".join(faltan)))
    return 1 if faltan else 0


if __name__ == "__main__":
    sys.exit(main())
