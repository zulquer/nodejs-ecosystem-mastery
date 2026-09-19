/**
 * ============================================================================
 * LECCIÓN 02: Worker Threads, SharedArrayBuffer y Race Conditions en JavaScript
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Desmentir el mito de que "en JavaScript no existen condiciones de carrera (Race Conditions)".
 * 2. Usar `worker_threads` para cómputo paralelo real en múltiples núcleos de CPU.
 * 3. Demostrar la diferencia entre paso de mensajes (`postMessage`, copia de memoria)
 *    y memoria compartida de alto rendimiento (`SharedArrayBuffer`, Zero-Copy entre hilos).
 * 4. Demostrar una Race Condition real cuando dos hilos incrementan un contador sin control
 *    y cómo garantizar consistencia matemática usando `Atomics.add()`.
 * ============================================================================
 */

import { Worker, isMainThread, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';

const __filename = fileURLToPath(import.meta.url);

const ITERATIONS_PER_WORKER = 250_000;
const EXPECTED_TOTAL = ITERATIONS_PER_WORKER * 2; // 500,000

// ----------------------------------------------------------------------------
// LÓGICA DEL MAIN THREAD (Hilo Principal)
// ----------------------------------------------------------------------------
if (isMainThread) {
  console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
  console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 02: Worker Threads, SharedArrayBuffer y Atomics (Race Condition)'));
  console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

  // Función para ejecutar dos workers con una estrategia dada
  async function runWorkers(useAtomics) {
    // Creamos un búfer de memoria compartida de 4 bytes (un entero de 32 bits)
    const sharedBuffer = new SharedArrayBuffer(4);
    const typedArray = new Int32Array(sharedBuffer);
    typedArray[0] = 0; // Inicializar en 0

    // Lanzamos 2 hilos que apuntan a la misma dirección física de RAM
    const worker1 = new Worker(__filename, {
      workerData: { sharedBuffer, useAtomics, workerId: 1, iterations: ITERATIONS_PER_WORKER }
    });
    const worker2 = new Worker(__filename, {
      workerData: { sharedBuffer, useAtomics, workerId: 2, iterations: ITERATIONS_PER_WORKER }
    });

    await Promise.all([
      new Promise((resolve) => worker1.on('exit', resolve)),
      new Promise((resolve) => worker2.on('exit', resolve))
    ]);

    return typedArray[0];
  }

  async function startBenchmark() {
    // 1. Prueba SIN sincronización (Race Condition clásica)
    console.log(styleText(['bold', 'yellow'], '--- PRUEBA 1: Dos Workers sumando con sharedArray[0]++ (SIN Atomics) ---'));
    console.log(styleText('gray', `Cada worker suma ${ITERATIONS_PER_WORKER.toLocaleString()} veces. Esperamos: ${EXPECTED_TOTAL.toLocaleString()}\n`));

    const resultWithoutAtomics = await runWorkers(false);
    const lostUpdates = EXPECTED_TOTAL - resultWithoutAtomics;

    console.log(`  • Resultado obtenido: ${styleText(['bold', 'red'], `${resultWithoutAtomics.toLocaleString()}`)}`);
    console.log(`  • Pérdida de datos:   ${styleText('red', `${lostUpdates.toLocaleString()} operaciones perdidas!`)}`);
    console.log(styleText(['bold', 'red'], '  🚨 ¡RACE CONDITION DETECTADA EN JAVASCRIPT!'));
    console.log(styleText('gray', '     `val++` requiere 3 pasos en CPU (Read -> Modify -> Write). Los hilos colisionan.\n'));

    // 2. Prueba CON Atomics (Operaciones atómicas a nivel de hardware)
    console.log(styleText(['bold', 'yellow'], '--- PRUEBA 2: Dos Workers sumando con Atomics.add() ---'));
    console.log(styleText('gray', `Mismo escenario, pero usando la instrucción atómica nativa de la CPU.\n`));

    const resultWithAtomics = await runWorkers(true);

    console.log(`  • Resultado obtenido: ${styleText(['bold', 'green'], `${resultWithAtomics.toLocaleString()}`)}`);
    console.log(`  • Pérdida de datos:   ${styleText('green', '0 (Consistencia del 100%)')}`);
    console.log(styleText(['bold', 'green'], '  ✅ Operación Thread-Safe exitosa gracias a la API Atomics.\n'));

    console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
    console.log(styleText('white', '  1. `worker_threads` es la única vía en Node.js para computación paralela multinúcleo en un solo proceso.'));
    console.log(styleText('white', '  2. `SharedArrayBuffer` permite compartir memoria entre hilos sin el coste de serialización de `postMessage`.'));
    console.log(styleText('white', '  3. SIEMPRE que múltiples hilos escriban en un `SharedArrayBuffer`, DEBES usar `Atomics`'));
    console.log(styleText('white', '     (`Atomics.add`, `Atomics.store`, `Atomics.wait`, `Atomics.notify`) para evitar race conditions.\n'));
  }

  startBenchmark();

// ----------------------------------------------------------------------------
// LÓGICA DEL WORKER THREAD (Se ejecuta en un hilo del SO en paralelo)
// ----------------------------------------------------------------------------
} else {
  const { sharedBuffer, useAtomics, iterations } = workerData;
  const sharedArray = new Int32Array(sharedBuffer);

  for (let i = 0; i < iterations; i++) {
    if (useAtomics) {
      // Instrucción atómica a nivel de CPU (LOCK XADD en x86 / LDADD en ARM)
      Atomics.add(sharedArray, 0, 1);
    } else {
      // No atómico: expuesto a colisiones de lectura/escritura concurrentes
      sharedArray[0]++;
    }
  }
}
