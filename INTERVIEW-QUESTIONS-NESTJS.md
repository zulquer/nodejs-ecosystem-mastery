# 🔴 NestJS Enterprise Architecture Mastery: Las 100 Preguntas Más Comunes en Entrevistas Técnicas

Guía de referencia técnica profunda para preparación de entrevistas en roles de **Senior NestJS Engineer, Backend Architect, Tech Lead y Staff Software Engineer**.

---

## 📑 Tabla de Contenidos

1. [Arquitectura Fundamental, Módulos e Inyección de Dependencias (Preguntas 1-12)](#1-arquitectura-fundamental-módulos-e-inyección-de-dependencias)
2. [El Request Lifecycle Pipeline en Profundidad (Preguntas 13-24)](#2-el-request-lifecycle-pipeline-en-profundidad)
3. [Módulos Dinámicos y Técnicas Avanzadas de IoC (Preguntas 25-32)](#3-módulos-dinámicos-y-técnicas-avanzadas-de-ioc)
4. [Microservicios, Eventos, WebSockets y CQRS (Preguntas 33-42)](#4-microservicios-eventos-websockets-y-cqrs)
5. [Testing, Persistencia, Rendimiento y Seguridad (Preguntas 43-50)](#5-testing-persistencia-rendimiento-y-seguridad)
6. [Inyección de Dependencias Avanzada, Metadatos y Reflection (Preguntas 51-60)](#6-inyección-de-dependencias-avanzada-metadatos-y-reflection)
7. [Arquitectura CQRS, Event-Driven y Transacciones Distribuidas (Preguntas 61-70)](#7-arquitectura-cqrs-event-driven-y-transacciones-distribuidas)
8. [Microservicios Avanzados, gRPC, WebSockets y SSE (Preguntas 71-80)](#8-microservicios-avanzados-grpc-websockets-y-sse)
9. [GraphQL Enterprise, DataLoader y Rendimiento de APIs (Preguntas 81-90)](#9-graphql-enterprise-dataloader-y-rendimiento-de-apis)
10. [Seguridad Avanzada, Observabilidad OpenTelemetry y Despliegue (Preguntas 91-100)](#10-seguridad-avanzada-observabilidad-opentelemetry-y-despliegue)

---

## 1. Arquitectura Fundamental, Módulos e Inyección de Dependencias

### 1. ¿Cómo funciona internamente el contenedor de Inversión de Control (IoC Container) de NestJS y cómo resuelve dependencias?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El IoC Container de NestJS gestiona el ciclo de vida, la instanciación y la inyección de dependencias de todos los proveedores (`@Injectable()`):
  - **Mecánica de Resolución**:
    1. Durante el arranque (*Bootstrap*), NestJS escanea el módulo raíz y construye un **Grafo de Módulos y Dependencias**.
    2. Utiliza la metadata de TypeScript emitida por el compilador (`emitDecoratorMetadata: true` en `tsconfig.json`) y la librería **`reflect-metadata`**.
    3. Al encontrar una clase con dependencias en su constructor (`constructor(private userService: UserService)`), TypeScript emite los tipos como metadatos (`design:paramtypes`).
    4. El contenedor consulta el tipo emitido, busca el proveedor coincidente en el módulo actual o en los módulos importados, lo instancia (si aún no existe como Singleton) y lo inyecta.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que NestJS inyecta dependencias basándose en el nombre de la variable en lugar de en el tipo o token de inyección.
  - 🟢 **Green Flag**: Explicar la necesidad obligatoria de `reflect-metadata` y por qué las interfaces puras de TypeScript no pueden inyectarse directamente sin un token `@Inject('TOKEN')` (porque las interfaces desaparecen al compilar a JS).

---

### 2. ¿Cuáles son los 3 Scopes de Inyección de Dependencias en NestJS y qué es el "Bubble Effect" (Efecto Burbuja)?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  NestJS define 3 ámbitos de ciclo de vida (`Scope` enum):
  1. **`Scope.DEFAULT` (Singleton - Por Defecto)**:
     - Una única instancia compartida por toda la aplicación. Se crea durante el bootstrap. Máximo rendimiento y bajo consumo de memoria.
  2. **`Scope.TRANSIENT`**:
     - Se crea una nueva instancia exclusiva cada vez que el servicio es inyectado en otra clase.
  3. **`Scope.REQUEST`**:
     - Se crea una **nueva instancia para cada petición HTTP entrante** y se destruye por el Garbage Collector cuando la respuesta termina.
  - **El Efecto Burbuja (Bubble Effect)**:
    - Si inyectas un servicio con `Scope.REQUEST` dentro de un servicio Singleton o en un Controlador, **ese controlador y todos los servicios que dependan de él se convierten automáticamente en Request-scoped**.
    - **Peligro de Rendimiento**: En una API con 4,000 RPS, NestJS instanciará decenas de miles de objetos por segundo, saturando el Heap de V8 y degradando el throughput del servidor hasta en un 60%.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `Scope.REQUEST` solo para acceder al objeto de la petición (`Request`) o al usuario autenticado.
  - 🟢 **Green Flag**: Utilizar `AsyncLocalStorage` para manejar contexto de usuario manteniendo los servicios en `Scope.DEFAULT` singleton.

---

### 3. ¿Cómo se inyecta una Interfaz de TypeScript en NestJS utilizando Tokens de Inyección personalizados?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Las interfaces de TypeScript son constructos puramente en tiempo de compilación y no existen en tiempo de ejecución de JavaScript. Por tanto, `design:paramtypes` no puede emitir una referencia a una interfaz.
  - **Solución con Tokens e `@Inject()`**:
    ```typescript
    // Contrato de dominio:
    export interface PaymentGateway {
      charge(amount: number): Promise<boolean>;
    }

    export const PAYMENT_GATEWAY_TOKEN = Symbol('PAYMENT_GATEWAY');

    // Registro en el Módulo:
    @Module({
      providers: [
        {
          provide: PAYMENT_GATEWAY_TOKEN,
          useClass: StripePaymentGateway,
        },
      ],
      exports: [PAYMENT_GATEWAY_TOKEN],
    })
    export class PaymentModule {}

    // Inyección en el Servicio:
    @Injectable()
    export class CheckoutService {
      constructor(
        @Inject(PAYMENT_GATEWAY_TOKEN)
        private readonly gateway: PaymentGateway,
      ) {}
    }
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar escribir `constructor(private gateway: PaymentGateway)` sin `@Inject(TOKEN)` y no entender por qué NestJS arroja `Nest can't resolve dependencies of...`.
  - 🟢 **Green Flag**: Utilizar un `Symbol` único como token para prevenir colisiones de nombres accidentales en aplicaciones enterprise.

---

### 4. ¿Cuál es la diferencia entre `useClass`, `useValue`, `useFactory` y `useExisting` en Custom Providers?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **`useClass`**: Mapea un token a una clase que el contenedor instanciará automáticamente resolviendo sus dependencias (ideal para implementar patrones de estrategia o mocks en tests: `{ provide: Logger, useClass: BetterLogger }`).
  - **`useValue`**: Inyecta un valor estático, objeto ya instanciado o constante de configuración (`{ provide: 'CONFIG', useValue: { port: 3000 } }`).
  - **`useFactory`**: Permite crear un proveedor de forma dinámica ejecutando una función que puede ser asíncrona y recibir dependencias inyectadas:
    ```typescript
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (config: ConfigService) => {
        const client = new Redis(config.get('REDIS_URL'));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    }
    ```
  - **`useExisting`**: Crea un alias para un proveedor ya existente sin crear una nueva instancia (`{ provide: 'AliasService', useExisting: RealService }`).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: No saber cómo conectar clientes asíncronos externos (como MongoDB o Redis) antes de que la aplicación arranque.
  - 🟢 **Green Flag**: Destacar que `useFactory` puede retornar una Promesa (`async useFactory`) y NestJS esperará a que se resuelva antes de completar el arranque de la aplicación.

---

### 5. ¿Cómo funciona la encapsulación de módulos en NestJS y por qué un proveedor no es accesible fuera de su módulo sin `exports`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  NestJS implementa un sistema de encapsulación estricto inspirado en Angular:
  - Los proveedores declarados en el array `providers: [UserService]` de un módulo son **privados por defecto** para ese módulo.
  - Para que otro módulo (`OrderModule`) pueda inyectar `UserService`:
    1. `UserModule` debe exportarlo explícitamente: `exports: [UserService]`.
    2. `OrderModule` debe importar `UserModule`: `imports: [UserModule]`.
  - Si se omite el `exports`, el contenedor IoC rechaza la resolución con un error `Nest can't resolve dependencies...`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Duplicar el mismo servicio en el array `providers` de múltiples módulos en lugar de exportarlo e importarlo (creando múltiples instancias independientes en memoria).
  - 🟢 **Green Flag**: Explicar la re-exportación de módulos completos (`exports: [CommonModule]`) para construir módulos compartidos limpios.

---

### 6. ¿Qué es un Módulo Global (`@Global()`) y cuáles son las mejores prácticas para evitar antipatrones?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El decorador `@Global()` hace que los proveedores exportados por ese módulo estén disponibles en **toda la aplicación sin necesidad de importar el módulo en cada sub-módulo**:
  - **Casos de Uso Válidos**: Módulos fundacionales y transversales que se utilizan en el 100% de la aplicación (ej. `DatabaseModule`, `ConfigModule`, `LoggerModule`).
  - **El Antipatrón del Módulo Dios**: Marcar módulos de dominio (`UserModule`, `OrderModule`) como globales por pereza de escribir los `imports: [...]`. Destruye la cohesión, la encapsulación, dificulta el testing unitario y oculta las dependencias reales de la arquitectura.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Proponer marcar todos los módulos de la aplicación como `@Global()` para "no tener que lidiar con los imports".
  - 🟢 **Green Flag**: Enfatizar que un módulo solo debe ser `@Global()` si es puramente infraestructura y se registra una sola vez en el módulo raíz (`AppModule`).

---

### 7. ¿Cómo se resuelven las Dependencias Circulares entre módulos y servicios con `forwardRef()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Ocurre cuando el Servicio A necesita el Servicio B, y el Servicio B necesita el Servicio A (o el Módulo A importa el Módulo B y viceversa).
  En JavaScript, esto genera una referencia `undefined` durante la carga del archivo.
  - **Solución con `forwardRef()`**:
    Permite que NestJS difiera la resolución de la clase hasta que ambos módulos o clases hayan sido cargados por el runtime:
    ```typescript
    // En UserService:
    @Injectable()
    export class UserService {
      constructor(
        @Inject(forwardRef(() => OrderService))
        private orderService: OrderService,
      ) {}
    }

    // En UserModule:
    @Module({
      imports: [forwardRef(() => OrderModule)],
      ...
    })
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `forwardRef()` de forma habitual como parche sin advertir que una dependencia circular suele ser un síntoma de un fallo de diseño en la cohesión de los servicios.
  - 🟢 **Green Flag**: Proponer refactorizar hacia un tercer servicio intermedio o usar el EventBus (`@nestjs/event-emitter`) para romper el acoplamiento circular.

---

### 8. ¿Qué interfaces del Ciclo de Vida de la Aplicación (Lifecycle Hooks) existen en NestJS y en qué orden se ejecutan?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Durante el arranque y apagado del servidor:
  - **Fase de Arranque (Startup)**:
    1. `onModuleInit()`: Se ejecuta después de que todas las dependencias del módulo han sido resueltas.
    2. `onApplicationBootstrap()`: Se ejecuta una vez que todos los módulos han sido completamente inicializados, justo antes de empezar a escuchar peticiones en la red.
  - **Fase de Apagado (Shutdown - requiere `app.enableShutdownHooks()`)**:
    3. `onModuleDestroy()`: Se ejecuta cuando se recibe una señal de terminación (`SIGTERM`).
    4. `beforeApplicationShutdown()`: Se ejecuta antes de que los sockets y conexiones comiencen a cerrarse.
    5. `onApplicationShutdown()`: Se ejecuta cuando la aplicación se apaga formalmente (ideal para cerrar pools de bases de datos).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Olvidar invocar `app.enableShutdownHooks()` en `main.ts` (sin esto, NestJS no escucha las señales POSIX `SIGTERM`/`SIGINT`).
  - 🟢 **Green Flag**: Utilizar `onApplicationBootstrap()` para ejecutar migraciones de datos o comprobaciones de conectividad previas a la apertura del puerto HTTP.

---

### 9. ¿Cómo funciona la Inyección de Dependencias a nivel de Propiedad (`@Inject()`) frente a la Inyección por Constructor?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **Inyección por Constructor (Recomendada y Estándar)**:
    ```typescript
    constructor(private readonly userService: UserService) {}
    ```
    - Facilita pruebas unitarias puras: puedes instanciar la clase en Jest con `new UserController(mockService)` sin levantar el framework.
  - **Inyección por Propiedad**:
    ```typescript
    @Inject(UserService)
    private readonly userService: UserService;
    ```
    - Útil exclusivamente en jerarquías de herencia complejas donde extender una clase base con muchas dependencias obligaría a escribir constructores verbosos con `super(dep1, dep2, dep3, ...)`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar inyección por propiedad en todas las clases dificultando las pruebas unitarias.
  - 🟢 **Green Flag**: Priorizar la inyección por constructor para mantener la inmutabilidad (`readonly`) y el desacoplamiento en pruebas.

---

### 10. ¿Qué es y cómo se usa el `ModuleRef` para resolver proveedores de forma imperativa en tiempo de ejecución?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  `ModuleRef` es una clase interna de NestJS que permite navegar el contenedor de dependencias de forma programática:
  ```typescript
  @Injectable()
  export class CommandDispatcher {
    constructor(private moduleRef: ModuleRef) {}

    getHandler(commandName: string) {
      // Resuelve dinámicamente el handler registrado:
      return this.moduleRef.get(commandName, { strict: false });
    }
  }
  ```
  - **Capacidades Avanzadas**:
    - `moduleRef.get()`: Obtiene un proveedor singleton síncrono.
    - `moduleRef.resolve()`: Permite resolver proveedores de ámbito `Scope.REQUEST` o `Scope.TRANSIENT` de forma asíncrona creando un nuevo sub-árbol de contexto mediante `ContextIdFactory`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar resolver proveedores Request-scoped con `moduleRef.get()` (arrojará un error porque los request-scoped no existen como singletons).
  - 🟢 **Green Flag**: Utilizar `ContextIdFactory.create()` para aislar ejecuciones manuales de colas en segundo plano dentro de scopes transaccionales de NestJS.

---

### 11. ¿Cuál es el rol del archivo `main.ts` y qué diferencia hay entre `NestFactory.create` y `NestFactory.createApplicationContext`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **`NestFactory.create(AppModule)`**:
    - Crea una aplicación web HTTP completa (montada sobre Express o Fastify).
    - Habilita el pipeline completo de peticiones, enrutamiento, controladores web y el método `app.listen(3000)`.
  - **`NestFactory.createApplicationContext(AppModule)`**:
    - Inicializa el contenedor IoC de NestJS y resuelve dependencias, pero **SIN levantar un servidor HTTP ni abrir ningún puerto de red**.
    - **Casos de uso ideales**: Tareas programadas en línea de comandos (CLI tools), workers de colas en segundo plano (consumidores de RabbitMQ/SQS independientes), o scripts de migración y seeders de bases de datos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Levantar un servidor HTTP completo con `app.listen()` para ejecutar un simple script de cron que procesa 5 registros y se apaga.
  - 🟢 **Green Flag**: Utilizar `createApplicationContext` para construir micro-servicios batch eficientes en memoria.

---

### 12. ¿Cómo desacoplar la configuración de la aplicación mediante `@nestjs/config` y validación con Joi / Zod?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El paquete `@nestjs/config` proporciona un módulo centralizado para variables de entorno (`.env`):
  - **Validación Estricta de Variables al Arrancar (Fail-Fast)**:
    Si falta una variable crítica como `DATABASE_URL` o `JWT_SECRET`, la aplicación **debe negarse a arrancar de inmediato**, en lugar de fallar en mitad de la noche durante la primera transacción del usuario.
  - **Implementación con Zod/Joi**:
    ```typescript
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const schema = z.object({
          PORT: z.coerce.number().default(3000),
          DATABASE_URL: z.string().url(),
          NODE_ENV: z.enum(['development', 'production', 'test']),
        });
        return schema.parse(config);
      },
    });
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Leer `process.env.VAR` disperso por todo el código sin validación de tipos ni valores por defecto.
  - 🟢 **Green Flag**: Usar Custom Config Namespaces con `registerAs()` para obtener autocompletado y seguridad de tipos estricta en el `ConfigService`.

---

## 2. El Request Lifecycle Pipeline en Profundidad

### 13. ¿Cuál es la diferencia conceptual y de diseño entre Middlewares, Guards, Interceptors, Pipes y Exception Filters?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  Cada elemento del pipeline tiene una única responsabilidad arquitectónica (*Single Responsibility Principle*):
  | Componente | Nivel de Ejecución | Responsabilidad Primordial |
  |---|---|---|
  | **Middleware** | Antes de los Guards | Acceso de bajo nivel al socket/objeto de Express/Fastify (CORS, Rate Limit crudo, logs de red). No conoce qué controlador se ejecutará. |
  | **Guards** | Antes de Pipes e Interceptors | **Autorización y Autenticación**: Determina si la petición tiene permiso de entrar (`canActivate()`). |
  | **Interceptors (Pre)** | Alrededor del Controlador | Vinculación de lógica transversal con RxJS (timers de latencia, caching). |
  | **Pipes** | Justo antes del método del Handler | **Validación y Transformación** de los parámetros de entrada (`body`, `query`, `params`). |
  | **Handler** | Núcleo | Lógica de negocio del controlador. |
  | **Interceptors (Post)** | Inmediatamente después del Handler | Mutación o serialización de la respuesta emitida por el controlador. |
  | **Exception Filters** | En cualquier punto de fallo | Captura y formateo de excepciones hacia respuestas HTTP estructuradas. |
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Validar el body o roles de usuario dentro de un Middleware en lugar de usar Pipes y Guards.
  - 🟢 **Green Flag**: Explicar por qué los Guards se ejecutan antes de los Pipes: para ahorrar ciclos de CPU evitando parsear y validar payloads de atacantes no autorizados.

---

### 14. ¿Cómo funciona un Guard y qué capacidades ofrece el objeto polimórfico `ExecutionContext`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Un Guard implementa la interfaz `CanActivate` y su método `canActivate(context: ExecutionContext): boolean | Promise<boolean>`:
  - Si retorna `true`, la petición continúa; si retorna `false`, NestJS responde automáticamente con **`HTTP 403 Forbidden`** (o el guard puede arrojar `UnauthorizedException` para `HTTP 401`).
  - **`ExecutionContext` (Polimorfismo de Transporte)**:
    - Hereda de `ArgumentsHost`.
    - Permite que el mismo Guard funcione en cualquier protocolo de transporte:
      - `context.switchToHttp()`: Extrae `req` y `res` en APIs REST.
      - `context.switchToWs()`: Extrae el socket cliente y datos en WebSockets.
      - `context.switchToRpc()`: Extrae el contexto y payload en microservicios Kafka/gRPC.
    - Proporciona introspección sobre el destino: `context.getClass()` y `context.getHandler()`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escribir un guard asumiendo que solo existe HTTP (`switchToHttp()`) y no saber cómo adaptarlo a WebSockets o microservicios.
  - 🟢 **Green Flag**: Utilizar `context.getHandler()` junto con `Reflector` para leer metadatos de decoradores personalizados.

---

### 15. ¿Cómo se implementa un sistema de Control de Acceso Basado en Roles (RBAC) con Decoradores y `Reflector`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  1. **Definir el Decorador de Metadatos con `SetMetadata`**:
     ```typescript
     export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
     ```
  2. **Aplicar el Decorador en el Controlador**:
     ```typescript
     @Roles('ADMIN', 'EDITOR')
     @Delete(':id')
     deleteUser() { ... }
     ```
  3. **Implementar el `RolesGuard` leyendo la metadata con `Reflector`**:
     ```typescript
     @Injectable()
     export class RolesGuard implements CanActivate {
       constructor(private reflector: Reflector) {}

       canActivate(context: ExecutionContext): boolean {
         const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
           context.getHandler(),
           context.getClass(),
         ]);
         if (!requiredRoles) return true; // Ruta pública sin restricciones

         const { user } = context.switchToHttp().getRequest();
         return requiredRoles.some(role => user?.roles?.includes(role));
       }
     }
     ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Leer la metadata usando solo `get()` en lugar de `getAllAndOverride()`, impidiendo que los métodos de ruta sobrescriban los roles del controlador padre.
  - 🟢 **Green Flag**: Utilizar `Reflector.createDecorator<string[]>()` introducido en NestJS 10 para tipado estricto sin strings mágicos.

---

### 16. ¿Cómo funcionan los Interceptors y el flujo de streams con RxJS (`CallHandler`)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Un Interceptor implementa `NestInterceptor` y su método `intercept(context, next: CallHandler): Observable<any>`:
  - El objeto `next.handle()` **retorna un Observable de RxJS** que representa la ejecución del método del controlador:
    ```typescript
    @Injectable()
    export class LoggingInterceptor implements NestInterceptor {
      intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        // Código ejecutado ANTES del controlador...

        return next.handle().pipe(
          // Código ejecutado DESPUÉS de que el controlador emitió su respuesta:
          tap(() => console.log(`Latencia: ${Date.now() - now}ms`)),
          map(data => ({ data, timestamp: new Date() })), // Muta la respuesta
          catchError(err => throwError(() => new BadGatewayException())),
        );
      }
    }
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que un Interceptor se ejecuta con callbacks simples y desconocer los operadores de RxJS (`tap`, `map`, `catchError`).
  - 🟢 **Green Flag**: Implementar interceptores de Timeout (`timeout(5000)`) o almacenamiento en caché con Redis envolviendo la llamada a `next.handle()`.

---

### 17. ¿Cómo se utiliza `ClassSerializerInterceptor` y `@Exclude()` para ocultar contraseñas de las respuestas?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - En la entidad de usuario o DTO:
    ```typescript
    export class UserEntity {
      id: number;
      email: string;

      @Exclude() // Oculta este campo al serializar a JSON
      passwordHash: string;
    }
    ```
  - En el controlador o a nivel global:
    ```typescript
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('profile')
    getProfile(): UserEntity {
      return this.userService.getUser();
    }
    ```
  - **Mecánica**: El interceptor intercepta la respuesta saliente y ejecuta `instanceToPlain()` de `class-transformer`, eliminando automáticamente todos los atributos decorados con `@Exclude()`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Eliminar la contraseña a mano con `delete user.passwordHash` en cada controlador (fácil de olvidar y peligroso para la seguridad).
  - 🟢 **Green Flag**: Advertir que el objeto retornado DEBE ser una instancia real de la clase (`new UserEntity()`) y no un objeto JSON plano anónimo, o `class-transformer` no sabrá qué metadatos leer.

---

### 18. ¿Cuál es la diferencia entre un Pipe de Transformación y un Pipe de Validación?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Un Pipe implementa la interfaz `PipeTransform` y su método `transform(value, metadata: ArgumentMetadata)`:
  - **Pipe de Transformación**: Convierte los datos de entrada a la estructura o tipo primitivo deseado:
    ```typescript
    // Convierte el string de la URL en un número entero:
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) { ... }
    ```
    Si el valor no se puede convertir (ej. `/users/abc`), arroja un `BadRequestException` (`HTTP 400`).
  - **Pipe de Validación**: Evalúa si los datos cumplen las reglas de negocio declaradas en el DTO:
    ```typescript
    @Post()
    create(@Body(ValidationPipe) dto: CreateUserDto) { ... }
    ```
    Inspecciona los decoradores de `class-validator` y rechaza la petición con una lista detallada de errores si no pasa la validación.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escribir validaciones de tipos primitivos manuales dentro del cuerpo del controlador.
  - 🟢 **Green Flag**: Conocer los Pipes nativos de NestJS: `ParseUUIDPipe`, `ParseBoolPipe`, `ParseArrayPipe`, `DefaultValuePipe`.

---

### 19. ¿Por qué es obligatoria la configuración defensiva de `ValidationPipe` en producción (`whitelist` y `forbidNonWhitelisted`)?
- **Nivel**: Mid-Level / Senior / Security
- **Respuesta Técnica**:
  Por defecto, `ValidationPipe()` permite que propiedades no declaradas en el DTO pasen al controlador:
  - **El Ataque de Inyección de Propiedades (Mass Assignment)**: Un atacante envía:
    `{ "name": "Carlos", "role": "ADMIN", "isVerified": true }`
    Si el DTO solo esperaba `name`, pero el código pasa `req.body` directo a la base de datos, el atacante se convierte en administrador.
  - **Configuración Blindada**:
    ```typescript
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,            // Pasa un filtro estricto: borra cualquier campo no decorado en el DTO
      forbidNonWhitelisted: true, // Si el payload incluye campos extra, RECHAZA la petición con HTTP 400
      transform: true,            // Convierte tipos escalares automáticamente
      transformOptions: { enableImplicitConversion: true },
    }));
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: No usar `whitelist: true`, exponiendo la base de datos a ataques de asignación masiva de campos privilegiados.
  - 🟢 **Green Flag**: Explicar por qué `forbidNonWhitelisted: true` ayuda a los equipos de frontend a detectar contratos desalineados en tiempo de desarrollo.

---

### 20. ¿Cómo funciona un Exception Filter personalizado y qué ventaja tiene implementar `@Catch(HttpException)` frente a `@Catch()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **`@Catch(HttpException)`**: Captura **exclusivamente excepciones HTTP controladas** generadas por el desarrollador (`NotFoundException`, `BadRequestException`). Permite formatear los errores de cliente esperados.
  - **`@Catch()` (Sin argumentos - Catch-All Filter)**:
    - Captura **ABSOLUTAMENTE TODO**: tanto `HttpException` como errores imprevistos no controlados (fallos de conexión a la base de datos, errores sintácticos de JavaScript, `TypeError`, `NullPointerException`).
    - Esencial para implementar el **Manejador de Errores Global de Seguridad**: oculta los stack traces internos de bases de datos o secretos en modo producción respondiendo con un error 500 genérico y audita el fallo en herramientas como Sentry o Datadog.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Filtrar solo `HttpException` dejando que los fallos del motor de Node.js emitan la respuesta HTML fea de Express por defecto.
  - 🟢 **Green Flag**: Implementar el formato estándar RFC 7807 (Problem Details) dentro del Exception Filter global.

---

### 21. ¿Cómo se combinan múltiples decoradores en uno solo mediante `applyDecorators`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  En APIs enterprise con Swagger y seguridad, un solo endpoint puede acumular 8 decoradores encima del método:
  ```typescript
  // Composición limpia con applyDecorators:
  export function AuthRole(...roles: string[]) {
    return applyDecorators(
      Roles(...roles),
      UseGuards(JwtAuthGuard, RolesGuard),
      ApiBearerAuth(),
      ApiResponse({ status: 401, description: 'No autenticado' }),
      ApiResponse({ status: 403, description: 'Permisos insuficientes' }),
    );
  }

  // Uso limpio y elegante en el controlador:
  @AuthRole('ADMIN')
  @Delete(':id')
  deleteItem() { ... }
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Copiar y pegar 6 decoradores idénticos en cada uno de los 40 endpoints del controlador.
  - 🟢 **Green Flag**: Utilizar `applyDecorators` para crear decoradores semánticos unificados y limpios.

---

### 22. ¿Por qué registrar Guards o Interceptors con `app.useGlobalGuards()` en `main.ts` impide la Inyección de Dependencias y cómo se soluciona?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - Si registras en `main.ts`:
    `app.useGlobalGuards(new AuthGuard());`
    - Tuviste que instanciar la clase manualmente con el operador `new`.
    - Como fue creada fuera del contenedor IoC, **`AuthGuard` NO puede inyectar ningún servicio en su constructor** (como `Reflector`, `AuthService` o `ConfigService`).
  - **La Solución Arquitectónica (Multi-Provider Tokens)**:
    Registrar el guard como un proveedor dentro de cualquier módulo (típicamente `AppModule`) utilizando el token especial del framework **`APP_GUARD`**:
    ```typescript
    @Module({
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard, // ¡NestJS lo instancia DENTRO del IoC con soporte total de dependencias!
        },
      ],
    })
    export class AppModule {}
    ```
  - Aplica exactamente igual para `APP_INTERCEPTOR`, `APP_PIPE` y `APP_FILTER`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Pasar servicios manualmente por constructor con `new AuthGuard(new Reflector(), new ConfigService())` en `main.ts`.
  - 🟢 **Green Flag**: Citar los tokens multi-proveedor `APP_*` y explicar cómo NestJS los vincula globalmente a todo el pipeline.

---

### 23. ¿Cómo se implementa un Middleware tradicional en NestJS implementando la interfaz `NestMiddleware`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  A diferencia de Express donde se usan funciones sueltas, en NestJS un middleware es una clase `@Injectable()`:
  ```typescript
  @Injectable()
  export class TraceMiddleware implements NestMiddleware {
    constructor(private logger: LoggerService) {}

    use(req: Request, res: Response, next: NextFunction) {
      req['traceId'] = crypto.randomUUID();
      this.logger.log(`Petición entrante: ${req.method} ${req.url}`);
      next();
    }
  }
  ```
  - **Montaje en el Módulo**:
    El módulo implementa la interfaz `NestModule` y su método `configure(consumer: MiddlewareConsumer)`:
    ```typescript
    export class AppModule implements NestModule {
      configure(consumer: MiddlewareConsumer) {
        consumer.apply(TraceMiddleware)
                .exclude('health', 'metrics')
                .forRoutes({ path: 'users', method: RequestMethod.ALL });
      }
    }
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar registrar middlewares en el array `providers: [...]` del decorador `@Module()`.
  - 🟢 **Green Flag**: Utilizar `exclude()` para omitir endpoints de salud (`/healthz`) y métricas de Prometheus del logging de middlewares.

---

### 24. ¿Cómo funciona el paso de parámetros y metadatos con `ArgumentMetadata` dentro de un Custom Pipe?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El método `transform(value, metadata: ArgumentMetadata)` recibe dos argumentos:
  - `value`: El dato crudo entrante que fue enviado por el cliente.
  - `metadata`: Objeto que describe de dónde proviene el dato:
    - `metadata.type`: `'body' | 'query' | 'param' | 'custom'`.
    - `metadata.metatype`: El tipo de TypeScript asociado en la firma del método (ej. `Number`, `CreateUserDto`).
    - `metadata.data`: El string pasado al decorador (ej. si usas `@Param('id')`, `metadata.data` contendrá `'id'`).
  - Permite construir pipes inteligentes que varían su comportamiento dependiendo de si están validando un parámetro de URL o el cuerpo completo.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Ignorar el objeto `metadata` y asumir que el pipe siempre está procesando un cuerpo JSON.
  - 🟢 **Green Flag**: Utilizar `metadata.metatype` para instanciar dinámicamente la clase con `plainToInstance()` dentro de un validador personalizado.

---

## 3. Módulos Dinámicos y Técnicas Avanzadas de IoC

### 25. ¿Qué es un Módulo Dinámico en NestJS y qué contiene el objeto `DynamicModule`?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  Un Módulo Dinámico permite configurar y registrar módulos programáticamente en tiempo de compilación/ejecución pasando parámetros de configuración:
  - Implementa un método estático (por convención `forRoot()` o `register()`) que retorna un objeto de tipo **`DynamicModule`**:
    ```typescript
    @Module({})
    export class DatabaseModule {
      static register(options: DbOptions): DynamicModule {
        return {
          module: DatabaseModule, // Referencia a la clase
          providers: [
            { provide: 'DB_OPTIONS', useValue: options },
            DatabaseConnectionService,
          ],
          exports: [DatabaseConnectionService],
          global: false,
        };
      }
    }
    ```
  - Permite crear paquetes reutilizables (como `@nestjs/jwt`, `@nestjs/typeorm`) que pueden ser consumidos por diferentes aplicaciones con configuraciones totalmente divergentes.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Hardcodear credenciales de base de datos o URLs dentro de módulos estáticos.
  - 🟢 **Green Flag**: Dominar la estructura de la interfaz `DynamicModule` y su integración con `ConfigurableModuleBuilder`.

---

### 26. ¿Cuál es la convención oficial entre `register()`, `forRoot()` y `forFeature()` en Módulos Dinámicos?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Convención de nomenclatura estandarizada por el equipo nuclear de NestJS:
  1. **`register()`**: Para configurar un módulo dinámico con una configuración específica diseñada para ser utilizado en un **módulo consumidor local** (ej. `JwtModule.register({ secret: '...' })`).
  2. **`forRoot()`**: Para configurar un módulo dinámico **una sola vez a nivel de toda la aplicación** (típicamente en `AppModule`), estableciendo conexiones globales o clientes base (ej. `TypeOrmModule.forRoot(options)`).
  3. **`forFeature()`**: Para registrar configuraciones específicas o entidades de dominio individuales que **reutilizan la definición global previamente establecida por `forRoot()`** (ej. `TypeOrmModule.forFeature([User, Order])`).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Nombrar a todos los métodos dinámicos `init()` o `setup()` violando las directrices de la arquitectura de NestJS.
  - 🟢 **Green Flag**: Explicar la necesidad de las variantes asíncronas (`registerAsync`, `forRootAsync`) para soportar inyección de `ConfigService`.

---

### 27. ¿Cómo se implementa el patrón `forRootAsync()` con soporte para `useFactory`, `useClass` y `useExisting`?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  Para permitir que un módulo dinámico lea configuraciones desde variables de entorno asíncronas:
  ```typescript
  interface DatabaseAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    inject?: any[];
    useFactory?: (...args: any[]) => Promise<DbOptions> | DbOptions;
  }

  @Module({})
  export class DatabaseModule {
    static forRootAsync(options: DatabaseAsyncOptions): DynamicModule {
      return {
        module: DatabaseModule,
        imports: options.imports || [],
        providers: [
          {
            provide: 'DB_OPTIONS',
            useFactory: options.useFactory,
            inject: options.inject || [],
          },
          DatabaseService,
        ],
        exports: [DatabaseService],
      };
    }
  }
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Obligar a que el usuario pase configuraciones síncronas en módulos que necesitan leer credenciales de AWS Secrets Manager o Vault.
  - 🟢 **Green Flag**: Utilizar la clase utilitaria moderna de NestJS **`ConfigurableModuleBuilder`** que autogenera toda esta infraestructura de código con tipado estricto en 5 líneas.

---

### 28. ¿Qué es `ConfigurableModuleBuilder` introducido en NestJS 9+ y cómo simplifica los módulos dinámicos?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Elimina el boilerplate repetitivo de escribir métodos `forRoot`, `forRootAsync`, interfaces de opciones y factories manuales:
  ```typescript
  // database.module-definition.ts
  export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<DbOptions>()
      .setClassPrefix('Database')
      .setMethod('forRoot')
      .build();

  // database.module.ts
  @Module({
    providers: [DatabaseService],
    exports: [DatabaseService],
  })
  export class DatabaseModule extends ConfigurableModuleClass {}
  ```
  - **Resultado**: La clase hereda automáticamente los métodos estáticos `DatabaseModule.forRoot(options)` y `DatabaseModule.forRootAsync({ inject, useFactory })` con tipado 100% estricto de TypeScript sin escribir nada de código manual.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Seguir escribiendo 150 líneas de boilerplate manual para módulos dinámicos asíncronos en proyectos que corren NestJS 10+.
  - 🟢 **Green Flag**: Conocer las opciones de configuración de `ConfigurableModuleBuilder` (`setExtras`, `setClassPrefix`).

---

### 29. ¿Cómo implementar un Decorador de Propiedad o Parámetro Personalizado con `createParamDecorator`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  ```typescript
  import { createParamDecorator, ExecutionContext } from '@nestjs/common';

  export const IpAddress = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    },
  );

  // Uso limpio en el Controlador:
  @Get('analytics')
  trackVisit(@IpAddress() clientIp: string) {
    return this.analyticsService.record(clientIp);
  }
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Inyectar `@Req() req` entero en el controlador para leer una simple cabecera, rompiendo el desacoplamiento.
  - 🟢 **Green Flag**: Saber que los decoradores creados con `createParamDecorator` pueden ser combinados con Pipes nativos (`@IpAddress(new ParseIpPipe())`).

---

### 30. ¿Cómo funciona la Inyección de Dependencias Jerárquica entre sub-árboles de controladores y servicios?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Cuando NestJS resuelve una dependencia solicitada en un servicio o controlador:
  1. Busca en la tabla de proveedores del **módulo local actual**.
  2. Si no la encuentra, busca en los módulos explícitamente importados en el array `imports: [...]`.
  3. Si no la encuentra, busca en los módulos registrados como `@Global()`.
  4. Si no la encuentra, arroja `UnknownDependenciesException`.
  - Los proveedores de un módulo padre **no se heredan automáticamente en los módulos hijos** a menos que el módulo padre sea importado explícitamente, preservando límites de dominio estrictos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Confundir la jerarquía de inyectores de Angular en el DOM con la resolución basada en grafos de módulos de NestJS.
  - 🟢 **Green Flag**: Diseñar módulos de arquitectura limpia con inversión de dependencias aplicando Interfaces como contratos y puertos/adaptadores (Arquitectura Hexagonal).

---

### 31. ¿Qué es y cuándo se debe usar `useExisting` para reutilizar instancias de proveedores?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Permite definir un alias hacia un proveedor ya registrado sin crear una nueva instancia en memoria:
  ```typescript
  const loggerAliasProvider = {
    provide: 'AppLogger',
    useExisting: WinstonLoggerService, // Reutiliza exactamente la misma instancia singleton
  };
  ```
  - **Diferencia con `useClass`**: Si usaras `useClass: WinstonLoggerService`, NestJS crearía **dos instancias independientes separadas** en el Heap. Con `useExisting`, ambas claves apuntan exactamente al mismo objeto en memoria.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `useClass` para crear alias duplicando la memoria de servicios pesados.
  - 🟢 **Green Flag**: Utilizar `useExisting` para soportar contratos de interfaz legados mientras se migra a nuevas implementaciones.

---

### 32. ¿Cómo gestionar la destrucción limpia de recursos en Custom Providers con `onApplicationShutdown`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Cualquier clase registrada como proveedor puede implementar la interfaz `OnApplicationShutdown`:
  ```typescript
  @Injectable()
  export class RabbitMqService implements OnApplicationShutdown {
    private connection: Connection;

    async onApplicationShutdown(signal?: string) {
      console.log(`Cerrando conexión RabbitMQ por señal: ${signal}`);
      await this.connection.close();
    }
  }
  ```
  - Permite que los sockets, transacciones activas y canales de mensajería se cierren ordenadamente cuando el clúster de Kubernetes retira el pod.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Dejar conexiones a brokers o bases de datos huérfanas al terminar el proceso.
  - 🟢 **Green Flag**: Citar la necesidad de activar `app.enableShutdownHooks()` en `main.ts` para que estos métodos se ejecuten.

---

## 4. Microservicios, Eventos, WebSockets y CQRS

### 33. ¿Cuáles son los patrones de comunicación en Microservicios de NestJS: Request-Response vs Event-Driven?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **Request-Response (`@MessagePattern`)**:
    - Comunicación síncrona/espera de respuesta: el cliente emite un mensaje y se queda esperando asíncronamente a que el servicio responda con un valor:
      ```typescript
      // Cliente:
      const total = await this.client.send('calculate_tax', payload).toPromise();

      // Microservicio Servidor:
      @MessagePattern('calculate_tax')
      calculateTax(data: TaxDto) { return data.amount * 0.21; }
      ```
  - **Event-Driven (`@EventPattern`)**:
    - Comunicación asíncrona "Dispara y Olvida" (*Fire and Forget*): el cliente emite el evento y no espera ninguna respuesta:
      ```typescript
      // Cliente:
      this.client.emit('order_created', orderData);

      // Microservicio Servidor:
      @EventPattern('order_created')
      handleOrderCreated(order: OrderDto) { /* Procesa sin responder */ }
      ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `send()` para todas las comunicaciones entre servicios creando acoplamiento temporal y bloqueos en cascada.
  - 🟢 **Green Flag**: Reservar `send()` únicamente cuando el llamador necesita un dato inmediato y usar `emit()` para efectos secundarios y arquitectura dirigida por eventos.

---

### 34. ¿Cómo funciona el transportador de gRPC en microservicios de NestJS y qué ventajas aporta?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  NestJS integra gRPC sobre HTTP/2 y Protocol Buffers:
  - **Configuración del Microservicio**:
    ```typescript
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(__dirname, 'hero/hero.proto'),
      },
    });
    ```
  - **Controlador con `@GrpcMethod`**:
    ```typescript
    @Controller()
    export class HeroController {
      @GrpcMethod('HeroService', 'FindOne')
      findOne(data: HeroById): Hero {
        return { id: data.id, name: 'Superman' };
      }
    }
    ```
  - **Ventajas**: Serialización binaria de ultra alta velocidad (mucho más rápida que JSON), soporte nativo de streaming y contratos fuertemente tipados generados por archivos `.proto`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que gRPC solo sirve para comunicar servidores con navegadores web.
  - 🟢 **Green Flag**: Utilizar `@GrpcStreamMethod` para flujos continuos de datos en streaming bidireccional.

---

### 35. ¿Cómo se crea una "Hybrid Application" (Aplicación Híbrida) en NestJS?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Una aplicación híbrida es un único proceso de NestJS que escucha simultáneamente en **un puerto HTTP web ordinario y en uno o más transportadores de microservicios**:
  ```typescript
  async function bootstrap() {
    const app = await NestFactory.create(AppModule); // Servidor HTTP estándar (puerto 3000)

    // Conectar microservicio Kafka en segundo plano:
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: { client: { brokers: ['localhost:9092'] } },
    });

    await app.startAllMicroservices(); // Inicia la escucha de microservicios
    await app.listen(3000);            // Inicia la escucha de peticiones HTTP
  }
  bootstrap();
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Levantar dos procesos de Node.js separados y duplicar la inicialización del framework en el mismo contenedor para atender HTTP y colas.
  - 🟢 **Green Flag**: Explicar cómo una Hybrid App comparte el mismo contenedor IoC y servicios de base de datos para responder a la web y a eventos de Kafka.

---

### 36. ¿Cómo funciona el módulo `@nestjs/cqrs` y cuáles son sus componentes nucleares?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  Implementa Command Query Responsibility Segregation (CQRS):
  - **Command**: Objeto inmutable que representa una acción de mutación (`CreateUserCommand`). Despachado por `CommandBus.execute()`. Procesado por un único `CommandHandler` (`@CommandHandler(CreateUserCommand)`).
  - **Query**: Objeto inmutable que representa una consulta de solo lectura (`GetUserByIdQuery`). Despachado por `QueryBus.execute()`. Procesado por un `QueryHandler`.
  - **Event**: Mensaje que notifica un hecho que ya sucedió (`UserCreatedEvent`). Despachado por `EventBus.publish()`. Múltiples `EventHandlers` pueden reaccionar en paralelo.
  - **Saga**: Método decorado con `@Saga()` que escucha flujos de eventos de dominio y despacha nuevos comandos utilizando operadores de streaming de RxJS para coordinar transacciones distribuidas.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Ejecutar queries de lectura pesadas dentro de un CommandHandler rompiendo la segregación de responsabilidades.
  - 🟢 **Green Flag**: Implementar una Saga con RxJS (`ofType`, `map`, `mergeMap`) para coordinar pasos de compensación ante fallos.

---

### 37. ¿Qué es y cómo funciona un Event Store y la Rehidratación en Event Sourcing con NestJS?
- **Nivel**: Staff / Principal Architect
- **Respuesta Técnica**:
  En lugar de almacenar el estado actual en una fila mutable (`UPDATE users SET balance = 200`):
  - Se utiliza una clase que extiende de **`AggregateRoot`**:
  - Los cambios de estado se expresan como una secuencia inmutable de eventos:
    ```typescript
    export class AccountAggregate extends AggregateRoot {
      private balance: number = 0;

      deposit(amount: number) {
        this.apply(new MoneyDepositedEvent(this.id, amount));
      }

      onMoneyDepositedEvent(event: MoneyDepositedEvent) {
        this.balance += event.amount; // Mutación interna de estado
      }
    }
    ```
  - **Rehidratación**: Para cargar el estado actual de una cuenta, el repositorio lee todos los eventos históricos de esa entidad desde el Event Store y los aplica secuencialmente en memoria con `account.loadFromHistory(events)`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Mutar el estado directamente sin invocar `this.apply(event)` en un agregado de Event Sourcing.
  - 🟢 **Green Flag**: Combinar agregados con Snapshots periódicos para evitar rehidratar millones de eventos en entidades antiguas.

---

### 38. ¿Cómo se implementa un WebSocket Gateway en NestJS con `@WebSocketGateway()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  NestJS desacopla WebSockets mediante adaptadores (por defecto Socket.io o `WsAdapter` para WebSockets puros):
  ```typescript
  @WebSocketGateway(8080, { cors: { origin: '*' } })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
      console.log(`Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: Socket) { ... }

    @SubscribeMessage('send_message')
    handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket): void {
      this.server.emit('new_message', { from: client.id, message: data });
    }
  }
  ```
  - Los Guards, Interceptors y Pipes de NestJS funcionan **de forma idéntica dentro de WebSockets**, permitiendo validar payloads con DTOs y autenticar tokens JWT en el handshake inicial.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que los Guards y Pipes solo funcionan para HTTP y escribir validaciones manuales de sockets dentro del gateway.
  - 🟢 **Green Flag**: Utilizar `WsExceptionFilter` para capturar errores en WebSockets y emitir eventos de error en formato JSON al cliente.

---

### 39. ¿Cómo funciona el emisor de eventos desacoplado en memoria con `@nestjs/event-emitter`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Basado en la librería `eventemitter2`:
  - Permite comunicación desacoplada dentro del mismo proceso sin brokers externos:
    ```typescript
    // En el servicio de órdenes:
    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order));

    // En el servicio de notificaciones:
    @OnEvent('order.created', { async: true })
    async handleOrderCreated(event: OrderCreatedEvent) {
      await this.mailService.send(event.order);
    }
    ```
  - **Opción `{ async: true }`**: Esencial para que el listener se ejecute en un microtask asíncrono sin bloquear la respuesta HTTP del controlador de la orden.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Confundir el Event Emitter local en memoria con un Message Broker distribuido como RabbitMQ (el Event Emitter local no sobrevive a reinicios del servidor ni escala a múltiples pods).
  - 🟢 **Green Flag**: Utilizar comodines en eventos (`@OnEvent('order.*')`) para agrupar listeners de dominio.

---

### 40. ¿Cómo se escala Socket.io en NestJS para múltiples servidores mediante el Redis Adapter?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En un clúster con 4 instancias de NestJS:
  - El Usuario A está conectado al Pod 1 por WebSocket; el Usuario B está conectado al Pod 2.
  - Si el Pod 1 emite `server.emit('msg')`, **el Usuario B nunca recibirá el mensaje** porque el socket vive en la memoria de un servidor diferente.
  - **Solución con Redis Adapter (`@socket.io/redis-adapter`)**:
    - Se configura un adaptador de WebSockets personalizado (`IoAdapter`) respaldado por Redis Pub/Sub:
    - Cuando cualquier pod emite un mensaje, Socket.io lo publica en un canal de Redis.
    - Todos los demás pods escuchan el canal y reenvían el mensaje a sus clientes locales conectados, logrando comunicación en tiempo real transparente entre todos los nodos del clúster.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar escalar WebSockets en Kubernetes sin un broker de pub/sub como Redis o NATS.
  - 🟢 **Green Flag**: Detallar la configuración de Sticky Sessions (afinidad de sesión) en el Ingress/balanceador para el handshake HTTP inicial de Socket.io.

---

### 41. ¿Cómo se implementa el cliente de mensajería `ClientProxy` en microservicios de NestJS?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `ClientProxy` es la clase abstracta que utiliza un servicio cliente para enviar comandos o eventos hacia otros microservicios:
  ```typescript
  @Injectable()
  export class OrderService {
    constructor(
      @Inject('PAYMENT_SERVICE')
      private readonly paymentClient: ClientProxy,
    ) {}

    async processPayment(order: OrderDto) {
      // Retorna un Observable de RxJS:
      return firstValueFrom(
        this.paymentClient.send({ cmd: 'charge' }, order),
      );
    }
  }
  ```
  - Registrado en el módulo con `ClientsModule.register([{ name: 'PAYMENT_SERVICE', transport: Transport.TCP, options: { port: 3001 } }])`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: No convertir el Observable de RxJS devuelto por `client.send()` usando `firstValueFrom()` o `lastValueFrom()` al trabajar con `async/await`.
  - 🟢 **Green Flag**: Conectar `client.emit()` con colas de reintentos para operaciones asíncronas tolerantes a fallos.

---

### 42. ¿Cómo gestionar la resiliencia en microservicios ante servicios caídos en NestJS?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  1. **Timeouts en llamadas remotas**: Utilizar el operador `timeout()` de RxJS en el Observable de `ClientProxy` para no dejar peticiones colgadas si el microservicio remoto muere.
  2. **Circuit Breaker**: Envolver las llamadas en librerías de estabilidad como `opossum` o decorators con Resilience4j/Polly conceptual.
  3. **Fallbacks**: Capturar errores con `catchError()` y retornar valores degradados o respuestas de caché.
  4. **Dead Letter Queues (DLQ)**: En Kafka/RabbitMQ, configurar colas de mensajes fallidos para que los mensajes que arrojen errores no bloqueen la partición ni se pierdan.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Esperar indefinidamente respuestas de microservicios remotos sin configurar timeouts de red.
  - 🟢 **Green Flag**: Implementar el patrón Retry con Backoff Exponencial y Jitter utilizando operadores de RxJS (`retry({ count: 3, delay: ... })`).

---

## 5. Testing, Persistencia, Rendimiento y Seguridad

### 43. ¿Cómo funciona el módulo `@nestjs/testing` y el método `Test.createTestingModule()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Crea un entorno de ejecución de NestJS simulado en memoria para pruebas unitarias y de integración sin levantar servidores de red:
  ```typescript
  describe('UsersService', () => {
    let service: UsersService;
    let repoMock: Partial<Record<keyof UserRepository, jest.Mock>>;

    beforeEach(async () => {
      repoMock = {
        findOne: jest.fn(),
        save: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: getRepositoryToken(User), useValue: repoMock },
        ],
      }).compile();

      service = module.get<UsersService>(UsersService);
    });

    it('debe retornar un usuario', async () => {
      repoMock.findOne.mockResolvedValue({ id: 1, name: 'Ana' });
      const user = await service.findById(1);
      expect(user.name).toBe('Ana');
    });
  });
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Instanciar los servicios con `new UsersService(mockRepo)` ignorando `@nestjs/testing` cuando se requiere validar la configuración de inyección de dependencias.
  - 🟢 **Green Flag**: Utilizar `module.overrideProvider()` y `overrideGuard()` en pruebas de integración E2E para deshabilitar la autenticación JWT sin romper el pipeline.

---

### 44. ¿Cómo se ejecutan pruebas End-to-End (E2E) completas en NestJS con Supertest?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  ```typescript
  describe('UserController (E2E)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      // ¡CRÍTICO!: Aplicar los mismos pipes y filtros globales que en main.ts:
      app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
      await app.init();
    });

    afterAll(async () => {
      await app.close(); // Cierra conexiones y libera recursos
    });

    it('/users (POST) - debe validar el body y retornar 201', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'test@mail.com', password: 'password123' })
        .expect(201);
    });
  });
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Olvidar registrar los `ValidationPipe` en el archivo de prueba E2E, provocando que los tests pasen en verde con datos inválidos que en producción serían rechazados.
  - 🟢 **Green Flag**: Usar Testcontainers para ejecutar las pruebas E2E contra una base de datos PostgreSQL real y no en memoria.

---

### 45. ¿Cuáles son las diferencias de rendimiento entre el adaptador Express (`platform-express`) y el adaptador Fastify (`platform-fastify`) en NestJS?
- **Nivel**: Senior / Staff / Performance
- **Respuesta Técnica**:
  Por defecto, NestJS utiliza Express como motor HTTP.
  - **Ventajas de Fastify (`@nestjs/platform-fastify`)**:
    - Entre **2x y 3x mayor throughput de peticiones por segundo (RPS)** en benchmarks de alto tráfico.
    - Menor latencia de CPU gracias a su motor de serialización rápida (`fast-json-stringify`) y enrutador Radix Tree.
  - **Trade-offs y Precauciones**:
    - Ciertos paquetes de middlewares diseñados exclusivamente para Express no son compatibles de forma directa (requieren `@fastify/express` o alternativas nativas de Fastify).
    - Métodos como `res.status().send()` difieren ligeramente si se interactúa con el objeto nativo de respuesta de bajo nivel.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Asumir que migrar a Fastify siempre duplica la velocidad de una aplicación que pasa el 95% de su tiempo esperando queries lentas de base de datos.
  - 🟢 **Green Flag**: Saber cómo cambiar de plataforma en `main.ts` pasando `new FastifyAdapter()` a `NestFactory.create()` manteniendo el 99% del código intacto.

---

### 46. ¿Cómo se gestionan las Transacciones de Base de Datos en NestJS con TypeORM o Prisma de forma segura?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - **En TypeORM (con `QueryRunner` o `DataSource.transaction`)**:
    ```typescript
    await this.dataSource.transaction(async (manager) => {
      // Todas las operaciones DEBEN ejecutarse sobre el 'manager' de la transacción:
      await manager.save(user);
      await manager.save(auditLog);
      // Si ocurre una excepción, hace rollback automático de todo el bloque
    });
    ```
  - **El Error Común**: Inyectar los repositorios estándar (`@InjectRepository(User) private repo`) y llamarlos dentro del bloque `transaction`: esos repositorios usan su propia conexión fuera de la transacción, rompiendo la atomicidad.
  - **Enfoque Moderno Declarativo**: Utilizar librerías basadas en `AsyncLocalStorage` (como `typeorm-transactional`) para que el decorador `@Transactional()` propague automáticamente la transacción a todos los repositorios inyectados sin pasarlos como argumento.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Ejecutar transacciones llamando a repositorios estándar que no están vinculados al `QueryRunner` transaccional.
  - 🟢 **Green Flag**: Explicar la propagación de transacciones con `AsyncLocalStorage` y niveles de aislamiento SQL en NestJS.

---

### 47. ¿Cómo se implementa Rate Limiting defensivo en NestJS con `@nestjs/throttler`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Utilizando el módulo oficial `@nestjs/throttler`:
  ```typescript
  // app.module.ts
  @Module({
    imports: [
      ThrottlerModule.forRoot([{
        ttl: 60000, // 60 segundos
        limit: 10,   // Máximo 10 peticiones
      }]),
    ],
    providers: [
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  })
  export class AppModule {}
  ```
  - **Control Quirúrgico por Ruta**:
    - `@SkipThrottle()`: Excluye rutas específicas (ej. webhooks de Stripe).
    - `@Throttle({ default: { limit: 3, ttl: 60000 } })`: Aplica límites más estrictos en endpoints sensibles como `/auth/login` contra ataques de fuerza bruta.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Dejar endpoints de login sin rate limiting facilitando ataques de fuerza bruta de contraseñas.
  - 🟢 **Green Flag**: Configurar el almacenamiento de Throttler en Redis (`@nest-lab/throttler-storage-redis`) para aplicaciones desplegadas en clústeres multi-pod.

---

### 48. ¿Cómo documentar automáticamente una API REST con OpenAPI / Swagger en NestJS?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  NestJS cuenta con el plugin de compilación oficial `@nestjs/swagger`:
  - **Configuración en `main.ts`**:
    ```typescript
    const config = new DocumentBuilder()
      .setTitle('API Enterprise')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    ```
  - **CLI Plugin de Swagger (`nest-cli.json`)**:
    Activando el plugin en `nest-cli.json`, el compilador de NestJS **inspecciona automáticamente los tipos de TypeScript de los DTOs y añade los decoradores `@ApiProperty()` de forma transparente**, eliminando el 90% del boilerplate manual de Swagger.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escribir decoradores `@ApiProperty()` a mano en cada una de las propiedades de todos los DTOs por desconocer el CLI Plugin.
  - 🟢 **Green Flag**: Utilizar decoradores semánticos como `@ApiResponse({ status: 201, type: UserResponseDto })` para contratos estrictos.

---

### 49. ¿Cómo se depuran Fugas de Memoria provocadas por el uso incorrecto de `EventEmitter2` o suscripciones de RxJS en NestJS?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - **Suscripciones de RxJS Huérfanas**: Si un servicio de ámbito `Scope.REQUEST` se suscribe a un Observable o Evento global sin cancelar la suscripción (`unsubscribe()`), la instancia del servicio y todo su contexto de petición queda anclada en memoria para siempre.
  - **EventEmitter Listeners**: Si se registran listeners dinámicos con `eventEmitter.on()` dentro de métodos de controladores sin eliminarlos en `onModuleDestroy()` o con `takeUntil()`.
  - **Diagnóstico**: Tomar Heap Snapshots con Chrome DevTools o `v8.writeHeapSnapshot()`, buscar instancias multiplicadas de clases de servicio y filtrar por retenedores en el array `_events` del EventEmitter.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Ignorar las advertencias de Node.js en consola: `MaxListenersExceededWarning: Possible EventEmitter memory leak detected`.
  - 🟢 **Green Flag**: Demostrar el uso del decorador `@OnEvent()` que gestiona automáticamente el ciclo de vida y la eliminación de listeners al destruir el módulo.

---

### 50. ¿Cómo estructurar un proyecto NestJS a escala Enterprise siguiendo principios de Domain-Driven Design (DDD) y Arquitectura Hexagonal?
- **Nivel**: Staff / Principal Architect
- **Respuesta Técnica**:
  En lugar de la estructura tradicional plana por capas técnicas (`controllers/`, `services/`, `entities/` mezcladas):
  - **Organización por Bounded Contexts y Módulos de Dominio**:
    ```
    src/
    ├── modules/
    │   └── billing/
    │       ├── domain/             # Núcleo puro (Entidades, Value Objects, Puertos/Interfaces)
    │       │   ├── models/
    │       │   └── ports/          # PaymentGatewayPort.ts, OrderRepositoryPort.ts
    │       ├── application/        # Casos de Uso, CQRS Commands/Queries, DTOs
    │       │   ├── commands/
    │       │   └── use-cases/
    │       └── infrastructure/     # Adaptadores de Entrada y Salida
    │           ├── adapters/       # StripeAdapter.ts (implementa PaymentGatewayPort)
    │           ├── persistence/    # TypeOrmRepositories, Schemas
    │           └── controllers/    # BillingHttpController.ts
    └── billing.module.ts
    ```
  - **Principio de Inversión de Dependencias**: La capa de `domain` es código TypeScript puro y **NO tiene dependencias de NestJS, ni de Express, ni de TypeORM/Prisma**. Las capas externas (`infrastructure`) dependen del dominio a través de Puertos y Adaptadores.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Acoplar entidades de dominio directamente con decoradores de TypeORM (`@Column`, `@ManyToOne`) en proyectos enterprise de gran escala.
  - 🟢 **Green Flag**: Guiar al entrevistador a través de la Arquitectura Hexagonal (Puertos y Adaptadores) y explicar cómo sustituir la base de datos o el framework web sin tocar una sola línea de la lógica de negocio del dominio.


---

## 6. Inyección de Dependencias Avanzada, Metadatos y Reflection

### 51. ¿Cómo funciona internamente el contenedor IoC de NestJS y cómo inspecciona tipos con `reflect-metadata` y `design:paramtypes`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El compilador de TypeScript, cuando tiene activo `"emitDecoratorMetadata": true`, analiza los tipos estáticos de los parámetros del constructor y emite metadatos en runtime usando la clave `'design:paramtypes'`:
  ```typescript
  @Injectable()
  export class OrderService {
    constructor(private readonly userRepo: UserRepository) {}
  }
  // TypeScript emite en JS:
  // Reflect.metadata("design:paramtypes", [UserRepository])
  ```
  Al arrancar la aplicación, el contenedor IoC de NestJS lee esos metadatos con `Reflect.getMetadata('design:paramtypes', OrderService)`, identifica que `OrderService` requiere una instancia de `UserRepository`, busca dicho provider en su grafo de dependencias interno y lo inyecta automáticamente.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que TypeScript conserva los tipos de las interfaces en runtime para inyección sin decorador `@Inject('TOKEN')`.
  - 🟢 *Green Flag*: Explica que como las interfaces se evaporan al compilar, NestJS requiere tokens de inyección explícitos (`@Inject('IUserRepository')`) cuando se inyectan abstracciones puras.

---

### 52. ¿Cómo utilizar `DiscoveryService` y `MetadataScanner` para construir plugins y procesadores de decoradores personalizados?
- **Nivel**: Staff Engineer / Architecture
- **Respuesta Técnica**:
  Librerías de alto nivel (como BullMQ, TypeORM, o sistemas de auditoría) necesitan escanear todos los controladores y providers de la aplicación para descubrir métodos decorados con metadatos personalizados (ej. `@AuditAction('USER_DELETED')`):
  ```typescript
  import { Injectable, OnModuleInit } from '@nestjs/common';
  import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

  @Injectable()
  export class AuditScannerService implements OnModuleInit {
    constructor(
      private readonly discovery: DiscoveryService,
      private readonly metadataScanner: MetadataScanner,
      private readonly reflector: Reflector,
    ) {}

    onModuleInit() {
      const controllers = this.discovery.getControllers();
      controllers.forEach((wrapper) => {
        const { instance } = wrapper;
        if (!instance) return;

        this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          (methodName) => {
            const auditMeta = this.reflector.get('AUDIT_ACTION', instance[methodName]);
            if (auditMeta) {
              console.log(`Descubierto método auditado: ${instance.constructor.name}.${methodName} -> ${auditMeta}`);
            }
          }
        );
      });
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Recorrer manualmente arrays globales de clases o forzar a los desarrolladores a registrar métodos auditados en listas manuales.
  - 🟢 *Green Flag*: Utiliza `DiscoveryService` y `MetadataScanner` respetando el ciclo de vida `onModuleInit` de NestJS.

---

### 53. ¿Cómo implementar decoradores de parámetros y métodos personalizados componiendo metadata con `applyDecorators`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  En APIs empresariales, acumular múltiples decoradores en cada endpoint (`@UseGuards(AuthGuard)`, `@Roles('ADMIN')`, `@ApiBearerAuth()`, `@ApiResponse({ status: 403 })`) genera código ruidoso.
  `applyDecorators` permite consolidar múltiples decoradores en una sola anotación semántica:
  ```typescript
  import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
  import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
  import { AuthGuard } from './auth.guard';
  import { RolesGuard } from './roles.guard';

  export function AuthAdmin() {
    return applyDecorators(
      SetMetadata('roles', ['ADMIN']),
      UseGuards(AuthGuard, RolesGuard),
      ApiBearerAuth(),
      ApiUnauthorizedResponse({ description: 'No autorizado o permisos insuficientes' }),
    );
  }

  // En el controlador:
  @Get('financial-report')
  @AuthAdmin()
  getReport() {
    return { data: 'confidencial' };
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Duplicar los mismos 5 decoradores en 50 controladores distintos.
  - 🟢 *Green Flag*: Crea composiciones limpias y decoradores de parámetros con `createParamDecorator()` para extraer datos autenticados.

---

### 54. ¿Qué es `ModuleRef` y cómo permite resolver providers de forma dinámica o bajo demanda en tiempo de ejecución?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  `ModuleRef` es una referencia al contenedor IoC del módulo actual. Permite navegar por el grafo de dependencias y obtener instancias de providers programáticamente:
  - **`moduleRef.get(Service, { strict: false })`**: Resuelve un provider síncronamente si ya fue instanciado en el arranque.
  - **`moduleRef.resolve(RequestScopedService, contextId)`**: Resuelve de forma asíncrona providers con `Scope.REQUEST` o `Scope.TRANSIENT`, creando un sub-árbol de dependencias aislado para un `ContextId` determinado:
  ```typescript
  @Injectable()
  export class CommandDispatcher {
    constructor(private readonly moduleRef: ModuleRef) {}

    async dispatch(commandName: string, payload: any) {
      // Resolución dinámica de handlers por convención de nombres
      const HandlerClass = this.resolveHandlerClass(commandName);
      const handlerInstance = await this.moduleRef.resolve(HandlerClass);
      return handlerInstance.execute(payload);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `ModuleRef` como Service Locator antipatrón en lugar de inyección por constructor habitual.
  - 🟢 *Green Flag*: Explica que su uso es legítimo en dispatchers de comandos, plugins dinámicos o resolución de estrategias polimórficas.

---

### 55. ¿Cómo implementar proveedores asíncronos (`useFactory` con `async/await`) para inicializar conexiones antes del bootstrap?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Si una conexión a base de datos, cliente gRPC o servicio de configuración en la nube requiere una inicialización asíncrona previa antes de que los controladores puedan aceptar peticiones:
  ```typescript
  import { Module } from '@nestjs/common';
  import { createClient } from 'redis';

  export const REDIS_CLIENT = 'REDIS_CLIENT';

  export const redisProvider = {
    provide: REDIS_CLIENT,
    useFactory: async (configService: ConfigService) => {
      const client = createClient({ url: configService.get('REDIS_URL') });
      await client.connect(); // Bloquea la inicialización del módulo hasta conectar
      return client;
    },
    inject: [ConfigService],
  };

  @Module({
    providers: [redisProvider],
    exports: [REDIS_CLIENT],
  })
  export class RedisModule {}
  ```
  NestJS suspende el arranque de la aplicación hasta que todas las promesas de los `useFactory` asíncronos se resuelvan exitosamente.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Inicializar clientes asíncronos en el constructor de los servicios sin `await`, generando *race conditions* en las primeras peticiones.
  - 🟢 *Green Flag*: Demuestra cómo `useFactory` asíncrono garantiza que los providers inyectados estén 100% listos para usar.

---

### 56. ¿Cómo funciona el patrón `ConfigurableModuleBuilder` introducido en NestJS v9 para generar módulos dinámicos estandarizados?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Antes de NestJS v9, crear módulos dinámicos configurables (`register`, `forRootAsync`, interfaces `ModuleOptionsFactory`, `AsyncOptions`) requería escribir cientos de líneas de código repetitivo (*boilerplate*).
  `ConfigurableModuleBuilder` automatiza la generación de interfaces y métodos:
  ```typescript
  // cache.module-definition.ts
  import { ConfigurableModuleBuilder } from '@nestjs/common';

  export interface CacheModuleOptions {
    ttlSeconds: number;
    redisHost: string;
  }

  export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
    new ConfigurableModuleBuilder<CacheModuleOptions>()
      .setClassPrefix('Cache')
      .build();

  // cache.module.ts
  import { Module } from '@nestjs/common';
  import { ConfigurableModuleClass } from './cache.module-definition';

  @Module({})
  export class CacheModule extends ConfigurableModuleClass {}

  // Consumo por el usuario (automáticamente soporta forRoot, forRootAsync con useFactory):
  CacheModule.register({ ttlSeconds: 300, redisHost: 'localhost' });
  CacheModule.registerAsync({
    useFactory: (config: ConfigService) => ({ ttlSeconds: config.get('TTL'), redisHost: 'redis' }),
    inject: [ConfigService],
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer la existencia de `ConfigurableModuleBuilder` y continuar escribiendo boilerplate manual para módulos asíncronos.
  - 🟢 *Green Flag*: Utiliza builders configurables en la creación de librerías y SDKs internos reutilizables de NestJS.

---

### 57. ¿Cómo evitar Memory Leaks causados por proveedores con `Scope.REQUEST` en APIs de alto throughput?
- **Nivel**: Senior / Staff / Performance
- **Respuesta Técnica**:
  - **El Riesgo de `Scope.REQUEST`**: Cuando un provider se marca como `Scope.REQUEST`, **todos los providers que lo inyectan aguas arriba se convierten automáticamente en Request Scoped en cascada (*Scope Bubbling*)**.
  - Si un `OrderService` inyecta un `TenantService` (Request Scoped), `OrderService` y el `OrderController` se re-instancian en **cada petición HTTP**. En APIs de 10,000 RPS, esto crea millones de objetos efímeros por segundo, disparando la presión sobre el Garbage Collector y degradando el throughput hasta en un 80%.
  - **Mitigación**: Reemplazar `Scope.REQUEST` por un provider **Singleton** que acceda al contexto de la petición mediante **`AsyncLocalStorage`**:
  ```typescript
  @Injectable() // SINGLETON (Cero sobrecarga de instanciación)
  export class TenantContextService {
    private als = new AsyncLocalStorage<{ tenantId: string }>();

    run(tenantId: string, callback: () => void) {
      this.als.run({ tenantId }, callback);
    }

    getTenantId(): string {
      return this.als.getStore()?.tenantId || 'DEFAULT';
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `Scope.REQUEST` de forma indiscriminada para acceder al usuario autenticado en servicios comunes.
  - 🟢 *Green Flag*: Advierte sobre el fenómeno de *Scope Bubbling* y demuestra cómo `AsyncLocalStorage` mantiene el rendimiento de un Singleton.

---

### 58. ¿Cómo implementar multi-tenancy dinámico inyectando conexiones de base de datos aisladas por inquilino con `AsyncLocalStorage`?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  En arquitecturas SaaS con aislamiento a nivel de base de datos (*Database-per-Tenant* o *Schema-per-Tenant*):
  1. Un Middleware HTTP extrae el inquilino (subdominio o header `x-tenant-id`) y envuelve la petición en `AsyncLocalStorage`.
  2. Un pool de conexiones dinámico mantiene en caché las instancias de `DataSource` de TypeORM/Prisma por tenant:
  ```typescript
  @Injectable()
  export class TenantDataSourceProvider {
    private dataSources = new Map<string, DataSource>();

    constructor(private readonly tenantContext: TenantContextService) {}

    async getDataSource(): Promise<DataSource> {
      const tenantId = this.tenantContext.getTenantId();
      let ds = this.dataSources.get(tenantId);
      if (!ds) {
        ds = new DataSource({
          type: 'postgres',
          database: `tenant_${tenantId}`,
          entities: [User, Order],
        });
        await ds.initialize();
        this.dataSources.set(tenantId, ds);
      }
      return ds;
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Re-conectar a la base de datos en cada petición HTTP sin cachear las instancias del pool de conexiones.
  - 🟢 *Green Flag*: Combina pool de conexiones por tenant con control de desalojo LRU para inquilinos inactivos.

---

### 59. ¿Cómo gestionar la destrucción ordenada de recursos con `BeforeApplicationShutdown` y `OnApplicationShutdown`?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  Cuando Kubernetes envía una señal `SIGTERM`, NestJS debe invocar los hooks de apagado si se habilitaron explícitamente con `app.enableShutdownHooks()`:
  1. **`BeforeApplicationShutdown(signal?: string)`**:
     - Se invoca inmediatamente al recibir la señal.
     - Ideal para dejar de aceptar nuevos trabajos de colas o cerrar suscripciones a tópicos de Kafka mientras el servidor HTTP termina de responder peticiones en curso.
  2. **`OnApplicationShutdown(signal?: string)`**:
     - Se invoca tras cerrar todas las conexiones de red.
     - Aquí se cierran ordenadamente las conexiones de base de datos, pools de Redis y descriptores de archivo:
     ```typescript
     @Injectable()
     export class DatabaseService implements OnApplicationShutdown {
       constructor(private readonly pool: Pool) {}

       async onApplicationShutdown(signal?: string) {
         console.log(`Cerrando pool de base de datos debido a señal ${signal}...`);
         await this.pool.end();
       }
     }
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No llamar a `app.enableShutdownHooks()` en `main.ts` (por defecto NestJS ignora las señales de apagado del sistema operativo).
  - 🟢 *Green Flag*: Explica la secuencia de cierre coordinada en Kubernetes para evitar errores de conexión rechazada.

---

### 60. ¿Cómo compilar e iniciar aplicaciones NestJS de forma programática como microservicios o Workers sin levantar el servidor HTTP?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  NestJS no requiere obligatoriamente levantar un servidor HTTP. Se puede instanciar en modos alternativos:
  1. **Modo Standalone / CLI Application (`NestFactory.createApplicationContext`))**:
     - Carga el contenedor IoC y ejecuta tareas cron, migraciones o scripts batch sin abrir puertos de red:
     ```typescript
     const app = await NestFactory.createApplicationContext(AppModule);
     const taskService = app.get(DataMigrationService);
     await taskService.run();
     await app.close();
     ```
  2. **Modo Microservicio Puro (`NestFactory.createMicroservice`)**:
     - Escucha exclusivamente eventos de Kafka, RabbitMQ o llamadas gRPC:
     ```typescript
     const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
       transport: Transport.KAFKA,
       options: { client: { brokers: ['kafka:9092'] } },
     });
     await app.listen();
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Levantar un servidor HTTP de Express con `NestFactory.create()` para ejecutar un worker que solo procesa mensajes de colas.
  - 🟢 *Green Flag*: Utiliza `createApplicationContext` para scripts de migración y `createMicroservice` para trabajadores de eventos.

---

## 7. Arquitectura CQRS, Event-Driven y Transacciones Distribuidas

### 61. ¿Cómo funciona el Command Bus y el Query Bus en `@nestjs/cqrs` y qué ventajas aporta la segregación de responsabilidades?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  El patrón **CQRS (Command Query Responsibility Segregation)** divide las operaciones del sistema en dos modelos desacoplados:
  - **Commands (Mutación de Estado)**: Representan intenciones de cambio (`CreateOrderCommand`). Son procesados por un único `CommandHandler`. No devuelven entidades completas; ejecutan validaciones e invariantes de negocio.
  - **Queries (Lectura de Estado)**: Representan consultas optimizadas para visualización (`GetOrderSummaryQuery`). Son atendidas por un `QueryHandler` que puede consultar vistas desnormalizadas, réplicas de lectura de PostgreSQL o índices de Elasticsearch sin sobrecargar el modelo de dominio:
  ```typescript
  // Controlador
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.commandBus.execute(new CreateOrderCommand(dto.userId, dto.items));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.queryBus.execute(new GetOrderSummaryQuery(id));
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mutar entidades de negocio dentro de un QueryHandler o devolver modelos de dominio ricos con métodos de mutación en una Query.
  - 🟢 *Green Flag*: Explica cómo CQRS permite escalar la lectura y la escritura de forma independiente sobre diferentes motores de persistencia.

---

### 62. ¿Cómo implementar Sagas en `@nestjs/cqrs` utilizando operadores de RxJS (`ofType`, `map`, `mergeMap`) para transacciones distribuidas?
- **Nivel**: Staff Engineer / Distributed Systems
- **Respuesta Técnica**:
  En microservicios, las transacciones que abarcan múltiples servicios no pueden usar transacciones ACID de base de datos tradicionales.
  Una **Saga** es un patrón de orquestación donde una serie de transacciones locales coordinan un proceso de negocio complejo a través de eventos, ejecutando **acciones compensatorias** si un paso intermedio falla:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { ICommand, ofType, Saga } from '@nestjs/cqrs';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { OrderCreatedEvent } from './events/order-created.event';
  import { ChargePaymentCommand } from './commands/charge-payment.command';

  @Injectable()
  export class OrderSagas {
    @Saga()
    orderCreated = (events$: Observable<any>): Observable<ICommand> => {
      return events$.pipe(
        ofType(OrderCreatedEvent),
        map((event) => {
          console.log(`[Saga] Pedido ${event.orderId} creado. Despachando cobro...`);
          return new ChargePaymentCommand(event.orderId, event.amount);
        })
      );
    };
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar usar Two-Phase Commit (2PC) en microservicios distribuidos con alta latencia.
  - 🟢 *Green Flag*: Diseña comandos de compensación explícitos (ej. `RefundPaymentCommand`) ante la llegada de eventos de fallo (`InventoryAllocationFailedEvent`).

---

### 63. ¿Cómo implementar el patrón Transactional Outbox en NestJS para garantizar entrega de eventos atómica con la base de datos?
- **Nivel**: Staff Engineer / Architect
- **Respuesta Técnica**:
  El problema de la "Doble Escritura" (*Dual Write Problem*) ocurre si guardas una orden en PostgreSQL y luego publicas en Kafka: si Kafka se cae o el pod muere en medio, la orden existe en BD pero el evento nunca se emitió, rompiendo la consistencia del sistema distribuido.
  **Patrón Transactional Outbox**:
  1. En una **única transacción atómica de PostgreSQL**:
     - Se guarda el registro en la tabla `orders`.
     - Se inserta el evento de dominio en una tabla `outbox` en la misma base de datos.
  2. Un proceso Worker separado (usando Change Data Capture con Debezium o un cron en NestJS con `SKIP LOCKED`):
     - Lee los eventos de la tabla `outbox`.
     - Los publica en Kafka/RabbitMQ.
     - Marca los eventos como publicados o los elimina.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Publicar en colas externas antes de hacer el commit de base de datos (puede emitir eventos de transacciones que luego hacen rollback).
  - 🟢 *Green Flag*: Explica cómo el Transactional Outbox garantiza la semántica *At-Least-Once Delivery* en microservicios.

---

### 64. ¿Cómo integrar el Event Bus de NestJS con Apache Kafka o RabbitMQ para publicar eventos de dominio asíncronos?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Para puentear los eventos de dominio internos de NestJS (`@nestjs/cqrs`) hacia un broker externo como Kafka:
  ```typescript
  import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
  import { Inject, Injectable } from '@nestjs/common';
  import { ClientKafka } from '@nestjs/microservices';
  import { UserRegisteredEvent } from './user-registered.event';

  @EventsHandler(UserRegisteredEvent)
  export class UserRegisteredExternalPublisher implements IEventHandler<UserRegisteredEvent> {
    constructor(
      @Inject('KAFKA_SERVICE')
      private readonly kafkaClient: ClientKafka,
    ) {}

    handle(event: UserRegisteredEvent) {
      // Publicar en el tópico 'user.events' de Kafka
      this.kafkaClient.emit('user.registered', {
        key: event.userId, // Clave de partición para garantizar orden de eventos
        value: JSON.stringify(event),
      });
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Publicar mensajes en Kafka sin clave de partición (`key`), provocando que eventos secuenciales del mismo usuario se procesen fuera de orden.
  - 🟢 *Green Flag*: Utiliza `key` para particionamiento determinista y serializa con contratos tipados.

---

### 65. ¿Cómo gestionar la idempotencia en consumidores de eventos de NestJS evitando procesar dos veces el mismo mensaje?
- **Nivel**: Senior / Reliability
- **Respuesta Técnica**:
  Los brokers como Kafka o RabbitMQ garantizan entrega *Al Menos Una Vez* (*At-Least-Once*), por lo que ante reintentos o desconexiones, el consumidor de NestJS puede recibir el mismo evento múltiples veces.
  *Estrategia de Deduplicación con Redis o Base de Datos*:
  ```typescript
  @EventPattern('payment.succeeded')
  async handlePaymentSucceeded(@Payload() data: PaymentEvent, @Ctx() context: RmqContext) {
    const eventId = data.eventId; // UUID único del evento

    // Operación atómica SET NX (Set if Not eXists) en Redis con TTL de 24h
    const isNew = await this.redis.set(`processed_event:${eventId}`, '1', 'EX', 86400, 'NX');
    if (!isNew) {
      console.warn(`[Deduplicación] Evento ${eventId} ya procesado previamente. Descartando.`);
      return;
    }

    // Procesar lógica de negocio de forma segura
    await this.orderService.fulfillOrder(data.orderId);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que los brokers de mensajería nunca envían mensajes duplicados y no implementar claves de idempotencia.
  - 🟢 *Green Flag*: Utiliza primitivas atómicas (`SET NX` o clave primaria única en tabla de auditoría) para descartar duplicados.

---

### 66. ¿Cómo implementar el patrón Unit of Work en NestJS para coordinar transacciones que abarcan múltiples repositorios?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  Si un caso de uso requiere actualizar el repositorio de órdenes y el de inventario en una única transacción atómica sin acoplar los repositorios al objeto `QueryRunner` de TypeORM:
  ```typescript
  @Injectable()
  export class UnitOfWork {
    constructor(private readonly dataSource: DataSource) {}

    async execute<T>(work: (repos: { orders: OrderRepository; inventory: InventoryRepository }) => Promise<T>): Promise<T> {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const orders = new OrderRepository(queryRunner.manager);
        const inventory = new InventoryRepository(queryRunner.manager);

        const result = await work({ orders, inventory });

        await queryRunner.commitTransaction();
        return result;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Iniciar transacciones en los controladores o pasar el `QueryRunner` como parámetro de método de dominio.
  - 🟢 *Green Flag*: Encapsula el ciclo de vida de la transacción en un servicio Unit of Work reutilizable.

---

### 67. ¿Cómo implementar eventos en memoria desacoplados con `@nestjs/event-emitter` y manejo síncrono vs asíncrono?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El paquete oficial `@nestjs/event-emitter` provee un bus de eventos en memoria tipado basado en `eventemitter2`:
  - **`eventEmitter.emit()`**: Es **síncrono**. No espera a que los listeners asíncronos finalicen sus promesas. Si un listener falla, no detiene el flujo principal.
  - **`eventEmitter.emitAsync()`**: Es **asíncrono**. Retorna una `Promise<any[]>` que resuelve cuando **todos** los listeners registrados han completado su ejecución:
  ```typescript
  // Emisión
  await this.eventEmitter.emitAsync('user.created', new UserCreatedEvent(user));

  // Escucha
  @Injectable()
  export class WelcomeEmailSubscriber {
    @OnEvent('user.created', { async: true })
    async handleUserCreated(event: UserCreatedEvent) {
      await this.mailService.sendWelcome(event.email);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `emit()` síncrono esperando que capture excepciones lanzadas dentro de listeners asíncronos.
  - 🟢 *Green Flag*: Sabe cuándo usar `emitAsync()` para flujos que requieren coordinación y `async: true` con colas para tareas secundarias.

---

### 68. ¿Cómo gestionar la concurrencia optimista en entidades de dominio con versionado (`@VersionColumn`) en NestJS?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Si dos administradores editan simultáneamente el mismo producto, el último en guardar sobreescribirá los cambios del primero (*Lost Update Problem*).
  Con **Bloqueo Optimista (Optimistic Locking)**:
  1. La entidad incluye una columna de versión entera:
     ```typescript
     @Entity()
     export class Product {
       @PrimaryGeneratedColumn('uuid')
       id: string;

       @Column()
       price: number;

       @VersionColumn()
       version: number; // Incrementado automáticamente por TypeORM
     }
     ```
  2. Al ejecutar la actualización, TypeORM genera: `UPDATE product SET price = 100, version = version + 1 WHERE id = 'uuid' AND version = 2`.
  3. Si otro proceso ya incrementó la versión a 3, el número de filas afectadas es 0, y TypeORM lanza automáticamente un error de concurrencia: `OptimisticLockVersionMismatchError`.
  4. En NestJS, un Exception Filter captura este error y responde `HTTP 409 Conflict`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar bloqueos pesimistas (`SELECT FOR UPDATE`) en todas las consultas de lectura saturando la base de datos.
  - 🟢 *Green Flag*: Explica cómo el control de concurrencia optimista maximiza el throughput en arquitecturas con baja probabilidad de colisión.

---

### 69. ¿Cómo implementar proyecciones de lectura (Read Models) actualizadas en tiempo real desde eventos en NestJS?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En CQRS, para evitar JOINs costosos entre 10 tablas al consultar un dashboard:
  - Se crea una tabla o documento desnormalizado optimizado para la vista: `CustomerDashboardView`.
  - Un EventHandler de NestJS escucha los eventos de dominio y actualiza la proyección incrementalmente:
  ```typescript
  @EventsHandler(OrderCompletedEvent, PaymentRefundedEvent)
  export class CustomerDashboardProjection implements IEventHandler {
    constructor(private readonly dashboardRepo: MongoDashboardRepository) {}

    async handle(event: OrderCompletedEvent | PaymentRefundedEvent) {
      if (event instanceof OrderCompletedEvent) {
        await this.dashboardRepo.incrementTotalSpent(event.customerId, event.amount);
      } else if (event instanceof PaymentRefundedEvent) {
        await this.dashboardRepo.decrementTotalSpent(event.customerId, event.refundAmount);
      }
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Consultar el modelo relacional transaccional complejo para emitir reportes de analítica en tiempo real.
  - 🟢 *Green Flag*: Diseña proyecciones de solo lectura desnormalizadas que permiten consultas instantáneas en tiempo $O(1)$.

---

### 70. ¿Cómo diseñar pruebas unitarias para Command Handlers y Query Handlers en `@nestjs/cqrs`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Dado que un Command Handler o Query Handler es una clase de TypeScript pura que solo implementa el método `execute()`, probarla de forma aislada no requiere levantar el framework NestJS:
  ```typescript
  import { describe, it, expect, vi } from 'vitest';
  import { CreateOrderHandler } from './create-order.handler';
  import { CreateOrderCommand } from './create-order.command';

  describe('CreateOrderHandler', () => {
    it('debe validar fondos y persistir el nuevo pedido emitiendo evento', async () => {
      const mockOrderRepo = { save: vi.fn().mockResolvedValue({ id: 'ord-123' }) };
      const mockPublisher = { mergeObjectContext: vi.fn((entity) => entity) };

      const handler = new CreateOrderHandler(mockOrderRepo as any, mockPublisher as any);
      const command = new CreateOrderCommand('usr-1', 500);

      const result = await handler.execute(command);

      expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('ord-123');
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `Test.createTestingModule()` para pruebas unitarias de CQRS que no tienen dependencias complejas del framework.
  - 🟢 *Green Flag*: Diseña pruebas unitarias que se ejecutan en 2ms instanciando directamente la clase con doubles/mocks.

---

## 8. Microservicios Avanzados, gRPC, WebSockets y SSE

### 71. ¿Cómo implementar microservicios gRPC de alto rendimiento con `@nestjs/microservices` y contratos `.proto`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  gRPC utiliza HTTP/2 y serialización binaria con Protocol Buffers (Protobuf), siendo hasta 5x a 10x más rápido que REST JSON para llamadas inter-servicio:
  1. Definir el contrato en `hero.proto`:
     ```protobuf
     syntax = "proto3";
     package hero;

     service HeroService {
       rpc FindOne (HeroById) returns (Hero);
     }

     message HeroById { int32 id = 1; }
     message Hero { int32 id = 1; string name = 2; }
     ```
  2. Implementar el controlador gRPC en NestJS:
     ```typescript
     import { Controller } from '@nestjs/common';
     import { GrpcMethod } from '@nestjs/microservices';

     @Controller()
     export class HeroController {
       @GrpcMethod('HeroService', 'FindOne')
       findOne(data: { id: number }): { id: number; name: string } {
         return { id: data.id, name: 'Superman' };
       }
     }
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Utilizar REST HTTP/1.1 para comunicación de alta frecuencia y baja latencia entre cientos de microservicios internos.
  - 🟢 *Green Flag*: Explica cómo gRPC genera contratos estrictos con serialización binaria compacta y multiplexación sobre una sola conexión HTTP/2.

---

### 72. ¿Cómo manejar streaming bidireccional cliente-servidor en gRPC con RxJS `Observable` en NestJS?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  A diferencia de REST, gRPC soporta streaming continuo en ambas direcciones. En NestJS, los streams de gRPC se representan naturalmente como Observables de RxJS:
  ```typescript
  import { Controller } from '@nestjs/common';
  import { GrpcStreamMethod } from '@nestjs/microservices';
  import { Observable, Subject } from 'rxjs';

  @Controller()
  export class SensorController {
    @GrpcStreamMethod('SensorService', 'SyncMetrics')
    syncMetrics(messages$: Observable<SensorReading>): Observable<SensorAck> {
      const output$ = new Subject<SensorAck>();

      messages$.subscribe({
        next: (reading) => {
          console.log(`Lectura recibida: ${reading.temperature}°C`);
          output$.next({ ackId: reading.id, status: 'PROCESSED' });
        },
        complete: () => output$.complete(),
      });

      return output$.asObservable();
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar implementar streaming con polling HTTP o cargar todos los mensajes en un array.
  - 🟢 *Green Flag*: Maneja el ciclo de vida del flujo de RxJS con `subscribe`, `next` y `complete` sobre gRPC.

---

### 73. ¿Cómo estructurar un clúster de WebSockets escalable con `@WebSocketGateway()` y el adaptador `@socket.io/redis-adapter`?
- **Nivel**: Senior / Architecture
- **Respuesta Técnica**:
  Por defecto, si un cliente emite un mensaje a una sala en el Pod 1, los usuarios conectados al Pod 2 nunca lo reciben.
  *Configuración del Adaptador Redis en NestJS*:
  ```typescript
  import { IoAdapter } from '@nestjs/platform-socket.io';
  import { createAdapter } from '@socket.io/redis-adapter';
  import { createClient } from 'redis';

  export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: any;

    async connectToRedis(): Promise<void> {
      const pubClient = createClient({ url: 'redis://redis-cluster:6379' });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: any): any {
      const server = super.createIOServer(port, options);
      server.adapter(this.adapterConstructor);
      return server;
    }
  }

  // En main.ts:
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar sincronizar salas de WebSockets entre pods mediante peticiones HTTP REST cruzadas.
  - 🟢 *Green Flag*: Utiliza el adaptador nativo Redis Pub/Sub desacoplando la capa de transporte de la lógica del Gateway.

---

### 74. ¿Cómo implementar autenticación JWT en el handshake de WebSockets usando WsGuards personalizados?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Los WebSockets no envían cabeceras de autorización en cada mensaje emitido; la autenticación debe validarse en el momento de la conexión inicial (*Handshake*):
  ```typescript
  import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
  import { WsException } from '@nestjs/websockets';
  import { JwtService } from '@nestjs/jwt';
  import { Socket } from 'socket.io';

  @Injectable()
  export class WsJwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth?.token || client.handshake.headers['authorization'];

      if (!token) throw new WsException('Token de autenticación faltante');

      try {
        const payload = this.jwtService.verify(token.replace('Bearer ', ''));
        // Adjuntar el usuario al socket para los futuros eventos
        client.data.user = payload;
        return true;
      } catch {
        throw new WsException('Token inválido o expirado');
      }
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Lanzar `UnauthorizedException` (HTTP) en un contexto WebSocket en lugar de `WsException`.
  - 🟢 *Green Flag*: Valida el token en `client.handshake.auth` y asocia los datos del usuario en `client.data`.

---

### 75. ¿Cómo emitir Server-Sent Events (SSE) nativos en NestJS utilizando el decorador `@Sse()` y flujos de RxJS?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  NestJS provee soporte de primera clase para Server-Sent Events mediante el decorador `@Sse()` retornando un `Observable<MessageEvent>`:
  ```typescript
  import { Controller, Sse, MessageEvent } from '@nestjs/common';
  import { Observable, interval } from 'rxjs';
  import { map } from 'rxjs/operators';

  @Controller('notifications')
  export class NotificationsController {
    @Sse('stream')
    streamEvents(): Observable<MessageEvent> {
      return interval(2000).pipe(
        map((num) => ({
          data: { message: `Tick de notificación #${num}`, timestamp: Date.now() },
          id: num.toString(),
          type: 'heartbeat',
          retry: 5000,
        }))
      );
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Manipular manualmente objetos `res` con callbacks crudos en lugar de aprovechar la integración reactiva nativa de NestJS.
  - 🟢 *Green Flag*: Modela eventos con interfaces estandarizadas W3C y gestiona el flujo con operadores de RxJS.

---

### 76. ¿Cómo implementar colas de tareas distribuidas de alta velocidad con `@nestjs/bullmq` y gestión de reintentos con backoff?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `@nestjs/bullmq` es la integración oficial para BullMQ (construido sobre Redis Streams nativos):
  ```typescript
  // 1. Encolar tarea en el productor
  @Injectable()
  export class NotificationService {
    constructor(@InjectQueue('email') private emailQueue: Queue) {}

    async sendEmail(to: string) {
      await this.emailQueue.add(
        'welcome',
        { to },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        }
      );
    }
  }

  // 2. Procesar tarea en el Worker
  @Processor('email')
  export class EmailProcessor extends WorkerHost {
    async process(job: Job<{ to: string }>): Promise<any> {
      console.log(`Enviando email a ${job.data.to} (Intento ${job.attemptsMade + 1})`);
      // Lógica de envío...
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No configurar `removeOnComplete` o `removeOnFail` acumulando millones de jobs completados en la RAM de Redis.
  - 🟢 *Green Flag*: Extiende de `WorkerHost` y utiliza estrategias de reintento exponencial con jitter.

---

### 77. ¿Cómo gestionar Dead Letter Queues (DLQ) y alertas de jobs fallidos en workers de BullMQ en NestJS?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Cuando un job agota todos sus reintentos configurados (`attempts: 5`), pasa al estado `FAILED`. Para evitar pérdida silenciosa de datos:
  ```typescript
  @Processor('orders')
  export class OrderProcessor extends WorkerHost {
    @InjectQueue('orders-dlq') private dlqQueue: Queue;

    async process(job: Job): Promise<any> {
      // Procesamiento de orden...
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job, err: Error) {
      if (job.attemptsMade >= (job.opts.attempts || 1)) {
        console.error(`Job ${job.id} falló definitivamente tras ${job.attemptsMade} intentos. Moviendo a DLQ...`);
        await this.dlqQueue.add('dead-letter-order', {
          failedJobId: job.id,
          originalData: job.data,
          error: err.message,
          stack: err.stack,
          failedAt: new Date().toISOString(),
        });
        // Disparar alerta en Slack / PagerDuty
      }
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar jobs fallidos en la cola principal sin notificación ni mecanismo de análisis post-mortem.
  - 🟢 *Green Flag*: Diseña un pipeline de DLQ que permite re-procesar trabajos una vez resuelta la causa raíz.

---

### 78. ¿Cómo configurar timeouts globales y cancelaciones cooperativas en llamadas RPC de microservicios con `timeout` de RxJS?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Las llamadas remotas entre microservicios (`ClientProxy`) deben tener un tiempo de vida máximo para evitar que peticiones congeladas agoten el pool de conexiones:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { ClientProxy } from '@nestjs/microservices';
  import { firstValueFrom, timeout, catchError, throwError, TimeoutError } from 'rxjs';

  @Injectable()
  export class InventoryClientService {
    constructor(@Inject('INVENTORY_SERVICE') private client: ClientProxy) {}

    async reserveStock(productId: string, quantity: number) {
      return firstValueFrom(
        this.client.send({ cmd: 'reserve_stock' }, { productId, quantity }).pipe(
          timeout(2500), // Si tarda más de 2.5s, se corta la llamada
          catchError((err) => {
            if (err instanceof TimeoutError) {
              return throwError(() => new RequestTimeoutException('El microservicio de inventario no respondió a tiempo'));
            }
            return throwError(() => err);
          })
        )
      );
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Envolver las llamadas en `firstValueFrom` directo sin operadores de timeout.
  - 🟢 *Green Flag*: Mapea `TimeoutError` de RxJS a excepciones semánticas de NestJS (`RequestTimeoutException`).

---

### 79. ¿Cómo implementar un API Gateway con NestJS que unifique microservicios gRPC, REST y Kafka con agregación de respuestas?
- **Nivel**: Staff / Solutions Architect
- **Respuesta Técnica**:
  El patrón **API Gateway / Backend-For-Frontend (BFF)** provee un único punto de entrada público para clientes web/móviles, agregando llamadas a múltiples microservicios internos:
  ```typescript
  @Controller('v1/orders')
  export class OrderGatewayController {
    constructor(
      @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
      @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
      @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    ) {}

    @Get(':id/full-summary')
    async getFullOrderSummary(@Param('id') orderId: string) {
      // Consultar microservicios en paralelo con Promise.all
      const [order, payment, user] = await Promise.all([
        firstValueFrom(this.orderClient.send('get_order', orderId)),
        firstValueFrom(this.paymentClient.send('get_payment_status', orderId)),
        firstValueFrom(this.userClient.send('get_user_profile', orderId)),
      ]);

      return {
        orderId,
        customerName: user.name,
        total: order.amount,
        paymentStatus: payment.status,
        items: order.items,
      };
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ejecutar llamadas a microservicios en cascada secuencial (`await call1; await call2;`) triplicando la latencia del usuario final.
  - 🟢 *Green Flag*: Utiliza paralelismo con `Promise.all` o combinadores de RxJS (`forkJoin`) y maneja fallos parciales con degradación elegante.

---

### 80. ¿Cómo manejar la serialización binaria y compatibilidad de versiones de mensajes en microservicios NestJS?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  En microservicios desacoplados, los servicios emisores y receptores no se despliegan al mismo tiempo. Un cambio en la estructura de un evento puede romper a los consumidores si no se aplican reglas de compatibilidad de esquemas:
  1. **Reglas de Schema Evolution (Protobuf o Avro)**:
     - Nunca reutilizar números de campo en archivos `.proto`.
     - Solo añadir campos opcionales; nunca eliminar campos obligatorios.
     - Marcar campos obsoletos con `reserved` para evitar que futuras versiones los reutilicen con otro tipo.
  2. **En payloads JSON / NestJS**:
     - Incluir siempre una cabecera de versión del contrato: `{ eventVersion: 2, payload: { ... } }`.
     - El consumidor utiliza un discriminador de versión para soportar tanto payloads v1 como v2 durante el periodo de transición.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Modificar el nombre o tipo de una propiedad en un evento sin mantener compatibilidad hacia atrás.
  - 🟢 *Green Flag*: Explica cómo un Schema Registry (ej. Confluent Schema Registry) valida la compatibilidad en tiempo de CI/CD.

---

## 9. GraphQL Enterprise, DataLoader y Rendimiento de APIs

### 81. ¿Cuál es la diferencia arquitectónica entre el enfoque Code-First y Schema-First en `@nestjs/graphql`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **Schema-First**:
    - Se escriben primero los esquemas de GraphQL en lenguaje SDL (`.graphql`).
    - NestJS genera automáticamente las definiciones de TypeScript mediante herramientas de compilación.
    - *Ventaja*: El esquema es independiente de cualquier lenguaje y sirve como contrato inicial de diseño de API.
  - **Code-First (Enfoque Idiomático de NestJS)**:
    - Se utilizan clases y decoradores de TypeScript (`@ObjectType()`, `@Field()`, `@Resolver()`).
    - NestJS genera automáticamente el esquema GraphQL SDL (`schema.gql`) a partir de los metadatos de TypeScript.
    - *Ventaja*: Cero duplicación; una sola fuente de verdad para el tipado estático, la validación de runtime con `class-validator` y el esquema GraphQL.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Duplicar manualmente archivos SDL y tipos de TypeScript en proyectos grandes.
  - 🟢 *Green Flag*: Elige Code-First para máxima sinergia con el sistema de tipos de NestJS y plugins de Swagger/OpenAPI.

---

### 82. ¿Cómo resolver el problema de consultas N+1 en GraphQL utilizando `DataLoader` integrado en NestJS?
- **Nivel**: Senior / Staff / Performance
- **Respuesta Técnica**:
  En GraphQL, si consultas 50 pedidos y cada uno resuelve su usuario (`author`), el resolver `@ResolveField('author')` se ejecutará 50 veces, generando 50 consultas individuales a la base de datos (**Problema N+1**).
  **DataLoader** resuelve esto mediante **Batching** (agrupamiento) y **Caching** en memoria durante el ciclo de vida de una sola petición:
  ```typescript
  import DataLoader from 'dataloader';
  import { Injectable, Scope } from '@nestjs/common';

  @Injectable({ scope: Scope.REQUEST })
  export class UserDataLoader {
    constructor(private readonly userService: UserService) {}

    // DataLoader agrupa todas las peticiones de un tick del Event Loop en una sola query SQL:
    // SELECT * FROM users WHERE id IN (1, 2, 3... 50)
    public readonly batchUsers = new DataLoader<string, User>(async (userIds) => {
      const users = await this.userService.findByIds([...userIds]);
      const userMap = new Map(users.map((u) => [u.id, u]));
      return userIds.map((id) => userMap.get(id) || null);
    });
  }

  // En el Resolver:
  @ResolveField(() => User)
  getAuthor(@Parent() post: Post, @Context('loaders') loaders: UserDataLoader) {
    return loaders.batchUsers.load(post.authorId);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ejecutar `this.userService.findById(post.authorId)` directamente en cada `@ResolveField()` provocando N+1 queries.
  - 🟢 *Green Flag*: Implementa DataLoaders Scoped por petición garantizando que el caché no se filtre entre diferentes usuarios.

---

### 83. ¿Cómo implementar suscripciones en tiempo real en GraphQL con `@Subscription()` y `PubSub` de Redis sobre WebSockets?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Las suscripciones de GraphQL permiten al cliente recibir actualizaciones en streaming cuando ocurren mutaciones en el servidor:
  ```typescript
  import { Resolver, Subscription, Mutation, Args } from '@nestjs/graphql';
  import { RedisPubSub } from 'graphql-redis-subscriptions';

  const pubSub = new RedisPubSub({ connection: { host: 'redis' } });

  @Resolver(() => Comment)
  export class CommentResolver {
    @Mutation(() => Comment)
    async addComment(@Args('postId') postId: string, @Args('text') text: string) {
      const comment = { id: 'c1', text, postId };
      await pubSub.publish(`COMMENT_ADDED_${postId}`, { commentAdded: comment });
      return comment;
    }

    @Subscription(() => Comment, {
      filter: (payload, variables) => payload.commentAdded.postId === variables.postId,
    })
    commentAdded(@Args('postId') postId: string) {
      return pubSub.asyncIterator(`COMMENT_ADDED_${postId}`);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar el `PubSub` en memoria básico de Apollo en clústeres multi-pod (los usuarios conectados a otros pods no recibirán los eventos).
  - 🟢 *Green Flag*: Utiliza `graphql-redis-subscriptions` con filtros de subscripción eficientes.

---

### 84. ¿Cómo aplicar Guards, Interceptors y Pipes en resolvers de GraphQL abstrayendo el `GqlExecutionContext`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Los Guards e Interceptors normales de Express esperan un contexto HTTP (`req` y `res`). En GraphQL, la estructura del contexto es diferente (`root`, `args`, `context`, `info`).
  Para hacer un Guard compatible con GraphQL:
  ```typescript
  import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
  import { GqlExecutionContext } from '@nestjs/graphql';

  @Injectable()
  export class GqlAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      // Transformar el ExecutionContext genérico en GqlExecutionContext
      const gqlContext = GqlExecutionContext.create(context);
      const req = gqlContext.getContext().req;

      const token = req.headers['authorization'];
      return this.validateToken(token);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar acceder a `context.switchToHttp().getRequest()` dentro de un resolver de GraphQL (retorna `undefined`).
  - 🟢 *Green Flag*: Utiliza `GqlExecutionContext.create(context)` para extraer el objeto `req` inyectado en el contexto de GraphQL.

---

### 85. ¿Cómo implementar paginación basada en cursores conforme a la especificación Relay en GraphQL con NestJS?
- **Nivel**: Senior
- **Respuesta Técnica**:
  La paginación basada en offsets (`LIMIT/OFFSET`) degrada el rendimiento en bases de datos relacionales al paginar páginas profundas (ej. offset 1,000,000) y sufre del problema de registros omitidos o duplicados si se insertan nuevos datos mientras el usuario navega.
  La **Paginación por Cursores (Relay Connection Specification)**:
  - Estructura: `edges { cursor, node }` y `pageInfo { hasNextPage, endCursor }`.
  - La query de base de datos utiliza una cláusula `WHERE id > cursor LIMIT 20` utilizando un índice B-Tree en tiempo $O(1)$:
  ```typescript
  @Query(() => UserConnection)
  async getUsers(
    @Args('first', { type: () => Int, defaultValue: 10 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<UserConnection> {
    const cursor = after ? decodeCursor(after) : null;
    const users = await this.userRepo.findAfterCursor(cursor, first + 1);

    const hasNextPage = users.length > first;
    const nodes = users.slice(0, first);

    return {
      edges: nodes.map((user) => ({ node: user, cursor: encodeCursor(user.id) })),
      pageInfo: {
        hasNextPage,
        endCursor: nodes.length > 0 ? encodeCursor(nodes[nodes.length - 1].id) : null,
      },
    };
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Proponer `OFFSET` para paginar feeds de millones de registros en producción.
  - 🟢 *Green Flag*: Implementa paginación por cursores inmutables con encoding Base64 de claves ordenadas.

---

### 86. ¿Cómo mitigar ataques DoS por consultas GraphQL anidadas profundas (*Query Complexity / Depth Limiting*)?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Dado que el cliente define la forma de la consulta en GraphQL, un atacante puede enviar una consulta recursiva maliciosa:
  ```graphql
  query MaliciousQuery {
    user {
      posts {
        author {
          posts {
            author { ... 50 niveles de anidamiento ... }
          }
        }
      }
    }
  }
  ```
  Esto genera millones de consultas SQL anidadas que saturan el CPU y la memoria del servidor.
  *Defensa Defensiva en NestJS*:
  ```typescript
  import depthLimit from 'graphql-depth-limit';
  import { createComplexityPlugin } from './complexity.plugin';

  GraphQLModule.forRoot<ApolloDriverConfig>({
    driver: ApolloDriver,
    autoSchemaFile: true,
    validationRules: [depthLimit(5)], // Máximo 5 niveles de profundidad permitidos
  });
  ```
  Además se configura un plugin de complejidad que asigna puntos a cada campo (`Query Complexity`), rechazando peticiones que superen un presupuesto máximo (ej. 1000 puntos).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar la API GraphQL expuesta a internet sin límites de profundidad de consulta ni análisis de complejidad.
  - 🟢 *Green Flag*: Combina `depthLimit` con cálculo de complejidad de esquemas en CI/CD.

---

### 87. ¿Cómo estructurar una arquitectura de GraphQL Federation con Apollo Federation v2 y subgrafos en NestJS?
- **Nivel**: Staff Engineer / Distributed Systems
- **Respuesta Técnica**:
  En lugar de un monolito de GraphQL gigante, **Apollo Federation v2** permite dividir el grafo en múltiples **Subgrafos independientes** mantenidos por diferentes equipos (ej. Subgrafo de Usuarios, Subgrafo de Productos, Subgrafo de Pagos):
  1. Cada microservicio de NestJS utiliza el driver federado:
     ```typescript
     GraphQLModule.forRoot<ApolloFederationDriverConfig>({
       driver: ApolloFederationDriver,
       autoSchemaFile: { federation: 2 },
     });
     ```
  2. Extensión de entidades federadas mediante la directiva `@key`:
     ```typescript
     @ObjectType()
     @Directive('@key(fields: "id")')
     export class User {
       @Field(() => ID)
       id: string;

       @Field()
       username: string;
     }
     ```
  3. Un **Apollo Router (Escrito en Rust)** se coloca delante como Gateway unificado, resolviendo consultas federadas y orquestando llamadas a los subgrafos en paralelo sin acoplamiento.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar resolver federación mediante Schema Stitching obsoleto que requería reiniciar el gateway ante cada cambio.
  - 🟢 *Green Flag*: Explica cómo Apollo Federation v2 resuelve entidades a través de directivas de clave primaria compartida sin acoplar código fuente.

---

### 88. ¿Cómo implementar directivas personalizadas de GraphQL (ej. `@auth`, `@cacheControl`) en NestJS Code-First?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Para aplicar directivas que alteren el comportamiento del esquema o de la resolución en NestJS Code-First:
  ```typescript
  // 1. Aplicar la directiva en la clase de objeto
  @ObjectType()
  @Directive('@cacheControl(maxAge: 3600)')
  export class PublicProduct {
    @Field()
    name: string;

    @Field()
    @Directive('@auth(role: "ADMIN")')
    internalCostPrice: number;
  }

  // 2. Registrar la directiva en el módulo
  GraphQLModule.forRoot<ApolloDriverConfig>({
    driver: ApolloDriver,
    autoSchemaFile: true,
    transformSchema: (schema) => applyAuthDirectiveTransformer(schema),
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que las directivas de GraphQL se ejecutan automáticamente sin un schema transformer en el bootstrap.
  - 🟢 *Green Flag*: Utiliza `transformSchema` de `@graphql-tools/utils` para interceptar resolvers de campos decorados con directivas.

---

### 89. ¿Cómo cachear respuestas de consultas GraphQL en Redis a nivel de campo (*Field-level Caching*)?
- **Nivel**: Senior / Performance
- **Respuesta Técnica**:
  A diferencia de REST, donde la URL completa puede cachearse en una CDN, en GraphQL cada petición POST contiene consultas diferentes con selecciones arbitrarias de campos.
  *Estrategia de Caché a Nivel de Campo*:
  - Campos costosos de computar (ej. recomendaciones de productos o métricas financieras) se envuelven con un interceptor o decorador de caché:
  ```typescript
  @ResolveField(() => [ProductRecommendation])
  async getRecommendations(@Parent() user: User) {
    const cacheKey = `recs:${user.id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const recs = await this.mlService.computeRecommendations(user.id);
    await this.redis.setEx(cacheKey, 1800, JSON.stringify(recs));
    return recs;
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar cachear peticiones POST completas de GraphQL en CDNs ignorando que los payloads contienen combinaciones dinámicas de campos.
  - 🟢 *Green Flag*: Aplica caché granular sobre resolvers pesados invalidando selectivamente por clave de usuario o entidad.

---

### 90. ¿Cómo generar documentación OpenAPI/Swagger automática con `@nestjs/swagger` y CLI plugins sin sobrecargar los DTOs?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Anotar manualmente cada propiedad de cada DTO con `@ApiProperty({ type: String, required: true })` ensucia las clases y es propenso a errores humanos.
  NestJS incluye un **Swagger CLI Plugin** oficial que analiza el AST de TypeScript durante la compilación e infiere automáticamente los tipos, la opcionalidad (`?`) y los enums:
  ```json
  // nest-cli.json
  {
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
      "plugins": [
        {
          "name": "@nestjs/swagger",
          "options": {
            "classValidatorShim": true,
            "introspectComments": true
          }
        }
      ]
    }
  }
  ```
  Al compilar con este plugin, las clases TypeScript puras con validaciones `class-validator` y comentarios JSDoc generan automáticamente la especificación OpenAPI 3.0 completa sin un solo decorador manual de Swagger.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Llenar miles de DTOs con decoradores manuales redundantes de `@ApiProperty()`.
  - 🟢 *Green Flag*: Configura el CLI plugin de Swagger en `nest-cli.json` con `classValidatorShim` para autogeneración limpia.

---

## 10. Seguridad Avanzada, Observabilidad OpenTelemetry y Despliegue

### 91. ¿Cómo implementar autenticación multifactor (MFA/2FA) con TOTP en NestJS?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  El estándar **TOTP (Time-based One-Time Password - RFC 6238)** genera códigos de 6 dígitos temporales calculados a partir de un secreto compartido y la hora actual (en ventanas de 30 segundos) usando HMAC-SHA1:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import * as speakeasy from 'speakeasy';
  import * as qrcode from 'qrcode';

  @Injectable()
  export class MfaService {
    generateSecret(userEmail: string) {
      const secret = speakeasy.generateSecret({
        name: `MiEmpresa (${userEmail})`,
        length: 20,
      });
      return {
        base32: secret.base32,
        otpauthUrl: secret.otpauth_url,
      };
    }

    async generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
      return qrcode.toDataURL(otpauthUrl);
    }

    verifyToken(secretBase32: string, userToken: string): boolean {
      return speakeasy.totp.verify({
        secret: secretBase32,
        encoding: 'base32',
        token: userToken,
        window: 1, // Tolera 1 paso de desfase temporal (±30s)
      });
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Almacenar el secreto MFA en texto plano sin cifrar en la base de datos de usuarios.
  - 🟢 *Green Flag*: Configura una ventana de tolerancia de reloj (`window: 1`) para mitigar desincronizaciones de tiempo entre el servidor y el smartphone del usuario.

---

### 92. ¿Cómo implementar autorización granular basada en políticas (*Policy-Based Authorization*) con CASL en NestJS?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El control de acceso por roles simple (`RBAC: @Roles('ADMIN')`) es insuficiente cuando la autorización depende de relaciones de propiedad del recurso (ej. *"Un editor puede editar un artículo solo si él es el autor y el artículo está en estado BORRADOR"* - **ABAC**).
  Se utiliza **CASL** integrado en NestJS:
  ```typescript
  import { AbilityBuilder, createMongoAbility } from '@casl/ability';

  export enum Action {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
  }

  export function defineAbilityFor(user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.role === 'ADMIN') {
      can(Action.Manage, 'all'); // Administrador tiene control total
    } else {
      can(Action.Read, 'Article');
      can(Action.Update, 'Article', { authorId: user.id, isPublished: false }); // Regla contextual fina
    }

    return build();
  }
  ```
  Un Guard `PoliciesGuard` evalúa la habilidad antes de ejecutar el controlador.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Escribir lógica compleja de permisos anidada con `if/else` dentro de los servicios de aplicación.
  - 🟢 *Green Flag*: Centraliza las reglas de autorización en matrices de capacidades (*Abilities*) testeables unitariamente con CASL.

---

### 93. ¿Cómo configurar el adaptador `FastifyAdapter` en NestJS y resolver incompatibilidades con middlewares de Express?
- **Nivel**: Senior / Performance
- **Respuesta Técnica**:
  Para reemplazar el motor HTTP de Express por Fastify logrando hasta el doble de peticiones por segundo:
  1. Instalar `@nestjs/platform-fastify`.
  2. Configurar en `main.ts`:
     ```typescript
     import { NestFactory } from '@nestjs/core';
     import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

     const app = await NestFactory.create<NestFastifyApplication>(
       AppModule,
       new FastifyAdapter({ logger: true })
     );
     await app.listen(3000, '0.0.0.0');
     ```
  - **Mitigación de Incompatibilidades**:
    - Middlewares de Express que dependen de `(req, res, next)` con mutaciones propietarias no funcionan.
    - Se deben usar plugins nativos de Fastify mediante `app.register()`:
      - Reemplazar `multer` por `@fastify/multipart`.
      - Reemplazar `helmet` por `@fastify/helmet`.
      - En Docker, escuchar obligatoriamente en `'0.0.0.0'` (Fastify por defecto solo escucha en localhost `127.0.0.1`).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Olvidar especificar `'0.0.0.0'` en Fastify y no entender por qué el contenedor Docker no es accesible externamente.
  - 🟢 *Green Flag*: Identifica las dependencias acopladas a Express antes de migrar a Fastify y utiliza los plugins equivalentes de Fastify.

---

### 94. ¿Cómo instrumentar una aplicación NestJS completa con OpenTelemetry (Tracing y Métricas) usando Interceptors globales?
- **Nivel**: Senior / SRE
- **Respuesta Técnica**:
  OpenTelemetry permite tracing distribuido de extremo a extremo a través de múltiples microservicios.
  En NestJS, la inicialización del SDK de OpenTelemetry **debe ocurrir antes de importar cualquier módulo del framework** (en un archivo `tracer.ts` precargado con `node --require`) para que los monkey-patches de red se apliquen correctamente:
  ```typescript
  // tracer.ts
  import { NodeSDK } from '@opentelemetry/sdk-node';
  import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
  import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4318/v1/traces' }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  ```
  En la aplicación, un Interceptor global enriquece los Spans con atributos de negocio (usuario, tenant, endpoint).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Iniciar OpenTelemetry dentro del `main.ts` después de que los módulos HTTP y de base de datos ya fueron importados (pierde la instrumentación automática).
  - 🟢 *Green Flag*: Pre-carga el tracer con `node --require ./dist/tracer.js` garantizando telemetría 100% fiel desde el arranque.

---

### 95. ¿Cómo implementar logging estructurado en JSON con correlation ID y contexto usando Winston o Pino en NestJS?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El logger por defecto de NestJS emite texto plano con colores formateado para humanos en consola, lo cual es ineficiente para indexadores de logs como Datadog, Grafana Loki o ELK.
  Se utiliza **Pino** (`nestjs-pino`) por su serialización ultra-rápida en C++:
  ```typescript
  import { LoggerModule } from 'nestjs-pino';

  @Module({
    imports: [
      LoggerModule.forRoot({
        pinoHttp: {
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
          redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'], // Filtrar secretos
          transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        },
      }),
    ],
  })
  export class AppModule {}
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Imprimir logs con `console.log()` plano o registrar passwords y tarjetas de crédito en texto sin redactar en los logs.
  - 🟢 *Green Flag*: Configura redacción de campos sensibles y logs estructurados en JSON de alta velocidad con Pino.

---

### 96. ¿Cómo estructurar pruebas E2E en NestJS usando Testcontainers (Postgres, Redis, Kafka) sin levantar servicios externos en CI?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En lugar de configurar un Docker Compose frágil en CI que deja datos sucios entre ejecuciones:
  ```typescript
  import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
  import { Test } from '@nestjs/testing';
  import request from 'supertest';

  describe('Orders E2E with Real Postgres', () => {
    let container: StartedPostgreSqlContainer;
    let app: INestApplication;

    beforeAll(async () => {
      container = await new PostgreSqlContainer('postgres:16-alpine').start();

      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider('DATABASE_URL')
        .useValue(container.getConnectionUri())
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    }, 60_000);

    afterAll(async () => {
      await app.close();
      await container.stop();
    });

    it('POST /orders debe persistir en base de datos real', async () => {
      const res = await request(app.getHttpServer()).post('/orders').send({ amount: 100 });
      expect(res.status).toBe(201);
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar mocks en pruebas E2E o depender de bases de datos compartidas que provocan tests flakies en paralelo.
  - 🟢 *Green Flag*: Utiliza Testcontainers para entornos efímeros idénticos a producción y valida migraciones reales.

---

### 97. ¿Cómo implementar auditoría de cambios de datos (*Audit Log*) capturando el estado anterior y nuevo de entidades con Interceptors?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Para cumplir con normativas (SOC2, GDPR), cada mutación debe registrar quién realizó el cambio, qué valores cambiaron y la estampa temporal:
  ```typescript
  @Injectable()
  export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const req = context.switchToHttp().getRequest();
      const user = req.user;
      const { method, url, body } = req;

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return next.handle().pipe(
          tap(async (responseBody) => {
            await this.auditService.record({
              userId: user?.id || 'ANONYMOUS',
              action: `${method} ${url}`,
              inputPayload: body,
              outputResponse: responseBody,
              timestamp: new Date(),
            });
          })
        );
      }
      return next.handle();
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Insertar registros de auditoría manualmente dentro de cada método de servicio duplicando lógica en cientos de archivos.
  - 🟢 *Green Flag*: Utiliza Interceptors con el operador `tap` de RxJS para capturar la respuesta exitosa sin interferir con la petición del cliente.

---

### 98. ¿Cómo optimizar el tiempo de compilación y arranque de NestJS en desarrollo usando SWC (`nest start -b swc`)?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  El compilador estándar `tsc` (TypeScript Compiler) está escrito en JavaScript y analiza todo el grafo de tipos en cada reinicio, haciendo que proyectos medianos de NestJS tarden entre 5 y 15 segundos en arrancar.
  **SWC (Speedy Web Compiler)** está escrito en Rust y es hasta **10x más rápido**:
  ```bash
  # Instalación
  npm i -D @swc/cli @swc/core

  # Arranque con flag builder swc y modo watch
  nest start -b swc -w
  ```
  Transpila los archivos a JavaScript casi instantáneamente (< 200ms).
  *Importante*: Como SWC omite el Type Checking estricto, se debe mantener un script `npm run typecheck` (`tsc --noEmit`) en el pipeline de CI/CD.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Tolerar tiempos de reinicio de 15 segundos en desarrollo local sin explorar herramientas de compilación nativas modernas.
  - 🟢 *Green Flag*: Integra SWC para desarrollo ágil y desacopla la validación de tipos estáticos en un paso paralelo.

---

### 99. ¿Cómo construir imágenes Docker multi-etapa mínimas para producción de NestJS sin incluir TypeScript ni dependencias dev?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  Una imagen Docker que incluya `node_modules` completos de desarrollo con el compilador de TypeScript puede superar 1.5GB de tamaño.
  Un **Multi-stage Dockerfile** optimizado emite imágenes de menos de 150MB:
  ```dockerfile
  # Etapa 1: Build y compilación
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  RUN npm prune --production

  # Etapa 2: Runtime limpio de producción
  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  USER node
  COPY --chown=node:node --from=builder /app/node_modules ./node_modules
  COPY --chown=node:node --from=builder /app/dist ./dist
  COPY --chown=node:node --from=builder /app/package.json ./

  EXPOSE 3000
  CMD ["node", "dist/main.js"]
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desplegar la imagen de desarrollo con `npm run start:dev` dentro de un contenedor en producción.
  - 🟢 *Green Flag*: Aplica imágenes alpine multi-etapa, ejecuta con usuario no-root (`USER node`) y purga dependencias de desarrollo con `npm prune`.

---

### 100. ¿Cómo implementar despliegues Zero-Downtime y Graceful Shutdown en Kubernetes coordinando `app.enableShutdownHooks()`?
- **Nivel**: Staff Engineer / Systems Architect
- **Respuesta Técnica**:
  En Kubernetes, cuando un pod se va a destruir (por despliegue de nueva versión o escalado hacia abajo):
  1. Kubernetes envía la señal `SIGTERM` al contenedor.
  2. Al mismo tiempo, el Endpoints Controller de Kubernetes remueve la IP del pod de los servicios y balanceadores de carga (Ingress).
  **El Problema**: La propagación del retiro de la IP tarda unos segundos en completarse en todos los nodos de red. Si el proceso de NestJS se apaga de inmediato al recibir `SIGTERM`, las peticiones de usuarios que aún estén en tránsito recibirán errores `502 Bad Gateway`.
  *La Solución SRE Coordinada*:
  ```typescript
  // main.ts
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Pausa de cortesía en Kubernetes (PreStop Hook en pod spec o delay):
  // Permite que los balanceadores de red dejen de enrutar tráfico antes de cerrar sockets
  ```
  En el `deployment.yaml` de Kubernetes:
  ```yaml
  lifecycle:
    preStop:
      exec:
        command: ["/bin/sleep", "10"] # Espera 10s antes de enviar SIGTERM
  ```
  Cuando llega `SIGTERM`, NestJS deja de aceptar nuevas conexiones, permite que las peticiones en vuelo terminen limpiamente y cierra los pools de base de datos en `onApplicationShutdown()`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No comprender la ventana de propagación de red en Kubernetes y culpar a los microservicios por errores 502 durante despliegues continuos.
  - 🟢 *Green Flag*: Coordina el lifecycle `preStop` de Kubernetes con `enableShutdownHooks()` para garantizar despliegues Zero Downtime absolutos.
