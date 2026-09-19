/**
 * ============================================================================
 * 🚂 EXPRESS.JS SENIOR LAB 01: ASYNC ERROR HANDLING & EXPRESS 4 VS 5 DISPATCHER
 * ============================================================================
 *
 * ¿QUÉ APRENDERÁS EN ESTE LABORATORIO?:
 * 1. Por qué Express 4 se congelaba (socket hang-up) ante excepciones en handlers `async`.
 * 2. Cómo el despachador de Express 5 inspecciona el retorno de cada middleware
 *    y reenvía automáticamente las promesas rechazadas a `next(err)`.
 * 3. La inspección reflexiva de la aridad de 4 argumentos `(err, req, res, next)`
 *    para despachar errores hacia el middleware final formateado en RFC 7807.
 *
 * EJECUCIÓN:
 *   npx tsx express-js/04-senior-internals/01-async-error-handling-and-pipeline.ts
 *   o: npm run express:senior:01
 * ============================================================================
 */

import { styleText } from 'node:util';

export interface MockReq {
  method: string;
  url: string;
}

export interface MockRes {
  statusCode: number;
  body: any;
  status(code: number): MockRes;
  json(data: any): MockRes;
}

export type NextFn = (err?: any) => void;
export type MiddlewareFn = (req: MockReq, res: MockRes, next: NextFn) => any;
export type ErrorMiddlewareFn = (err: any, req: MockReq, res: MockRes, next: NextFn) => any;

// ----------------------------------------------------------------------------
// 1. SIMULADOR DEL MOTOR DE EXPRESS (COMPARATIVA DE DESPACHADORES)
// ----------------------------------------------------------------------------
export class ExpressRouterSimulator {
  private stack: Array<MiddlewareFn | ErrorMiddlewareFn> = [];

  use(fn: MiddlewareFn | ErrorMiddlewareFn) {
    this.stack.push(fn);
  }

  /**
   * DESPACHADOR DE EXPRESS 4 (LEGACY):
   * Asume ejecución síncrona. No captura promesas devueltas.
   */
  dispatchExpress4(req: MockReq, res: MockRes, onSocketTimeout: () => void) {
    let index = 0;

    const next: NextFn = (err?: any) => {
      if (index >= this.stack.length) return;
      const layer = this.stack[index++];

      if (err) {
        // Buscar middleware de error (fn.length === 4)
        if (layer.length === 4) {
          (layer as ErrorMiddlewareFn)(err, req, res, next);
        } else {
          next(err);
        }
      } else {
        if (layer.length < 4) {
          try {
            // Express 4 solo captura excepciones SÍNCRONAS con try/catch
            (layer as MiddlewareFn)(req, res, next);
          } catch (syncErr) {
            next(syncErr);
          }
        } else {
          next();
        }
      }
    };

    next();

    // Si pasaron 100ms y res.body sigue vacío, el socket se congeló (hang-up)
    setTimeout(() => {
      if (res.body === undefined) {
        onSocketTimeout();
      }
    }, 100);
  }

  /**
   * DESPACHADOR DE EXPRESS 5 (MODERNO):
   * Soporte nativo de Promesas: si fn() retorna un objeto con .catch(), lo engancha a next(err).
   */
  dispatchExpress5(req: MockReq, res: MockRes) {
    let index = 0;

    const next: NextFn = (err?: any) => {
      if (index >= this.stack.length) return;
      const layer = this.stack[index++];

      if (err) {
        if (layer.length === 4) {
          try {
            const ret = (layer as ErrorMiddlewareFn)(err, req, res, next);
            if (ret && typeof ret.catch === 'function') ret.catch(next);
          } catch (e) {
            next(e);
          }
        } else {
          next(err);
        }
      } else {
        if (layer.length < 4) {
          try {
            const ret = (layer as MiddlewareFn)(req, res, next);
            // ¡EL CORAZÓN DE EXPRESS 5!:
            if (ret && typeof ret.catch === 'function') {
              ret.catch(next); // Captura automática de rechazos asíncronos
            }
          } catch (syncErr) {
            next(syncErr);
          }
        } else {
          next();
        }
      }
    };

    next();
  }
}

// ----------------------------------------------------------------------------
// 2. DEMOSTRACIÓN PRÁCTICA DEL PROBLEMA Y SU SOLUCIÓN
// ----------------------------------------------------------------------------
async function runLab() {
  console.log(styleText('bold', styleText('bgMagenta', ' 🚂 EXPRESS.JS SENIOR: ASYNC ERROR HANDLING (v4 VS v5) ')));
  console.log(styleText('gray', 'Demostración de socket hang-up en Express 4 vs auto-forwarding en Express 5.\n'));

  // Middleware asíncrono que falla simulando un fallo de base de datos
  const failingAsyncRoute: MiddlewareFn = async (req, res, next) => {
    console.log('   [Route Handler] Consultando microservicio o base de datos...');
    await new Promise(r => setTimeout(r, 20));
    throw new Error('DatabaseConnectionLost: No se pudo conectar con el cluster primario.');
  };

  // Middleware final de errores (RFC 7807) con aridad de 4 argumentos
  const rfc7807ErrorHandler: ErrorMiddlewareFn = (err, req, res, next) => {
    console.log(styleText('green', '   [Error Middleware] 🛡️ Error capturado en la tubería: ') + err.message);
    res.status(500).json({
      type: 'https://api.enterprise.com/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: err.message,
      instance: req.url,
    });
  };

  const createMockResponse = (): MockRes => ({
    statusCode: 200,
    body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; },
  });

  // --------------------------------------------------------------------------
  // ESCENARIO A: EL DESPACHADOR DE EXPRESS 4 (SOCKET HANG-UP)
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '--- 🔴 ESCENARIO A: DESPACHADOR DE EXPRESS 4 (FALLO SILENCIOSO Y SOCKET HANG-UP) ---'));
  const appV4 = new ExpressRouterSimulator();
  appV4.use(failingAsyncRoute);
  appV4.use(rfc7807ErrorHandler);

  const resV4 = createMockResponse();
  let socketHanged = false;

  // En Node.js 16+, los rechazos no capturados de Express 4 disparan 'unhandledRejection'
  const unhandledRejectionHandler = (reason: any) => {
    console.log(styleText('bgRed', styleText('white', ' [UNHANDLED PROMISE REJECTION] ')) + ` Node.js interceptó: ${reason.message}`);
    console.log(styleText('gray', '   -> Express 4 fue incapaz de atrapar el error dentro de su pipeline de capas.'));
  };
  process.on('unhandledRejection', unhandledRejectionHandler);

  appV4.dispatchExpress4({ method: 'GET', url: '/v1/users' }, resV4, () => {
    socketHanged = true;
    console.log(styleText('red', '❌ [SOCKET TIMEOUT DETECTADO]:'));
    console.log('   Express 4 ignoró el Promise rejection. El cliente HTTP esperó 100ms y nadie cerró la respuesta.');
    console.log('   En producción, este socket se queda abierto 120 segundos hasta que el cliente aborta.');
  });

  await new Promise(r => setTimeout(r, 150));
  process.off('unhandledRejection', unhandledRejectionHandler);

  // --------------------------------------------------------------------------
  // ESCENARIO B: EL DESPACHADOR DE EXPRESS 5 (CAPTURA NATIVA)
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '\n--- 🟢 ESCENARIO B: DESPACHADOR DE EXPRESS 5 (RESOLUCIÓN AUTOMÁTICA) ---'));
  const appV5 = new ExpressRouterSimulator();
  appV5.use(failingAsyncRoute);
  appV5.use(rfc7807ErrorHandler);

  const resV5 = createMockResponse();
  appV5.dispatchExpress5({ method: 'GET', url: '/v1/users' }, resV5);

  await new Promise(r => setTimeout(r, 50));

  console.log(`Status de respuesta: ${styleText('bold', styleText('red', String(resV5.statusCode)))}`);
  console.log('Cuerpo de respuesta RFC 7807:', JSON.stringify(resV5.body, null, 2));
  console.log(styleText('green', '✅ Express 5 capturó la excepción asíncrona limpiamente sin necesidad de wrappers externos.'));

  console.log(styleText('bold', styleText('cyan', '\n🎯 RESUMEN TÉCNICO SENIOR:')));
  console.log(
    '1. Si tu proyecto aún está en ' + styleText('yellow', 'Express 4') + ', es OBLIGATORIO usar ' + styleText('yellow', 'express-async-errors') + ' o envolver con un helper.\n' +
    '2. En ' + styleText('green', 'Express 5') + ', el motor despacha directamente las promesas retornadas mediante ' + styleText('cyan', 'result.catch(next)') + '.\n' +
    '3. Los middlewares de error SIEMPRE deben declarar ' + styleText('magenta', '4 parámetros formales (fn.length === 4)') + ' para ser reconocidos.'
  );
}

runLab().catch(console.error);
