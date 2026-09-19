/**
 * ============================================================================
 * LECCIÓN 03: Event Loop Starvation (Inanición) y Medición de Lag Nativo
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Comprender qué es el Event Loop Starvation y por qué derriba servidores en producción.
 * 2. Medir el retraso del Event Loop (Event Loop Delay) con la API nativa `perf_hooks.monitorEventLoopDelay()`.
 * 3. Aprender la técnica de "Event Loop Yielding" (ceder el turno con setImmediate) para procesar
 *    tareas pesadas sin bloquear las peticiones entrantes ni los healthchecks.
 * 
 * 💡 PROBLEMA REAL EN PRODUCCIÓN:
 * Un endpoint procesa un cálculo pesado síncrono (ej. parsear un JSON gigante, hash de datos o
 * iterar arrays enormes). De repente:
 * - Kubernetes mata el pod porque el healthcheck (/healthz) da timeout (504).
 * - Los sockets de clientes se cierran.
 * - Las métricas de CPU están al 100%, pero el Event Loop está totalmente "congelado".
 * ============================================================================
 */

import { styleText } from 'node:util';
import { monitorEventLoopDelay } from 'node:perf_hooks';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 03: Event Loop Starvation, Latencia y Técnicas de Yielding'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// 1. Inicializar el monitor nativo de retardo del Event Loop (resolución de 10ms)
const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();

// Un "latido" (heartbeat) cada 50ms que simula un health check de Kubernetes
let lastTick = performance.now();
const heartbeatInterval = setInterval(() => {
  const now = performance.now();
  const drift = (now - lastTick - 50).toFixed(2);
  lastTick = now;

  if (Number(drift) > 30) {
    console.log(styleText(['bold', 'red'], `  🚨 [Healthcheck ALERT] Retraso de +${drift}ms detectado! El servidor no respondió a tiempo.`));
  } else {
    console.log(styleText('green', `  💓 [Healthcheck OK] Heartbeat a tiempo (desvío: ${drift}ms)`));
  }
}, 50);

// Función auxiliar para convertir nanosegundos a milisegundos
const toMs = (nano) => (Number.isNaN(nano) ? '0.00' : (nano / 1_000_000).toFixed(2));

function printLagReport(title) {
  console.log(styleText(['bold', 'yellow'], `\n📊 Reporte de Latencia del Event Loop: ${title}`));
  console.log(`  • Promedio:               ${toMs(histogram.mean)} ms`);
  console.log(`  • Percentil 50 (Mediana): ${toMs(histogram.percentile(50))} ms`);
  console.log(`  • Percentil 99 (p99):     ${toMs(histogram.percentile(99))} ms`);
  console.log(`  • Máximo retardo (Lag):   ${styleText(['bold', 'red'], `${toMs(histogram.max)} ms`)}\n`);
}

// ----------------------------------------------------------------------------
// SIMULACIÓN 1: Tarea Pesada Síncrona (Bloquea el Event Loop por completo)
// ----------------------------------------------------------------------------
function runBlockingWorkload(iterations = 250_000_000) {
  console.log(styleText(['bold', 'red'], '\n--- FASE 1: Ejecutando tarea bloqueante síncrona (CPU Bound) ---'));
  console.log(styleText('gray', `Calculando ${iterations.toLocaleString()} iteraciones de forma 100% síncrona...`));
  
  const start = performance.now();
  let counter = 0;
  for (let i = 0; i < iterations; i++) {
    counter += Math.sqrt(i);
  }
  const elapsed = (performance.now() - start).toFixed(2);
  console.log(styleText('red', `  ❌ Tarea síncrona finalizada en ${elapsed}ms. Durante este tiempo NINGÚN evento ni timer pudo ejecutarse.`));
}

// ----------------------------------------------------------------------------
// SIMULACIÓN 2: Misma Tarea Partida en Chunks con Yielding (setImmediate)
// ----------------------------------------------------------------------------
function runNonBlockingWorkload(totalItems = 250_000_000, chunkSize = 10_000_000) {
  return new Promise((resolve) => {
    console.log(styleText(['bold', 'cyan'], '\n--- FASE 2: Misma tarea pero aplicando YIELDING (Chunking + setImmediate) ---'));
    console.log(styleText('gray', `Procesando ${totalItems.toLocaleString()} items en bloques pequeños de ${chunkSize.toLocaleString()} cediendo el Event Loop entre cada bloque...`));

    let processed = 0;
    let counter = 0;
    const start = performance.now();

    function processNextChunk() {
      const limit = Math.min(processed + chunkSize, totalItems);
      for (let i = processed; i < limit; i++) {
        counter += Math.sqrt(i);
      }
      processed = limit;

      if (processed % 50_000_000 === 0 || processed === totalItems) {
        console.log(styleText('blue', `  🔄 Progreso: ${(processed / 1_000_000).toFixed(0)}M / ${(totalItems / 1_000_000).toFixed(0)}M iteraciones. El bucle respira con normalidad.`));
      }

      if (processed < totalItems) {
        // ⚡ CLAVE SENIOR: setImmediate cede el control a la fase Check de Libuv,
        // permitiendo que en cada iteración el Event Loop atienda I/O, Timers y Healthchecks.
        setImmediate(processNextChunk);
      } else {
        const elapsed = (performance.now() - start).toFixed(2);
        console.log(styleText('green', `  ✅ Tarea por chunks completada en ${elapsed}ms SIN ahogar el Event Loop!`));
        resolve(counter);
      }
    }

    processNextChunk();
  });
}

// ----------------------------------------------------------------------------
// Orquestación del Experimento
// ----------------------------------------------------------------------------
async function startDemo() {
  // Esperar 150ms para ver un par de heartbeats limpios
  await new Promise((r) => setTimeout(r, 150));

  // 1. Ejecutamos el trabajo bloqueante
  histogram.reset();
  runBlockingWorkload();
  
  // Esperamos a que los timers pendientes se ejecuten para que el monitor registre el retardo sufrido
  await new Promise((r) => setTimeout(r, 10));
  printLagReport('Tras el Bloqueo Síncrono (Fase 1)');

  // Esperar 150ms para estabilizar
  await new Promise((r) => setTimeout(r, 150));

  // 2. Ejecutamos el trabajo con yielding
  histogram.reset();
  await runNonBlockingWorkload();
  
  // Esperamos un momento para leer las métricas
  await new Promise((r) => setTimeout(r, 10));
  printLagReport('Durante el Trabajo con Yielding (Fase 2)');

  // Finalizar
  clearInterval(heartbeatInterval);
  histogram.disable();

  console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN ARQUITECTÓNICA SENIOR:'));
  console.log(styleText('white', '  1. `monitorEventLoopDelay()` es la herramienta nativa que librerías como @promster,'));
  console.log(styleText('white', '     fastify-under-pressure y datadog usan para exponer la métrica `nodejs_eventloop_lag_seconds`.'));
  console.log(styleText('white', '  2. Con chunks pequeños y `setImmediate`, el CPU puede procesar millones de cálculos'));
  console.log(styleText('white', '     manteniendo el healthcheck activo y respondiendo a los clientes sin timeouts.'));
  console.log(styleText('white', '  3. Para cómputos masivos continuos, la solución definitiva es delegar a un Worker Thread.\n'));
}

startDemo();
