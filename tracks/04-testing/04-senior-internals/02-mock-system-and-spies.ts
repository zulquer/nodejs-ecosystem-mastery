/**
 * ============================================================================
 * 🧪 TESTING SENIOR LAB 02: MOCK SYSTEM, SPIES & DETERMINISTIC FAKE TIMERS
 * ============================================================================
 *
 * ¿QUÉ APRENDERÁS EN ESTE LABORATORIO?:
 * 1. Cómo implementar internamente un sistema de espías y mocks (`fn()`, `spyOn()`).
 * 2. La captura de telemetría de ejecución: argumentos, llamadas y valores devueltos.
 * 3. La arquitectura de un motor de Fake Timers (Reloj Virtual Determinista):
 *    Avanzar 24 horas en el futuro en 0 milisegundos de tiempo real,
 *    eliminando para siempre las pruebas intermitentes (*flaky tests*) causadas por timeouts reales.
 *
 * EJECUCIÓN:
 *   npx tsx testing/04-senior-internals/02-mock-system-and-spies.ts
 *   o: npm run test:senior:02
 * ============================================================================
 */

import { styleText } from 'node:util';

// ----------------------------------------------------------------------------
// 1. MOTOR DE MOCKS Y ESPÍAS
// ----------------------------------------------------------------------------
export interface MockCallRecord {
  args: any[];
  returned?: any;
  threw?: any;
}

export interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mock: {
    calls: any[][];
    results: any[];
  };
  mockReturnValue(value: any): MockFunction<T>;
  mockImplementation(fn: (...args: any[]) => any): MockFunction<T>;
}

export function fn<T extends (...args: any[]) => any>(implementation?: T): MockFunction<T> {
  let currentImpl = implementation || ((...args: any[]) => undefined);

  const mockFn: any = function (...args: any[]) {
    mockFn.mock.calls.push(args);
    try {
      const result = currentImpl(...args);
      mockFn.mock.results.push({ type: 'return', value: result });
      return result;
    } catch (err) {
      mockFn.mock.results.push({ type: 'throw', value: err });
      throw err;
    }
  };

  mockFn.mock = {
    calls: [],
    results: [],
  };

  mockFn.mockReturnValue = (value: any) => {
    currentImpl = ((() => value) as any);
    return mockFn;
  };

  mockFn.mockImplementation = (newImpl: any) => {
    currentImpl = newImpl;
    return mockFn;
  };

  return mockFn;
}

export function spyOn<T extends object, K extends keyof T>(object: T, method: K) {
  const original = object[method];
  const mocked = fn(original as any);
  object[method] = mocked as any;

  return {
    mock: (mocked as any).mock,
    mockRestore() {
      object[method] = original;
    },
  };
}

// ----------------------------------------------------------------------------
// 2. MOTOR DE FAKE TIMERS DETERMINISTA (VIRTUAL CLOCK)
// ----------------------------------------------------------------------------
interface VirtualTimer {
  id: number;
  triggerAt: number;
  callback: () => void;
}

export class VirtualClock {
  private currentTime = 0;
  private timerIdCounter = 0;
  private timers: VirtualTimer[] = [];

  now(): number {
    return this.currentTime;
  }

  setTimeout(callback: () => void, delayMs: number): number {
    const id = ++this.timerIdCounter;
    this.timers.push({
      id,
      triggerAt: this.currentTime + delayMs,
      callback,
    });
    // Mantener ordenado por triggerAt ascendente
    this.timers.sort((a, b) => a.triggerAt - b.triggerAt);
    return id;
  }

  /**
   * Avanza el tiempo virtual instantáneamente en 0ms de CPU real
   * ejecutando todos los timers que hayan expirado en el intervalo.
   */
  advanceTimeBy(ms: number) {
    const targetTime = this.currentTime + ms;

    while (this.timers.length > 0 && this.timers[0].triggerAt <= targetTime) {
      const nextTimer = this.timers.shift()!;
      this.currentTime = nextTimer.triggerAt;
      nextTimer.callback();
    }

    this.currentTime = targetTime;
  }
}

// ----------------------------------------------------------------------------
// 3. DEMOSTRACIÓN PRÁCTICA DEL LABORATORIO
// ----------------------------------------------------------------------------
async function runLab() {
  console.log(styleText('bold', styleText('bgYellow', styleText('black', ' 🧪 TESTING SENIOR: MOCKS, SPIES & FAKE TIMERS '))) + '\n');

  // --------------------------------------------------------------------------
  // PARTE A: SISTEMA DE ESPÍAS (SPY ON)
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '--- PARTE A: ESPÍAS (SPY ON) Y CAPTURA DE TELEMETRÍA ---'));

  const notifier = {
    sendNotification(email: string, message: string) {
      return `Email enviado a ${email}: ${message}`;
    },
  };

  // Espiamos el método
  const spy = spyOn(notifier, 'sendNotification');

  // Simulamos ejecución del servicio de negocio
  notifier.sendNotification('ceo@empresa.com', 'Reporte Semanal Listo');
  notifier.sendNotification('cto@empresa.com', 'Despliegue a Producción');

  console.log(`Llamadas registradas por el Spy: ${styleText('bold', String(spy.mock.calls.length))}`);
  console.log(`Argumentos de llamada #1: ${JSON.stringify(spy.mock.calls[0])}`);
  console.log(`Argumentos de llamada #2: ${JSON.stringify(spy.mock.calls[1])}`);

  spy.mockRestore();
  console.log(styleText('green', '✅ Spy restauró la implementación original del objeto.'));

  // --------------------------------------------------------------------------
  // PARTE B: EL PODER DE LOS FAKE TIMERS (TIEMPO DETERMINISTA)
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '\n--- PARTE B: FAKE TIMERS (24 HORAS EN 0 MILISEGUNDOS) ---'));

  const clock = new VirtualClock();
  let sessionExpired = false;
  let reminderSent = false;

  // Programamos eventos temporales de larga duración:
  // 1. Recordatorio a las 2 horas (7,200,000 ms)
  clock.setTimeout(() => {
    reminderSent = true;
    console.log(styleText('cyan', `   ⏰ [T = ${clock.now()}ms (2 horas)] Recordatorio de inactividad disparado.`));
  }, 2 * 3600 * 1000);

  // 2. Expiración total de la sesión a las 24 horas (86,400,000 ms)
  clock.setTimeout(() => {
    sessionExpired = true;
    console.log(styleText('magenta', `   🚪 [T = ${clock.now()}ms (24 horas)] Sesión cerrada por inactividad.`));
  }, 24 * 3600 * 1000);

  console.log(`Estado inicial: Recordatorio=${reminderSent}, SesiónExpirada=${sessionExpired}`);

  // Avanzamos el reloj virtual 3 horas instantáneamente:
  console.log(styleText('gray', '\n-> Avanzando el reloj virtual 3 horas (10,800,000ms) en 0ms reales...'));
  clock.advanceTimeBy(3 * 3600 * 1000);
  console.log(`Estado a las 3h: Recordatorio=${styleText('green', String(reminderSent))}, SesiónExpirada=${sessionExpired}`);

  // Avanzamos el reloj virtual las 21 horas restantes hasta completar las 24 horas:
  console.log(styleText('gray', '\n-> Avanzando el reloj virtual 21 horas más (75,600,000ms)...'));
  clock.advanceTimeBy(21 * 3600 * 1000);
  console.log(`Estado a las 24h: SesiónExpirada=${styleText('bold', styleText('green', String(sessionExpired)))}`);

  console.log(styleText('bold', styleText('green', '\n🎯 REGLAS DE ORO SENIOR:')));
  console.log(
    '1. NUNCA usar `setTimeout` real en tests unitarios; ralentiza el pipeline y crea ' + styleText('red', 'flaky tests') + '.\n' +
    '2. Los ' + styleText('yellow', 'Fake Timers') + ' simulan días de inactividad o reintentos exponenciales en milisegundos.\n' +
    '3. Un ' + styleText('cyan', 'Spy') + ' observa comportamiento real, mientras que un ' + styleText('magenta', 'Mock') + ' define expectativas estrictas.'
  );
}

runLab().catch(console.error);
