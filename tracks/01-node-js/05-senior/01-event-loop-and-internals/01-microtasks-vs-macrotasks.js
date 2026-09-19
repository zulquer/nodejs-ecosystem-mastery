/**
 * ============================================================================
 * LECCIÓN 01: Microtasks vs Macrotasks y el Comportamiento ESM vs CJS
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * Dominar las prioridades de colas en Node.js y entender una sutileza crítica:
 * ¿Por qué el comportamiento en ESM (ECMAScript Modules) difiere en el nivel superior
 * respecto a CommonJS y respecto a lo que ocurre dentro de cualquier callback?
 * 
 * 💡 ANATOMÍA DE COLAS:
 * 1. Call Stack (Síncrono)
 * 2. process.nextTickQueue (Cola propia de Node.js, prioridad máxima en callbacks)
 * 3. Microtask Queue de V8 (Promises, queueMicrotask)
 * 4. Macrotasks de Libuv (Timers, I/O, Check/Immediate, Close)
 * 
 * 🧠 SECRETO SENIOR (ESM vs CommonJS Top-Level):
 * - En CommonJS: El script superior se ejecuta síncronamente envuelto en una función.
 *   Al terminar el archivo, Node vacía `nextTickQueue` ANTES de la cola de Promises de V8.
 * - En ESM (import/export): Según la especificación de ECMAScript, la carga del módulo
 *   es una tarea asíncrona de V8 basada en Promises (Module Evaluation Job). Por tanto,
 *   en el nivel superior de un archivo ESM, las Promises registradas durante la evaluación
 *   pertenecen a la microtarea activa y se resuelven antes de ceder el turno a nextTick.
 * - PERO dentro de cualquier callback (I/O, timers, eventos, servidores), el orden siempre es:
 *   `process.nextTick` -> `Promise.then` -> Macrotasks.
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n==============================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 01: Prioridades de Microtasks y Macrotasks en Node.js'));
console.log(styleText(['bold', 'cyan'], '===============================================================\n'));

function log(phase, label, color = 'white') {
  const ts = performance.now().toFixed(2).padStart(6);
  console.log(
    `${styleText('gray', `[+${ts}ms]`)} ` +
    `${styleText(['bold', color], phase.padEnd(26))} ` +
    `-> ${label}`
  );
}

// ----------------------------------------------------------------------------
// PARTE 1: Top-Level Execution en ESM
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 1: Nivel Superior del Módulo (ESM Evaluation) ---'));

log('1. Call Stack Síncrono', 'Inicio del script', 'green');

setTimeout(() => {
  log('4. Macrotask (Timers)', 'setTimeout(..., 0) de nivel superior', 'magenta');
}, 0);

setImmediate(() => {
  log('5. Macrotask (Check)', 'setImmediate() de nivel superior', 'magenta');
});

Promise.resolve().then(() => {
  log('2b. V8 Microtask (Promise)', 'Promise.then en nivel superior (ESM)', 'cyan');
});

queueMicrotask(() => {
  log('2c. V8 Microtask (queue)', 'queueMicrotask en nivel superior', 'cyan');
});

process.nextTick(() => {
  log('3. Node nextTickQueue', 'process.nextTick registrado en nivel superior', 'blue');
});

log('1b. Call Stack Síncrono', 'Fin síncrono del archivo', 'green');

// ----------------------------------------------------------------------------
// PARTE 2: Orden Estándar en un Callback Normal (El 99.9% de tu código backend)
// ----------------------------------------------------------------------------
setTimeout(() => {
  console.log(styleText(['bold', 'yellow'], '\n--- PARTE 2: Dentro de un Callback de Event Loop (Comportamiento Estándar) ---'));
  
  log('Callback Timers', 'Iniciando callback de setTimeout...', 'magenta');

  // Programamos en el mismo instante dentro del callback:
  // 1. setTimeout
  // 2. setImmediate
  // 3. Promise
  // 4. nextTick
  
  setTimeout(() => {
    log('Macrotask Siguiente', 'setTimeout anidado ejecutado', 'magenta');
  }, 0);

  setImmediate(() => {
    log('Macrotask Check', 'setImmediate anidado ejecutado', 'magenta');
  });

  Promise.resolve().then(() => {
    log('V8 Microtask', 'Promise.then dentro del callback (después de nextTick)', 'cyan');
  });

  process.nextTick(() => {
    log('Node nextTickQueue', 'process.nextTick dentro del callback (¡PRIMERO que Promise!)', 'blue');
  });

  log('Callback Timers Fin', 'Fin del callback síncrono. Ahora se vacían las microtareas...', 'green');
}, 50);

// ----------------------------------------------------------------------------
// Explicación técnica al finalizar
// ----------------------------------------------------------------------------
process.on('exit', () => {
  console.log(styleText(['bold', 'white'], '\n💡 RESUMEN SENIOR:'));
  console.log(styleText('white', '• Dentro de cualquier función o manejador asíncrono (Express, Fastify, I/O):'));
  console.log(styleText('blue',  '  1. process.nextTickQueue se vacía de forma INMEDIATA y prioritaria.'));
  console.log(styleText('cyan',  '  2. MicrotaskQueue de V8 (Promises) se vacía a continuación.'));
  console.log(styleText('magenta','  3. El Event Loop continúa a la siguiente fase de Libuv.'));
  console.log(styleText('yellow','• En el arranque de un archivo ESM, el top-level corre dentro del Promise loader de V8,'));
  console.log(styleText('yellow','  por eso en la Parte 1 verás que la Promise se resuelve antes del nextTick del top-level.\n'));
});
