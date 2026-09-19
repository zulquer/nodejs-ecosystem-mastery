/**
 * ============================================================================
 * 🧪 TESTING SENIOR LAB 01: CUSTOM TEST RUNNER ENGINE & ASSERTION SYSTEM
 * ============================================================================
 *
 * ¿QUÉ APRENDERÁS EN ESTE LABORATORIO?:
 * 1. Cómo funciona internamente la arquitectura de un Test Runner (estilo Vitest/Jest/node:test).
 * 2. La construcción de un árbol de suites jerárquicas con `describe` y casos `it`.
 * 3. La implementación de una biblioteca de aserciones encadenable `expect()`
 *    con comprobaciones de igualdad estricta (`toBe`), igualdad profunda (`toEqual`)
 *    y captura de excepciones (`toThrow`).
 * 4. Control de tiempos asíncronos y timeouts con reporte de resultados en consola.
 *
 * EJECUCIÓN:
 *   npx tsx testing/04-senior-internals/01-custom-test-runner-engine.ts
 *   o: npm run test:senior:01
 * ============================================================================
 */

import { styleText } from 'node:util';

// ----------------------------------------------------------------------------
// 1. SISTEMA DE ASERCIONES (EXPECT MATCHER ENGINE)
// ----------------------------------------------------------------------------
export class AssertionError extends Error {
  constructor(message: string, public actual?: any, public expected?: any) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (!Object.is(actual, expected)) {
        throw new AssertionError(
          `Esperaba [${JSON.stringify(expected)}] pero recibí [${JSON.stringify(actual)}]`,
          actual,
          expected
        );
      }
    },

    toEqual(expected: any) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new AssertionError(
          `Igualdad profunda falló:\nEsperaba: ${expectedStr}\nRecibí:   ${actualStr}`,
          actual,
          expected
        );
      }
    },

    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          `Esperaba que ${actual} fuera mayor que ${expected}`,
          actual,
          expected
        );
      }
    },

    toThrow(expectedMessage?: string) {
      if (typeof actual !== 'function') {
        throw new AssertionError('toThrow requiere que el valor evaluado sea una función');
      }

      let threw = false;
      let caughtError: any;
      try {
        actual();
      } catch (err: any) {
        threw = true;
        caughtError = err;
      }

      if (!threw) {
        throw new AssertionError('Se esperaba que la función lanzara un error, pero terminó con éxito');
      }

      if (expectedMessage && !caughtError.message.includes(expectedMessage)) {
        throw new AssertionError(
          `Se lanzó un error pero no contiene el mensaje esperado.\nEsperaba incluir: "${expectedMessage}"\nRecibí: "${caughtError.message}"`
        );
      }
    },
  };
}

// ----------------------------------------------------------------------------
// 2. MOTOR DEL TEST RUNNER
// ----------------------------------------------------------------------------
export interface TestCase {
  title: string;
  fn: () => void | Promise<void>;
  timeoutMs: number;
}

export interface TestSuite {
  title: string;
  tests: TestCase[];
  beforeEachHooks: Array<() => void | Promise<void>>;
}

export class CustomTestRunner {
  private currentSuite: TestSuite | null = null;
  private suites: TestSuite[] = [];

  describe(title: string, fn: () => void) {
    const suite: TestSuite = { title, tests: [], beforeEachHooks: [] };
    this.suites.push(suite);
    const prev = this.currentSuite;
    this.currentSuite = suite;
    fn();
    this.currentSuite = prev;
  }

  it(title: string, fn: () => void | Promise<void>, timeoutMs = 2000) {
    if (!this.currentSuite) throw new Error('it() debe estar dentro de un describe()');
    this.currentSuite.tests.push({ title, fn, timeoutMs });
  }

  beforeEach(fn: () => void | Promise<void>) {
    if (!this.currentSuite) throw new Error('beforeEach() debe estar dentro de un describe()');
    this.currentSuite.beforeEachHooks.push(fn);
  }

  async run(): Promise<{ total: number; passed: number; failed: number }> {
    let passed = 0;
    let failed = 0;
    let total = 0;

    console.log(styleText('bold', styleText('bgYellow', styleText('black', ' 🧪 MINI TEST RUNNER ENGINE '))) + '\n');

    for (const suite of this.suites) {
      console.log(styleText('bold', `📦 Suite: ${suite.title}`));

      for (const test of suite.tests) {
        total++;
        const startTime = process.hrtime.bigint();

        try {
          // Ejecutar beforeEach hooks
          for (const hook of suite.beforeEachHooks) {
            await hook();
          }

          // Ejecutar test con timeout de protección
          await Promise.race([
            Promise.resolve(test.fn()),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout de ${test.timeoutMs}ms excedido`)), test.timeoutMs)
            ),
          ]);

          const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          console.log(`   ${styleText('green', '✔')} ${test.title} ${styleText('gray', `(${durationMs.toFixed(2)}ms)`)}`);
          passed++;
        } catch (err: any) {
          const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          console.log(`   ${styleText('red', '✖')} ${test.title} ${styleText('gray', `(${durationMs.toFixed(2)}ms)`)}`);
          console.log(styleText('red', `      Error: ${err.message}`));
          failed++;
        }
      }
      console.log('');
    }

    console.log(styleText('bold', '--- RESUMEN FINAL ---'));
    console.log(`Total: ${total} | Pasados: ${styleText('green', String(passed))} | Fallados: ${failed > 0 ? styleText('red', String(failed)) : '0'}`);

    return { total, passed, failed };
  }
}

// ----------------------------------------------------------------------------
// 3. SUITE DE PRUEBAS DE DEMOSTRACIÓN
// ----------------------------------------------------------------------------
async function main() {
  const runner = new CustomTestRunner();

  runner.describe('Módulo de Cálculo Financiero', () => {
    let balance = 0;

    runner.beforeEach(() => {
      // Se ejecuta antes de cada test para aislar estado
      balance = 100;
    });

    runner.it('debe iniciar con saldo reseteado a 100', () => {
      expect(balance).toBe(100);
    });

    runner.it('debe permitir aplicar descuentos válidos', () => {
      balance -= 25;
      expect(balance).toBe(75);
      expect(balance).toBeGreaterThan(50);
    });

    runner.it('debe lanzar excepción si se retira más del saldo permitido', () => {
      const invalidWithdraw = () => {
        throw new Error('OverdraftLimitExceeded: Saldo insuficiente.');
      };
      expect(invalidWithdraw).toThrow('OverdraftLimitExceeded');
    });

    runner.it('debe comparar objetos profundamente con toEqual', () => {
      const user = { id: 1, roles: ['admin', 'billing'] };
      expect(user).toEqual({ id: 1, roles: ['admin', 'billing'] });
    });
  });

  await runner.run();
}

main().catch(console.error);
