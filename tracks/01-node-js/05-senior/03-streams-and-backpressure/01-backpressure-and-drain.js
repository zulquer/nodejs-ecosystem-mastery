/**
 * ============================================================================
 * LECCIÓN 01: Backpressure y el Evento 'drain'
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Entender qué es la Presión de Retorno (Backpressure) y por qué ignorarla
 *    provoca colapsos por falta de memoria (JavaScript heap out of memory).
 * 2. Visualizar en tiempo real el crecimiento del búfer interno del Writable Stream
 *    cuando se ignora el valor de retorno de `write()`.
 * 3. Implementar el patrón Senior correcto escuchando el evento `'drain'`
 *    para mantener el consumo de RAM plano y predecible.
 * ============================================================================
 */

import { Writable } from 'node:stream';
import { once } from 'node:events';
import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 01: Backpressure, writableLength y el Evento "drain"'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

const CHUNK_SIZE = 16 * 1024; // 16 KB por chunk
const TOTAL_CHUNKS = 1_000;   // 1,000 chunks = ~16 MB de datos
const chunk = Buffer.alloc(CHUNK_SIZE, 'A');

// Función auxiliar para crear un Writable lento (simula red 3G o base de datos saturada)
function createSlowWritable() {
  return new Writable({
    highWaterMark: 32 * 1024, // Búfer máximo recomendado: 32 KB
    write(data, encoding, callback) {
      // Simulamos que el destino tarda 1ms en procesar cada chunk de 16KB
      setTimeout(callback, 1);
    }
  });
}

function getMemoryMB() {
  return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
}

// ----------------------------------------------------------------------------
// CASO 1: Ignorando Backpressure (Mala práctica Junior)
// ----------------------------------------------------------------------------
async function runNaiveProducer() {
  console.log(styleText(['bold', 'red'], '--- CASO 1: Productor Ingenuo (Ignora Backpressure con for loop síncrono) ---'));
  
  const slowStream = createSlowWritable();
  const startHeap = getMemoryMB();
  let backpressureCount = 0;

  console.log(styleText('gray', `Escribiendo ${TOTAL_CHUNKS} chunks de 16KB sin pausar...`));

  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const canAcceptMore = slowStream.write(chunk);
    if (!canAcceptMore) {
      backpressureCount++;
    }
  }

  // Medimos inmediatamente tras el bucle antes de que el consumidor termine
  const peakBufferedBytes = slowStream.writableLength;
  const peakHeap = getMemoryMB();

  console.log(styleText('red', `  ❌ Alertas de Backpressure ignoradas: ${backpressureCount} veces.`));
  console.log(styleText(['bold', 'red'], `  🚨 Bytes acumulados en la cola de RAM: ${(peakBufferedBytes / 1024 / 1024).toFixed(2)} MB`));
  console.log(styleText('red', `  📈 Crecimiento de Heap: ${startHeap} MB -> ${peakHeap} MB`));

  slowStream.end();
  await once(slowStream, 'finish');
  console.log(styleText('gray', '  (El stream finalmente vació los datos tras acumular todo en memoria)\n'));
}

// ----------------------------------------------------------------------------
// CASO 2: Respetando Backpressure con el Evento 'drain' (Práctica Senior)
// ----------------------------------------------------------------------------
async function runSeniorProducer() {
  console.log(styleText(['bold', 'green'], '--- CASO 2: Productor Senior (Control de Flujo con evento "drain") ---'));
  
  const slowStream = createSlowWritable();
  const startHeap = getMemoryMB();
  let drainEventsCount = 0;
  let maxBufferedBytes = 0;

  console.log(styleText('gray', `Escribiendo ${TOTAL_CHUNKS} chunks de 16KB pausando cuando el búfer se llena...`));

  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    maxBufferedBytes = Math.max(maxBufferedBytes, slowStream.writableLength);

    const canAcceptMore = slowStream.write(chunk);
    
    if (!canAcceptMore) {
      // ⚡ CLAVE SENIOR: writable.write() devolvió false. El búfer superó highWaterMark (32KB).
      // Nos detenemos y esperamos a que el consumidor emita 'drain' antes de enviar más datos.
      drainEventsCount++;
      await once(slowStream, 'drain');
    }
  }

  slowStream.end();
  await once(slowStream, 'finish');

  const finalHeap = getMemoryMB();

  console.log(styleText('green', `  ✅ Eventos "drain" gestionados: ${drainEventsCount}`));
  console.log(styleText(['bold', 'green'], `  🛡️ Máximo de bytes retenidos en RAM: ${(maxBufferedBytes / 1024).toFixed(2)} KB (¡Siempre <= highWaterMark!)`));
  console.log(styleText('green', `  📊 Memoria Heap estable: ${startHeap} MB -> ${finalHeap} MB\n`));
}

async function main() {
  await runNaiveProducer();
  await runSeniorProducer();

  console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
  console.log(styleText('white', '  1. `writable.write()` NO es un método fire-and-forget; devuelve un booleano crucial.'));
  console.log(styleText('white', '  2. Si devuelve `false`, debes dejar de escribir y esperar al evento `drain`.'));
  console.log(styleText('white', '  3. Si ignoras `false`, Node.js seguirá acumulando los chunks en RAM (en `writableBuffer`),'));
  console.log(styleText('white', '     convirtiendo tu servidor en una bomba de tiempo hacia un Out-of-Memory (OOM).\n'));
}

main();
