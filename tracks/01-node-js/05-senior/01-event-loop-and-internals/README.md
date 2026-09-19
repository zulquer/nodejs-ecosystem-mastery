# Módulo 01: Event Loop & Runtime Internals

Para un desarrollador senior, el **Event Loop** no es una "caja negra mágica". Es un ciclo estructurado gestionado principalmente por **Libuv** (escrito en C), coordinado con el motor **V8** de JavaScript.

---

## ⚙️ Arquitectura: ¿Quién hace qué?

```
+-------------------------------------------------------------+
|                     Tu Código JavaScript                    |
+-------------------------------------------------------------+
                              |
                              v
+-----------------------------+-------------------------------+
|          V8 Engine          |      Node.js Core (C++/JS)    |
| - Call Stack                | - process.nextTickQueue       |
| - Microtask Queue (Promises)| - Bindings nativos            |
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                           LIBUV                             |
| - Event Loop (6 fases deterministas)                        |
| - Thread Pool (4 hilos por defecto: fs, crypto, dns.lookup) |
| - Non-blocking I/O (epoll en Linux, kqueue en macOS, etc.)  |
+-------------------------------------------------------------+
```

---

## 🔄 Las 6 Fases del Event Loop (Libuv)

En cada "vuelta" (tick) del Event Loop de Libuv, se recorren las siguientes fases en orden estricto:

1. **Timers**: Ejecuta los callbacks programados por `setTimeout()` y `setInterval()`.
2. **Pending Callbacks**: Ejecuta callbacks de I/O aplazados de la iteración anterior (por ejemplo, errores específicos de red del sistema operativo).
3. **Idle / Prepare**: Uso exclusivamente interno de Libuv para preparar la siguiente fase.
4. **Poll (Sondeo)**:
   - Recupera nuevos eventos de I/O (lectura de red, disco, sockets entrantes).
   - Ejecuta los callbacks de I/O casi de inmediato.
   - Si no hay timers pendientes ni `setImmediate`, puede bloquear y esperar nuevos eventos de I/O.
5. **Check**: Ejecuta callbacks registrados con `setImmediate()`.
6. **Close Callbacks**: Ejecuta callbacks de eventos de cierre (ejemplo: `socket.on('close', ...)`).

---

## ⚡ Las Colas de Microtareas (Microtask Queues)

Las microtareas **NO son parte de Libuv**, sino que son gestionadas por V8 y Node.js en memoria:

1. **`process.nextTickQueue`** (Prioridad MÁXIMA):
   - Cada vez que el Call Stack de JavaScript se vacía, Node.js procesa **toda** la cola de `process.nextTick` antes de cualquier otra cosa.
2. **`otherMicrotasksQueue`** (Promises y `queueMicrotask`):
   - Se procesan inmediatamente después de vaciar la cola de `nextTick`, y antes de que el Event Loop avance a la siguiente fase de Libuv.

> ⚠️ **Regla de Oro Senior**: Las microtareas se drenan por completo entre cada fase del Event Loop y entre callbacks individuales. Si encolas microtareas indefinidamente (ej. llamadas recursivas a `process.nextTick`), el Event Loop se "congela" (Starvation) y jamás atenderá I/O ni timers.

---

## 📂 Scripts del Módulo

1. **`01-microtasks-vs-macrotasks.js`**:
   - Demostración práctica del orden de ejecución entre `process.nextTick`, `Promise.then`, `queueMicrotask`, `setTimeout` y `setImmediate`.
2. **`02-nexttick-vs-setimmediate-io.js`**:
   - Comportamiento en contexto global vs contexto de I/O (fase Poll de Libuv). Demostración de por qué dentro de un callback de I/O `setImmediate` siempre gana a `setTimeout(0)`.
3. **`03-event-loop-starvation-and-delay.js`**:
   - Inanición del bucle de eventos, medición precisa del retraso con `perf_hooks.monitorEventLoopDelay()` y técnicas de descongestión (unrolling / chunking).
