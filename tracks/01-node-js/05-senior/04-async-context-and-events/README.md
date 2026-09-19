# Módulo 04: Contexto Asíncrono, Cancelación y Eventos

En aplicaciones empresariales de alta concurrencia, las operaciones no ocurren de forma aislada. Miles de peticiones entrelazadas cruzan llamadas a bases de datos, APIs de terceros, timers y eventos.

Un desarrollador senior debe dominar tres herramientas críticas para mantener el control, la observabilidad y la estabilidad del servidor:

---

## 🧭 1. `AsyncLocalStorage` (`node:async_hooks`)

En lenguajes multihilo tradicionales (como Java o C#), existe `ThreadLocal` para almacenar datos específicos del hilo actual. Pero en Node.js, un **único hilo** atiende cientos de peticiones asíncronas concurrentemente.

¿Cómo propagamos el **Trace ID**, el **Tenant ID** o el usuario autenticado a través de múltiples capas (Controllers -> Services -> Repositories -> Loggers) **sin ensuciar cada firma de método** con un argumento `context`?

```
[ Petición HTTP A ] ---> AsyncLocalStorage.run({ traceId: 'abc-1' }, async () => {
                              |
                              +--> Controller()
                                      |
                                      +--> Service()
                                              |
                                              +--> Repository()
                                                      |
                                                      +--> Logger.info() 
                                                           (Lee traceId 'abc-1' de la nada!)
                         })
```

`AsyncLocalStorage` preserva la continuidad del almacén a través de Promises, `await`, timers (`setTimeout`) y callbacks de I/O. Es el cimiento sobre el que se construye **OpenTelemetry** y los sistemas de métricas y auditoría modernos.

---

## 🛑 2. Cancelación Cooperativa con `AbortController`

¿Qué pasa si un usuario cancela una petición HTTP en su navegador mientras tu backend sigue ejecutando una query pesada de 10 segundos en la base de datos?
- En código junior: El backend sigue trabajando a ciegas, desperdiciando CPU, I/O y memoria para una respuesta que nadie va a recibir.
- En arquitectura senior: La cancelación se propaga en cascada usando `AbortSignal`.

### APIs Modernas de `AbortSignal`:
- `AbortSignal.timeout(ms)`: Reemplaza los complejos y propensos a fugas `setTimeout() / clearTimeout()`.
- `AbortSignal.any([signal1, signal2])`: Permite combinar múltiples razones de cancelación (ej. la petición fue cancelada por el usuario **O** se agotó el timeout de 3 segundos).

---

## ⚡ 3. `EventEmitter` Internals y Fugas de Memoria

El `EventEmitter` es la columna vertebral de casi toda la API de Node.js (Streams, Sockets, Process). Sin embargo, esconde dos de las trampas más letales:

1. **Crash por evento `'error'` no capturado**: Si emites `emitter.emit('error', err)` y no hay ningún listener `.on('error')` registrado, **Node.js finaliza el proceso inmediatamente** con un `uncaughtException`.
2. **Retención de Memoria en Closures**: Si registras un listener en un EventEmitter de larga vida (ej. un singleton o bus de eventos) y no lo eliminas con `.off()`, **el objeto y todo su closure** nunca podrán ser recolectados por el Garbage Collector.
   *Solución Senior*: Usar `emitter.on('evento', handler, { signal })` para desuscribirse automáticamente.

---

## 📂 Scripts del Módulo

1. **`01-async-local-storage-tracing.js`**:
   - Implementación de un logger de observabilidad distribuida empresarial con `Trace ID` y `User Context` automático a través de llamadas asíncronas y microservicios simulados.
2. **`02-abort-controller-and-timeouts.js`**:
   - Cancelación en cascada de peticiones, simulación de desconexión de clientes, `AbortSignal.timeout()` y combinación con `AbortSignal.any()`.
3. **`03-event-emitter-leaks-and-signals.js`**:
   - Demostración de crash por error no capturado, detección del warning `MaxListenersExceededWarning`, fuga por closures y la solución nativa moderna con `{ signal }`.
