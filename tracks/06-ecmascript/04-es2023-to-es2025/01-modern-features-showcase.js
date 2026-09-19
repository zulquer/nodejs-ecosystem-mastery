/**
 * ============================================================================
 * LAB: Novedades Modernas de ECMAScript (ES2022, ES2023, ES2024 en Node.js 24)
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * Demostrar de forma ejecutable las características añadidas al estándar oficial
 * en los últimos 3 años (ES2022 a ES2024) que eliminan dependencias externas
 * (como lodash, ramda o utilitarios custom).
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB ECMASCRIPT: Novedades de ES2022 a ES2024 en Acción'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// ----------------------------------------------------------------------------
// 1. ES2024: Object.groupBy() (Reemplazo nativo de lodash.groupBy)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 1. ES2024: Object.groupBy() ---'));

const inventory = [
  { name: 'Manzanas', type: 'fruta', stock: 12 },
  { name: 'Lechuga',  type: 'verdura', stock: 5 },
  { name: 'Plátanos', type: 'fruta', stock: 0 },
  { name: 'Zanahoria', type: 'verdura', stock: 20 }
];

// Agrupamos por tipo en un solo paso nativo sin librerías
const groupedByType = Object.groupBy(inventory, item => item.type);
console.log('Agrupado por tipo:', JSON.stringify(groupedByType, null, 2));

// Agrupamos por condición booleana (con stock vs agotado)
const groupedByAvailability = Object.groupBy(inventory, item => item.stock > 0 ? 'disponible' : 'agotado');
console.log('Disponibilidad:', Object.keys(groupedByAvailability).map(k => `${k}: ${groupedByAvailability[k].length} items`).join(', '));
console.log(styleText('green', '  ✅ Object.groupBy() funciona de forma nativa en Node 24.\n'));

// ----------------------------------------------------------------------------
// 2. ES2024: Promise.withResolvers() (Extracción limpia de resolve/reject)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 2. ES2024: Promise.withResolvers() ---'));

// Antes (código torpe):
// let res, rej;
// const p = new Promise((r1, r2) => { res = r1; rej = r2; });

// Ahora (ES2024 nativo):
const { promise, resolve, reject } = Promise.withResolvers();

// Simulamos resolver la promesa desde un callback asíncrono externo
setTimeout(() => {
  resolve('Datos recibidos desde socket remoto');
}, 50);

const result = await promise;
console.log(styleText('white', `  • Promesa resuelta limpiamente: "${result}"`));
console.log(styleText('green', '  ✅ Promise.withResolvers() simplifica la creación de deferreds y colas.\n'));

// ----------------------------------------------------------------------------
// 3. ES2023: Change Array by Copy (toSorted, toReversed, with)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 3. ES2023: Change Array by Copy (Inmutabilidad Funcional) ---'));

const originalScores = [40, 10, 80, 25];
console.log('Array original:                 ', originalScores);

// toSorted no muta el original
const sortedScores = originalScores.toSorted((a, b) => a - b);
console.log('toSorted (nuevo array ordenado):', sortedScores);
console.log('Original permanece intacto:     ', originalScores);

// with() reemplaza un elemento sin mutar
const updatedScores = originalScores.with(1, 999);
console.log('with(1, 999) (copia modificada):', updatedScores);
console.log(styleText('green', '  ✅ Métodos no mutantes nativos para programación funcional.\n'));

// ----------------------------------------------------------------------------
// 4. ES2022: Error Cause & Array.at()
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 4. ES2022: Error Cause y Array.at() ---'));

const items = ['A', 'B', 'C', 'D', 'E'];
console.log(`  • Último elemento con items.at(-1): "${items.at(-1)}"`);
console.log(`  • Penúltimo con items.at(-2):       "${items.at(-2)}"`);

// Encadenamiento de errores con cause
try {
  try {
    throw new TypeError('Error de socket TCP: conexión reseteada');
  } catch (lowLevelError) {
    // Envolvemos el error en un error de negocio sin perder la causa original
    throw new Error('Servicio de Pagos no disponible', { cause: lowLevelError });
  }
} catch (highLevelError) {
  console.log(styleText('red', `  ❌ Error de Negocio: "${highLevelError.message}"`));
  console.log(styleText('yellow', `     Causa Raíz ({ cause }): "${highLevelError.cause.message}"`));
  console.log(styleText('green', '  ✅ Diagnóstico y trazabilidad de excepciones perfecta sin perder stacktraces.\n'));
}

console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
console.log(styleText('white', '  1. Mantente al día con las especificaciones de TC39; usar librerías externas para utilidades'));
console.log(styleText('white', '     que ya son nativas en Node (groupBy, at, withResolvers) añade peso innecesario a dependencias.'));
console.log(styleText('white', '  2. El parámetro `{ cause }` en Error es el estándar moderno para re-empaquetar errores en arquitecturas por capas.\n'));
