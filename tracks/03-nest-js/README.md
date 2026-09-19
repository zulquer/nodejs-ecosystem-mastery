# 🔴 NestJS Senior & Staff Engineer Mastery: Los 100 Temas Esenciales

Bienvenido a la **enciclopedia práctica y definitiva de NestJS a nivel Senior / Staff / Principal Engineer**.

Aquí no hay tutoriales básicos ni código de juguete. Este documento recoge los **100 temas y laboratorios de arquitectura** que todo desarrollador debe dominar para liderar sistemas backend de misión crítica, alta concurrencia y tolerancia a fallos.

---

## 🏛️ Índice de los 10 Bloques Arquitectónicos (100 Labs)

- **[Bloque 01: El Pipeline Sagrado de Ejecución & Metaprogramación (01 - 10)](#bloque-01)**
- **[Bloque 02: Inversión de Control (IoC) & Inyección de Dependencias Profunda (11 - 20)](#bloque-02)**
- **[Bloque 03: Módulos Dinámicos & Arquitectura de Librerías (21 - 30)](#bloque-03)**
- **[Bloque 04: Ciclo de Vida, Resiliencia & Producción (31 - 40)](#bloque-04)**
- **[Bloque 05: Persistencia de Datos, Transacciones & Concurrencia (41 - 50)](#bloque-05)**
- **[Bloque 06: Autenticación, Autorización & Seguridad de Grado Bancario (51 - 60)](#bloque-06)**
- **[Bloque 07: Microservicios, Mensajería & Sistemas Distribuidos (61 - 70)](#bloque-07)**
- **[Bloque 08: Arquitectura CQRS & Event-Driven a Gran Escala (71 - 80)](#bloque-08)**
- **[Bloque 09: Comunicación en Tiempo Real, Streaming & Background Jobs (81 - 90)](#bloque-09)**
- **[Bloque 10: Metaprogramación, AST, Testing Avanzado & Internals (91 - 100)](#bloque-10)**

---

<a name="bloque-01"></a>
### ⚡ Bloque 01: El Pipeline Sagrado de Ejecución & Metaprogramación (Labs 01 - 10)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **01** | **[Request Lifecycle Execution Order](./01-request-lifecycle-pipeline/01-lifecycle-execution-order.ts)** | Demostración milimétrica del orden exacto: Middleware -> Guard -> Interceptor Pre -> Pipe -> Handler -> Interceptor Post (Cebolla RxJS). | ✅ Ejecutable |
| **02** | **ExecutionContext & ArgumentsHost Polimórfico** | Escribir un Guard agnóstico que funcione idéntico en HTTP (`switchToHttp`), RPC (`switchToRpc`) y WebSockets (`switchToWs`). | ⏳ Pendiente |
| **03** | **Custom Param Decorators & Composición** | Creación de decoradores de parámetros (`@CurrentUser()`) y composición con Pipes de validación internos. | ⏳ Pendiente |
| **04** | **Reflector & Jerarquía de Metadatos** | Lectura jerárquica de metadatos con `Reflector`: `getAllAndOverride()` vs `getAllAndMerge()` para control de permisos. | ⏳ Pendiente |
| **05** | **RxJS Avanzado en Interceptors** | Implementación de Circuit Breaker nativo, `timeout()`, `retryWhen()` y envoltura de respuesta estándar `{ data, meta }`. | ⏳ Pendiente |
| **06** | **Exception Filters & RFC 7807 (Problem Details)** | Estandarización universal de errores HTTP, base de datos y RPC en el estándar oficial RFC 7807 sin filtrar stacktraces. | ⏳ Pendiente |
| **07** | **ValidationPipe Profundo & Sanitización** | Configuración estricta de `class-validator`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` y `plainToInstance`. | ⏳ Pendiente |
| **08** | **Validación Moderna de Alto Rendimiento con Zod** | Reemplazo de `class-validator` con esquemas Zod en Pipes personalizados para inferencia estricta de tipos TypeScript. | ⏳ Pendiente |
| **09** | **Raw Body Capture en Middlewares** | Captura del Buffer binario crudo del body para verificación de firmas criptográficas HMAC en Webhooks (Stripe / PayPal). | ⏳ Pendiente |
| **10** | **Scoped vs Global Bindings Trap** | Riesgos y trampas de inyectar dependencias en filtros y middlewares registrados globalmente con `app.useGlobal*()`. | ⏳ Pendiente |

---

<a name="bloque-02"></a>
### 🧩 Bloque 02: Inversión de Control (IoC) & Inyección de Dependencias Profunda (Labs 11 - 20)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **11** | **El Grafo de Inyección & NestContainer** | Cómo NestJS escanea módulos en el arranque y construye el Directed Acyclic Graph (DAG) de dependencias. | ⏳ Pendiente |
| **12** | **Custom Providers: useClass, useFactory, useValue** | Inversión de dependencias completa: mockear infraestructura y configurar proveedores condicionales. | ⏳ Pendiente |
| **13** | **Desacoplamiento con Tokens de Símbolo** | Arquitectura Hexagonal / Puertos y Adaptadores usando `Symbol('IUserRepository')` para desacoplar el dominio del ORM. | ⏳ Pendiente |
| **14** | **Inyección Asíncrona (Async Factory Providers)** | Conexión e inicialización de clientes de base de datos o colas antes de levantar el servidor con `useFactory` devolviendo una Promise. | ⏳ Pendiente |
| **15** | **ModuleRef & Resolución Dinámica bajo Demanda** | Obtención diferida de instancias del contenedor IoC con `moduleRef.get()` y creación dinámica con `moduleRef.resolve()`. | ⏳ Pendiente |
| **16** | **Scopes: Scope.DEFAULT vs Scope.REQUEST vs Scope.TRANSIENT** | La anatomía interna de los 3 scopes del contenedor de NestJS y su ciclo de vida en memoria. | ⏳ Pendiente |
| **17** | **La Trampa Mortal del Efecto Cascada (Request Scope)** | Demostración de degradación de rendimiento (de 50k req/s a 5k req/s) al inyectar un request-scope en un Singleton. | ⏳ Pendiente |
| **18** | **Alternativa Senior: AsyncLocalStorage en NestJS** | Preservar contexto de Tenant y Usuario en toda la app sin usar `Scope.REQUEST` (manteniendo el Singleton al 100% de velocidad). | ⏳ Pendiente |
| **19** | **Dependencias Circulares & forwardRef()** | Qué hace `forwardRef()` internamente y por qué su presencia es un code-smell que debe resolverse con eventos o mediadores. | ⏳ Pendiente |
| **20** | **DiscoveryService & MetadataScanner** | Construcción de plugins dinámicos que escanean decoradores personalizados en el bootstrap de la app (estilo NestJS Core). | ⏳ Pendiente |

---

<a name="bloque-03"></a>
### 📦 Bloque 03: Módulos Dinámicos & Arquitectura de Librerías (Labs 21 - 30)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **21** | **Anatomía de DynamicModule** | Comprender la estructura de `DynamicModule`: `module`, `providers`, `exports`, `imports` y la propiedad `global`. | ⏳ Pendiente |
| **22** | **Patrones forRoot(), forFeature() y register()** | Cuándo usar cada convención de nombrado según el estándar oficial de NestJS y librerías del ecosistema. | ⏳ Pendiente |
| **23** | **Configuración Asíncrona con forRootAsync()** | Creación manual de un módulo que soporta `useFactory`, `useClass` y `useExisting` para cargar configuración desde la BD o Vault. | ⏳ Pendiente |
| **24** | **ConfigurableModuleBuilder (API Moderna)** | Uso del constructor moderno de NestJS para generar módulos configurables con tipado estricto sin boilerplate. | ⏳ Pendiente |
| **25** | **ASYNC_OPTIONS_TYPE & MODULE_OPTIONS_TOKEN** | Dominio de los tipos automáticos generados por `ConfigurableModuleBuilder` para opciones extra y métodos dinámicos. | ⏳ Pendiente |
| **26** | **Creación de Librerías Internas Reutilizables** | Monorepo de NestJS (`nest g library`) para compartir autenticación, logging y clientes de datos entre microservicios. | ⏳ Pendiente |
| **27** | **Módulos Globales (@Global()) vs Módulos Core** | Cuándo es legítimo usar `@Global()` y cómo evitar la ruptura de la encapsulación modular. | ⏳ Pendiente |
| **28** | **Carga Condicional de Módulos (Feature Flags)** | Habilitar o deshabilitar módulos completos en el arranque del servidor basándose en variables de entorno. | ⏳ Pendiente |
| **29** | **Re-exporting y Módulos Transitivos** | Exportar módulos importados para evitar que los módulos consumidores tengan que declarar dependencias repetitivas. | ⏳ Pendiente |
| **30** | **Module Boundaries & Control de Arquitectura** | Reglas de arquitectura con eslint o Nx para prohibir importaciones ilegales entre dominios de negocio. | ⏳ Pendiente |

---

<a name="bloque-04"></a>
### 🛡️ Bloque 04: Ciclo de Vida, Resiliencia & Producción (Labs 31 - 40)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **31** | **Secuencia Completa de Lifecycle Hooks** | El orden exacto de los 6 hooks: `onModuleInit` -> `onApplicationBootstrap` -> `onModuleDestroy` -> `beforeApplicationShutdown` -> `onApplicationShutdown`. | ⏳ Pendiente |
| **32** | **Graceful Shutdown & SIGTERM en Kubernetes** | Uso de `app.enableShutdownHooks()` para interceptar señales del orquestador y evitar desconexiones forzadas. | ⏳ Pendiente |
| **33** | **Evitar Caídas en Despliegues (Zero-Downtime)** | Esperar a que las conexiones HTTP y transacciones activas finalicen antes de cerrar sockets y pools de base de datos. | ⏳ Pendiente |
| **34** | **Probes de Kubernetes con @nestjs/terminus** | Implementación de Liveness (`/livez`) y Readiness (`/readyz`) con indicadores reales de salud. | ⏳ Pendiente |
| **35** | **Monitoreo de Event Loop Delay en Healthchecks** | Integrar `perf_hooks.monitorEventLoopDelay` en Terminus para que Kubernetes no envíe tráfico si el hilo principal está saturado. | ⏳ Pendiente |
| **36** | **Logging Estructurado de Alta Velocidad (Pino)** | Integrar `nestjs-pino` para logging JSON sin bloqueo del Event Loop, formateado para Datadog / ELK. | ⏳ Pendiente |
| **37** | **OpenTelemetry & Correlación de Trace IDs** | Inyección automática de W3C Trace Context en todas las peticiones HTTP y llamadas salientes. | ⏳ Pendiente |
| **38** | **Rate Limiting Distribuido con @nestjs/throttler** | Protección contra abuso con throttling respaldado por Redis para aplicaciones distribuidas en múltiples pods. | ⏳ Pendiente |
| **39** | **Hardening de Seguridad: Helmet, CORS & Brotli** | Configuración de cabeceras de seguridad HTTP de grado de producción y compresión dinámica. | ⏳ Pendiente |
| **40** | **Optimización de Cold Starts en Serverless** | Técnicas para reducir el arranque en AWS Lambda / Cloud Run: Lazy modules y exclusión de escaneo innecesario. | ⏳ Pendiente |

---

<a name="bloque-05"></a>
### 💾 Bloque 05: Persistencia de Datos, Transacciones & Concurrencia (Labs 41 - 50)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **41** | **Patrón Repository Desacoplado del ORM** | Implementar interfaces de persistencia de dominio para que el negocio no conozca TypeORM ni Prisma. | ⏳ Pendiente |
| **42** | **Patrón Unit of Work (UoW) y Transacciones** | Orquestar transacciones atómicas de múltiples repositorios sin pasar el `EntityManager` o `PrismaClient` como parámetro. | ⏳ Pendiente |
| **43** | **Concurrencia Optimista (@VersionColumn)** | Prevención de sobrescritura de datos concurrentes (*Lost Update Problem*) mediante control de versiones de entidad. | ⏳ Pendiente |
| **44** | **Concurrencia Pesimista (Row Locks)** | Bloqueos de lectura y escritura (`FOR UPDATE`) en bases de datos relacionales para reservas de inventario y saldo bancario. | ⏳ Pendiente |
| **45** | **Multi-Tenancy: Base de Datos Aislada por Tenant** | Enrutamiento dinámico de conexiones a bases de datos independientes por cliente usando `AsyncLocalStorage`. | ⏳ Pendiente |
| **46** | **Multi-Tenancy: Schema Aislado por Tenant** | Gestión de múltiples schemas dentro del mismo motor PostgreSQL para inquilinos con aislamiento lógico. | ⏳ Pendiente |
| **47** | **Multi-Tenancy: Row-Level Security (RLS)** | Aislamiento de datos en tablas compartidas mediante políticas nativas de PostgreSQL configuradas dinámicamente en NestJS. | ⏳ Pendiente |
| **48** | **Database Migrations con Zero-Downtime** | El patrón *Expand and Contract* para aplicar migraciones sin romper versiones anteriores de la API durante despliegues. | ⏳ Pendiente |
| **49** | **Caching Multinivel (L1 Memoria + L2 Redis)** | Implementación de caché local ultra-rápida combinada con Redis distribuido mediante `@nestjs/cache-manager`. | ⏳ Pendiente |
| **50** | **Estrategias de Invalidación de Caché** | Patrones Cache-Aside, Write-Through e invalidación reactiva basada en eventos de dominio. | ⏳ Pendiente |

---

<a name="bloque-06"></a>
### 🔒 Bloque 06: Autenticación, Autorización & Seguridad de Grado Bancario (Labs 51 - 60)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **51** | **Autenticación Stateless JWT & Refresh Tokens** | Flujo completo de access token efímero (15 min) con refresh token rotativo y lista de revocación en Redis. | ⏳ Pendiente |
| **52** | **Role-Based Access Control (RBAC) Jerárquico** | Decorador `@Roles()`, herencia de permisos y Guards que evalúan roles con jerarquías. | ⏳ Pendiente |
| **53** | **Attribute-Based Access Control (ABAC) con CASL** | Autorización basada en atributos del recurso (ej. *"un usuario puede editar un post solo si es el autor"*). | ⏳ Pendiente |
| **54** | **Decorador @Public() y Bypass de Guards** | Configuración de Guards globales con exclusión declarativa mediante metadatos de Reflector. | ⏳ Pendiente |
| **55** | **Defensa en Profundidad: CSRF, XSS y Clickjacking** | Configuración de cookies `SameSite=Strict`, `HttpOnly` y protección contra inyección en respuestas JSON. | ⏳ Pendiente |
| **56** | **Prevención de Inyección SQL/NoSQL en Queries Dinámicas** | Buenas prácticas para sanitizar constructores de consultas dinámicas en TypeORM / Prisma / Mongoose. | ⏳ Pendiente |
| **57** | **Field-Level Encryption para Datos PII** | Cifrado y descifrado automático transparente de columnas sensibles (tarjetas, DNI) con hooks de entidad. | ⏳ Pendiente |
| **58** | **Single Sign-On (SSO) con OAuth2 / OIDC** | Integración de Passport con proveedores de identidad corporativos (Keycloak, Auth0, Okta, Google). | ⏳ Pendiente |
| **59** | **Gestión de Secretos Dinámicos en Tiempo de Ejecución** | Integración con HashiCorp Vault o AWS Secrets Manager con rotación en caliente sin reiniciar la app. | ⏳ Pendiente |
| **60** | **Firmas Criptográficas de Webhooks con Anti-Replay** | Validación de firmas HMAC-SHA256 con ventana de tiempo de tolerancia para evitar ataques de repetición. | ⏳ Pendiente |

---

<a name="bloque-07"></a>
### 🌐 Bloque 07: Microservicios, Mensajería & Sistemas Distribuidos (Labs 61 - 70)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **61** | **Aplicaciones Híbridas (HTTP + Microservicio)** | Una sola aplicación NestJS que expone endpoints REST y al mismo tiempo consume mensajes de una cola o socket TCP. | ⏳ Pendiente |
| **62** | **Transport TCP Nativo de Bajísima Latencia** | Comunicación directa entre microservicios con sockets TCP sin la sobrecarga de HTTP. | ⏳ Pendiente |
| **63** | **Microservicios con RabbitMQ** | Enrutamiento avanzado con Direct, Topic y Fanout Exchanges, confirmaciones manuales de ACKs y Dead Letter Exchanges (DLX). | ⏳ Pendiente |
| **64** | **Event Streaming con Apache Kafka** | Particionado, Consumer Groups, gestión manual de Offsets y rebalanceo de consumidores en NestJS. | ⏳ Pendiente |
| **65** | **RPC de Alto Rendimiento con gRPC y Protobuf** | Definición de contratos `.proto`, compilación de interfaces TypeScript y streaming bidireccional cliente-servidor. | ⏳ Pendiente |
| **66** | **Request-Response (@MessagePattern) vs Event-Driven (@EventPattern)** | Cuándo esperar una respuesta síncrona en colas y cuándo disparar eventos asíncronos *fire-and-forget*. | ⏳ Pendiente |
| **67** | **Políticas de Reintento y Dead Letter Queues (DLQ)** | Gestión de mensajes venenosos (*poison pills*) para que no bloqueen los consumidores del microservicio. | ⏳ Pendiente |
| **68** | **El Patrón Transaccional Outbox** | Garantizar que un evento de dominio se envíe a Kafka/RabbitMQ exactamente si y solo si la transacción de BD se comiteó. | ⏳ Pendiente |
| **69** | **Idempotencia en Consumidores de Eventos** | Decorador `@Idempotent()` respaldado por Redis para garantizar procesamiento seguro ante mensajes duplicados de red. | ⏳ Pendiente |
| **70** | **Backpressure y Control de Flujo en Consumidores** | Evitar que una avalancha de mensajes en RabbitMQ o Kafka sature la memoria RAM del pod de NestJS. | ⏳ Pendiente |

---

<a name="bloque-08"></a>
### 🏗️ Bloque 08: Arquitectura CQRS & Event-Driven a Gran Escala (Labs 71 - 80)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **71** | **Fundamentos de CQRS con @nestjs/cqrs** | Separación radical de modelos de lectura y escritura: CommandBus, QueryBus y EventBus. | ⏳ Pendiente |
| **72** | **Implementación de CommandBus** | Handlers de comandos que ejecutan lógica de negocio, validan invariantes y persisten en la base de datos de escritura. | ⏳ Pendiente |
| **73** | **Implementación de QueryBus Optimizado** | Consultas directas y desnormalizadas a bases de datos de lectura (ej. PostgreSQL views o Elasticsearch) sin tocar el dominio. | ⏳ Pendiente |
| **74** | **EventBus & Publicación de Eventos de Dominio** | Desacoplamiento de efectos colaterales (ej. enviar emails, actualizar analíticas) mediante eventos internos. | ⏳ Pendiente |
| **75** | **El Patrón Saga en NestJS** | Orquestación de flujos de negocio complejos y distribuidos utilizando operadores RxJS en `@Saga()`. | ⏳ Pendiente |
| **76** | **Transacciones Compensatorias en Sagas** | Ejecución automática de comandos compensatorios (rollbacks semánticos) si un paso de la saga distribuida falla. | ⏳ Pendiente |
| **77** | **Event Sourcing: Reconstrucción de Agregados** | Almacenar solo la secuencia inmutable de eventos pasados y reconstruir el estado del agregado en memoria. | ⏳ Pendiente |
| **78** | **Read Model Projections Asíncronas** | Consumir eventos de dominio para actualizar la base de datos de lectura con consistencia eventual. | ⏳ Pendiente |
| **79** | **Snapshots en Event Sourcing** | Guardar instantáneas periódicas del estado del agregado para evitar reproducir miles de eventos en cada lectura. | ⏳ Pendiente |
| **80** | **Testing Integral de Handlers y Sagas CQRS** | Pruebas unitarias puras de commands, queries y sagas sin dependencias de infraestructura. | ⏳ Pendiente |

---

<a name="bloque-09"></a>
### 📡 Bloque 09: Comunicación en Tiempo Real, Streaming & Background Jobs (Labs 81 - 90)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **81** | **WebSockets de Alta Escala con @nestjs/websockets** | Gateways con adaptadores Socket.io y `ws` nativo de alto rendimiento con Redis Adapter para clústeres. | ⏳ Pendiente |
| **82** | **Autenticación en Handshakes de WebSockets** | Guards de autorización en la fase de conexión inicial del WebSocket rechazando sockets no autorizados. | ⏳ Pendiente |
| **83** | **Server-Sent Events (SSE) Nativos con @Sse()** | Notificaciones unidireccionales ligeras desde el servidor al navegador utilizando RxJS Observables sin WebSockets. | ⏳ Pendiente |
| **84** | **Background Jobs con BullMQ y Redis** | Colas de trabajo en segundo plano con `@nestjs/bullmq` para procesamiento desacoplado de emails y tareas pesadas. | ⏳ Pendiente |
| **85** | **Prioridad de Jobs, Reintentos y Rate Limiting** | Configuración de colas con retroceso exponencial (*exponential backoff*), jobs repetitivos y control de concurrencia. | ⏳ Pendiente |
| **86** | **Tareas Programadas con @nestjs/schedule (Cron)** | Ejecución de tareas periódicas con prevención de ejecuciones duplicadas en clústeres multi-pod con Redlock. | ⏳ Pendiente |
| **87** | **Streaming de Subida de Archivos con Busboy** | Subir archivos de 1GB directamente a S3 o disco por streams sin acumular los buffers en la RAM del servidor. | ⏳ Pendiente |
| **88** | **Delegación de Cargas CPU a Worker Threads** | Integrar `worker_threads` dentro de servicios de NestJS para renderizado de PDFs o reportes sin congelar la API. | ⏳ Pendiente |
| **89** | **Streaming de Respuestas HTTP con Backpressure** | Exportación de millones de filas de base de datos a CSV enviadas en chunks al cliente con `stream.pipeline()`. | ⏳ Pendiente |
| **90** | **Sistema Robusto de Webhooks Salientes** | Cola de despacho de webhooks a clientes con firmas HMAC, reintentos automáticos y registro de auditoría. | ⏳ Pendiente |

---

<a name="bloque-10"></a>
### 🔬 Bloque 10: Metaprogramación, AST, Testing Avanzado & Internals (Labs 91 - 100)

| # | Laboratorio | Concepto Clave Senior | Estado |
| :---: | :--- | :--- | :---: |
| **91** | **TypeScript Decorators Internals & Reflect Metadata** | Cómo funcionan los decoradores en TypeScript y cómo NestJS almacena y recupera metadata con `Reflect.defineMetadata`. | ⏳ Pendiente |
| **92** | **Decoradores Compuestos con applyDecorators()** | Creación de decoradores que combinan Swagger, Autenticación, Roles y Serialización en una sola anotación limpia. | ⏳ Pendiente |
| **93** | **Decorador @AuditLog() Metaprogramado** | Interceptar llamadas a métodos de servicios y persistir automáticamente la auditoría de cambios en la base de datos. | ⏳ Pendiente |
| **94** | **Decorador @Benchmark() para Diagnóstico** | Medir milisegundos y consumo de memoria delta de cualquier método en tiempo de desarrollo o producción. | ⏳ Pendiente |
| **95** | **Testing Unitario Profundo con Test.createTestingModule()** | Técnicas avanzadas de testing: `overrideProvider()`, mocks tipados y verificación de comportamiento. | ⏳ Pendiente |
| **96** | **Testing de Integración Real con Testcontainers** | Levantar contenedores Docker efímeros de PostgreSQL y Redis en los tests para probar contra bases de datos reales. | ⏳ Pendiente |
| **97** | **End-to-End (E2E) Testing con Supertest** | Pruebas de integración completa de peticiones HTTP con base de datos transaccional que se limpia tras cada suite. | ⏳ Pendiente |
| **98** | **Profiling y Detección de Fugas de Memoria en NestJS** | Inspeccionar aplicaciones NestJS con Chrome DevTools (`--inspect`) y análisis de snapshots de memoria heap. | ⏳ Pendiente |
| **99** | **AST Transformers y Compilador de NestJS** | Cómo funcionan los plugins del CLI (`@nestjs/swagger/plugin`) para generar documentación OpenAPI analizando el código TypeScript. | ⏳ Pendiente |
| **100** | **Arquitectura Hexagonal / DDD Completa de Referencia** | Estructura de proyecto modular completa de grado empresarial integrando Domain Entities, Use Cases, Ports y Adapters. | ⏳ Pendiente |

---

## ⚡ Comandos Rápidos

Para ejecutar los laboratorios desarrollados:

```bash
# Desde la carpeta nest-js/:
npm run lab01

# O desde la raíz del proyecto:
npm run nest:lab01
```
