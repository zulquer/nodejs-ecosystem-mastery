# 🟢 Node.js Core: Ruta de Aprendizaje por Niveles

Esta carpeta contiene la progresión formativa completa en **Node.js puro**, estructurada desde los cimientos hasta los conocimientos más profundos requeridos para un ingeniero Senior / Staff.

---

## 📈 Matriz de Niveles de Conocimiento

```
+-------------------------------------------------------------------------------+
| Nivel               | Foco Principal                          | Estado        |
+-------------------------------------------------------------------------------+
| 01. Fundamentals    | Runtime V8, CJS vs ESM, CLI y Globals   | 📚 Documentado|
| 02. Trainee         | Async Control, Promises, Error-First    | 📚 Documentado|
| 03. Junior          | Servidor HTTP básico, JSON, SemVer, Test| 📚 Documentado|
| 04. Intermediate    | Streams básicos, Graceful Shutdown, DI  | 📚 Documentado|
| 05. Senior          | Libuv, Slab, Backpressure, Workers, OTel| 🧪 5 Módulos  |
|                     |                                         |    Completados|
+-------------------------------------------------------------------------------+
```

---

## 🧭 Navegación por Niveles

### [01. Fundamentals](./01-fundamentals/)
- Definición formal del runtime Node.js.
- CommonJS vs ECMAScript Modules (`"type": "module"`).
- Variables globales (`process`, `globalThis`, `import.meta.url`).
- Banderas útiles de Node CLI (`--watch`, `--env-file`).

### [02. Trainee](./02-trainee/)
- Callbacks tradicionales y Callback Hell.
- Promesas, `Promise.all()`, `Promise.allSettled()`.
- `async / await` y captura de excepciones con `try / catch`.
- Manejo de rutas con `node:path` y ficheros con `node:fs/promises`.

### [03. Junior](./03-junior/)
- Servidor nativo con `node:http`.
- Lectura y deserialización del cuerpo JSON de peticiones.
- Códigos de estado HTTP y cabeceras fundamentales.
- `package.json`, SemVer (`^` vs `~`) y `package-lock.json`.
- Testing nativo con `node:test` y `node:assert`.

### [04. Intermediate](./04-intermediate/)
- Primer contacto con Streams: evitar picos de memoria en lectura de archivos grandes.
- Manipulación básica de buffers (`Buffer.from`, `Buffer.concat`).
- Separación de capas: Controllers, Services, Repositorios.
- Resiliencia en contenedores: **Graceful Shutdown** con `SIGTERM` y `SIGINT`.
- Logging estructurado en JSON (formato Datadog / ELK).

### [05. Senior](./05-senior/)
- **Event Loop & Libuv**: Fases deterministas, colas microtareas (ESM vs CJS), Starvation y medición nativa de lag (`perf_hooks`).
- **Buffers & Memoria**: El pool de 8KB (Slab Allocator), prevención de fugas por retención y vistas Zero-Copy.
- **Streams & Backpressure**: Control de flujo con evento `'drain'`, fugas de descriptores con `.pipe()` vs `pipeline()`, y Async Generators.
- **Contexto Asíncrono**: `AsyncLocalStorage` para trazabilidad distribuida (Trace IDs) sin prop-drilling, `AbortController` y `events.addAbortListener()`.
- **Concurrencia & Multithreading**: Calibración de `UV_THREADPOOL_SIZE`, Worker Threads, Race Conditions resueltas con `Atomics.add()` y Rolling Restarts con `cluster`.

---

## ⚡ Comandos de Ejecución

Todos los laboratorios prácticos del nivel Senior se pueden ejecutar desde la raíz del proyecto:

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

# Contexto Asíncrono y Cancelación
npm run node:senior:m4:1
npm run node:senior:m4:2
npm run node:senior:m4:3

# Concurrencia y Multiproceso
npm run node:senior:m5:1
npm run node:senior:m5:2
npm run node:senior:m5:3
```
