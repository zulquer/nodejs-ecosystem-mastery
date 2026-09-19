# Nivel 05: Senior (Ingeniero Senior / Staff)

En este nivel se domina la **arquitectura interna del runtime de Node.js**, la interacción con el motor **V8** y la librería **Libuv**, la gestión de memoria cruda, la concurrencia multihilo y multiproceso, y el diagnóstico de rendimiento en producción.

---

## 🗺️ Módulos de Nivel Senior

| Módulo | Conceptos Clave de Nivel Senior | Estado |
| :--- | :--- | :--- |
| **[01-event-loop-and-internals](./01-event-loop-and-internals/)** | Fases de Libuv (Timers, Poll, Check), prioridades de colas (ESM vs CJS), Starvation y medición nativa de lag con `perf_hooks.monitorEventLoopDelay()`. | ✅ Completado |
| **[02-buffers-and-binary-data](./02-buffers-and-binary-data/)** | Pool de 8KB (Slab Allocator), alloc vs allocUnsafe, Vistas Zero-Copy (`subarray()`) y prevención de fugas de memoria silenciosas por retención. | ✅ Completado |
| **[03-streams-and-backpressure](./03-streams-and-backpressure/)** | Control de flujo con evento `drain`, límites de memoria `highWaterMark`, riesgos de fugas de FD con `.pipe()` vs `stream.pipeline()`, y Async Generators. | ✅ Completado |
| **[04-async-context-and-events](./04-async-context-and-events/)** | Trazabilidad distribuida con `AsyncLocalStorage` (Trace IDs sin prop-drilling), cancelación cooperativa con `AbortController` / `AbortSignal.any()`, y auto-limpieza con `events.addAbortListener()`. | ✅ Completado |
| **[05-concurrency-and-threads](./05-concurrency-and-threads/)** | Saturación de `UV_THREADPOOL_SIZE`, paralelismo en CPU con `worker_threads`, Race Conditions reales en JS con `SharedArrayBuffer` resueltas con `Atomics.add()`, y Rolling Restarts con `cluster`. | ✅ Completado |
| **06-networking-and-http-from-scratch** | Sockets TCP con `node:net`, decodificación de tramas binarias, servidor HTTP nativo sin dependencias y streaming de respuestas HTTP/1.1. | ⏳ Pendiente |
| **07-memory-debugging-and-profiling** | V8 Heap vs Stack, fases del Garbage Collector (Scavenge vs Mark-Sweep), volcado de Heap Snapshots con `v8.writeHeapSnapshot()` y CPU profiling. | ⏳ Pendiente |

---

## ⚡ Comandos de Ejecución

Todos los laboratorios se ejecutan desde la raíz del proyecto:

```bash
# Event Loop
npm run node:senior:m1:1
npm run node:senior:m1:2
npm run node:senior:m1:3

# Buffers y Slab Allocation
npm run node:senior:m2:1
npm run node:senior:m2:2
npm run node:senior:m2:3

# Streams y Backpressure
npm run node:senior:m3:1
npm run node:senior:m3:2
npm run node:senior:m3:3

# Contexto Asíncrono y Eventos
npm run node:senior:m4:1
npm run node:senior:m4:2
npm run node:senior:m4:3

# Concurrencia y Multithreading
npm run node:senior:m5:1
npm run node:senior:m5:2
npm run node:senior:m5:3
```
