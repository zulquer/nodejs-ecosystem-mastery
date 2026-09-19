/**
 * ============================================================================
 * LECCIÓN 03: EventEmitter Internals, Crash por 'error' y Fugas por Closures
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Comprender por qué un evento `'error'` sin capturar derriba el proceso entero de Node.js.
 * 2. Entender el warning `MaxListenersExceededWarning` (y por qué `setMaxListeners(0)` es una mala práctica).
 * 3. Demostrar la fuga de memoria al registrar listeners dentro de peticiones HTTP en un bus compartido.
 * 4. Aprender la diferencia entre `EventTarget` (Web API nativa con `{ signal }`) y `EventEmitter`
 *    de Node.js, usando `events.addAbortListener()` para auto-desuscripción garantizada.
 * ============================================================================
 */

import events, { EventEmitter } from 'node:events';
import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 03: EventEmitter: Crashes, Memory Leaks y Auto-Cleanup con Signals'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// ----------------------------------------------------------------------------
// PARTE 1: El Crash del Proceso por el Evento 'error' no capturado
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 1: La Regla Especial del Evento "error" en EventEmitter ---'));

const riskyEmitter = new EventEmitter();

console.log(styleText('gray', 'En EventEmitter, el evento "error" tiene un tratamiento especial en el core de Node.js:'));

try {
  // Para evitar que el script termine abruptamente, capturamos el throw que hace Node internamente
  riskyEmitter.emit('error', new Error('Fallo de conexión en Socket'));
} catch (err) {
  console.log(styleText(['bold', 'red'], `  🚨 Crash prevenido: Si no tienes un .on('error'), Node.js lanza una excepción fatal:`));
  console.log(styleText('red', `     "${err.message}" (derribaría el pod en producción).`));
}

// Registro correcto:
riskyEmitter.on('error', (err) => {
  console.log(styleText('green', `  ✅ Manejado correctamente con .on('error'): "${err.message}" (proceso a salvo).\n`));
});
riskyEmitter.emit('error', new Error('Segundo fallo controlado'));

// ----------------------------------------------------------------------------
// PARTE 2: Fuga de Memoria en Closures y MaxListenersExceededWarning
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '\n--- PARTE 2: Fuga de Memoria al registrar listeners en Buses Globales ---'));

// Bus de eventos global de la aplicación (Singleton)
const globalEventBus = new EventEmitter();

console.log(`Límite por defecto de listeners en Node.js: ${styleText('yellow', `${globalEventBus.getMaxListeners()} listeners`)}`);
console.log(styleText('gray', 'Simulando 15 peticiones entrantes que se suscriben al bus global pero olvidan desuscribirse:\n'));

// Simulamos peticiones que retienen memoria
for (let i = 1; i <= 15; i++) {
  // Cada petición tiene un contexto pesado (un buffer de 1MB o datos de usuario)
  const heavyRequestContext = { requestId: i, data: Buffer.alloc(1024 * 1024, 'X') };

  // Antipatrón común: el listener mantiene una referencia al closure `heavyRequestContext`
  globalEventBus.on('notification', () => {
    console.log(`Procesando para req #${heavyRequestContext.requestId}`);
  });
}

console.log(styleText('red', `  ⚠️ Total de listeners activos acumulados en el bus: ${globalEventBus.listenerCount('notification')}`));
console.log(styleText('red', '  🚨 Cada uno de esos 15 listeners mantiene en RAM su respectivo buffer de 1MB.'));
console.log(styleText('red', '     ¡El Garbage Collector NO puede liberar ninguno porque el bus global tiene la referencia!\n'));

// Limpiamos el bus para la siguiente prueba
globalEventBus.removeAllListeners();

// ----------------------------------------------------------------------------
// PARTE 3: La Solución Senior: events.addAbortListener() (Node 20.5+)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 3: Auto-desuscripción con AbortSignal y events.addAbortListener ---'));

console.log(styleText('gray', 'En EventEmitter, a diferencia de EventTarget, la forma moderna y segura de ligar'));
console.log(styleText('gray', 'un listener al ciclo de vida de una petición es `events.addAbortListener(signal, cleanup)`:\n'));

function simulateHttpRequest(reqId) {
  const controller = new AbortController();
  const heavyContext = { reqId, payload: Buffer.alloc(1024 * 1024) };

  const onOrderUpdated = () => {
    console.log(`Orden actualizada para req #${heavyContext.reqId}`);
  };

  // Registramos el listener
  globalEventBus.on('order_updated', onOrderUpdated);

  // ⚡ CLAVE SENIOR: Ligamos la desuscripción al AbortSignal
  events.addAbortListener(controller.signal, () => {
    globalEventBus.off('order_updated', onOrderUpdated);
  });

  // Simulamos que la petición finaliza a los 30ms
  setTimeout(() => {
    // Al terminar la petición, abortamos la señal: esto desvincula el listener del bus inmediatamente!
    controller.abort();
  }, 30);
}

// Simulamos 5 peticiones que se auto-limpian
for (let i = 1; i <= 5; i++) {
  simulateHttpRequest(i);
}

console.log(styleText('white', `  • Listeners activos mientras las 5 peticiones se procesan: ${styleText('yellow', `${globalEventBus.listenerCount('order_updated')}`)}`));

// Esperamos a que todas las peticiones terminen y aborten sus controllers
setTimeout(() => {
  const countAfter = globalEventBus.listenerCount('order_updated');
  console.log(styleText('green', `  • Listeners activos tras finalizar las peticiones:         ${styleText(['bold', 'green'], `${countAfter}`)}`));
  console.log(styleText('green', '  ✅ Todos los listeners y sus closures pesados fueron liberados automáticamente de memoria.\n'));

  console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
  console.log(styleText('white', '  1. Siempre registra un manejador `.on("error")` en cualquier EventEmitter personalizado.'));
  console.log(styleText('white', '  2. Si ves `MaxListenersExceededWarning`, NUNCA aumentes el límite a ciegas con `setMaxListeners()`;'));
  console.log(styleText('white', '     investiga qué listeners están quedando huérfanos.'));
  console.log(styleText('white', '  3. Usa `events.addAbortListener()` para desuscribir listeners automáticamente al terminar'));
  console.log(styleText('white', '     el ciclo de vida de la petición HTTP o componente.\n'));
}, 60);
