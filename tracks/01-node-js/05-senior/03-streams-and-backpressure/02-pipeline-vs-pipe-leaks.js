/**
 * ============================================================================
 * LECCIÓN 02: pipeline() vs .pipe() y Fugas de Descriptores de Fichero (FD Leaks)
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Entender por qué `readable.pipe(writable)` es considerado una mala práctica / antipatrón
 *    en arquitecturas de producción modernas.
 * 2. Demostrar empíricamente cómo `.pipe()` deja el stream de origen (Readable) abierto
 *    y sin destruir cuando el destino (Writable) lanza un error o se desconecta (ej. cliente cancela).
 * 3. Demostrar cómo `node:stream/promises` (`pipeline()`) destruye de forma determinista
 *    TODOS los streams involucrados en la cadena, liberando File Descriptors y Sockets de red.
 * ============================================================================
 */

import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 02: stream.pipeline() vs .pipe() (Prevención de FD Leaks)'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// Función auxiliar para crear un Readable simulado (ej. lectura de archivo grande en disco)
function createMockSourceStream() {
  let counter = 0;
  return new Readable({
    read() {
      if (counter < 10) {
        this.push(`chunk_de_datos_${counter++}\n`);
      } else {
        this.push(null); // Fin del stream
      }
    },
    destroy(err, callback) {
      // Hook nativo de destrucción
      this.isExplicitlyDestroyed = true;
      callback(err);
    }
  });
}

// Función auxiliar para crear un Writable que falla a mitad de la transmisión (ej. socket cerrado)
function createFailingDestinationStream() {
  let count = 0;
  return new Writable({
    write(chunk, encoding, callback) {
      count++;
      if (count === 3) {
        // Simulamos un error fatal (ej. EPIPE, ECONNRESET, disco lleno)
        return callback(new Error('FATAL: Conexión cerrada abruptamente por el cliente (ECONNRESET)'));
      }
      callback();
    }
  });
}

// ----------------------------------------------------------------------------
// CASO 1: El peligro del .pipe() tradicional
// ----------------------------------------------------------------------------
async function testLegacyPipe() {
  console.log(styleText(['bold', 'red'], '--- CASO 1: Usando .pipe() Tradicional ante un fallo en Destino ---'));

  const source = createMockSourceStream();
  const failingDest = createFailingDestinationStream();

  // Escuchamos error en dest para evitar que el proceso explote sin captura
  failingDest.on('error', (err) => {
    console.log(styleText('yellow', `  ⚠️ Destino emitió error: "${err.message}"`));
  });

  // Conectamos mediante .pipe()
  source.pipe(failingDest);

  // Esperamos un tick para que el error se procese
  await new Promise((r) => setTimeout(r, 50));

  console.log(styleText('white', `  • ¿Destino destruido?: ${failingDest.destroyed}`));
  console.log(styleText('red',   `  ❌ ¿Origen (Source) destruido automáticamente?: ${source.destroyed}`));
  console.log(styleText('red',   `  🚨 ¿Origen sigue abierto (FD Leak)?: ${!source.destroyed}`));

  if (!source.destroyed) {
    console.log(styleText(['bold', 'red'], '  ⚠️ ¡PELIGRO EN PRODUCCIÓN! El archivo o socket origen quedó zombi.'));
    console.log(styleText('gray', '     En un servidor real, miles de clientes cancelando descargas agotarían'));
    console.log(styleText('gray', '     los descriptores de fichero del sistema operativo: error EMFILE.\n'));
    source.destroy(); // Limpiamos manualmente para el test
  }
}

// ----------------------------------------------------------------------------
// CASO 2: La Solución Senior: pipeline() de node:stream/promises
// ----------------------------------------------------------------------------
async function testModernPipeline() {
  console.log(styleText(['bold', 'green'], '--- CASO 2: Usando pipeline() de node:stream/promises ---'));

  const source = createMockSourceStream();
  const failingDest = createFailingDestinationStream();

  try {
    // pipeline maneja el ciclo de vida completo y devuelve una Promise
    await pipeline(source, failingDest);
  } catch (err) {
    console.log(styleText('yellow', `  ⚠️ Pipeline capturó el error centralizadamente: "${err.message}"`));
  }

  console.log(styleText('white', `  • ¿Destino destruido?: ${failingDest.destroyed}`));
  console.log(styleText('green', `  ✅ ¿Origen (Source) destruido automáticamente?: ${source.destroyed}`));
  console.log(styleText('green', `  🛡️ ¿El descriptor de fichero fue liberado por completo?: ${source.destroyed}`));
  console.log(styleText(['bold', 'green'], '  🎉 Cero fugas de sockets o archivos zombis.\n'));
}

async function main() {
  await testLegacyPipe();
  await testModernPipeline();

  console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
  console.log(styleText('white', '  1. NUNCA uses `readable.pipe(writable)` en producción si alguno maneja I/O de red o disco.'));
  console.log(styleText('white', '  2. Usa SIEMPRE `pipeline(stream1, stream2, ...)` de `node:stream/promises`.'));
  console.log(styleText('white', '  3. `pipeline()` garantiza que ante cualquier error en cualquier eslabón de la cadena,'));
  console.log(styleText('white', '     TODOS los streams se destruyen (.destroy()) y emiten sus eventos de cierre limpiamente.\n'));
}

main();
