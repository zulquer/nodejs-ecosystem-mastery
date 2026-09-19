/**
 * ============================================================================
 * 🚂 EXPRESS.JS SENIOR LAB 02: CUSTOM MIDDLEWARE ONION & ASYNC TRACING
 * ============================================================================
 *
 * ¿QUÉ APRENDERÁS EN ESTE LABORATORIO?:
 * 1. Cómo implementar el patrón Onion (Cebolla) en middlewares de Express.
 * 2. Trazabilidad distribuida con `node:async_hooks (AsyncLocalStorage)`:
 *    Propagación automática del `X-Correlation-ID` a través de capas de negocio
 *    y repositorios sin ensuciar las firmas de funciones (Zero Prop-Drilling).
 * 3. Medición de latencia de red de alta precisión con `process.hrtime.bigint()`
 *    e interceptación del evento del stream de respuesta `res.on('finish')`.
 *
 * EJECUCIÓN:
 *   npx tsx express-js/04-senior-internals/02-custom-middleware-onion-and-tracing.ts
 *   o: npm run express:senior:02
 * ============================================================================
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { styleText } from 'node:util';

// ----------------------------------------------------------------------------
// 1. CONTEXTO DE TRAZABILIDAD DISTRIBUIDA (TRACING CONTEXT)
// ----------------------------------------------------------------------------
export interface RequestTraceContext {
  traceId: string;
  startTimeNs: bigint;
}

export const traceStorage = new AsyncLocalStorage<RequestTraceContext>();

// Logger centralizado que lee el Trace ID automáticamente del contexto de V8
export class StructuredLogger {
  static info(message: string, meta: Record<string, any> = {}) {
    const ctx = traceStorage.getStore();
    const traceId = ctx ? ctx.traceId : 'GLOBAL_NO_TRACE';
    console.log(
      `   [${styleText('cyan', traceId.slice(0, 8))}] ${styleText('bold', message)} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
    );
  }
}

// ----------------------------------------------------------------------------
// 2. SIMULADOR DEL STREAM HTTP Y PIPELINE DE MIDDLEWARES
// ----------------------------------------------------------------------------
export class MockResponseStream extends EventEmitter {
  public statusCode = 200;
  public headersSent = false;
  public body: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.body = data;
    this.end();
    return this;
  }

  end() {
    this.headersSent = true;
    // Emite el evento estándar de Node.js 'finish' cuando el socket termina de enviar
    this.emit('finish');
  }
}

export interface MockRequest {
  headers: Record<string, string>;
  url: string;
}

// ----------------------------------------------------------------------------
// 3. MIDDLEWARES SENIOR DE PRODUCCIÓN
// ----------------------------------------------------------------------------

/**
 * Middleware 1: Inyector de Trace ID y Almacenamiento Asíncrono
 */
export const correlationIdMiddleware = (req: MockRequest, res: MockResponseStream, next: () => void) => {
  const traceId = req.headers['x-correlation-id'] || randomUUID();
  const startTimeNs = process.hrtime.bigint();

  // Interceptamos el evento 'finish' para medir la latencia total del ciclo
  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - startTimeNs;
    const elapsedMs = Number(elapsedNs) / 1_000_000;
    StructuredLogger.info(`Petición finalizada con HTTP ${res.statusCode} en ${elapsedMs.toFixed(2)}ms`);
  });

  // Envolvemos toda la cadena descendente dentro del contexto de AsyncLocalStorage
  traceStorage.run({ traceId, startTimeNs }, () => {
    StructuredLogger.info(`Petición entrante iniciada: ${req.url}`);
    next();
  });
};

/**
 * Simulación de Capa de Negocio profunda (sin acceso directo a req o headers)
 */
class PaymentDomainService {
  async processPayment(amount: number) {
    // Fíjate: ¡Esta función NO recibe 'req' ni 'traceId', pero puede loguearlo!
    StructuredLogger.info('Validando límites de crédito con proveedor externo...');
    await new Promise(r => setTimeout(r, 25));
    StructuredLogger.info(`Cargo de $${amount} procesado con éxito.`);
    return { transactionId: 'tx_998877' };
  }
}

// ----------------------------------------------------------------------------
// 4. DEMOSTRACIÓN PRÁCTICA
// ----------------------------------------------------------------------------
async function runLab() {
  console.log(styleText('bold', styleText('bgMagenta', ' 🚂 EXPRESS.JS SENIOR: ONION MIDDLEWARE & ASYNC TRACING ')));
  console.log(styleText('gray', 'Demostración de AsyncLocalStorage y captura de latencia con res.on("finish").\n'));

  const paymentService = new PaymentDomainService();

  // Simulamos dos peticiones concurrentes entrando a la API
  const handleIncomingRequest = async (url: string, incomingTraceId?: string) => {
    const req: MockRequest = {
      url,
      headers: incomingTraceId ? { 'x-correlation-id': incomingTraceId } : {},
    };
    const res = new MockResponseStream();

    correlationIdMiddleware(req, res, async () => {
      // Handler del controlador
      StructuredLogger.info('Controlador recibió la solicitud');
      const result = await paymentService.processPayment(150.0);
      res.status(201).json(result);
    });
  };

  console.log(styleText('yellow', '--- EJECUTANDO DOS PETICIONES CONCURRENTES EN PARALELO ---'));
  console.log(styleText('gray', 'Observa cómo cada log en consola lleva el Trace ID exacto sin colisionar ni mezclarse:\n'));

  await Promise.all([
    handleIncomingRequest('/api/v1/checkout', 'trace-user-alpha-12345'),
    handleIncomingRequest('/api/v1/checkout', 'trace-user-beta-67890'),
  ]);

  console.log(styleText('bold', styleText('green', '\n🎯 VENTAJAS ARQUITECTÓNICAS SENIOR:')));
  console.log(
    '1. ' + styleText('yellow', 'AsyncLocalStorage') + ' desacopla la lógica de logging y observabilidad de las firmas de tus funciones de dominio.\n' +
    '2. Usar ' + styleText('cyan', 'res.on("finish")') + ' es la forma no invasiva canónica de capturar el status final y la latencia exacta de red.\n' +
    '3. Los logs estructurados con ' + styleText('magenta', 'Correlation IDs') + ' permiten correlacionar trazas en Datadog / Grafana Loki instantáneamente.'
  );
}

runLab().catch(console.error);
