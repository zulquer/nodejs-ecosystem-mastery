/**
 * ============================================================================
 * LECCIÓN 01: AsyncLocalStorage y Trazabilidad Distribuida (Trace IDs)
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Comprender la necesidad de `AsyncLocalStorage` (la respuesta de Node.js a `ThreadLocal`).
 * 2. Eliminar el antipatrón de "Prop-Drilling" de contexto (pasar el `traceId` y `user`
 *    como argumento a través de 20 capas de funciones).
 * 3. Demostrar cómo peticiones concurrentes entrelazadas en el Event Loop mantienen
 *    su contexto aislado sin contaminación cruzada.
 * 4. Implementar un Logger corporativo con inyección transparente de metadatos.
 * ============================================================================
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';
import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 01: AsyncLocalStorage (Rastreo de Trace ID y Contexto)'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// 1. Instancia global del almacén de contexto asíncrono
const asyncLocalStorage = new AsyncLocalStorage();

// 2. Logger Centralizado: No recibe traceId por parámetro, lo obtiene del contexto actual
const Logger = {
  info(message) {
    const store = asyncLocalStorage.getStore();
    const traceId = store?.traceId ? styleText('yellow', `[${store.traceId.slice(0, 8)}]`) : styleText('gray', '[no-trace]');
    const user = store?.user ? styleText('magenta', `<${store.user}>`) : styleText('gray', '<anon>');
    const time = performance.now().toFixed(0).padStart(4);

    console.log(`${styleText('gray', `+${time}ms`)} ${traceId} ${user} ${message}`);
  }
};

// 3. Capa de Repositorio (Cero conocimiento de HTTP, Trace ID o Users)
class OrderRepository {
  async saveOrder(orderId, amount) {
    Logger.info(`💾 [OrderRepository] Conectando a BD para guardar orden #${orderId}...`);
    // Simulamos latencia asíncrona de I/O de base de datos
    await new Promise((r) => setTimeout(r, Math.random() * 50 + 20));
    Logger.info(`💾 [OrderRepository] Orden #${orderId} de $${amount} guardada con éxito en PostgreSQL.`);
  }
}

// 4. Capa de Servicio de Negocio
class PaymentService {
  constructor() {
    this.repo = new OrderRepository();
  }

  async processPayment(orderId, amount) {
    Logger.info(`💳 [PaymentService] Iniciando cobro de $${amount}...`);
    await new Promise((r) => setTimeout(r, 20));
    
    // Llamada a repositorio: Observa que NO le pasamos el contexto ni el traceId!
    await this.repo.saveOrder(orderId, amount);
    Logger.info(`💳 [PaymentService] Cobro completado.`);
  }
}

// 5. Capa de Middleware / Handler HTTP
async function handleIncomingRequest(user, orderId, amount) {
  // Generamos metadatos de la petición
  const requestContext = {
    traceId: crypto.randomUUID(),
    user: user,
    startTime: Date.now()
  };

  // ⚡ CLAVE SENIOR: asyncLocalStorage.run envuelve la ejecución.
  // Cualquier Promise, función asíncrona o timer dentro de este callback
  // tendrá acceso al requestContext mediante asyncLocalStorage.getStore()!
  return asyncLocalStorage.run(requestContext, async () => {
    Logger.info(`🌐 [HTTP Middleware] Petición entrante para crear orden #${orderId}`);
    
    const paymentService = new PaymentService();
    await paymentService.processPayment(orderId, amount);

    Logger.info(`🌐 [HTTP Middleware] Respuesta HTTP 201 enviada.`);
  });
}

// ----------------------------------------------------------------------------
// SIMULACIÓN: Múltiples Peticiones Concurrentes Entrelazadas
// ----------------------------------------------------------------------------
async function runConcurrentRequests() {
  console.log(styleText(['bold', 'yellow'], '--- Lanzando 3 peticiones HTTP concurrentes con I/O asíncrono entrelazado ---\n'));

  // Las lanzamos en paralelo con Promise.all para que sus callbacks se intercalen en Libuv
  await Promise.all([
    handleIncomingRequest('alice_senior', 101, 250),
    handleIncomingRequest('bob_architect', 102, 1200),
    handleIncomingRequest('carlos_lead', 103, 75)
  ]);

  console.log(styleText(['bold', 'white'], '\n💡 CONCLUSIÓN SENIOR:'));
  console.log(styleText('white', '  1. Cada log imprimió el `traceId` y el `user` correcto a pesar de que las llamadas'));
  console.log(styleText('white', '     a BD se intercalaron asíncronamente en el mismo Event Loop de Node.js.'));
  console.log(styleText('white', '  2. Ni `PaymentService` ni `OrderRepository` tuvieron que ensuciar sus firmas con `(ctx)` o `(traceId)`.'));
  console.log(styleText('white', '  3. Este es el mecanismo estándar con el que OpenTelemetry (OTel), Datadog y NestJS CLS'));
  console.log(styleText('white', '     rastrean transacciones distribuidas en microservicios.\n'));
}

runConcurrentRequests();
