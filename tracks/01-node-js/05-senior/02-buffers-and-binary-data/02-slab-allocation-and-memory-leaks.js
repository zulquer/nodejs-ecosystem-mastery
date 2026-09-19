/**
 * ============================================================================
 * LECCIÓN 02: Slab Allocation (El Pool de 8KB) y Retención de Memoria
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Comprender el mecanismo de "Slab Allocation" interno de Node.js (`Buffer.poolSize = 8192`).
 * 2. Entender por qué un buffer de 16 bytes retiene 8192 bytes en memoria C++ (ArrayBuffer).
 * 3. Descubrir un "Memory Leak Silencioso" común en Node.js: almacenar pequeñas porciones
 *    de buffers en cachés o estructuras de larga vida.
 * 4. Aprender la solución senior: `Buffer.allocUnsafeSlow()` o desacoplamiento con aislamiento.
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 02: El Pool de 8KB (Slab Allocator) y Fugas de Memoria'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

console.log(`Buffer.poolSize configurado por defecto en Node.js: ${styleText('yellow', `${Buffer.poolSize} bytes (8 KB)`)}`);
console.log(`Límite máximo para usar el pool (Buffer.poolSize >>> 1): ${styleText('yellow', `${Buffer.poolSize >>> 1} bytes (4 KB)`)}\n`);

// ----------------------------------------------------------------------------
// PARTE 1: La Anatomía Interna de un Buffer Pequeño (< 4KB)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 1: Inspección de Buffer.byteLength vs Underlying ArrayBuffer ---'));

const smallBuffer = Buffer.allocUnsafe(16); // 16 bytes lógicos
const slowBuffer = Buffer.allocUnsafeSlow(16); // 16 bytes sin pool

console.log(styleText('white', 'Buffer asignado con allocUnsafe(16):'));
console.log(`  • Tamaño lógico (byteLength):              ${styleText('green', `${smallBuffer.byteLength} bytes`)}`);
console.log(`  • Tamaño real en RAM (buffer.byteLength):  ${styleText(['bold', 'red'], `${smallBuffer.buffer.byteLength} bytes (¡Retiene el slab entero de 8KB!)`)}`);
console.log(`  • Offset dentro del Slab (byteOffset):     ${styleText('cyan', `${smallBuffer.byteOffset} bytes`)}\n`);

console.log(styleText('white', 'Buffer asignado con allocUnsafeSlow(16) (Bypass del pool):'));
console.log(`  • Tamaño lógico (byteLength):              ${styleText('green', `${slowBuffer.byteLength} bytes`)}`);
console.log(`  • Tamaño real en RAM (buffer.byteLength):  ${styleText('green', `${slowBuffer.buffer.byteLength} bytes (Aislado e independiente)`)}`);
console.log(`  • Offset:                                  ${styleText('cyan', `${slowBuffer.byteOffset} bytes`)}\n`);

// ----------------------------------------------------------------------------
// PARTE 2: El Memory Leak Silencioso en Producción (Simulación)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 2: Simulación de Fuga de Memoria por Retención en Caché ---'));

const REQUESTS_COUNT = 500;
const TOKEN_SIZE = 16; // 16 bytes (ej. un session ID o auth hash)

console.log(styleText('gray', `Simulando ${REQUESTS_COUNT.toLocaleString()} peticiones entrantes donde cada una guarda un token de ${TOKEN_SIZE} bytes en una caché global.`));
console.log(styleText('gray', `Datos útiles reales almacenados: ${((REQUESTS_COUNT * TOKEN_SIZE) / 1024).toFixed(2)} KB\n`));

// Simulación A: Cada petición procesa datos efímeros y retiene solo el token del slab
const leakedCache = [];
for (let i = 0; i < REQUESTS_COUNT; i++) {
  // Tomamos una porción de 16 bytes
  const token = Buffer.allocUnsafe(TOKEN_SIZE);
  token.write('token_secret_123');
  leakedCache.push(token);

  // La petición procesa otros datos que terminan de consumir el slab actual (4000 + 4000 = 8000 bytes)
  // por lo que la siguiente petición empezará en un slab completamente nuevo
  Buffer.allocUnsafe(4000);
  Buffer.allocUnsafe(4000);
}

const uniqueArrayBuffersA = new Set(leakedCache.map(b => b.buffer));
const totalMemoryRetainedA = [...uniqueArrayBuffersA].reduce((acc, ab) => acc + ab.byteLength, 0);

console.log(styleText('red', `  ❌ [Caché Ingenua (Pool Compartido)]:`));
console.log(`     • Slabs de 8KB secuestrados en RAM: ${uniqueArrayBuffersA.size}`);
console.log(`     • Memoria C++ total retenida por el GC: ${styleText(['bold', 'red'], `${(totalMemoryRetainedA / 1024).toFixed(2)} KB (~${(totalMemoryRetainedA / 1024 / 1024).toFixed(2)} MB)`)}`);

// Simulación B: Técnica Senior - Desacoplar antes de guardar en caché
const optimizedCache = [];
for (let i = 0; i < REQUESTS_COUNT; i++) {
  // Almacenamos usando allocUnsafeSlow (crea un ArrayBuffer exclusivo de 16 bytes)
  const token = Buffer.allocUnsafeSlow(TOKEN_SIZE);
  token.write('token_secret_123');
  optimizedCache.push(token);

  Buffer.allocUnsafe(4000);
  Buffer.allocUnsafe(4000);
}

const uniqueArrayBuffersB = new Set(optimizedCache.map(b => b.buffer));
const totalMemoryRetainedB = [...uniqueArrayBuffersB].reduce((acc, ab) => acc + ab.byteLength, 0);

console.log(styleText('green', `\n  ✅ [Caché Optimizada Senior con allocUnsafeSlow]:`));
console.log(`     • Memoria C++ real ocupada en RAM: ${styleText(['bold', 'green'], `${(totalMemoryRetainedB / 1024).toFixed(2)} KB`)}`);

const ratio = (totalMemoryRetainedA / totalMemoryRetainedB).toFixed(0);
console.log(styleText(['bold', 'cyan'], `\n  🔥 Impacto Real: La caché ingenua retiene ${ratio}x VECES MÁS MEMORIA en RAM!`));
console.log(styleText('gray', `     (${(totalMemoryRetainedA / 1024).toFixed(0)} KB retenidos frente a solo ${(totalMemoryRetainedB / 1024).toFixed(0)} KB necesarios)`));

// ----------------------------------------------------------------------------
// PARTE 3: Cómo Desacoplar un Buffer existente si ya viene de una librería externa
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '\n--- PARTE 3: Función Utilitaria Senior para Aislamiento de Buffers ---'));

function isolateBuffer(buf) {
  // Si el buffer comparte un ArrayBuffer más grande, clonamos solo su segmento exacto
  if (buf.byteLength < buf.buffer.byteLength) {
    const copy = Buffer.allocUnsafeSlow(buf.byteLength);
    buf.copy(copy);
    return copy;
  }
  return buf;
}

const incomingFromNetwork = Buffer.allocUnsafe(32); // Viene de una librería o socket
const safeToCache = isolateBuffer(incomingFromNetwork);

console.log(`  • Original underlying size: ${incomingFromNetwork.buffer.byteLength} bytes (atado al slab de 8KB)`);
console.log(`  • Aislado underlying size:  ${safeToCache.buffer.byteLength} bytes (listo para caché sin retención indebida)\n`);

// ----------------------------------------------------------------------------
// Resumen
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'white'], '💡 REGLA DE ORO SENIOR:'));
console.log(styleText('white', '  1. El slab de 8KB es una optimización brillante para buffers de vida corta (request/response).'));
console.log(styleText('white', '  2. Si vas a almacenar buffers pequeños en una estructura de larga vida (Map, Set, LRU Cache, variable global),'));
console.log(styleText('white', '     SIEMPRE desacóplalos usando `Buffer.allocUnsafeSlow()` o `isolateBuffer()`.'));
console.log(styleText('white', '  3. De lo contrario, un puñado de IDs o tokens de 16 bytes evitará que megabytes enteros de RAM sean liberados por el GC.\n'));
