/**
 * ============================================================================
 * LECCIÓN 02: setImmediate vs setTimeout(0) en Ciclos de I/O
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * Demostrar por qué `setImmediate()` y `setTimeout(fn, 0)` se comportan de forma
 * no determinista en el ámbito global, pero 100% DETERMINISTA dentro de un ciclo I/O.
 * 
 * 💡 PREGUNTA CLÁSICA DE ENTREVISTA SENIOR:
 * "Si tengo un setTimeout(fn, 0) y un setImmediate(fn), ¿cuál se ejecuta antes?"
 * 
 * 🧠 RESPUESTA SENIOR:
 * 1. En el ámbito global (fuera de I/O): Es NO DETERMINISTA.
 *    Depende del rendimiento de la máquina y del reloj del SO. En Libuv,
 *    `setTimeout(fn, 0)` se normaliza a 1ms (`uv_timer_start(&handle, cb, 1, 0)`).
 *    Si el proceso tarda <1ms en preparar el Event Loop, el timer aún no venció
 *    cuando Libuv llega a la fase Timers, así que pasa de largo y ejecuta
 *    `setImmediate` en la fase Check. Si la CPU tuvo una pequeña pausa (>1ms),
 *    el timer venció y se ejecuta primero `setTimeout`.
 * 
 * 2. Dentro de un callback de I/O (fs, net, http): Es 100% DETERMINISTA.
 *    Los callbacks de I/O se procesan en la fase POLL.
 *    La fase inmediatamente siguiente a POLL es CHECK (`setImmediate`).
 *    Para que `setTimeout(0)` se ejecute, el Event Loop tendría que dar la vuelta
 *    completa hasta la fase TIMERS.
 *    Por tanto: dentro de I/O, `setImmediate` SIEMPRE gana.
 * ============================================================================
 */

import { styleText } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

console.log(styleText(['bold', 'cyan'], '\n================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 02: setTimeout(0) vs setImmediate() en Contexto Global vs I/O'));
console.log(styleText(['bold', 'cyan'], '=================================================================\n'));

// ----------------------------------------------------------------------------
// EXPERIMENTO 1: Contexto Global (No Determinista)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- EXPERIMENTO 1: Ámbito Global (Resultados No Deterministas) ---'));
console.log(styleText('gray', 'Ejecutando 5 parejas simultáneas en el ámbito global para observar la carrera:\n'));

for (let i = 1; i <= 3; i++) {
  setTimeout(() => {
    console.log(styleText('magenta', `  [Global #${i}] setTimeout(0) ejecutado`));
  }, 0);

  setImmediate(() => {
    console.log(styleText('cyan', `  [Global #${i}] setImmediate() ejecutado`));
  });
}

// ----------------------------------------------------------------------------
// EXPERIMENTO 2: Dentro de un Callback de I/O (100% Determinista)
// ----------------------------------------------------------------------------
setTimeout(() => {
  console.log(styleText(['bold', 'yellow'], '\n--- EXPERIMENTO 2: Dentro de un Ciclo I/O (Fase POLL de Libuv) ---'));
  console.log(styleText('gray', 'Leyendo este mismo archivo de disco con fs.readFile para entrar en fase POLL...\n'));

  fs.readFile(__filename, () => {
    console.log(styleText('green', '  [I/O Callback] Archivo leído. Estamos actualmente en la fase POLL de Libuv.'));
    console.log(styleText('gray', '  Registrando setTimeout(0) y setImmediate() AHORA:\n'));

    setTimeout(() => {
      console.log(styleText('magenta', '  [I/O Callback] -> setTimeout(0) ejecutado (Tuvo que esperar la vuelta del bucle)'));
    }, 0);

    setImmediate(() => {
      console.log(styleText('cyan', '  [I/O Callback] -> setImmediate() ejecutado (¡Fase Check inmediatamente después de Poll!)'));
    });

    process.nextTick(() => {
      console.log(styleText('blue', '  [I/O Callback] -> nextTick ejecutado (Al terminar el callback antes de cambiar de fase)'));
    });
  });
}, 100);

// ----------------------------------------------------------------------------
// Explicación Arquitectónica al salir
// ----------------------------------------------------------------------------
process.on('exit', () => {
  console.log(styleText(['bold', 'white'], '\n📋 EXPLICACIÓN ARQUITECTÓNICA DE LIBUV:'));
  console.log(styleText('gray', '  Ciclo de Fases de Libuv:'));
  console.log(styleText('white', '    [1. Timers] -> [2. Pending I/O] -> [3. Idle/Prepare] -> [4. Poll] -> [5. Check] -> [6. Close]'));
  console.log(styleText('white', '                                                                  |            |'));
  console.log(styleText('green', '                                                          (I/O termina aquí)   |'));
  console.log(styleText('cyan', '                                                                      (setImmediate se ejecuta AQUÍ)'));
  console.log(styleText('yellow', '\n  Por eso dentro de I/O, el bucle pasa directamente de Poll -> Check sin pasar por Timers.\n'));
});
