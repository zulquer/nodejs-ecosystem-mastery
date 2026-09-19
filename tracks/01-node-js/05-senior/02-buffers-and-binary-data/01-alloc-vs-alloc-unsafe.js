/**
 * ============================================================================
 * LECCIÓN 01: Buffer.alloc vs Buffer.allocUnsafe y Riesgos de Seguridad
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Entender la diferencia fundamental entre memoria inicializada (Zero-filled)
 *    y memoria no inicializada.
 * 2. Visualizar cómo `Buffer.allocUnsafe()` puede filtrar información confidencial
 *    (contraseñas, tokens JWT, headers HTTP previos) que residían en la memoria RAM.
 * 3. Analizar cuándo un desarrollador senior DEBE usar `allocUnsafe` (por rendimiento)
 *    y cuándo es una vulnerabilidad de seguridad crítica.
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 01: Buffer.alloc vs Buffer.allocUnsafe (Seguridad vs Velocidad)'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// ----------------------------------------------------------------------------
// PARTE 1: La Trampa de Seguridad - Fuga de Memoria Residual
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- PARTE 1: Inspección de Memoria Residual (Security Risk) ---'));

// 1. Simulamos que la aplicación procesó datos ultra-secretos
(() => {
  const secretKey = 'JWT_SECRET_KEY_SUPER_CONFIDENCIAL_123456789_API_PASSWORD';
  Buffer.from(secretKey); // Queda en algún bloque de memoria liberado recientemente
})();

// 2. Comparamos Buffer.alloc vs Buffer.allocUnsafe
const safeBuffer = Buffer.alloc(40);
const unsafeBuffer = Buffer.allocUnsafe(40);

console.log(styleText('green', '  ✅ Buffer.alloc(40) (Garantizado relleno de ceros 0x00):'));
console.log('    HEX:', safeBuffer.toString('hex'));
console.log('    STR (limpio):', JSON.stringify(safeBuffer.toString()));

console.log(styleText('red', '\n  🚨 Buffer.allocUnsafe(40) (Memoria cruda reutilizada de la RAM):'));
console.log('    HEX:', unsafeBuffer.toString('hex'));
const dirtyAscii = unsafeBuffer.toString('utf8').replace(/[^\x20-\x7E]/g, '.');
console.log('    ASCII legible:', JSON.stringify(dirtyAscii));

let hasDirtyData = unsafeBuffer.some(byte => byte !== 0);
if (hasDirtyData) {
  console.log(styleText(['bold', 'red'], '    ⚠️ ¡ALERTA! El buffer contiene bytes residuales no vacíos de ejecuciones previas.'));
} else {
  console.log(styleText('gray', '    (En esta asignación particular los bytes fueron ceros, pero no hay garantía)'));
}

// ----------------------------------------------------------------------------
// PARTE 2: Benchmark de Rendimiento - ¿Por qué existe allocUnsafe?
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '\n--- PARTE 2: Benchmark de Velocidad de Asignación (1,000,000 operaciones) ---'));

const ITERATIONS = 1_000_000;
const BUFFER_SIZE = 1024; // 1 KB

// Prueba con Buffer.alloc
const startSafe = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const buf = Buffer.alloc(BUFFER_SIZE);
  buf[0] = 42; // forzar uso
}
const timeSafe = (performance.now() - startSafe).toFixed(2);

// Prueba con Buffer.allocUnsafe
const startUnsafe = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const buf = Buffer.allocUnsafe(BUFFER_SIZE);
  buf[0] = 42; // forzar uso
}
const timeUnsafe = (performance.now() - startUnsafe).toFixed(2);

const speedRatio = (timeSafe / timeUnsafe).toFixed(1);

console.log(styleText('white', `  • Buffer.alloc(1KB) x ${ITERATIONS.toLocaleString()}:       ${styleText('yellow', `${timeSafe} ms`)}`));
console.log(styleText('white', `  • Buffer.allocUnsafe(1KB) x ${ITERATIONS.toLocaleString()}: ${styleText('green', `${timeUnsafe} ms`)}`));
console.log(styleText(['bold', 'cyan'], `  ⚡ allocUnsafe es aproximadamente ${speedRatio}x más rápido porque NO escribe ceros en cada byte.`));

// ----------------------------------------------------------------------------
// Reglas de Oro Senior
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'white'], '\n📋 REGLAS DE ORO DEL SENIOR:'));
console.log(styleText('green', '  1. USA Buffer.alloc(size) por defecto para el 95% de los casos. La seguridad es primero.'));
console.log(styleText('yellow', '  2. USA Buffer.allocUnsafe(size) ÚNICAMENTE si vas a sobrescribir inmediatamente el 100%'));
console.log(styleText('yellow', '     del buffer (por ejemplo, al leer de un socket de red o archivo con fs.read).'));
console.log(styleText('red', '  3. NUNCA envíes un Buffer.allocUnsafe directamente al cliente HTTP sin llenarlo completamente,'));
console.log(styleText('red', '     de lo contrario estarías creando una vulnerabilidad tipo "Heartbleed" en tu API.\n'));
