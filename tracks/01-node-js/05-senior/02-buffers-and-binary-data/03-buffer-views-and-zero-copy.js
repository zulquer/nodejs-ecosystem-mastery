/**
 * ============================================================================
 * LECCIÓN 03: Vistas de Memoria Zero-Copy, Mutaciones y Encodings Binarios
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Comprender la semántica "Zero-Copy" de `buf.subarray()`: NO duplica memoria,
 *    crea una vista de puntero sobre los mismos bytes de RAM.
 * 2. Entender los efectos colaterales de mutación compartida en microservicios.
 * 3. Saber cuándo y cómo realizar un copiado real en memoria (`buf.copy()` vs `Uint8Array.set()`).
 * 4. Demostrar el coste en CPU y Garbage Collection de convertir Buffers a Strings innecesariamente.
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 03: Zero-Copy Slicing, Mutaciones Compartidas y Encodings'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// ----------------------------------------------------------------------------
// PARTE 1: La Trampa de la Mutación Compartida (Zero-Copy)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 1: Zero-Copy con buf.subarray() vs Copiado Real ---'));

// Buffer original simulando un paquete de red con Header + Payload
const originalPacket = Buffer.from('HEADER:PAYLOAD_CONFIDENCIAL_12345');
console.log(styleText('white', `Paquete original: "${originalPacket.toString()}"`));

// Un desarrollador junior extrae el payload usando subarray (o slice)
const payloadView = originalPacket.subarray(7); // Apunta a 'PAYLOAD_CONFIDENCIAL_12345'
console.log(styleText('cyan', `Vista extraída:   "${payloadView.toString()}"`));

// Modificamos la vista creyendo que es una copia aislada
payloadView.write('X'.repeat(7)); // Sobrescribimos los primeros 7 bytes del payload

console.log(styleText('red', `\n🚨 Efecto colateral: ¡El paquete original también mutó en RAM!`));
console.log(styleText('red', `Paquete original tras mutar la vista: "${originalPacket.toString()}"`));

// Cómo hacer una copia real segura (Deep Copy en memoria)
const safeOriginal = Buffer.from('HEADER:PAYLOAD_SEGURO_99999');
const safeCopy = Buffer.alloc(safeOriginal.length - 7);
safeOriginal.copy(safeCopy, 0, 7); // Copia explícita byte a byte

safeCopy.write('Z'.repeat(7));
console.log(styleText('green', `\n✅ Con copia real (buf.copy):`));
console.log(styleText('white', `Copia modificada: "${safeCopy.toString()}"`));
console.log(styleText('green', `Original intacto: "${safeOriginal.toString()}"\n`));

// ----------------------------------------------------------------------------
// PARTE 2: Encodings Binarios (Hex, Base64, UTF-8)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 2: Manipulación de Encodings Binarios Nativos ---'));

const rawBytes = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xf0, 0x9f, 0x9a, 0x80]); // "Hello 🚀"

console.log('Bytes crudos en Array:', [...rawBytes]);
console.log('Representación HEX:    ', styleText('cyan', rawBytes.toString('hex')));
console.log('Representación Base64: ', styleText('magenta', rawBytes.toString('base64')));
console.log('Decodificado UTF-8:    ', styleText('green', rawBytes.toString('utf8')));

// ----------------------------------------------------------------------------
// PARTE 3: El Coste Invisible: String vs Buffer en Servidores de Alto Rendimiento
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '\n--- PARTE 3: Benchmark: Procesar Buffers Crudos vs Convertir a Strings ---'));

const BENCHMARK_SIZE = 100_000;
const sampleBuffer = Buffer.from('{"status":"ok","transaction_id":"9876543210","code":200}');

// Prueba 1: Convertir a string en cada middleware (mala práctica común)
const startString = performance.now();
for (let i = 0; i < BENCHMARK_SIZE; i++) {
  const str = sampleBuffer.toString('utf8'); // Decodificación UTF-8 + Asignación de String en Heap de V8
  const len = str.length;
}
const timeString = (performance.now() - startString).toFixed(2);

// Prueba 2: Mantener como Buffer crudo usando vistas
const startBuffer = performance.now();
for (let i = 0; i < BENCHMARK_SIZE; i++) {
  const len = sampleBuffer.byteLength; // Cero conversiones, lectura directa de propiedad numérica
}
const timeBuffer = (performance.now() - startBuffer).toFixed(2);

console.log(styleText('yellow', `  • Convertir a String UTF-8 x ${BENCHMARK_SIZE.toLocaleString()}: ${timeString} ms`));
console.log(styleText('green',  `  • Procesar Buffer crudo x ${BENCHMARK_SIZE.toLocaleString()}:        ${timeBuffer} ms`));
console.log(styleText(['bold', 'cyan'], `  ⚡ Mantener Buffers binarios es ${(timeString / Math.max(timeBuffer, 0.01)).toFixed(0)}x más rápido y genera CERO presión de Garbage Collection en V8.`));

// ----------------------------------------------------------------------------
// Resumen
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'white'], '\n💡 CONCLUSIÓN SENIOR:'));
console.log(styleText('white', '  1. `buf.subarray()` es Zero-Copy: ultra eficiente para leer paquetes y streams sin duplicar RAM,'));
console.log(styleText('white', '     pero CUIDADO si alguna capa posterior intenta mutar esos bytes.'));
console.log(styleText('white', '  2. Evita `.toString()` prematuros en middlewares o gateways; cada conversión de buffer a string'));
console.log(styleText('white', '     obliga a V8 a decodificar UTF-8 y crear un nuevo objeto en el heap que luego el GC debe recolectar.\n'));
