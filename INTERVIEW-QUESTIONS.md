# 🟢 Node.js Ecosystem Mastery: Hub Maestro de Preguntas de Entrevistas Técnicas

> **Total: 450 Preguntas Técnicas de Alto Nivel** divididas en 4 guías especializadas (150 en Node.js Core y 100 en cada framework/lenguaje), diseñadas para roles de **Junior, Mid-Level, Senior Node.js Developer, NestJS Architect, Express Specialist, Backend Tech Lead y Staff Systems Engineer**.

---

## 🧭 Estructura del Ecosistema de Entrevistas (450 Preguntas)

En el desarrollo profesional con Node.js, las entrevistas técnicas profundas evalúan tanto el runtime subyacente (V8, Libuv, memoria, hilos) como los frameworks dominantes del mercado (Express y NestJS) y la calidad mediante TypeScript estricto y testing moderno.

Para garantizar máxima exhaustividad y profundidad técnica sin omitir ningún detalle crítico, este módulo se divide en 4 volúmenes dedicados:

```
nodejs-ecosystem-mastery/
├── INTERVIEW-QUESTIONS.md                <-- [ESTE HUB MAESTRO]
├── INTERVIEW-QUESTIONS-NODEJS.md         <-- 150 Preguntas: Node.js Core, Fundamentos, V8, Libuv & Concurrencia
├── INTERVIEW-QUESTIONS-EXPRESS.md        <-- 100 Preguntas: Express.js, Middlewares & Arquitectura
├── INTERVIEW-QUESTIONS-NESTJS.md         <-- 100 Preguntas: NestJS Enterprise, IoC, CQRS & Microservicios
└── INTERVIEW-QUESTIONS-TYPESCRIPT.md     <-- 100 Preguntas: TypeScript Avanzado, Testing & ECMAScript
```

---

## 📚 Acceso Directo a las 4 Guías Especializadas

### 1. 🟢 [Node.js Core & Runtime Mastery (150 Preguntas)](./INTERVIEW-QUESTIONS-NODEJS.md)
*Enfoque: Internals del runtime, bajo nivel, escalabilidad de sockets y concurrencia.*
- **Motor V8, Gestión de Memoria y Garbage Collection (Preguntas 1-12)**:
  - Compilador Ignition vs TurboFan, hidden classes (*Shapes*), inline caching.
  - Heap spaces (New Space, Old Space, Large Object Space, Code Space).
  - Algoritmos Scavenge (Cheney) y Mark-Sweep-Compact con recolección incremental.
  - Slabs de 8KB en Buffers, detección de Memory Leaks con Heap Snapshots y Allocation Profiler.
- **Arquitectura Libuv, Event Loop y Microtasks (Preguntas 13-25)**:
  - Las 6 fases del Event Loop (Timers, Pending I/O, Idle/Prepare, Poll, Check, Close).
  - Microtasks (`process.nextTick` vs `Promise.then`), inanición (*starvation*) del bucle.
  - `UV_THREADPOOL_SIZE`, operaciones bloqueantes de crypto y fs en hilos de Libuv.
  - `ref()` y `unref()` en handles y timers.
- **Buffers, Streams y Manejo de Backpressure (Preguntas 26-35)**:
  - Backpressure nativo (`stream.write() === false` y evento `'drain'`).
  - `stream.pipeline` con `AbortSignal` vs el obsoleto `.pipe()`.
  - Streams duplex, transform y streaming HTTP con chunked transfer encoding.
- **Concurrencia: Worker Threads, Cluster y Child Processes (Preguntas 36-43)**:
  - `worker_threads` vs `child_process.fork()` vs módulo `cluster`.
  - Memoria compartida con `SharedArrayBuffer` y sincronización con `Atomics`.
  - IPC (Inter-Process Communication) y transferencia de file descriptors (`sendHandle`).
- **Diagnóstico, Profiling, Observabilidad y CJS vs ESM (Preguntas 44-50)**:
  - Flamegraphs con `perf` y `--prof`, OpenTelemetry con `AsyncLocalStorage`.
  - Dual-package hazard (CJS vs ESM), import loops y graceful shutdown coordinado.

👉 **[Ver las 100 Preguntas de Node.js Core & Runtime](./INTERVIEW-QUESTIONS-NODEJS.md)**

---

### 2. ⚡ [Express.js Framework & Middlewares Mastery (100 Preguntas)](./INTERVIEW-QUESTIONS-EXPRESS.md)
*Enfoque: Arquitectura HTTP pragmática, middlewares, routing y rendimiento.*
- **Fundamentos del Enrutamiento, Ciclo de Vida y Middlewares (Preguntas 1-12)**:
  - El patrón Onion Middleware, orden de precedencia y signatura de `(err, req, res, next)`.
  - `app.use` vs `router.use`, sub-routers modulares y `mergeParams: true`.
  - Param pre-conditioning con `router.param()` y salto de rutas con `next('route')`.
  - Diferencias críticas entre Express 4 y Express 5 (soporte de promesas en middlewares, path-to-regexp v8).
- **Manejo de Errores, Robustez y Middlewares Especiales (Preguntas 13-22)**:
  - Manejo de excepciones asíncronas no capturadas y `express-async-errors`.
  - Estándar RFC 7807 (Problem Details for HTTP APIs) en respuestas de error.
  - Headers HTTP ya enviados (`res.headersSent`) y prevención del crash por doble envío.
  - Middlewares de body parsing (`express.json({ limit })`), raw buffers para webhooks de Stripe.
- **Seguridad en Producción con Express (Preguntas 23-32)**:
  - Configuración exhaustiva de `helmet` (CSP, HSTS, X-Frame-Options).
  - Prevención de NoSQL Injection, ReDoS, Parameter Pollution (`hpp`) y Path Traversal.
  - Cookie flags de seguridad (`HttpOnly`, `Secure`, `SameSite=Strict`).
  - Rate limiting distribuido con `express-rate-limit` y Redis Store con algoritmos Token Bucket / Sliding Window.
- **Performance, Streaming, Cache y Escalabilidad (Preguntas 33-40)**:
  - Streaming de archivos grandes mediante `stream.pipeline` sin saturar memoria RAM.
  - Cache HTTP (`ETag`, `Last-Modified`, `304 Not Modified`, `Cache-Control`).
  - Compresión gzip/brotli con `compression` y por qué descargarla en un Reverse Proxy (Nginx/Traefik).
  - Session clustering en Redis mediante `connect-redis` frente a JWTs sin estado.
- **Testing, Tipado en TypeScript, Migraciones y Fastify (Preguntas 41-50)**:
  - Pruebas E2E y de integración con `supertest` sin apertura de puertos TCP.
  - Extensiones de namespaces y tipos en `Express.Request` y `Express.Response`.
  - Comparativa de arquitectura y rendimiento entre Express y Fastify (Fastify schema compiler, ajv, find-my-way).
  - Arquitectura en capas limpia: Controladores desacoplados de `req`/`res` mediante DTOs.

👉 **[Ver las 100 Preguntas de Express.js](./INTERVIEW-QUESTIONS-EXPRESS.md)**

---

### 3. 🦁 [NestJS Enterprise Architecture Mastery (100 Preguntas)](./INTERVIEW-QUESTIONS-NESTJS.md)
*Enfoque: Arquitectura empresarial modular, inyección de dependencias, CQRS y microservicios.*
- **Contenedor IoC, Inyección de Dependencias y Módulos (Preguntas 1-12)**:
  - Registro de providers (`useClass`, `useValue`, `useFactory`, `useExisting`).
  - Scopes de inyección (`DEFAULT`, `REQUEST`, `TRANSIENT`) y el impacto en memoria del Request Scope.
  - Módulos dinámicos (`forRoot`, `forFeature`, `forRootAsync`, `ConfigurableModuleBuilder`).
  - Resolución de dependencias circulares con `forwardRef()` y diseño arquitectónico alternativo.
  - Hooks de ciclo de vida (`onModuleInit`, `onApplicationBootstrap`, `onModuleDestroy`).
- **El Ciclo de Vida de una Petición en NestJS (Preguntas 13-22)**:
  - Orden estricto de ejecución: Middlewares -> Guards -> Interceptors (Pre) -> Pipes -> Handler -> Interceptors (Post) -> Exception Filters.
  - `ExecutionContext` y `ArgumentsHost` para abstracción multiplataforma (HTTP, WebSockets, RPC).
  - Validación de payloads con `ValidationPipe`, `class-validator`, `whitelist` y `forbidNonWhitelisted`.
  - Metadata personalizada con `SetMetadata()` y `Reflector`.
- **Persistencia, Transacciones y Modelado de Dominio (Preguntas 23-30)**:
  - Patrón Repository y desacoplamiento de ORMs (Prisma, TypeORM, MikroORM).
  - Transacciones atómicas de negocio con `DataSource.transaction()` o Unit of Work.
  - Soft-deletes, multi-tenancy a nivel de schema y migración de esquemas.
- **Microservicios, Event-Driven y WebSockets (Preguntas 31-40)**:
  - Patrones de transporte (`Transport.KAFKA`, `Transport.RMQ`, `Transport.TCP`).
  - Request-Response (`client.send()`) vs Event-Based (`client.emit()`).
  - Arquitectura CQRS con `@nestjs/cqrs` (Command Bus, Query Bus, Event Bus, Sagas).
  - WebSockets con `@WebSocketGateway()` y adaptadores Redis para Socket.io / ws.
- **Testing, Seguridad, Performance y Fastify Adapter (Preguntas 41-50)**:
  - `Test.createTestingModule()` y técnicas de mocking selectivo (`overrideProvider()`).
  - Autenticación JWT y roles con Passport (`@nestjs/passport`) y `AuthGuard`.
  - Adaptador `FastifyAdapter` y mitigación de incompatibilidades con middlewares de Express.
  - Tareas en segundo plano con `@nestjs/bullmq` y observabilidad con OpenTelemetry e Interceptors.

👉 **[Ver las 100 Preguntas de NestJS](./INTERVIEW-QUESTIONS-NESTJS.md)**

---

### 4. 🔷 [TypeScript, Testing & Modern ECMAScript (100 Preguntas)](./INTERVIEW-QUESTIONS-TYPESCRIPT.md)
*Enfoque: Sistema de tipos estricto, metodologías de prueba, TDD y características modernas del lenguaje.*
- **Sistema de Tipos de TypeScript Avanzado (Preguntas 1-12)**:
  - *Conditional Types* y palabra clave `infer` para desenvolver promesas y retornos.
  - *Mapped Types* y *Key Remapping* (`as`) con Template Literal Types.
  - *Branded / Nominal Types* para erradicar el Primitive Obsession en identificadores de dominio.
  - *Covarianza* y *Contravarianza* de parámetros y retornos (`strictFunctionTypes`).
  - *Exhaustiveness Check* con `never` en Discriminated Unions.
  - Operador `satisfies` (TS 4.9+) vs `as` cast vs type annotations.
  - Utilitarios nativos desde cero: `ReturnType`, `Parameters`, `Pick`, `Omit`, `Awaited`.
- **Configuración del Compilador, Módulos y Arquitectura TS (Preguntas 13-20)**:
  - Flags estrictos: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
  - `moduleResolution: "node16"` vs `"bundler"` e importaciones ESM con extensión `.js`.
  - *Declaration Merging* para augmentations de namespaces globales y de terceros.
  - Monorepos con *Project References* (`composite: true`, `tsc -b`).
  - Compilación `tsc` vs transpiladores binarios (`esbuild`, `swc`, `tsup`).
  - *Stage 3 Decorators* vs *Experimental Decorators* y metadatos de reflexión.
- **Estrategias y Fundamentos de Testing en Node.js (Preguntas 21-30)**:
  - Definición formal de los 5 Test Doubles: Dummy, Stub, Spy, Mock, Fake.
  - El test runner nativo `node:test` y `node:assert` vs frameworks externos.
  - Jest vs Vitest: Arquitectura ESM nativa, rendimiento de workers y Vite pipeline.
  - Estructura AAA y Four-Phase Test (Setup, Exercise, Verify, Teardown).
  - Pruebas con Fake Timers (`vi.useFakeTimers()`) y testing determinista de Streams.
  - *Mutation Testing* con Stryker: Mutantes eliminados/sobrevivientes y métrica MSI.
- **Testing de Integración, End-to-End y Base de Datos (Preguntas 31-40)**:
  - Contenedores Docker efímeros en tests con `Testcontainers` (PostgreSQL, Redis).
  - Estrategias de limpieza de BD: Transacciones Rollback vs TRUNCATE vs Database-per-Worker.
  - Simulación de peticiones HTTP externas con MSW (`msw/node`) vs `nock`.
  - *Contract Testing* con Pact para arquitecturas orientadas a microservicios.
  - *Property-Based Testing* con `fast-check` y reducción sistemática (*Shrinking*).
  - Pruebas de condiciones de carrera y transacciones concurrentes con `Promise.all`.
- **ECMAScript Moderno, JavaScript Internals y Best Practices (Preguntas 41-50)**:
  - Operadores `??`, `?.`, `||=`, `&&=`, `??=`.
  - `WeakMap` y `WeakSet`: Recolección de claves débiles y mitigación de Memory Leaks.
  - Campos privados nativos (`#field`) vs palabra clave `private` de TypeScript.
  - Generadores asíncronos (`async function*`) y consumo en streaming con `for await...of`.
  - Comparativa de los 4 combinadores de Promesas: `all`, `allSettled`, `race`, `any`.
  - Cancelación cooperativa con `AbortController` y `AbortSignal`.
  - Clonación profunda nativa con `structuredClone()` vs `JSON.parse(JSON.stringify())`.
  - Top-Level `await` en ESM: Ventajas y riesgos de deadlock en inicialización.

👉 **[Ver las 100 Preguntas de TypeScript & Testing](./INTERVIEW-QUESTIONS-TYPESCRIPT.md)** (o en el módulo suite `../typescript-mastery/`)

---

## 🎯 Matriz de Evaluación por Rol de Ingeniería

| Nivel / Rol | Foco Principal de Evaluación | Documentos Clave de Estudio |
| :--- | :--- | :--- |
| **Junior Node.js Engineer** | Sintaxis asíncrona, promesas, middlewares de Express, tipado básico de TypeScript, tests unitarios con AAA. | [Express.js Q1-15](./INTERVIEW-QUESTIONS-EXPRESS.md), [TypeScript Q1-10, Q21-25](./INTERVIEW-QUESTIONS-TYPESCRIPT.md) |
| **Mid-Level Backend Engineer** | Fases del Event Loop, ciclo de vida de NestJS, testing de integración con mocks/stubs, validación con DTOs, manejo de streams y transacciones SQL. | [Node.js Q13-25](./INTERVIEW-QUESTIONS-NODEJS.md), [Express Q16-32](./INTERVIEW-QUESTIONS-EXPRESS.md), [NestJS Q1-25](./INTERVIEW-QUESTIONS-NESTJS.md) |
| **Senior / Lead Backend Engineer** | Concurrencia con Worker Threads y Atomics, mitigación de Backpressure, módulos dinámicos y CQRS en NestJS, Testcontainers en CI, Branded Types, optimización de V8 y Garbage Collection. | [Node.js Q1-12, Q36-43](./INTERVIEW-QUESTIONS-NODEJS.md), [NestJS Q23-40](./INTERVIEW-QUESTIONS-NESTJS.md), [TypeScript Q1-20, Q31-40](./INTERVIEW-QUESTIONS-TYPESCRIPT.md) |
| **Staff / Principal Systems Architect** | Diagnóstico de Memory Leaks con Heap Snapshots y perf flamegraphs, arquitectura desacoplada de microservicios con Pact y Kafka, sustitución de adaptadores Fastify de alto rendimiento, gobernanza de monorepos TS con Project References. | **Las 4 guías completas (200 preguntas)** |

---

## 💡 Cómo Conducir una Entrevista Técnica con estas Guías

1. **No evaluar memoria enciclopédica; evaluar criterio de diseño**: Utiliza las banderas 🚩 *Red Flag* y 🟢 *Green Flag* de cada pregunta para discernir si el candidato comprende los compromisos (*trade-offs*) arquitectónicos.
2. **Pedir razonamiento de producción**: Pregunta no solo *"qué es un Stream con Backpressure"*, sino *"qué incidente de producción ocurrió la última vez que piping sin backpressure saturó la memoria de los pods en Kubernetes"*.
3. **Validar principios de Type Safety**: En TypeScript, comprueba si el candidato confía en `any`/`as` para silenciar al compilador o si diseña modelos de dominio sólidos con branded types, narrowings y tipos condicionales.
