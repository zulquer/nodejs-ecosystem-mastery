/**
 * ============================================================================
 * 🧪 TESTING SENIOR LAB 03: MUTATION TESTING VS 100% CODE COVERAGE ILLUSION
 * ============================================================================
 *
 * ¿QUÉ APRENDERÁS EN ESTE LABORATORIO?:
 * 1. Por qué una suite de tests con 100% de cobertura de líneas puede ser inútil
 *    si sus aserciones son débiles o tautológicas (falsa sensación de seguridad).
 * 2. Qué es el Mutation Testing (estilo Stryker) y cómo audita la calidad real de los tests.
 * 3. La inyección de mutantes:
 *    - Mutador de operador relacional (cambiar `>` por `>=`).
 *    - Mutador de condición lógica (cambiar `&&` por `||`).
 *    - Mutador de asignación aritmética.
 * 4. El cálculo de la métrica real: Mutation Score (Mutantes Muertos / Mutantes Totales).
 *
 * EJECUCIÓN:
 *   npx tsx testing/04-senior-internals/03-mutation-testing-and-coverage.ts
 *   o: npm run test:senior:03
 * ============================================================================
 */

import { styleText } from 'node:util';

// ----------------------------------------------------------------------------
// 1. CÓDIGO DE PRODUCCIÓN: CÁLCULO DE APROBACIÓN DE CRÉDITO
// ----------------------------------------------------------------------------
export interface LoanApplication {
  income: number;
  creditScore: number;
  hasDefaultHistory: boolean;
}

/**
 * REGLA DE NEGOCIO ORIGINAL:
 * El préstamo solo se aprueba si:
 * - Ingresos mayores a 30,000 Y
 * - Puntuación de crédito mayor o igual a 650 Y
 * - NO tiene historial de impagos.
 */
export function evaluateLoanOriginal(app: LoanApplication): boolean {
  if (app.hasDefaultHistory) return false;
  return app.income > 30000 && app.creditScore >= 650;
}

// ----------------------------------------------------------------------------
// 2. MUTANTES SINTÁCTICOS INYECTADOS AUTOMÁTICAMENTE
// ----------------------------------------------------------------------------
export const MUTANTS = [
  {
    id: 'MUTANT-1-BOUNDARY',
    description: 'Cambiar operador de ingresos: app.income >= 30000 (en vez de >)',
    fn: (app: LoanApplication): boolean => {
      if (app.hasDefaultHistory) return false;
      return app.income >= 30000 && app.creditScore >= 650; // ⚠️ Mutante
    },
  },
  {
    id: 'MUTANT-2-LOGICAL-OP',
    description: 'Cambiar operador lógico: app.income > 30000 || app.creditScore >= 650 (en vez de &&)',
    fn: (app: LoanApplication): boolean => {
      if (app.hasDefaultHistory) return false;
      return app.income > 30000 || app.creditScore >= 650; // ⚠️ Mutante
    },
  },
  {
    id: 'MUTANT-3-NEGATION',
    description: 'Omitir chequeo de impago: ignorar app.hasDefaultHistory',
    fn: (app: LoanApplication): boolean => {
      return app.income > 30000 && app.creditScore >= 650; // ⚠️ Mutante
    },
  },
];

// ----------------------------------------------------------------------------
// 3. SUITES DE PRUEBAS COMPARATIVAS (JUNIOR VS SENIOR)
// ----------------------------------------------------------------------------

/**
 * SUITE JUNIOR / DÉBIL:
 * Logra 100% de cobertura de líneas ejecutando el código con 1 solo caso feliz,
 * pero apenas valida los valores límite ni los operadores lógicos.
 */
function runJuniorTestSuite(evaluateFn: typeof evaluateLoanOriginal): boolean {
  // Caso feliz obvio
  const result = evaluateFn({ income: 50000, creditScore: 800, hasDefaultHistory: false });
  // Aserción débil: solo comprueba que retorne true
  return result === true;
}

/**
 * SUITE SENIOR / ROBUSTA:
 * Diseñada con análisis de valores límite (Boundary Value Analysis) y pruebas de equivalencia.
 */
function runSeniorTestSuite(evaluateFn: typeof evaluateLoanOriginal): boolean {
  // Test 1: Caso límite en el umbral exacto de 30000 (debe ser false)
  if (evaluateFn({ income: 30000, creditScore: 700, hasDefaultHistory: false }) !== false) {
    return false; // El test detectó el fallo
  }

  // Test 2: Caso límite justo por encima del umbral de 30001 (debe ser true)
  if (evaluateFn({ income: 30001, creditScore: 650, hasDefaultHistory: false }) !== true) {
    return false;
  }

  // Test 3: Buen ingreso pero bajo score crediticio (debe ser false)
  if (evaluateFn({ income: 50000, creditScore: 649, hasDefaultHistory: false }) !== false) {
    return false;
  }

  // Test 4: Con historial de impago aunque gane 1 millón (debe ser false)
  if (evaluateFn({ income: 1000000, creditScore: 850, hasDefaultHistory: true }) !== false) {
    return false;
  }

  return true; // Todos los tests pasaron
}

// ----------------------------------------------------------------------------
// 4. MOTOR DE MUTATION TESTING
// ----------------------------------------------------------------------------
function runMutationAnalysis(
  suiteName: string,
  testRunner: (fn: typeof evaluateLoanOriginal) => boolean
) {
  console.log(styleText('bold', `\n--- EVALUANDO SUITE: ${suiteName} ---`));

  let killedCount = 0;
  let survivedCount = 0;

  for (const mutant of MUTANTS) {
    const passed = testRunner(mutant.fn);

    // Si los tests PASARON a pesar de que el código tenía un bug inyectado, el mutante SOBREVIVIÓ
    if (passed) {
      console.log(
        `   ${styleText('bgRed', styleText('white', ' SOBREVIVIÓ '))} ${mutant.id}: ${styleText('red', mutant.description)}`
      );
      survivedCount++;
    } else {
      // Si los tests FALLARON, significa que la suite detectó el bug y "mató" al mutante
      console.log(
        `   ${styleText('bgGreen', styleText('black', ' MUERTO '))} ${mutant.id}: ${styleText('green', 'Detectado con éxito')}`
      );
      killedCount++;
    }
  }

  const score = (killedCount / MUTANTS.length) * 100;
  console.log(`Puntuación de Mutación (Mutation Score): ${score === 100 ? styleText('green', '100%') : styleText('red', `${score.toFixed(0)}%`)}`);
  return score;
}

// ----------------------------------------------------------------------------
// 5. DEMOSTRACIÓN PRÁCTICA
// ----------------------------------------------------------------------------
function main() {
  console.log(styleText('bold', styleText('bgYellow', styleText('black', ' 🧪 MUTATION TESTING VS 100% COVERAGE ILLUSION '))) + '\n');
  console.log(styleText('gray', 'Demostración de por qué el 100% de Code Coverage puede dejar escapar bugs críticos.\n'));

  // Caso 1: Suite Junior (100% cobertura de líneas en SonarQube, pero llena de agujeros)
  runMutationAnalysis('Suite Junior (100% Line Coverage, Aserciones Débiles)', runJuniorTestSuite);

  // Caso 2: Suite Senior (Boundary Values & Cobertura de Mutación Real)
  runMutationAnalysis('Suite Senior (Boundary Value Analysis & Aserciones Estrictas)', runSeniorTestSuite);

  console.log(styleText('bold', styleText('cyan', '\n🎯 CONCLUSIÓN SENIOR:')));
  console.log(
    '1. La cobertura de líneas (' + styleText('yellow', 'Line Coverage') + ') solo mide qué código se EJECUTÓ, no si se VERIFICÓ.\n' +
    '2. ' + styleText('magenta', 'Mutation Testing (Stryker)') + ' altera tu código fuente a propósito; si tus tests siguen pasando verde,\n' +
    '   tienes un test inútil que no protege contra regresiones.\n' +
    '3. Aplicar ' + styleText('green', 'Boundary Value Analysis') + ' en los límites de cada condición es el sello distintivo de un Staff Engineer.'
  );
}

main();
