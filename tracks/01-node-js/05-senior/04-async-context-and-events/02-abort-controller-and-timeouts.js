/**
 * ============================================================================
 * LECCIÓN 02: AbortController, Timeouts Declarativos y AbortSignal.any()
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Dominar la cancelación cooperativa moderna con `AbortController` y `AbortSignal`.
 * 2. Evitar el "Zombie Work": cuando un cliente se desconecta, tu backend debe
 *    abortar inmediatamente las queries de base de datos y peticiones HTTP salientes.
 * 3. Reemplazar `setTimeout` manuales con el estándar nativo `AbortSignal.timeout(ms)`.
 * 4. Combinar múltiples señales de cancelación usando `AbortSignal.any([sig1, sig2])`.
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 02: AbortController, Timeout Signals y AbortSignal.any()'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// Función auxiliar que simula una tarea asíncrona que respeta un AbortSignal (ej. query a BD o fetch)
async function simulateLongRunningTask(taskId, durationMs, signal) {
  console.log(styleText('gray', `  ⏳ [Tarea ${taskId}] Iniciada (duración estimada: ${durationMs}ms)...`));

  // Comprobación inicial rápida
  signal?.throwIfAborted();

  return new Promise((resolve, reject) => {
    // Si la señal ya fue cancelada o se cancela mientras esperamos:
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason); // Rechazamos con la razón exacta (TimeoutError o AbortError)
    };

    const timer = setTimeout(() => {
      // Limpiamos el listener para evitar retención de memoria
      signal?.removeEventListener('abort', onAbort);
      resolve(`Resultado exitoso de tarea ${taskId}`);
    }, durationMs);

    if (signal) {
      // { once: true } es clave para que el listener se auto-elimine al dispararse
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

// ----------------------------------------------------------------------------
// ESCENARIO 1: Timeout Declarativo Nativo con AbortSignal.timeout()
// ----------------------------------------------------------------------------
async function testDeclarativeTimeout() {
  console.log(styleText(['bold', 'yellow'], '--- ESCENARIO 1: AbortSignal.timeout(ms) (Sin clearTimeout manual) ---'));

  // Tarea de 200ms con un timeout de 80ms
  const timeoutSignal = AbortSignal.timeout(80);

  try {
    await simulateLongRunningTask('PagoBancario', 200, timeoutSignal);
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.log(styleText(['bold', 'red'], `  🚨 Timeout detectado limpiamente: "${err.message}"`));
      console.log(styleText('green', '  ✅ El temporizador fue gestionado y liberado automáticamente por el runtime.\n'));
    } else {
      console.log(styleText('red', `  Error desconocido: ${err}`));
    }
  }
}

// ----------------------------------------------------------------------------
// ESCENARIO 2: Cancelación Manual por Desconexión del Cliente
// ----------------------------------------------------------------------------
async function testClientCancellation() {
  console.log(styleText(['bold', 'yellow'], '--- ESCENARIO 2: Desconexión del Cliente (AbortController) ---'));

  const controller = new AbortController();

  // Simulamos que a los 40ms el usuario cierra la pestaña del navegador
  setTimeout(() => {
    console.log(styleText('magenta', '  🛑 [Cliente] Pestaña cerrada por el usuario. Disparando controller.abort()...'));
    controller.abort(new Error('CLIENT_CLOSED_REQUEST'));
  }, 40);

  try {
    await simulateLongRunningTask('GenerarReportePDF', 300, controller.signal);
  } catch (err) {
    console.log(styleText(['bold', 'red'], `  ❌ Tarea abortada inmediatamente: "${err.message}"`));
    console.log(styleText('green', '  🛡️ Se evitó generar el PDF en vano, ahorrando 260ms de CPU.\n'));
  }
}

// ----------------------------------------------------------------------------
// ESCENARIO 3: Combinación de Señales con AbortSignal.any() (API Moderna)
// ----------------------------------------------------------------------------
async function testCompositeSignals() {
  console.log(styleText(['bold', 'yellow'], '--- ESCENARIO 3: AbortSignal.any() (Timeout O Cancelación de Usuario) ---'));
  console.log(styleText('gray', 'La tarea se cancela si el usuario lo pide O si se vence el SLA de 150ms.\n'));

  const userController = new AbortController();
  const slaTimeoutSignal = AbortSignal.timeout(150);

  // Combinamos ambas señales en una sola señal compuesta
  const compositeSignal = AbortSignal.any([userController.signal, slaTimeoutSignal]);

  // En esta prueba, el usuario cancela a los 60ms (antes del timeout de 150ms)
  setTimeout(() => {
    console.log(styleText('magenta', '  🛑 [Usuario] Canceló manualmente a los 60ms'));
    userController.abort(new Error('USER_CANCELLED_OPERATION'));
  }, 60);

  try {
    await simulateLongRunningTask('ExportarDatosMasivos', 500, compositeSignal);
  } catch (err) {
    console.log(styleText('yellow', `  ⚠️ Operación detenida por la señal compuesta: "${err.message}"`));
    console.log(styleText('white', `  • ¿Fue por timeout?: ${slaTimeoutSignal.aborted}`));
    console.log(styleText('white', `  • ¿Fue por el usuario?: ${userController.signal.aborted}\n`));
  }
}

async function main() {
  await testDeclarativeTimeout();
  await testClientCancellation();
  await testCompositeSignals();

  console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
  console.log(styleText('white', '  1. Siempre pasa el `AbortSignal` a llamadas `fetch()`, queries de ORM/Prisma/TypeORM y child_process.'));
  console.log(styleText('white', '  2. `AbortSignal.timeout(ms)` elimina la necesidad de librerías externas para timeouts.'));
  console.log(styleText('white', '  3. `AbortSignal.any()` permite orquestar de forma elegante políticas de SLA y cancelaciones voluntarias.\n'));
}

main();
