// Módulo 5 · Sistemas: memoria manual (C) y concurrencia (Python, Java, Kotlin, Swift).
import { check } from './helpers.js';
import { analyzeConcurrency } from '../core/analyzer.js';

const systems = {
  id: 'm5-systems',
  module: 5,
  title: 'Núcleo del Sistema',
  codename: 'KERNEL.SYNC',
  scene: (lang) => (lang === 'c' ? 'heap' : 'concurrency'),
  xp: 320,
  mode: (lang) => (lang === 'c' ? 'run' : 'static'),
  story: 'Último módulo antes del jefe final. En C gestionas a mano la memoria de los escudos: cada byte que pides con malloc debes devolverlo con free, o el heap se desangra. En el resto de lenguajes, tres sondas escanean tres sectores: si las lanzas una detrás de otra tardas 3 s; si las lanzas a la vez, 1 s.',
  objective: {
    c: 'Reserva shields para 8 int y buffer para 4 int, rellena shields[i] = i * 10, y libera TODO al final. Sin overflow de heap, sin use-after-free, sin fugas.',
    default: 'Lanza los 3 escaneos de forma concurrente (todos antes de esperar), espera a que terminen todos y combina el resultado sin carreras de datos.',
  },
  concept: {
    title: 'Memoria manual y concurrencia',
    text: 'malloc(bytes) reserva memoria en el heap y devuelve un puntero; free() la devuelve. Olvidar free = fuga; usar tras free = use-after-free; pedir pocos bytes = overflow. Concurrencia: lanzar varias tareas antes de esperar a ninguna; si comparten una variable mutable, protégela (atómicos, mutex, actores) o, mejor, devuelve valores y combínalos al final.',
  },
  starter: {
    c: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *shields = malloc(8);              // ⚠ ¿8 qué? ¿bytes o ints?
    for (int i = 0; i < 8; i++) {
        shields[i] = i * 10;
    }

    int *buffer = malloc(4 * sizeof(int));
    for (int i = 0; i < 4; i++) {
        buffer[i] = shields[i] + 1;
    }

    printf("Escudo máximo: %d\\n", shields[7]);
    free(shields);
    // ⚠ ¿falta algo?
    return 0;
}
`,
    python: `import asyncio

async def scan(sector):
    await asyncio.sleep(1)   # el sensor tarda 1 s
    return sector * 10

async def main():
    results = []
    for sector in range(3):
        results.append(await scan(sector))   # ⚠ una detrás de otra
    print("Minerales:", sum(results))

asyncio.run(main())
`,
    java: `import java.util.*;

public class Main {
    static int total = 0;

    static int scan(int sector) throws InterruptedException {
        Thread.sleep(1000); // el sensor tarda 1 s
        return sector * 10;
    }

    public static void main(String[] args) throws Exception {
        for (int s = 0; s < 3; s++) {
            final int sector = s;
            Thread t = new Thread(() -> {
                try { total += scan(sector); } catch (InterruptedException e) { }
            });
            t.start();
            t.join(); // ⚠ espera a cada hilo antes de lanzar el siguiente
        }
        System.out.println("Minerales: " + total);
    }
}
`,
    kotlin: `import kotlinx.coroutines.*

suspend fun scan(sector: Int): Int {
    delay(1000) // el sensor tarda 1 s
    return sector * 10
}

fun main() = runBlocking {
    var total = 0
    for (sector in 0 until 3) {
        val job = launch { total += scan(sector) }
        job.join() // ⚠ espera antes de lanzar la siguiente
    }
    println("Minerales: $total")
}
`,
    swift: `func scan(_ sector: Int) async -> Int {
    try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 s
    return sector * 10
}

func runScanners() async {
    var total = 0
    for sector in 0..<3 {
        total += await scan(sector) // ⚠ una detrás de otra
    }
    print("Minerales: \\(total)")
}
`,
  },
  solution: {
    c: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *shields = malloc(8 * sizeof(int));
    for (int i = 0; i < 8; i++) {
        shields[i] = i * 10;
    }

    int *buffer = malloc(4 * sizeof(int));
    for (int i = 0; i < 4; i++) {
        buffer[i] = shields[i] + 1;
    }

    printf("Escudo máximo: %d\\n", shields[7]);
    free(shields);
    free(buffer);
    return 0;
}
`,
    python: `import asyncio

async def scan(sector):
    await asyncio.sleep(1)
    return sector * 10

async def main():
    results = await asyncio.gather(scan(0), scan(1), scan(2))
    print("Minerales:", sum(results))

asyncio.run(main())
`,
    java: `import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    static AtomicInteger total = new AtomicInteger(0);

    static int scan(int sector) throws InterruptedException {
        Thread.sleep(1000);
        return sector * 10;
    }

    public static void main(String[] args) throws Exception {
        List<Thread> threads = new ArrayList<>();
        for (int s = 0; s < 3; s++) {
            final int sector = s;
            Thread t = new Thread(() -> {
                try { total.addAndGet(scan(sector)); } catch (InterruptedException e) { }
            });
            threads.add(t);
            t.start();
        }
        for (Thread t : threads) {
            t.join();
        }
        System.out.println("Minerales: " + total.get());
    }
}
`,
    kotlin: `import kotlinx.coroutines.*

suspend fun scan(sector: Int): Int {
    delay(1000)
    return sector * 10
}

fun main() = runBlocking {
    val results = (0 until 3).map { s -> async { scan(s) } }.awaitAll()
    println("Minerales: \${results.sum()}")
}
`,
    swift: `func scan(_ sector: Int) async -> Int {
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    return sector * 10
}

func runScanners() async {
    async let a = scan(0)
    async let b = scan(1)
    async let c = scan(2)
    let total = await a + b + c
    print("Minerales: \\(total)")
}
`,
  },
  polyglot: {
    python: 'asyncio es concurrencia cooperativa en UN hilo: await cede el control. gather lanza las corrutinas a la vez. Sin hilos no hay carreras en total += …',
    java: 'Hilos reales del sistema operativo. total += x NO es atómico (leer-sumar-escribir): usa AtomicInteger o synchronized. Arranca todos los hilos y luego haz join de todos.',
    kotlin: 'Corrutinas: hilos ligeros con concurrencia ESTRUCTURADA. async { } devuelve un Deferred; awaitAll() espera a todos. Devolver valores evita compartir estado.',
    swift: 'async let lanza tareas hijas en paralelo y await las recoge. El compilador (Swift 6) prohíbe mutar una var capturada desde tareas concurrentes: los actores protegen el estado.',
    c: 'El heap es tuyo: malloc no inicializa, no comprueba límites y free no anula el puntero. Herramientas como AddressSanitizer y Valgrind detectan lo que ves en pantalla.',
  },
  evaluate({ result, code, lang }) {
    if (lang === 'c') {
      const heap = result && result.state ? result.state.heap : { blocks: [], events: [] };
      const err = result && result.error;
      const blocks = heap.blocks;
      const shieldsBlock = blocks[0];
      const filled = shieldsBlock && shieldsBlock.len >= 8 && [0, 10, 20, 30, 40, 50, 60, 70].every((x, i) => shieldsBlock.data[i] === x);
      const leaks = blocks.filter((b) => !b.freed);
      const memErr = err && ['heapoverflow', 'uaf', 'doublefree', 'invalidfree'].includes(err.code);
      const checks = [
        check('alloc', 'Reserva dos bloques en el heap', blocks.length >= 2, `Bloques: ${blocks.length}`),
        check('size', 'shields tiene sitio para 8 int (32 bytes)', shieldsBlock && shieldsBlock.size >= 32, shieldsBlock ? `malloc(${shieldsBlock.size}) → ${shieldsBlock.len} int` : ''),
        check('safe', 'Sin overflow, use-after-free ni double free', !memErr && !!result && result.ok, memErr ? err.message : ''),
        check('filled', 'shields = [0, 10, …, 70]', filled),
        check('no-leaks', 'Sin fugas: todo malloc tiene su free', blocks.length > 0 && leaks.length === 0 && !memErr, leaks.length ? `${leaks.length} bloque(s) sin liberar: #${leaks.map((b) => b.id).join(', #')}` : ''),
      ];
      return {
        checks,
        scene: {
          blocks: blocks.map((b) => ({ id: b.id, size: b.size, len: b.len, freed: b.freed, line: b.line, addr: b.addr, data: (b.data || []).slice(0, 16) })),
          events: heap.events,
          error: memErr ? err.code : null,
          finished: !!result && result.ok,
        },
      };
    }
    const a = analyzeConcurrency(code, lang);
    const asyncDecl = {
      python: /async\s+def\s+scan/, java: /static\s+\w+\s+scan\s*\(/, kotlin: /suspend\s+fun\s+scan/, swift: /func\s+scan\s*\([^)]*\)\s*async/,
    }[lang].test(code);
    const raceFree = !a.sharedMutation || a.protectedMutation;
    const checks = [
      check('scan', 'Función scan asíncrona definida', asyncDecl),
      check('concurrent', 'Las 3 sondas se lanzan a la vez', a.concurrent, a.concurrent ? `${a.spawnCount} tareas concurrentes` : a.interleaved ? 'Esperas a cada tarea antes de lanzar la siguiente: ejecución en serie.' : 'Las tareas se ejecutan una detrás de otra.'),
      check('waits', 'Espera a que terminen todas antes de usar el resultado', a.waits),
      check('race', 'Sin carreras de datos en el resultado compartido', raceFree,
        raceFree ? '' : lang === 'swift' ? "error: mutation of captured var 'total' in concurrently-executing code" : 'total += … desde varias tareas sin protección: se pueden perder sumas.'),
    ];
    return { checks, scene: { concurrent: a.concurrent, tasks: Math.max(3, a.tasks), race: !raceFree, lang } };
  },
  duck: {
    size: ['malloc recibe BYTES. ¿Cuántos bytes ocupa un int? ¿Y ocho?', '¿Qué operador de C te dice el tamaño de un tipo?'],
    safe: ['Lee el stack trace: ¿en qué línea se accede fuera del bloque? ¿Cuántos elementos caben en lo que reservaste?'],
    'no-leaks': ['Cuenta tus malloc y tus free. ¿Coinciden?', 'Si el programa terminara y volviera a empezar un millón de veces, ¿qué pasaría con la memoria no liberada?'],
    filled: ['¿Qué valor debería tener shields[3]?'],
    alloc: ['¿Cuántas veces llamas a malloc?'],
    scan: ['¿Cómo marca tu lenguaje que una función puede suspenderse mientras espera?'],
    concurrent: [
      'Si cada escaneo tarda 1 s, ¿cuánto tarda tu programa en total? ¿Por qué?',
      '¿En qué momento esperas a la primera sonda: antes o después de lanzar la segunda?',
      '¿Puedes lanzar las tres primero y esperarlas todas después?',
    ],
    waits: ['¿Qué pasaría si imprimes el total antes de que las sondas terminen?'],
    race: ['Dos hilos leen total = 10 a la vez, ambos suman y escriben. ¿Cuánto vale total al final?', '¿Y si en vez de compartir una variable, cada tarea DEVOLVIERA su valor?'],
  },
};

export default [systems];
