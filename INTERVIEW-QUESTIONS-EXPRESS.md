# 🚂 Express.js Architecture & Production Mastery: Las 100 Preguntas Más Comunes en Entrevistas Técnicas

Guía de referencia técnica profunda para preparación de entrevistas en roles de **Senior Node.js Engineer, Backend Tech Lead y Staff Software Engineer**.

---

## 📑 Tabla de Contenidos

1. [Arquitectura Interna, Ciclo de Petición y Enrutamiento (Preguntas 1-12)](#1-arquitectura-interna-ciclo-de-petición-y-enrutamiento)
2. [El Pipeline de Middlewares y Manejo de Errores (Preguntas 13-24)](#2-el-pipeline-de-middlewares-y-manejo-de-errores)
3. [Diferencias Críticas: Express 4 vs Express 5 (Preguntas 25-30)](#3-diferencias-críticas-express-4-vs-express-5)
4. [Seguridad Defensiva y Protección de Producción (Preguntas 31-40)](#4-seguridad-defensiva-y-protección-de-producción)
5. [Rendimiento, Streams, Subida de Archivos y Testing (Preguntas 41-50)](#5-rendimiento-streams-subida-de-archivos-y-testing)
6. [Enrutamiento Avanzado, Subdominios y Negociación de Contenido (Preguntas 51-60)](#6-enrutamiento-avanzado-subdominios-y-negociación-de-contenido)
7. [Middleware Pipeline Internals, Contexto y Flujo Asíncrono (Preguntas 61-70)](#7-middleware-pipeline-internals-contexto-y-flujo-asíncrono)
8. [Seguridad Defensiva, Autenticación y Mitigación de Vulnerabilidades (Preguntas 71-80)](#8-seguridad-defensiva-autenticación-y-mitigación-de-vulnerabilidades)
9. [Resiliencia, Idempotencia, Caché y Rendimiento (Preguntas 81-90)](#9-resiliencia-idempotencia-caché-y-rendimiento)
10. [Arquitectura Hexagonal, Testing Avanzado y TypeScript en Express (Preguntas 91-100)](#10-arquitectura-hexagonal-testing-avanzado-y-typescript-en-express)

---

## 1. Arquitectura Interna, Ciclo de Petición y Enrutamiento

### 1. ¿Cómo funciona internamente el objeto `app` en Express y cuál es su relación con el módulo nativo `http` de Node.js?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Una aplicación de Express (`const app = express()`) es en realidad una **función de JavaScript ordinaria** que internamente delega en `app.handle(req, res, callback)`:
  - Cuando ejecutas `app.listen(3000)`, Express simplemente ejecuta por debajo:
    ```javascript
    const server = http.createServer(app);
    return server.listen(3000);
    ```
  - Express extiende los prototipos nativos de Node.js `http.IncomingMessage` y `http.ServerResponse` agregando métodos convenientes (como `req.ip`, `req.params`, `res.status()`, `res.json()`, `res.send()`), pero sin romper la compatibilidad con las APIs nativas de streams y sockets de Node.js.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que Express reemplaza por completo el módulo `http` de Node.js con un servidor en C++.
  - 🟢 **Green Flag**: Saber que puedes pasar la instancia `app` directamente a `https.createServer({ cert, key }, app)` o a servidores de WebSockets (`new WebSocketServer({ server })`).

---

### 2. ¿Cómo funciona la estructura de datos interna del enrutador (`router.stack`) en Express?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El enrutador de Express mantiene una matriz interna llamada `stack` que almacena objetos de tipo **`Layer`**:
  - Cada vez que invocas `app.use()` o `router.get('/path', handler)`, Express instancia un nuevo `Layer`.
  - Un `Layer` contiene:
    1. El `path` original.
    2. Una expresión regular compilada generada por la librería `path-to-regexp` (`layer.regexp`).
    3. La propiedad `keys` con los nombres de los parámetros capturados.
    4. La función controladora (`layer.handle`).
  - Cuando entra una petición HTTP, Express itera secuencialmente a través de `router.stack`, evaluando `layer.match(req.path)`. Si la expresión regular coincide, ejecuta el handler; si no, avanza al siguiente `Layer`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Desconocer que cada ruta registrada añade un elemento evaluado por expresiones regulares en una matriz lineal.
  - 🟢 **Green Flag**: Advertir sobre el impacto en CPU de registrar miles de rutas dinámicas en un solo router plano sin agrupar por prefijos modulares.

---

### 3. ¿Qué hace exactamente la opción `{ mergeParams: true }` al instanciar `express.Router()`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Por defecto, los parámetros de ruta (`req.params`) están estrictamente aislados dentro de su propio router local.
  - Si tienes routers anidados:
    ```javascript
    // app.js
    app.use('/users/:userId/orders', orderRouter);

    // orderRouter.js
    const orderRouter = express.Router({ mergeParams: true });
    orderRouter.get('/:orderId', (req, res) => {
      // Con mergeParams: true, req.params contiene tanto userId como orderId:
      console.log(req.params.userId, req.params.orderId);
    });
    ```
  - **Sin `mergeParams: true`**: `req.params.userId` será `undefined` dentro de `orderRouter` porque el router secundario no tiene acceso a los parámetros capturados por el router padre.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar pasar el `userId` inyectándolo en una variable global o en `req.headers` por no conocer `mergeParams`.
  - 🟢 **Green Flag**: Utilizar `mergeParams: true` para diseñar APIs RESTful anidadas y jerárquicas limpias.

---

### 4. ¿Qué diferencia formal hay entre `app.use('/api', ...)` y `app.all('/api', ...)`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **`app.use('/api', ...)`**:
    - Registra un **Middleware de prefijo**.
    - Coincide con **cualquier ruta que COMIENCE con ese prefijo**: `/api`, `/api/users`, `/api/v1/orders/123`.
    - Responde a **todos los métodos HTTP** (`GET`, `POST`, `PUT`, `DELETE`, etc.).
    - Elimina el prefijo coincidente en `req.url` dentro del sub-router montado.
  - **`app.all('/api', ...)`**:
    - Registra un **Controlador de Ruta Exacto**.
    - **Solo coincide exactamente con `/api`** (no coincide con `/api/users`).
    - Responde a todos los métodos HTTP, pero solo para esa ruta idéntica.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `app.all('/users', router)` esperando que capture las sub-rutas `/users/:id`.
  - 🟢 **Green Flag**: Explicar la mutación de `req.baseUrl` y `req.url` que realiza `app.use()` durante el montaje de sub-routers.

---

### 5. ¿Qué es `next('route')` y en qué escenario específico se utiliza?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `next('route')` es una directiva especial de Express que solo funciona dentro de funciones de ruta registradas con `app.METHOD()` o `router.METHOD()`:
  - Ordena a Express que **se salte todos los handlers de middleware restantes de la ruta actual** y transfiera el control de la petición a la **siguiente ruta coincidente** en la pila:
    ```javascript
    app.get('/user/:id', (req, res, next) => {
      // Si el ID es 0, saltar este handler y delegar al siguiente handler de /user/:id:
      if (req.params.id === '0') return next('route');
      res.send('Usuario regular');
    });

    app.get('/user/:id', (req, res) => {
      res.send('Usuario especial con ID cero');
    });
    ```
  - Si se pasa cualquier otro string distinto de `'route'` a `next('error')`, Express lo trata como un error fatal y salta directamente a la pila de manejadores de errores.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que `next('route')` funciona dentro de middlewares montados con `app.use()`.
  - 🟢 **Green Flag**: Utilizar `next('route')` para bifurcar lógica condicional entre diferentes controladores sin anidar bloques `if/else` gigantescos.

---

### 6. ¿Cómo funciona `next('router')` introducido en Express para salir de un sub-router completo?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Similar a `next('route')`, pero opera a nivel de instancia de `express.Router()`:
  - Cuando se invoca `next('router')` dentro de un middleware o ruta de un router secundario, Express **aborta inmediatamente el procesamiento de ese router completo**.
  - La petición abandona el router secundario y regresa a la pila del router padre para continuar evaluando las siguientes rutas declaradas en la aplicación principal.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Desconocer la existencia de `next('router')` y recurrir a excepciones controladas para salir de un router.
  - 🟢 **Green Flag**: Combinar `next('router')` con validaciones de autenticación donde ciertas peticiones deben ser derivadas a routers alternativos.

---

### 7. ¿Cuál es la diferencia entre `res.send()`, `res.json()`, `res.end()` y `res.write()`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **`res.write(chunk)`**: Método nativo de Node.js Streams. Escribe un fragmento (*chunk*) en el cuerpo de la respuesta HTTP sin cerrar la conexión (ideal para streaming o Server-Sent Events).
  - **`res.end([data])`**: Método nativo de Node.js. Cierra la conexión HTTP y finaliza la respuesta inmediatamente sin agregar cabeceras automáticas.
  - **`res.send([body])`**: Método de Express. Inspecciona el tipo de dato:
    - Si es un `Buffer`, establece `Content-Type: application/octet-stream`.
    - Si es un `String`, establece `Content-Type: text/html` y calcula la cabecera `Content-Length` y el `ETag`.
    - Si es un `Object` o `Array`, delega internamente a `res.json()`.
  - **`res.json([body])`**: Método de Express. Convierte el objeto a JSON mediante `JSON.stringify()`, aplica opciones de formato (`json spaces`), y fuerza explícitamente la cabecera `Content-Type: application/json; charset=utf-8`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Enviar un objeto JavaScript con `res.send({ a: 1 })` creyendo que hace algo diferente a `res.json()`.
  - 🟢 **Green Flag**: Destacar que `res.send()` genera automáticamente cabeceras de validación de caché `ETag` para respuestas estables.

---

### 8. ¿Qué problema ocurre si ejecutas código después de llamar a `res.json()` o `res.send()` y cómo se previene el error `ERR_HTTP_HEADERS_SENT`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  El error `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client` ocurre cuando el código intenta modificar cabeceras, enviar un código de estado o emitir un nuevo body hacia una respuesta HTTP que **ya fue cerrada y enviada previamente**:
  ```javascript
  // ANTIPATRÓN COMÚN:
  app.post('/pay', (req, res) => {
    if (!req.body.token) {
      res.status(400).json({ error: 'Token requerido' });
      // ¡Falta el return! La ejecución continúa hacia abajo...
    }
    // Intenta responder por segunda vez sobre el mismo socket cerrado:
    res.json({ success: true }); // ¡Explota con ERR_HTTP_HEADERS_SENT!
  });
  ```
  - **Regla de Oro**: Invocar `res.json()` **NO detiene la ejecución de la función de JavaScript**; simplemente encola la escritura en el socket.
  - **Solución**: Usar siempre **`return res.json(...)`** para forzar la salida inmediata de la función.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que `res.json()` actúa como un `return` automático en la función.
  - 🟢 **Green Flag**: Utilizar `res.headersSent` como comprobación booleana defensiva en middlewares complejos para saber si la respuesta ya inició su transmisión.

---

### 9. ¿Cómo se configuran y extraen parámetros dinámicos con Expresiones Regulares en rutas de Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Express permite restringir el formato de los parámetros en la propia definición de la ruta mediante regex:
  ```javascript
  // Solo coincide si :id son estrictamente dígitos numéricos:
  app.get('/users/:id(\\d+)', (req, res) => {
    res.send(`User ID: ${req.params.id}`);
  });

  // Solo coincide con códigos postales de 5 dígitos:
  app.get('/postal/:code(\\d{5})', (req, res) => {
    res.send(`Código postal: ${req.params.code}`);
  });
  ```
  Si un cliente consulta `/users/abc`, la ruta no coincide y Express pasa limpiamente al siguiente handler o emite un 404, evitando ejecutar consultas SQL innecesarias con IDs inválidos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Validar el formato de números a mano dentro de cada controlador con `isNaN()` en lugar de usar expresiones regulares en el router.
  - 🟢 **Green Flag**: Conocer la evolución de la librería subyacente `path-to-regexp` entre Express 4 y Express 5.

---

### 10. ¿Qué es `app.param()` y cómo optimiza la carga de entidades en Express (Param Pre-Conditioning)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `app.param(name, callback)` permite registrar un middleware que se activa **automáticamente cuando un parámetro de ruta específico aparece en la URL**:
  ```javascript
  app.param('userId', async (req, res, next, id) => {
    try {
      const user = await userRepository.findById(id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      req.user = user; // Inyecta la entidad cargada directamente en la petición
      next();
    } catch (err) {
      next(err);
    }
  });

  // Todas estas rutas se benefician automáticamente sin duplicar la consulta a la BD:
  app.get('/users/:userId', (req, res) => res.json(req.user));
  app.put('/users/:userId', (req, res) => res.json(req.user.update(req.body)));
  app.delete('/users/:userId', (req, res) => res.json(req.user.delete()));
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Copiar y pegar `const user = await find(req.params.id); if (!user) return 404;` en 10 controladores diferentes.
  - 🟢 **Green Flag**: Explicar que `app.param` solo se ejecuta una única vez por ciclo de petición incluso si el parámetro coincide en múltiples rutas anidadas.

---

### 11. ¿Cómo gestiona Express las cookies y qué diferencias hay entre una cookie ordinaria y una firmada (`signedCookies`)?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Utilizando el middleware `cookie-parser`:
  - **Cookie Ordinaria (`req.cookies`)**: Se almacena en texto claro en el navegador del usuario. El cliente puede modificar su valor fácilmente usando las herramientas de desarrollador (ej. cambiar `role=user` por `role=admin`).
  - **Signed Cookie (`req.signedCookies`)**:
    - Requiere un secreto criptográfico: `app.use(cookieParser('mi-secreto-seguro'))`.
    - Al emitir la cookie (`res.cookie('token', '123', { signed: true })`), Express genera una firma **HMAC-SHA256** del valor y la adjunta (`s:123.FIRMA_HASH`).
    - Al recibir la petición, Express recalcula el HMAC; si el usuario manipuló el valor, la firma no coincide y Express elimina la cookie retornando `undefined`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Asumir que una cookie firmada está "cifrada" (los datos siguen siendo legibles en texto plano; la firma solo garantiza la **integridad**, no la confidencialidad).
  - 🟢 **Green Flag**: Configurar obligatoriamente los flags de seguridad: `httpOnly: true` (inmune a robo por XSS), `secure: true` (solo viaja por HTTPS) y `sameSite: 'strict'` (previene CSRF).

---

### 12. ¿Cómo funciona la resolución de vistas y qué son los motores de plantillas (Template Engines) en Express?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Express desacopla el renderizado de HTML mediante la configuración de vistas:
  ```javascript
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs'); // o pug, hbs
  ```
  - Cuando se invoca `res.render('index', { user })`:
    1. Express localiza el archivo en el directorio configurado.
    2. Invoca la función compiladora del motor (`engine.__express(filePath, options, callback)`).
    3. El motor de plantillas sustituye las variables dinámicas y compila el HTML final.
    4. Express responde con `Content-Type: text/html` y emite el string.
  - **Optimización en Producción**: Si `NODE_ENV=production`, Express activa la caché de plantillas compiladas (`view cache`), evitando leer el disco y parsear el template en cada visita.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Dejar la caché de vistas desactivada en servidores de producción de alto tráfico.
  - 🟢 **Green Flag**: Explicar la interfaz estándar que cualquier motor de plantillas debe implementar para ser compatible con Express (`__express`).

---

## 2. El Pipeline de Middlewares y Manejo de Errores

### 13. ¿Por qué un Middleware de Manejo de Errores en Express DEBE declarar exactamente 4 argumentos formales `(err, req, res, next)`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  En JavaScript, cada función tiene una propiedad interna inmutable llamada **`fn.length`** que reporta el número de argumentos formales declarados en su firma.
  Express inspecciona `fn.length` para determinar cómo enrutar la ejecución:
  - Si `fn.length < 4`, Express clasifica la función como un **Middleware Ordinario** y solo la invoca durante el flujo normal sin errores.
  - Si `fn.length === 4`, Express clasifica la función como un **Error-Handling Middleware**:
    ```javascript
    app.use((err, req, res, next) => {
      // Solo se ejecuta si un middleware anterior llamó a next(err) o arrojó una excepción
      res.status(500).json({ error: err.message });
    });
    ```
  - Si eliminas el argumento `next` dejando `(err, req, res)`, `fn.length` será 3. Express lo tratará como un middleware normal: **el primer argumento `err` recibirá en realidad el objeto `req`**, y tu manejador de errores jamás atrapará ninguna excepción.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Quitar el argumento `next` para complacer una regla ingenua de ESLint sobre variables no usadas.
  - 🟢 **Green Flag**: Configurar la regla de ESLint `no-unused-vars` con el patrón `argsIgnorePattern: '^_'` (`_next`) para preservar los 4 argumentos sin advertencias.

---

### 14. ¿Cómo viaja un error a través de la cadena de middlewares en Express?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - Cuando un middleware o controlador invoca `next(new Error('Fallo'))` pasando cualquier valor no nulo:
  - Express **interrumpe inmediatamente la ejecución del pipeline regular**:
    - Se salta todos los middlewares normales restantes en el stack.
    - Se salta todas las funciones de ruta siguientes.
  - Avanza directamente por el stack de capas buscando el primer **Middleware de Error que tenga 4 argumentos** (`err, req, res, next`).
  - Si no existe ningún manejador de error personalizado, Express ejecuta su **Manejador de Errores por Defecto (Default Error Handler)**, el cual imprime el stack trace en la consola y responde con un código de estado `HTTP 500` con formato HTML.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Invocar `next()` vacío esperando que Express sepa que ocurrió un error en un bloque `catch`.
  - 🟢 **Green Flag**: Explicar que invocar `next(false)` o `next(0)` también es tratado como un error porque Express evalúa cualquier argumento veraz o definido.

---

### 15. ¿Cómo implementar un formateador de errores estándar basado en el RFC 7807 (Problem Details) en Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  ```javascript
  // middleware/problemDetails.js
  export function problemDetailsHandler(err, req, res, _next) {
    const status = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    const problem = {
      type: err.type || 'https://api.empresa.com/errors/internal-server-error',
      title: err.title || err.name || 'Internal Server Error',
      status: status,
      detail: isProduction && status === 500 ? 'Ha ocurrido un error inesperado en el servidor' : err.message,
      instance: req.originalUrl,
      traceId: req.headers['x-trace-id'] || req.id || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    res.status(status)
       .setHeader('Content-Type', 'application/problem+json')
       .json(problem);
  }
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Responder siempre con `{ error: err.message }` exponiendo detalles internos de la base de datos a clientes en producción.
  - 🟢 **Green Flag**: Utilizar la cabecera estándar `Content-Type: application/problem+json` y sanitizar los mensajes en modo producción para prevenir fuga de información (*Information Disclosure*).

---

### 16. ¿Por qué un error lanzado dentro de un callback asíncrono no capturado tumbaba todo el servidor en Express 4?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En Node.js, cuando se produce una excepción síncrona ordinaria, se puede atrapar con `try/catch`.
  Sin embargo, un callback asíncrono o una Promesa rechazada se ejecuta en un **tick posterior del Event Loop**, fuera del bloque `try/catch` que envolvió la petición original:
  ```javascript
  // Express 4: CATASTRÓFICO
  app.get('/data', (req, res) => {
    setTimeout(() => {
      throw new Error('Explosión asíncrona'); // ¡No hay try/catch en el stack de Libuv!
    }, 100);
  });
  ```
  - Como el Event Loop no encuentra ningún manejador en la pila de llamadas, emite el evento global **`uncaughtException`**.
  - Por defecto en Node.js, **el proceso se cierra de forma inmediata y abrupta (`process.exit(1)`)**, desconectando a todos los demás usuarios del servidor.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que colocar un `try/catch` alrededor de una función con callbacks tradicionales captura los errores de los callbacks.
  - 🟢 **Green Flag**: Detallar la pérdida de contexto léxico en la pila de llamadas asíncrona y la necesidad de pasar el error con `next(err)`.

---

### 17. ¿Cómo funciona la técnica "Async Wrapper" en Express 4 para evitar el boilerplate repetitivo de `try/catch`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Para no escribir `try { ... } catch (err) { next(err); }` en cada uno de los 50 endpoints de una API:
  - Se define una función de orden superior (*Higher-Order Function*):
    ```javascript
    const asyncHandler = (fn) => (req, res, next) => {
      // Envuelve el retorno en Promise.resolve() y captura cualquier rechazo enviándolo a next():
      Promise.resolve(fn(req, res, next)).catch(next);
    };

    // Uso limpio y elegante:
    app.get('/users', asyncHandler(async (req, res) => {
      const users = await db.getUsers(); // Si falla, va directo al error handler!
      res.json(users);
    }));
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escribir bloques `try/catch` idénticos de 6 líneas en todos los controladores de la empresa.
  - 🟢 **Green Flag**: Explicar cómo paquetes como `express-async-errors` parcheaban el prototipo de `Layer.prototype.handle_request` para automatizar esto globalmente.

---

### 18. ¿Cuál es el orden obligatorio de registro de middlewares en una aplicación de Express en producción?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  El orden es innegociable debido al modelo secuencial de Express:
  1. **Middlewares de Observabilidad y Seguridad Inicial**: Inyección de Correlation/Trace ID (`AsyncLocalStorage`), `helmet()`, `cors()`.
  2. **Middlewares de Rate Limiting**: Bloquea peticiones abusivas antes de procesar bytes.
  3. **Middlewares de Body Parsing**: `express.json({ limit: '100kb' })`, `express.urlencoded()`.
  4. **Middlewares de Compresión y Estáticos**: `compression()`, `express.static()`.
  5. **Middlewares de Autenticación y Sesión**: Validación de JWTs, passport.
  6. **Rutas de la Aplicación**: Montaje de los routers de dominio (`app.use('/api', apiRouter)`).
  7. **Middleware 404 (Not Found)**: Captura cualquier petición que no coincidió con ninguna ruta previa.
  8. **Middlewares de Manejo de Errores (4 argumentos)**: Al final absoluto de todo el archivo para capturar errores de cualquier capa previa.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Registrar el middleware de manejo de errores antes de las rutas (nunca capturará los errores de los controladores).
  - 🟢 **Green Flag**: Justificar ubicar el Rate Limiting y CORS antes del Body Parser para no gastar memoria parseando JSONs de atacantes o peticiones no autorizadas.

---

### 19. ¿Cómo se implementa un Middleware 404 limpio en Express sin capturar errores?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Si una petición llega al final de la pila sin haber coincidido con ninguna ruta ni haber respondido:
  ```javascript
  // Se ubica inmediatamente después de todas las rutas y ANTES del error handler:
  app.use((req, res, _next) => {
    res.status(404).json({
      type: 'https://api.empresa.com/errors/not-found',
      title: 'Resource Not Found',
      status: 404,
      detail: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor.`,
    });
  });
  ```
  No requiere llamar a `next()` porque aquí termina la navegación válida.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Dejar que Express emita su página HTML 404 fea por defecto en una API REST de producción.
  - 🟢 **Green Flag**: Utilizar `req.originalUrl` en lugar de `req.url` para reportar el path completo en caso de routers anidados.

---

### 20. ¿Qué son los middlewares de terceros configurables mediante "Factory Functions"?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Un Middleware Factory es una función que acepta opciones de configuración y **retorna una función middleware real de Express** configurada en su clausura léxica:
  ```javascript
  // Factory Function
  function requireRole(role) {
    return (req, res, next) => {
      if (!req.user || req.user.role !== role) {
        return res.status(403).json({ error: 'Permisos insuficientes' });
      }
      next();
    };
  }

  // Uso parametrizado:
  app.delete('/users/:id', requireRole('SUPER_ADMIN'), userController.delete);
  ```
  Es el patrón estándar utilizado por librerías como `cors({ origin: '...' })` y `rateLimit({ max: 100 })`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escribir 5 middlewares casi idénticos como `requireAdmin`, `requireEditor`, `requireManager` en lugar de una función factory reutilizable.
  - 🟢 **Green Flag**: Explicar el concepto de Clausura Léxica (Closure) que preserva las opciones de configuración en memoria.

---

### 21. ¿Cómo funciona la propagación de contexto con `AsyncLocalStorage` dentro de un middleware de Express?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Permite tener acceso al usuario autenticado o al Trace ID en cualquier capa profunda del backend sin pasarlo como argumento:
  ```javascript
  import { AsyncLocalStorage } from 'node:async_hooks';

  export const requestContext = new AsyncLocalStorage();

  app.use((req, res, next) => {
    const store = {
      traceId: req.headers['x-request-id'] || crypto.randomUUID(),
      userId: null,
      startTime: Date.now(),
    };

    // Envuelve el resto de la ejecución de Express en el contexto:
    requestContext.run(store, () => {
      next();
    });
  });
  ```
  Cualquier servicio de base de datos o logger puede llamar a `requestContext.getStore()?.traceId` sin que el controlador tenga que inyectarlo.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Guardar el usuario de la petición en una variable global estática del módulo (provocando colisiones entre peticiones concurrentes).
  - 🟢 **Green Flag**: Saber que en Node.js 16+ `AsyncLocalStorage` tiene un rendimiento altamente optimizado en V8 con mínimo impacto en latencia.

---

### 22. ¿Cómo gestionar la cancelación de peticiones cuando el cliente aborta la conexión TCP (`req.on('close')`)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Si un usuario lanza una búsqueda compleja que tarda 10 segundos en la base de datos y a los 2 segundos cierra la pestaña del navegador:
  - Por defecto, **Node.js seguirá ejecutando la consulta pesada y procesando los datos hasta el final**, desperdiciando CPU y memoria para una respuesta que nadie va a recibir.
  - **Cancelación Proactiva con AbortController**:
    ```javascript
    app.get('/heavy-search', async (req, res, next) => {
      const controller = new AbortController();

      // Si el cliente cierra el navegador o socket antes de terminar:
      req.on('close', () => {
        if (!res.writableEnded) {
          controller.abort(); // Cancela la consulta downstream inmediatamente
        }
      });

      try {
        const data = await db.query(sql, { signal: controller.signal });
        res.json(data);
      } catch (err) {
        if (err.name === 'AbortError') return; // Cancelado pacíficamente
        next(err);
      }
    });
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Dejar que procesos en segundo plano continúen consumiendo recursos de base de datos tras la desconexión del cliente.
  - 🟢 **Green Flag**: Integrar el evento `'close'` del socket con `AbortController` nativo y drivers modernos de bases de datos compatibles con `signal`.

---

### 23. ¿Cuál es el impacto de no manejar el evento `'error'` en un Writable Stream en Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Si estás haciendo streaming de un archivo hacia la respuesta con `stream.pipe(res)` y el cliente se desconecta a mitad de la descarga:
  - El socket se destruye.
  - El stream de lectura intenta escribir en el socket cerrado y emite un evento **`'error'`** (`ECONNRESET` o `EPIPE`).
  - En Node.js, si un objeto `EventEmitter` emite un evento `'error'` y **no tiene registrado ningún listener explícito (`.on('error')`)**, el runtime de Node.js arroja una excepción no controlada que **tumba inmediatamente todo el proceso del servidor**.
  - **Solución Obligatoria**: Usar siempre la utilidad nativa **`stream.pipeline()`** de `node:stream/promises`, que escucha los errores de todos los streams involucrados y cierra los descriptores de archivo automáticamente.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `readStream.pipe(res)` crudo en código de producción sin listeners de error.
  - 🟢 **Green Flag**: Reemplazar `pipe()` por `stream.pipeline()` garantizando limpieza de recursos y prevención de caídas de proceso.

---

### 24. ¿Cómo implementar un middleware de auditoría y métricas de latencia sin alterar la respuesta?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Escuchando el evento nativo del socket **`res.on('finish')`**:
  ```javascript
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    // Se activa cuando los últimos bytes han sido entregados al sistema operativo:
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      logger.info({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${durationMs.toFixed(2)}ms`,
      });
    });

    next();
  });
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Sobrescribir el método `res.send()` con Monkey Patching para medir el tiempo (frágil y propenso a bugs).
  - 🟢 **Green Flag**: Utilizar `process.hrtime.bigint()` para obtener precisión de nanosegundos inmune a fluctuaciones del reloj del sistema operativo (NTP drift).

---

## 3. Diferencias Críticas: Express 4 vs Express 5

### 25. ¿Cómo gestiona Express 5 las Promesas Asíncronas nativas frente a Express 4?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Es el cambio más trascendental en la historia del framework:
  - **Express 4**:
    - Si un middleware o función de ruta era `async` y lanzaba un `throw new Error()` o una promesa se rechazaba sin un `try/catch` manual, **Express 4 no se enteraba**.
    - La petición se quedaba colgada en el cliente hasta que expiraba el timeout del socket, y Node.js emitía un `UnhandledPromiseRejection`.
  - **Express 5**:
    - El enrutador y la clase `Layer` fueron reescritos para soportar Promesas nativamente.
    - Si un handler retorna una Promesa rechazada (`async (req, res) => { throw new Error(); }`), Express 5 la intercepta automáticamente y la envía al middleware de manejo de errores de 4 argumentos:
      ```javascript
      // En Express 5, esto funciona de forma 100% nativa y segura:
      app.get('/users', async (req, res) => {
        const users = await db.query(); // Cero try/catch necesarios!
        res.json(users);
      });
      ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que en Express 5 aún es necesario instalar librerías auxiliares como `express-async-errors`.
  - 🟢 **Green Flag**: Explicar la eliminación de librerías externas de patching asíncrono y la reducción de código boilerplate.

---

### 26. ¿Qué cambios ocurrieron en la sintaxis de enrutamiento y la librería `path-to-regexp` en Express 5?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Express 5 actualizó a `path-to-regexp` v6+:
  - **Eliminación de comodines sueltos**: El comodín simple `*` ya no está permitido directamente. En su lugar, debe usarse un comodín nombrado con sintaxis explícita: `/*splat` o `/{*splat}`.
  - **Parámetros Opcionales**: La sintaxis para parámetros opcionales cambió a `/:id?` o `/user{/:id}?`.
  - **Expresiones regulares estrictas**: Ya no se pueden incrustar expresiones regulares arbitrarias sin escapar dentro de los strings de ruta de forma descuidada.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar usar `app.get('*', ...)` en Express 5 y no entender por qué arroja un error de compilación de sintaxis.
  - 🟢 **Green Flag**: Conocer la sintaxis moderna `/*splat` para capturar rutas comodín en Express 5.

---

### 27. ¿Cuáles métodos y propiedades obsoletas fueron formalmente eliminados en Express 5?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Eliminación de métodos legados que arrastraban deuda técnica desde Express 3:
  1. **`res.send(status, body)`**: Eliminado. Antes se podía hacer `res.send(404, 'Not Found')`. Ahora es obligatorio encadenar: `res.status(404).send('Not Found')`.
  2. **`res.json(status, body)`**: Eliminado a favor de `res.status(status).json(body)`.
  3. **`res.sendfile()`**: Reemplazado formalmente por la versión en CamelCase **`res.sendFile()`**.
  4. **`app.param(fn)`**: La capacidad de alterar el comportamiento global de `app.param` pasando solo una función fue eliminada.
  5. **`app.del()`**: Eliminado formalmente a favor de `app.delete()`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Seguir escribiendo `res.send(200, data)` en tutoriales o pruebas técnicas.
  - 🟢 **Green Flag**: Detallar la estandarización hacia la API fluida encadenable (`res.status().json()`).

---

### 28. ¿Cómo cambió el comportamiento de `req.query` en Express 5?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - En Express 4, la propiedad `req.query` era un objeto mutable ordinario parseado por la librería `qs` (extendida) o `querystring` (simple).
  - En Express 5, se mejoró la seguridad y la consistencia de `req.query`:
    - Permite configurar parseadores de query personalizados más estrictos para prevenir ataques de **HTTP Parameter Pollution (HPP)**.
    - Se modificó la opción predeterminada para evitar la creación indiscriminada de arrays u objetos anidados profundos que pudieran saturar la memoria del servidor ante queries maliciosas como `?a[b][c][d][e]=1`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Confiar ciegamente en que `req.query.id` siempre es un string (un cliente puede enviar `?id=1&id=2` y convertirlo en un array).
  - 🟢 **Green Flag**: Utilizar validación de esquemas (Zod) sobre `req.query` para forzar que los parámetros sean estrictamente del tipo esperado.

---

### 29. ¿Qué mejoras de rendimiento introduce Express 5 en el rechazo de peticiones no coincidentes?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El algoritmo de coincidencia de capas (`Layer.match`) fue optimizado en C++ y JavaScript:
  - Cachea internamente las expresiones regulares de rutas comunes.
  - En Express 4, si una petición no coincidía, el stack continuaba ejecutando comprobaciones redundantes sobre middlewares de prefijo.
  - Express 5 optimiza el salto rápido (*Fast-Path Rejection*): si el prefijo del router no coincide con los primeros caracteres de la URL, descarta todo el sub-árbol en tiempo $O(1)$ sin evaluar las expresiones regulares individuales de sus rutas hijas.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Pensar que la única diferencia de Express 5 son las promesas async.
  - 🟢 **Green Flag**: Describir la optimización del árbol de decisiones del router en aplicaciones enterprise con cientos de endpoints.

---

### 30. ¿Cómo planificar una migración segura de Express 4 a Express 5 en una API enterprise en producción?
- **Nivel**: Staff / Tech Lead
- **Respuesta Técnica**:
  Estrategia de migración de 4 etapas:
  1. **Auditoría de Sintaxis Deprecada**: Ejecutar herramientas de análisis estático para detectar llamadas a `res.send(status, body)`, `res.sendfile()` y comodines `app.get('*')`.
  2. **Eliminación de Parches Asíncronos**: Desinstalar librerías como `express-async-errors` y probar que el manejo de promesas nativo de Express 5 capture los rechazos.
  3. **Verificación de Middlewares de Terceros**: Comprobar la compatibilidad de paquetes antiguos de npm que pudieran depender de métodos eliminados en `res` o `req`.
  4. **Pruebas de Regresión con Supertest**: Ejecutar la suite completa de pruebas de integración validando que los códigos de error HTTP y contratos JSON se preserven idénticos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Cambiar la versión en el `package.json` y desplegar directamente a producción sin auditar dependencias de terceros.
  - 🟢 **Green Flag**: Diseñar un despliegue Canary progresivo (5% $\to$ 100%) monitoreando la tasa de errores 5xx tras la migración.

---

## 4. Seguridad Defensiva y Protección de Producción

### 31. ¿Qué es el ataque de "HTTP Parameter Pollution" (HPP) y cómo defender Express contra él?
- **Nivel**: Mid-Level / Senior / Security
- **Respuesta Técnica**:
  Ocurre cuando un atacante envía múltiples parámetros con el mismo nombre en la query string de la URL:
  `GET /api/transfer?to=123&amount=100&to=666`
  - **Comportamiento en Express**:
    Por defecto, Express convierte los parámetros duplicados en un **Array**:
    `req.query.to` contendrá `['123', '666']`.
  - **La Vulnerabilidad**: Si el código backend esperaba un string y ejecuta:
    `db.transfer({ to: req.query.to })`, la base de datos o el servicio de pagos puede comportarse de forma impredecible, transferir dinero al segundo destinatario, o explotar con un error no controlado.
  - **Defensa**:
    1. Utilizar el middleware **`hpp`**: sanitiza `req.query` y `req.body`, forzando a que solo se preserve el último parámetro enviado (o el primero) e ignorando los duplicados.
    2. Validación estricta con esquemas Zod (`z.string()` rechaza arrays automáticamente).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Asumir que `req.query.campo` siempre es un string primitivo sin validar.
  - 🟢 **Green Flag**: Explicar cómo HPP puede utilizarse para saltarse validaciones de WAFs perimetrales si el WAF valida el primer parámetro y el backend procesa el segundo.

---

### 32. ¿Cómo blindar Express contra ataques de "Prototype Pollution" en payloads JSON?
- **Nivel**: Senior / Staff / Security
- **Respuesta Técnica**:
  Si una aplicación fusiona de forma recursiva objetos entrantes (ej. `Object.assign({}, req.body)` o funciones de deep merge caseras):
  - Un atacante envía: `{"__proto__": {"admin": true}}`.
  - Si la función de clonado no filtra las propiedades prohibidas, mutará el `Object.prototype` global en la memoria de V8. Todos los objetos del servidor heredarán `admin = true`.
  **Defensa de Producción**:
  1. Validar el body con librerías seguras de esquemas (Zod o Joi con `.strict()`).
  2. Congelar el prototipo base al arrancar el servidor en `server.js`:
     ```javascript
     Object.freeze(Object.prototype);
     ```
  3. Crear diccionarios puros libres de prototipo: `Object.create(null)`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que escribir el backend en TypeScript previene la contaminación de prototipos en tiempo de ejecución.
  - 🟢 **Green Flag**: Demostrar cómo `Object.freeze(Object.prototype)` bloquea el vector de ataque a nivel de motor de V8.

---

### 33. ¿Cuáles son las 15 cabeceras de seguridad que inyecta `helmet` y cómo configurar una Content Security Policy (CSP) estricta?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `helmet()` es una colección de middlewares que configura:
  - `Content-Security-Policy`: Restringe qué scripts, estilos y orígenes multimedia pueden ejecutarse.
  - `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy`.
  - `Origin-Agent-Cluster`: Aísla el origen en su propio proceso de navegación.
  - `Referrer-Policy`: Controla la información del referer en peticiones salientes.
  - `Strict-Transport-Security` (HSTS): Fuerza conexiones HTTPS persistentes.
  - `X-Content-Type-Options: nosniff`: Previene MIME-sniffing.
  - `X-DNS-Prefetch-Control`, `X-Download-Options`, `X-Frame-Options: SAMEORIGIN`, `X-Permitted-Cross-Domain-Policies`, `X-XSS-Protection: 0` (desactiva el filtro buggy antiguo del navegador).
  - **CSP Estricta con Nonce**:
    ```javascript
    app.use((req, res, next) => {
      res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
      next();
    });
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        },
      },
    }));
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar Helmet con la configuración por defecto en aplicaciones con Server-Side Rendering sin entender por qué se bloquean los estilos o scripts en línea.
  - 🟢 **Green Flag**: Explicar por qué `X-XSS-Protection` se configura en `0` (los filtros XSS antiguos de los navegadores introducían vulnerabilidades de seguridad adicionales).

---

### 34. ¿Por qué `cors()` mal configurado (`origin: '*'`) es peligroso y cómo implementar una lista blanca dinámica segura?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - `Access-Control-Allow-Origin: *` permite que cualquier sitio web malicioso en internet pueda enviar peticiones fetch a tu API desde el navegador de un usuario. Si la API utiliza autenticación basada en IP corporativa o no valida orígenes, expone datos internos. Además, **los navegadores prohíben enviar credenciales (cookies) cuando el origen es `*`**.
  - **Lista Blanca Dinámica con Validación**:
    ```javascript
    const allowedOrigins = ['https://mi-empresa.com', 'https://admin.mi-empresa.com'];

    app.use(cors({
      origin: (origin, callback) => {
        // Permitir peticiones sin origen (como apps móviles nativas o curl):
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado por política CORS'));
        }
      },
      credentials: true, // Permite cookies seguras
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Poner `origin: true` o `*` en producción para "solucionar rápido el error de CORS que salía en consola".
  - 🟢 **Green Flag**: Explicar la petición pre-vuelo (**Preflight Request con método `OPTIONS`**) y cómo cachearla con `maxAge`.

---

### 35. ¿Cómo funciona la Inyección de Comandos del Sistema Operativo en Express y cómo prevenirla?
- **Nivel**: Mid-Level / Senior / Security
- **Respuesta Técnica**:
  Ocurre cuando el backend toma datos del usuario y los pasa a funciones que ejecutan shells del sistema operativo:
  ```javascript
  // VULNERABLE:
  app.get('/ping', (req, res) => {
    exec(`ping -c 1 ${req.query.host}`); // Si host es "8.8.8.8; cat /etc/passwd" -> RCE!
  });
  ```
  - `child_process.exec()` inicia un sub-shell `/bin/sh`, interpretando metacaracteres de comando (`;`, `&&`, `|`, `` ` ``).
  **Prevención Defensiva**:
  1. **NUNCA usar `exec()` con inputs de usuario**.
  2. Usar **`child_process.spawn()`** o **`execFile()`** pasando los argumentos como un **array de strings separado**:
     ```javascript
     // SEGURO: Los argumentos no se interpretan por una shell
     execFile('ping', ['-c', '1', req.query.host]);
     ```
  3. Validar con expresiones regulares estrictas (solo permitir direcciones IP válidas).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar sanitizar reemplazando `;` con un regex casero (los atacantes usan `\n`, `|`, o variables de entorno para saltarse filtros simples).
  - 🟢 **Green Flag**: Explicar la diferencia entre invocar un binario directamente sin shell (`spawn`) vs invocar un subshell de bash (`exec`).

---

### 36. ¿Cómo blindar el backend de Express contra ataques de "Timing Attacks" en comparación de credenciales o tokens?
- **Nivel**: Senior / Staff / Security
- **Respuesta Técnica**:
  El operador de comparación estándar de strings (`===`) compara carácter por carácter de izquierda a derecha y se detiene en el primer carácter que no coincide (*Short-Circuit Evaluation*):
  - Si el token correcto empieza por `'A'` y el atacante envía `'B'`, la comparación tarda 2 nanosegundos.
  - Si el atacante envía `'A'`, el comparador pasa al segundo carácter y tarda 4 nanosegundos.
  - Muestreando miles de peticiones con precisión estadística, un atacante puede deducir la contraseña o firma carácter por carácter mediante la latencia de respuesta (**Timing Attack**).
  **Solución Criptográfica**:
  - Utilizar la función nativa de Node.js **`crypto.timingSafeEqual()`**:
    ```javascript
    import crypto from 'node:crypto';

    function verifyToken(userInput, secretToken) {
      const a = Buffer.from(userInput);
      const b = Buffer.from(secretToken);
      if (a.length !== b.length) return false;
      // Compara en tiempo constante constante independiente de dónde esté la diferencia:
      return crypto.timingSafeEqual(a, b);
    }
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `if (userToken === secretToken)` para validar webhooks de Stripe o firmas HMAC de API Keys críticas.
  - 🟢 **Green Flag**: Advertir que ambos Buffers pasados a `timingSafeEqual` deben tener exactamente la misma longitud o arrojarán un error, requiriendo verificación previa de longitud en tiempo constante.

---

### 37. ¿Qué es el ataque de "Path Traversal" (Directory Traversal) al servir archivos estáticos y cómo se evita?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Ocurre cuando el backend lee archivos del disco basándose en un parámetro sin sanitizar:
  `GET /download?file=../../../../etc/passwd`
  Si el código ejecuta `fs.readFile('/var/www/uploads/' + req.query.file)`, el atacante puede escapar del directorio permitido y leer archivos sensibles del sistema operativo.
  **Defensas**:
  1. Usar siempre el método seguro de Express **`res.sendFile(filename, { root: '/var/www/uploads' })`**, el cual valida internamente que la ruta resuelta no escape de la raíz permitida y arroja un error 403.
  2. Si se manipula el path manualmente, verificar con `path.resolve()`:
     ```javascript
     const safePath = path.resolve(BASE_DIR, userPath);
     if (!safePath.startsWith(BASE_DIR)) {
       throw new Error('Intento de Path Traversal detectado');
     }
     ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Concatenar strings de rutas directamente con el operador `+` en llamadas a `fs.readFile()`.
  - 🟢 **Green Flag**: Utilizar las opciones de contención de raíz (*root containment*) que implementan librerías como `serve-static` y `send`.

---

### 38. ¿Por qué es crítico ejecutar `app.disable('x-powered-by')` en Express?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Por defecto, Express incluye la cabecera HTTP:
  `X-Powered-By: Express`
  - **Riesgo de Information Disclosure**: Revela a los escáneres automáticos de vulnerabilidades de atacantes (ej. Shodan, bots de internet) que el servidor corre sobre Express y Node.js. Si se descubre un fallo de seguridad de día cero en Express, tu servidor se convierte en un objetivo inmediato.
  - **Mitigación**:
    ```javascript
    app.disable('x-powered-by');
    // O automáticamente usando helmet()
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que ocultar la cabecera es suficiente para estar seguro (es solo seguridad por oscuridad, pero una buena práctica básica de higiene).
  - 🟢 **Green Flag**: Identificar que `helmet()` elimina esta cabecera por defecto dentro de su suite.

---

### 39. ¿Cómo implementar un Rate Limiter distribuido en Express con Redis para entornos multi-instancia?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  En un entorno de producción con 10 pods de Express en Kubernetes detrás de un balanceador:
  - Un rate limiter en memoria local (`express-rate-limit` con memoria RAM por defecto) **NO funciona**: cada pod tiene su propio contador independiente. Un atacante puede hacer 10 veces más peticiones enviándolas a pods diferentes.
  - **Solución Distribuida con Redis Store**:
    ```javascript
    import rateLimit from 'express-rate-limit';
    import RedisStore from 'rate-limit-redis';
    import Redis from 'ioredis';

    const redisClient = new Redis(process.env.REDIS_URL);

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Límite de 100 peticiones por ventana
      standardHeaders: true, // Retorna cabeceras IETF: RateLimit-*
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
      }),
    });

    app.use('/api/', limiter);
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar el almacén de memoria por defecto en clústeres de Kubernetes multi-pod.
  - 🟢 **Green Flag**: Manejar el caso de fallo de Redis (*Fail-Open vs Fail-Closed*) para que la caída temporal de Redis no tumbe la API completa.

---

### 40. ¿Qué es el "ReDoS" (Regular Expression Denial of Service) y cómo proteger las rutas de Express?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Ocurre cuando una expresión regular contiene cuantificadores anidados sobre expresiones solapadas (ej. `(a+)+$`).
  - Ante una entrada maliciosa como `"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"`:
  - El motor de expresiones regulares de V8 entra en un **Backtracking Catastrófico**: evalúa $2^N$ combinaciones posibles.
  - Como el motor de regex de JavaScript corre en el **hilo principal de Node.js**, el Event Loop queda **100% bloqueado durante minutos o días**, congelando el servidor para todos los demás usuarios.
  **Prevención**:
  1. Auditar expresiones regulares con linters estáticos (`eslint-plugin-regexp`).
  2. No usar regex complejas construidas dinámicamente con inputs del usuario.
  3. Utilizar motores de regex con tiempo lineal garantizado ($O(N)$) sin backtracking, como **RE2** (`node-re2`).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que un regex lento se ejecuta en un hilo de fondo sin afectar al resto de las peticiones.
  - 🟢 **Green Flag**: Explicar el fenómeno de Backtracking Catastrófico y el uso de librerías basadas en automatas finitos como RE2.

---

## 5. Rendimiento, Streams, Subida de Archivos y Testing

### 41. ¿Cómo gestionar la subida segura de archivos grandes en Express con `multer` y almacenamiento en Streams (S3 / Cloud Storage)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **El Antipatrón de Memoria (`multer.memoryStorage()`)**: Carga el archivo completo en un Buffer de RAM antes de procesarlo. Si 50 usuarios suben vídeos de 200MB simultáneamente, el servidor colapsará por Out of Memory (OOM).
  - **La Práctica Segura con Streams**:
    - Validar el tipo MIME y la extensión en el filtro (`fileFilter`).
    - Configurar límites estrictos de tamaño (`limits: { fileSize: 10 * 1024 * 1024 }`).
    - Transmitir el archivo directamente mediante un stream hacia el bucket de AWS S3 usando **`@aws-sdk/lib-storage` (Upload)** o un driver compatible con streams, sin almacenarlo jamás completo en la memoria RAM del servidor de Express ni en disco local efímero.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Subir archivos al disco local del contenedor de Docker en arquitecturas efímeras de Kubernetes (el archivo se pierde al reiniciar el pod).
  - 🟢 **Green Flag**: Utilizar URLs prefirmadas de S3 (*Presigned URLs*) para que el frontend suba el archivo directamente a AWS sin tocar el servidor de Express, ahorrando el 100% de CPU y ancho de banda en el backend.

---

### 42. ¿Por qué `compression` middleware puede ser peligroso si no se utiliza con precaución (Ataque BREACH)?
- **Nivel**: Senior / Staff / Security
- **Respuesta Técnica**:
  El middleware `compression()` aplica compresión Gzip o Brotli a las respuestas HTTP para reducir el ancho de banda.
  - **El Ataque BREACH (Browser Reconnaissance and Exfiltration via Adaptive Compression of Hypertext)**:
    - Ocurre cuando se combinan 3 factores:
      1. Conexión cifrada mediante HTTPS.
      2. Compresión HTTP (Gzip) activada.
      3. La página refleja datos del usuario (ej. un parámetro de búsqueda) junto a un secreto sensible (como un token CSRF).
    - Un atacante puede medir las variaciones milimétricas en el tamaño en bytes de la respuesta comprimida para descifrar el token secreto carácter por carácter sin romper el cifrado TLS.
  - **Mitigación**: Desactivar la compresión en respuestas que contengan secretos o tokens de sesión, o usar tokens enmascarados con ruido aleatorio.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Desconocer las implicaciones de seguridad de combinar compresión con secretos reflejados en respuestas HTTPS.
  - 🟢 **Green Flag**: Recomendar delegar la compresión Gzip/Brotli al balanceador de carga o CDN perimetral (Cloudflare/CloudFront) en lugar de consumir CPU de Node.js.

---

### 43. ¿Cómo funciona la compresión condicional y el umbral `threshold` en Express?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  El algoritmo de compresión Gzip consume ciclos de CPU para buscar patrones y comprimir:
  - Si una respuesta es diminuta (ej. un JSON de 200 bytes), **el archivo comprimido resultante puede ser MÁS GRANDE que el original** debido al sobrecoste de los encabezados de compresión, además de desperdiciar CPU.
  - **Configuración del Umbral**:
    ```javascript
    app.use(compression({
      threshold: 1024, // Solo comprime respuestas mayores a 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }));
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar comprimir respuestas de 50 bytes o imágenes JPEG/PNG (que ya están comprimidas por formato).
  - 🟢 **Green Flag**: Configurar el filtro de tipos MIME para comprimir exclusivamente texto, JSON, HTML y SVG.

---

### 44. ¿Cómo implementar Server-Sent Events (SSE) en un endpoint de Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  SSE permite streaming de eventos unidireccionales desde el servidor hacia el cliente sobre HTTP estándar:
  ```javascript
  app.get('/events', (req, res) => {
    // 1. Cabeceras obligatorias para streaming SSE:
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 2. Enviar datos formateados según la especificación W3C:
    const timer = setInterval(() => {
      res.write(`data: ${JSON.stringify({ time: new Date() })}\n\n`);
    }, 1000);

    // 3. Limpieza garantizada si el cliente se desconecta:
    req.on('close', () => {
      clearInterval(timer);
      res.end();
    });
  });
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Olvidar los dos saltos de línea finales `\n\n` obligatorios en el protocolo SSE (el navegador nunca procesará el evento sin ellos).
  - 🟢 **Green Flag**: Desactivar el buffering en proxies intermedios agregando la cabecera `X-Accel-Buffering: no` (para Nginx).

---

### 45. ¿Cómo se ejecutan pruebas de integración de APIs de Express sin abrir puertos TCP reales usando `supertest`?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  La librería `supertest` permite probar aplicaciones Express pasándole directamente la función `app` sin necesidad de ejecutar `app.listen()` en un puerto real:
  ```javascript
  import request from 'supertest';
  import app from '../src/app.js';

  describe('GET /api/users', () => {
    it('debe responder 200 y retornar lista de usuarios', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer token_test')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
  ```
  - **Ventajas**: Cero colisiones de puertos en entornos de CI en paralelo, ejecución ultra rápida en memoria sobre sockets simulados de Node.js.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Levantar el servidor en el puerto 3000 durante las pruebas unitarias y sufrir colisiones de `EADDRINUSE`.
  - 🟢 **Green Flag**: Separar la definición de la aplicación (`app.js`) del archivo de arranque que invoca `app.listen()` (`server.js`) para permitir que Supertest importe la app limpiamente.

---

### 46. ¿Por qué es una mejor práctica separar `app.js` de `server.js` en proyectos de Express?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **`app.js` (Definición y Configuración)**:
    - Instancia la aplicación Express (`const app = express()`).
    - Configura middlewares, seguridad, enrutadores y manejadores de errores.
    - Exporta la instancia `export default app` sin iniciar ningún socket de escucha en red.
  - **`server.js` (Punto de Entrada del Proceso)**:
    - Importa `app`.
    - Conecta los pools de bases de datos y clientes de Redis.
    - Ejecuta `app.listen(port)` y configura el Graceful Shutdown con `process.on('SIGTERM')`.
  - **Beneficios**: Permite que las suites de pruebas (Supertest) importen `app` instantáneamente en memoria sin levantar conexiones de red ni bloquear puertos, y desacopla la configuración de la infraestructura de hosting.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Poner toda la lógica de rutas, conexión a BD y `app.listen()` en un único archivo monolítico de 1,000 líneas.
  - 🟢 **Green Flag**: Explicar la segregación de responsabilidades y la facilidad para desplegar la misma `app` en entornos serverless (AWS Lambda con `@vendia/serverless-express`).

---

### 47. ¿Cómo gestionar sesiones de usuario escalables en Express sin almacenar estado en la memoria del proceso?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Por defecto, middlewares como `express-session` utilizan un almacén de memoria RAM interno (`MemoryStore`):
  - **Peligro**: Si tienes 3 pods de Express, la sesión guardada en el Pod A no existe en el Pod B; cada reinicio borra todas las sesiones de todos los usuarios y provoca fugas de memoria continuas.
  - **Solución Enterprise con Redis (`connect-redis`)**:
    ```javascript
    import session from 'express-session';
    import RedisStore from 'connect-redis';
    import Redis from 'ioredis';

    const redisClient = new Redis(process.env.REDIS_URL);

    app.use(session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: true, httpOnly: true, maxAge: 86400000 },
    }));
    ```
  - Permite que cualquier pod del clúster acceda a la sesión compartida en Redis con persistencia y TTL automático.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `MemoryStore` en producción ignorando las advertencias explícitas de la documentación.
  - 🟢 **Green Flag**: Configurar `resave: false` y `saveUninitialized: false` para optimizar el número de escrituras en Redis y cumplir normativas de privacidad GDPR.

---

### 48. ¿Cómo implementar un motor de Inversión de Control (IoC) y Dependency Injection en Express sin usar NestJS?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  Express no incluye inyección de dependencias por defecto. En proyectos enterprise con arquitectura limpia se utilizan contenedores IoC ligeros como **Awilix** o **InversifyJS**:
  ```javascript
  import { createContainer, asClass, asValue } from 'awilix';

  const container = createContainer();
  container.register({
    userRepo: asClass(PostgresUserRepository).singleton(),
    userService: asClass(UserService).scoped(),
  });

  // Middleware de Scope por petición:
  app.use((req, res, next) => {
    req.scope = container.createScope();
    next();
  });

  // En el controlador:
  app.get('/users/:id', (req, res) => {
    const userService = req.scope.resolve('userService');
    const user = await userService.getUser(req.params.id);
    res.json(user);
  });
  ```
  Permite desacoplar completamente los controladores de las implementaciones de base de datos facilitando pruebas unitarias puras con mocks.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Instanciar dependencias manualmente con `new Servicio()` en cada controlador.
  - 🟢 **Green Flag**: Comparar la inyección de dependencias manual de Awilix en Express frente al sistema integrado de NestJS.

---

### 49. ¿Cómo optimizar el rendimiento de Express mediante el uso del framework Fastify y cuáles son las diferencias?
- **Nivel**: Senior / Staff / Performance
- **Respuesta Técnica**:
  Fastify es una alternativa moderna a Express que puede ser hasta **2x a 4x más rápida**:
  - **Por qué Fastify es más rápido**:
    1. **Serialización JSON Ultrarrápida (`fast-json-stringify`)**: En lugar de usar `JSON.stringify()` ordinario, compila esquemas JSON a código C++/JS optimizado conociendo la forma del objeto de antemano.
    2. **Enrutamiento Radix Tree**: Utiliza un árbol Radix optimizado (`find-my-way`) en lugar de expresiones regulares secuenciales en un array como Express ($O(K)$ vs $O(N)$).
    3. **Soporte Nativo de TypeScript y Validación**: Validación automática con JSON Schema de serie.
  - **Por qué Express sigue dominando**: Ecosistema masivo con más de 10 años de madurez, millones de librerías compatibles y una curva de aprendizaje mínima.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Afirmar que "Express está muerto y nadie lo usa" sin entender el valor de la estabilidad en bases de código corporativas.
  - 🟢 **Green Flag**: Saber que NestJS permite alternar de forma transparente entre Express y Fastify como motor subyacente mediante el adaptador `@nestjs/platform-fastify`.

---

### 50. ¿Qué buenas prácticas de producción son indispensables en el archivo `package.json` y variables de entorno para un backend de Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  1. **`NODE_ENV=production`**: Es el flag más importante de todo el ecosistema. Activa la caché de vistas en Express, oculta los stack traces de errores al cliente, y optimiza módulos de Node.js y dependencias internas de rendimiento.
  2. **Scripts de Ejecución Segura**:
     - Usar `node --enable-source-maps dist/server.js` para depurar TypeScript en producción.
     - Usar flags de memoria explícitos si corre en contenedores con límites: `--max-old-space-size=N`.
  3. **No ejecutar como usuario Root en Docker**: En el `Dockerfile`, declarar siempre `USER node` para mitigar vulnerabilidades de escalada de privilegios en el contenedor.
  4. **Health Check Endpoints**: Implementar `/healthz` (liveness) y `/ready` (readiness) para que Kubernetes o AWS ALB monitoreen la salud del servidor.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Dejar que la aplicación corra con `NODE_ENV=development` en producción (destruye el rendimiento y expone stack traces de seguridad).
  - 🟢 **Green Flag**: Explicar el desacoplamiento de las sondas de liveness y readiness para balanceo de carga sin caídas de servicio.


---

## 6. Enrutamiento Avanzado, Subdominios y Negociación de Contenido

### 51. ¿Cómo funciona la negociación de contenido en Express mediante `res.format()` y `req.accepts()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El protocolo HTTP permite a los clientes declarar qué formatos de representación pueden procesar mediante la cabecera `Accept`.
  En Express:
  - **`req.accepts(types)`**: Comprueba si el cliente acepta los tipos MIME indicados en base al header `Accept`, devolviendo el mejor match o `false`.
  - **`res.format(object)`**: Realiza negociación de contenido declarativa. Ejecuta el callback correspondiente al tipo aceptado por el cliente y configura automáticamente el header `Content-Type` y el header `Vary: Accept`:
  ```javascript
  app.get('/api/users/:id', (req, res, next) => {
    const user = { id: req.params.id, name: 'Alice' };

    res.format({
      'application/json': () => res.json(user),
      'application/xml': () => res.type('xml').send(`<user><id>${user.id}</id><name>${user.name}</name></user>`),
      'text/html': () => res.send(`<h1>Usuario: ${user.name}</h1>`),
      default: () => res.status(406).send('Not Acceptable: Formato no soportado'),
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Responder siempre JSON ignorando la cabecera `Accept` del cliente cuando la API declara soporte multipropósito.
  - 🟢 *Green Flag*: Explica que `res.format()` añade automáticamente la cabecera `Vary: Accept` para evitar que proxies y CDNs sirvan representaciones XML cacheadas a clientes que esperan JSON.

---

### 52. ¿Cómo gestionar subdominios y multi-tenancy dinámico usando el middleware `vhost` en Express?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  Para soportar aplicaciones SaaS multi-inquilino (*Multi-Tenant*) donde cada cliente tiene su propio subdominio (ej. `acme.app.com` y `globex.app.com`), Express permite bifurcar el pipeline HTTP mediante el middleware `vhost` o inspeccionando `req.subdomains`:
  ```javascript
  import express from 'express';
  import vhost from 'vhost';

  const mainApp = express();
  const tenantApp = express();
  const apiApp = express();

  tenantApp.get('/', (req, res) => {
    // req.vhost.host provee el subdominio exacto
    res.send(`Portal del Tenant: ${req.headers.host}`);
  });

  mainApp.use(vhost('api.empresa.com', apiApp));
  mainApp.use(vhost('*.empresa.com', tenantApp));
  mainApp.listen(3000);
  ```
  En Express nativo, `req.subdomains` devuelve un array con los subdominios en orden inverso (respetando la configuración `app.set('subdomain offset', 2)`).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Parsear manualmente `req.headers.host` con expresiones regulares frágiles en cada controlador.
  - 🟢 *Green Flag*: Maneja `subdomain offset` para entornos locales (`lvh.me` o `localhost`) vs dominios de producción con múltiples niveles TLD.

---

### 53. ¿Cómo implementar enrutamiento basado en expresiones regulares y parámetros comodín en Express 4 vs Express 5?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Express 4 utilizaba `path-to-regexp` v0.1.x, que permitía comodines planos como `app.get('/files/*')`.
  Express 5 actualizó a **`path-to-regexp` v8+**, introduciendo cambios críticos:
  1. Comodines arbitrarios sin nombre (`*`) ya no están permitidos. Deben escribirse con parámetros comodín nombrados explícitos: `app.get('/files/{*splat}')`.
  2. Sintaxis de parámetros opcionales: En Express 4 se usaba `/:id?`, mientras que en Express 5 se admiten grupos con llaves `{/:id}`.
  3. Soporte estricto de RegExp:
     ```javascript
     // Express 5: Ruta que solo acepta IDs numéricos mediante regex en parámetro
     app.get('/orders/:id(\\d+)', (req, res) => {
       res.send(`Orden numérica confirmada: ${req.params.id}`);
     });
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar migrar a Express 5 manteniendo rutas `app.get('*')` y no entender por qué la aplicación lanza errores de sintaxis en el arranque.
  - 🟢 *Green Flag*: Domina la sintaxis moderna de `path-to-regexp` v8+ para parámetros comodín y validación estricta de rutas.

---

### 54. ¿Cómo estructurar un árbol de routers jerárquico a gran escala con `mergeParams: true` y prefijos de versión de API?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Por defecto, los sub-routers de Express aíslan los parámetros de ruta de sus routers padres (`req.params` de la ruta base no son visibles en el sub-router).
  Para construir arquitecturas RESTful anidadas (ej. `/api/v1/organizations/:orgId/projects/:projectId/tasks`):
  ```javascript
  import { Router } from 'express';

  // Router de Tareas (Nivel más profundo)
  const taskRouter = Router({ mergeParams: true });
  taskRouter.get('/:taskId', (req, res) => {
    const { orgId, projectId, taskId } = req.params;
    res.json({ orgId, projectId, taskId });
  });

  // Router de Proyectos
  const projectRouter = Router({ mergeParams: true });
  projectRouter.use('/:projectId/tasks', taskRouter);

  // Router Principal de Organización
  const orgRouter = Router();
  orgRouter.use('/organizations/:orgId/projects', projectRouter);

  export default orgRouter;
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No usar `mergeParams: true` y re-declarar los parámetros padres en cada sub-ruta o guardarlos en variables globales.
  - 🟢 *Green Flag*: Diseña módulos de enrutamiento desacoplados y auto-contenidos fácilmente testeables en aislamiento.

---

### 55. ¿Cómo implementar Server-Sent Events (SSE) nativos con Express manteniendo el streaming de eventos en vivo?
- **Nivel**: Senior
- **Respuesta Técnica**:
  **SSE (Server-Sent Events)** es un protocolo unidireccional (servidor a cliente) sobre HTTP estándar ideal para dashboards, notificaciones y streaming de tokens en aplicaciones de Inteligencia Artificial (LLMs):
  ```javascript
  app.get('/api/events/live', (req, res) => {
    // 1. Configurar cabeceras obligatorias para SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Evita que Nginx almacene en buffer el stream
    });

    res.write('retry: 10000\n\n'); // Reintento en 10s si se desconecta

    // 2. Emitir eventos periódicos formateados según la especificación W3C
    const interval = setInterval(() => {
      const payload = JSON.stringify({ time: new Date().toISOString(), memory: process.memoryUsage().rss });
      res.write(`event: metrics\ndata: ${payload}\n\n`);
    }, 2000);

    // 3. Limpieza obligatoria cuando el cliente cierra la conexión
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Olvidar escuchar el evento `req.on('close')`, provocando un memory leak masivo de intervals acumulados.
  - 🟢 *Green Flag*: Añade `X-Accel-Buffering: no` para evitar que reverse proxies intermedios bloqueen el envío en tiempo real de los chunks.

---

### 56. ¿Cómo integrar WebSockets sobre el mismo servidor HTTP de Express (`http.createServer(app)`)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Una aplicación de Express no puede procesar WebSockets directamente porque Express es un framework de capa 7 para peticiones HTTP de Request-Response.
  Para compartir el mismo puerto TCP y certificado TLS entre Express y WebSockets (librería `ws`):
  ```javascript
  import http from 'node:http';
  import express from 'express';
  import { WebSocketServer } from 'ws';

  const app = express();
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Crear el servidor HTTP nativo envolviendo a Express
  const server = http.createServer(app);

  // Instanciar WebSocketServer adjunto
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, 'http://localhost');

    if (pathname === '/ws/notifications') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy(); // Rechazar upgrades no autorizados
    }
  });

  server.listen(3000);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Levantar un puerto TCP diferente para WebSockets obligando al cliente a sortear problemas de CORS y firewalls corporativos.
  - 🟢 *Green Flag*: Utiliza `noServer: true` con enrutamiento de upgrades para validar autenticación de tokens antes de aceptar el handshake.

---

### 57. ¿Cómo implementar compresión selectiva de respuestas con `compression` discriminando por tamaño y tipo MIME?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El middleware `compression` utiliza gzip/deflate para comprimir respuestas HTTP. Sin embargo, comprimir payloads diminutos (< 1KB) consume más CPU de la que ahorra en red, y comprimir recursos multimedia (JPEG, PNG, MP4) ya comprimidos es un desperdicio de CPU:
  ```javascript
  import compression from 'compression';

  app.use(
    compression({
      threshold: 1024, // Solo comprimir si el cuerpo supera 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false; // Permitir al cliente deshabilitar compresión
        }
        // Usar el filtro por defecto que incluye JSON, HTML, CSS, JS
        return compression.filter(req, res);
      },
      level: 6, // Nivel 6: Balance óptimo entre compresión y uso de CPU
    })
  );
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Configurar nivel de compresión 9 en servidores con alta concurrencia (provoca picos de CPU saturando el Event Loop).
  - 🟢 *Green Flag*: Recomienda delegar la compresión en el Ingress/Reverse Proxy (Nginx, Cloudflare) en arquitecturas de producción maduras.

---

### 58. ¿Cómo gestionar la subida de archivos `multipart/form-data` con `multer` validando magic bytes en streaming?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Confiar únicamente en la extensión del archivo (`.png`) o en la cabecera `file.mimetype` es una grave vulnerabilidad de seguridad: un atacante puede subir un script malicioso `.php` renombrado a `.jpg`.
  *Estrategia de validación segura*:
  1. Limitar tamaño con `limits: { fileSize: 5 * 1024 * 1024 }`.
  2. Inspeccionar los **Magic Bytes** (primeros bytes del buffer binario real):
  ```javascript
  import multer from 'multer';

  const upload = multer({
    storage: multer.memoryStorage(), // O streaming a disco/S3
    limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB
    fileFilter: (req, file, cb) => {
      // Validación preliminar de tipo MIME reportado
      if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
        return cb(new Error('Tipo de archivo no permitido'), false);
      }
      cb(null, true);
    },
  });

  app.post('/upload', upload.single('avatar'), (req, res) => {
    // Validar Magic Bytes reales del Buffer en memoria
    const buffer = req.file.buffer;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    if (!isPng && !isJpeg) {
      return res.status(400).json({ error: 'Contenido binario falso. Archivo rechazado.' });
    }
    res.json({ message: 'Archivo verificado y seguro' });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Almacenar archivos subidos directamente en el disco público del servidor con su nombre original sin sanitizar.
  - 🟢 *Green Flag*: Combina límites de tamaño estrictos, verificación de firmas mágicas binarias y almacenamiento en buckets S3 aislados.

---

### 59. ¿Cómo gestionar la descarga de archivos grandes con `res.download()` y cabeceras `Content-Disposition`?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  `res.download(path, [filename], [options], [callback])` de Express:
  1. Configura automáticamente el header `Content-Disposition: attachment; filename="reporte.pdf"`.
  2. Configura el `Content-Type` adecuado según la extensión del archivo.
  3. Utiliza internamente un stream de lectura (`fs.createReadStream`) y lo canaliza hacia el socket de respuesta, transmitiendo el archivo sin cargarlo entero en la memoria RAM del proceso:
  ```javascript
  app.get('/invoices/:id/download', (req, res, next) => {
    const filePath = `/var/storage/invoices/${req.params.id}.pdf`;

    res.download(filePath, `factura-${req.params.id}.pdf`, (err) => {
      if (err) {
        if (!res.headersSent) {
          next(err);
        } else {
          console.error('Conexión abortada durante la descarga');
        }
      }
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `fs.readFileSync()` para leer archivos grandes antes de enviarlos con `res.send()`.
  - 🟢 *Green Flag*: Maneja la comprobación `res.headersSent` en el callback de error para evitar excepciones si el cliente canceló la descarga a mitad de camino.

---

### 60. ¿Cómo implementar renderizado del lado del servidor (SSR) de plantillas (EJS, Pug) con caché de vistas compiladas?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  Express soporta motores de plantillas mediante `app.set('view engine', 'ejs')` y el método `res.render()`:
  ```javascript
  app.set('views', './views');
  app.set('view engine', 'ejs');

  // En producción:
  // app.set('view cache', true); // Habilitado automáticamente si NODE_ENV=production

  app.get('/dashboard', (req, res) => {
    res.render('dashboard', {
      user: req.user,
      title: 'Panel de Control',
    });
  });
  ```
  *Internals de View Cache*: En desarrollo, Express lee y compila la plantilla desde el disco en cada petición para reflejar cambios. Con `view cache: true`, compila la función de renderizado en memoria una sola vez, erradicando lecturas de disco I/O síncronas en producción.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desactivar la caché de vistas en producción o realizar operaciones asíncronas pesadas dentro del archivo de plantilla.
  - 🟢 *Green Flag*: Explica cómo `NODE_ENV=production` activa automáticamente la caché de vistas para evitar cuellos de botella de I/O en disco.

---

## 7. Middleware Pipeline Internals, Contexto y Flujo Asíncrono

### 61. ¿Cómo funciona internamente la pila `app._router.stack` y qué sobrecoste tiene registrar cientos de middlewares globales?
- **Nivel**: Staff Engineer / Architecture
- **Respuesta Técnica**:
  En Express, tanto la aplicación (`app`) como cada instancia de `Router` mantienen una lista enlazada o array interno llamado `_router.stack`.
  Cada llamada a `app.use()` o `app.METHOD()` inserta un objeto `Layer` en esta pila:
  - Un `Layer` contiene: una expresión regular compilada (`regexp`), una lista de parámetros de ruta y el handler (`handle`).
  - **El Coste Algorítmico**: Ante cada petición HTTP entrante, Express recorre secuencialmente la pila (`for` o recursión de `next()`). Ejecuta el test de la regex (`layer.match(path)`) de cada capa en orden $O(N)$ hasta encontrar las que coinciden.
  Si una aplicación registra cientos de middlewares globales o miles de rutas en un solo router plano, el coste de evaluar expresiones regulares secuenciales degrada el tiempo de respuesta.
  *Optimización*: Agrupar rutas en sub-routers modulares prefijados (`app.use('/api/v1/billing', billingRouter)`), lo que permite que Express salte bloques enteros de rutas no coincidentes con una sola comprobación de prefijo.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que Express utiliza un árbol Radix u hash table para buscar rutas instantáneamente en tiempo constante $O(1)$.
  - 🟢 *Green Flag*: Explica la estructura de `Layer` y demuestra cómo sub-routers reducen el espacio de búsqueda del pipeline.

---

### 62. ¿Cómo saltar el resto de middlewares de una ruta o router usando `next('route')` y `next('router')`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  El parámetro `next` de Express no solo acepta un objeto de error; acepta palabras clave de control de flujo interno:
  - **`next('route')`**: Salta todos los middlewares restantes definidos en la **misma pila de ruta actual** y transfiere el control a la siguiente ruta coincidente:
    ```javascript
    app.get('/user/:id', (req, res, next) => {
      if (req.params.id === '0') {
        return next('route'); // Salta al siguiente app.get('/user/:id')
      }
      res.send('Usuario regular');
    });

    app.get('/user/:id', (req, res) => {
      res.send('Usuario especial de ID cero');
    });
    ```
  - **`next('router')`**: Salta completamente la instancia del `Router` actual y transfiere la ejecución de vuelta al router padre que invocó dicho sub-router.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar sentencias `if/else` gigantescas dentro de un solo controlador en lugar de modularizar rutas alternativas con `next('route')`.
  - 🟢 *Green Flag*: Conoce `next('router')` para implementar cortocircuitos limpios ante falta de permisos a nivel de submódulo.

---

### 63. ¿Cómo propagar un contexto transaccional o ID de usuario a lo largo de los middlewares sin mutar `req` usando `AsyncLocalStorage`?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  Mutar `req.user` o `req.traceId` es la convención tradicional de Express, pero acopla el código de dominio al objeto `req` de HTTP: si un servicio de dominio o repositorio de base de datos necesita el ID de usuario autenticado para auditoría, debes pasarlo manualmente por cada capa.
  La solución idiomática moderna utiliza **`AsyncLocalStorage`**:
  ```typescript
  import { AsyncLocalStorage } from 'node:async_hooks';
  import { Request, Response, NextFunction } from 'express';

  interface RequestContext {
    traceId: string;
    userId?: string;
  }

  export const requestContext = new AsyncLocalStorage<RequestContext>();

  export function contextMiddleware(req: Request, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', traceId);

    const store: RequestContext = { traceId };

    // Ejecutar el resto de la petición dentro del contexto asíncrono
    requestContext.run(store, () => {
      next();
    });
  }

  // Ahora en cualquier capa profunda de negocio (sin acceso a req):
  export function logAction(action: string) {
    const ctx = requestContext.getStore();
    console.log(`[${ctx?.traceId}] Acción: ${action}`);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Pasar el objeto `req` de Express hacia los servicios de dominio o entidades de base de datos rompiendo la arquitectura limpia.
  - 🟢 *Green Flag*: Implementa `AsyncLocalStorage` para tracing distribuido y multitenancy sin contaminar las capas de aplicación.

---

### 64. ¿Cómo manejar peticiones canceladas por el cliente (`req.on('close')` / `req.destroyed`) para abortar consultas a la base de datos?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Si un usuario realiza una búsqueda pesada de base de datos y cierra la pestaña del navegador o cancela la petición HTTP:
  - Si el backend continúa ejecutando la query durante 15 segundos y calculando el resultado, está desperdiciando CPU, memoria y saturando el pool de conexiones de base de datos por un resultado que nadie leerá (*Zombie Queries*).
  - Mediante `AbortController` y el evento `close` del request:
  ```javascript
  app.get('/api/heavy-search', async (req, res, next) => {
    const abortController = new AbortController();

    req.on('close', () => {
      if (!res.writableEnded) {
        console.warn('El cliente abortó la petición HTTP. Cancelando operación downstream...');
        abortController.abort();
      }
    });

    try {
      // Pasar el AbortSignal al driver de base de datos (PostgreSQL, Prisma, Fetch)
      const data = await db.query('SELECT * FROM audit_logs WHERE...', {
        signal: abortController.signal,
      });
      res.json(data);
    } catch (err) {
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return; // Petición cancelada limpiamente
      }
      next(err);
    }
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ignorar el ciclo de vida de desconexión del cliente permitiendo que queries zombis saturen la base de datos.
  - 🟢 *Green Flag*: Vincula `req.on('close')` con `AbortController` para propagar la cancelación cooperativa a la base de datos.

---

### 65. ¿Cómo crear un middleware de timeout robusto con `connect-timeout` asegurando no responder dos veces (`res.headersSent`)?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Al configurar timeouts en Express (ej. con `connect-timeout`), si la operación excede el tiempo límite, el middleware responde automáticamente con `HTTP 503 Gateway Timeout`.
  Sin embargo, la función controladora original puede seguir ejecutándose y, al terminar, intentar invocar `res.json()`, lanzando el error `ERR_HTTP_HEADERS_SENT`.
  *Patrón defensivo*:
  ```javascript
  import timeout from 'connect-timeout';

  app.use('/api', timeout('5s'));

  app.get('/api/slow-task', async (req, res, next) => {
    const result = await someSlowProcess();

    // Verificación obligatoria antes de responder
    if (req.timedout || res.headersSent) {
      console.warn('Proceso completado pero la respuesta ya expiró por timeout.');
      return;
    }

    res.json(result);
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No comprobar `req.timedout` o `res.headersSent` en controladores asíncronos protegidos por timeouts.
  - 🟢 *Green Flag*: Maneja el error de timeout en el middleware global de excepciones para unificar la respuesta RFC 7807.

---

### 66. ¿Cómo implementar un middleware de auditoría y métricas midiendo el tiempo de respuesta con `response-time` y percentiles?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  No se debe calcular el tiempo de respuesta simplemente haciendo `const start = Date.now()` al inicio y una resta al final del controlador, porque no mide el tiempo real que tarda Node.js en enviar los bytes finales por el socket TCP.
  Se debe escuchar el hook del socket o usar `response-time` (que escucha el evento `finish` o `header` de `res`):
  ```javascript
  import responseTime from 'response-time';

  app.use(
    responseTime((req, res, time) => {
      // time: duración en milisegundos con alta precisión
      const route = req.route ? req.route.path : req.path;
      console.log(`[${req.method}] ${route} -> ${res.statusCode} en ${time.toFixed(2)}ms`);

      // Registrar métrica en Prometheus Histogram
      httpRequestDurationMicroseconds
        .labels(req.method, route, res.statusCode.toString())
        .observe(time / 1000);
    })
  );
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar la URL completa con IDs dinámicos (`/users/12345`) como etiqueta en Prometheus, provocando una explosión de cardinalidad en métricas.
  - 🟢 *Green Flag*: Utiliza `req.route.path` parametrizado (`/users/:id`) para mantener una cardinalidad finita y medible.

---

### 67. ¿Cómo interceptar y mutar el cuerpo de la respuesta antes de enviarlo al cliente sobreescribiendo `res.send()` o `res.json()`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  En arquitecturas donde se requiere auditar la respuesta saliente, anonimizar campos sensibles globalmente o envolver el JSON en una estructura unificada (`{ data: ..., meta: ... }`), se aplica el patrón de interceptor sobreescribiendo el método del prototipo en la instancia local de `res`:
  ```javascript
  app.use((req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Envolver la respuesta de forma estandarizada
      const wrappedBody = {
        data: body,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        },
      };

      // Invocar la implementación original
      return originalJson(wrappedBody);
    };

    next();
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Sobreescribir `res.json` en el prototipo global `express.response` afectando a otras aplicaciones en el mismo runtime.
  - 🟢 *Green Flag*: Enlaza el contexto original con `.bind(res)` para preservar los métodos internos de envío.

---

### 68. ¿Cómo gestionar la serialización segura de objetos `BigInt` y fechas ISO en respuestas JSON de Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Por defecto, `JSON.stringify()` lanza un error fatal en tiempo de ejecución ante valores de tipo BigInt:
  `TypeError: Do not know how to serialize a BigInt`.
  *Solución idiomática y no invasiva*:
  ```javascript
  // Extensión segura de serialización de BigInt a nivel de proceso
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  // O configurando un reemplazador JSON en Express:
  app.set('json replacer', (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Convertir manualmente cada BigInt a string en cada controlador repitiendo código propenso a olvidos.
  - 🟢 *Green Flag*: Utiliza `app.set('json replacer', ...)` nativo de Express para controlar la serialización de forma centralizada.

---

### 69. ¿Cómo funciona el middleware `express.raw()` y en qué se diferencia de `express.json()` para validar firmas de webhooks de Stripe/Paddle?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Librerías de pago como Stripe o Paddle envían una cabecera criptográfica (`Stripe-Signature`) que firma el **payload binario exacto byte por byte** recibido en la red.
  - Si usas `express.json()`, Express parsea el body a un objeto de JavaScript. Al serializarlo de nuevo con `JSON.stringify(req.body)`, el orden de las claves o los espacios en blanco pueden alterarse sutilmente, **invalidando la firma criptográfica**.
  - `express.raw({ type: 'application/json' })` almacena el `Buffer` crudo original en `req.body` sin tocar ningún byte:
  ```javascript
  // Ruta de Webhook con buffer crudo
  app.post('/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Rutas normales con JSON parser
  app.use(express.json());
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Colocar `app.use(express.json())` globalmente antes de las rutas de webhooks de Stripe rompiendo la validación de firmas.
  - 🟢 *Green Flag*: Configura `express.raw()` exclusivamente en los endpoints de webhooks o captura el rawBuffer mediante la opción `verify`.

---

### 70. ¿Cómo construir un middleware de composición funcional (ej. `compose([m1, m2, m3])`) sin anidar callbacks manualmente?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Cuando se requieren aplicar múltiples middlewares reutilizables (autenticación, autorización, validación de cuota) de forma cohesionada:
  ```javascript
  function compose(middlewares) {
    return (req, res, next) => {
      let index = -1;

      function dispatch(i) {
        if (i <= index) return Promise.reject(new Error('next() invocado múltiples veces'));
        index = i;
        const fn = middlewares[i] || next;
        if (!fn) return;

        try {
          fn(req, res, (err) => {
            if (err) return next(err);
            dispatch(i + 1);
          });
        } catch (err) {
          next(err);
        }
      }

      dispatch(0);
    };
  }

  // Uso:
  const requireAdmin = compose([authenticateJwt, checkRole('ADMIN'), auditLog('ADMIN_ACCESS')]);
  app.delete('/api/system/reset', requireAdmin, (req, res) => res.send('Reset OK'));
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Anidar middlewares como argumentos infinitos en cada ruta duplicando lógica de tuberías.
  - 🟢 *Green Flag*: Implementa el patrón similar a Koa/Redux para componer pipelines de middlewares declarativos.

---

## 8. Seguridad Defensiva, Autenticación y Mitigación de Vulnerabilidades

### 71. ¿Cómo implementar autenticación basada en sesiones seguras con `express-session` y Redis store (`connect-redis`)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El almacenamiento de sesiones en memoria por defecto (`MemoryStore`) de `express-session` causa fugas de memoria y no soporta múltiples instancias o reinicios.
  En producción se debe utilizar una base de datos en memoria como Redis:
  ```javascript
  import session from 'express-session';
  import { RedisStore } from 'connect-redis';
  import { createClient } from 'redis';

  const redisClient = createClient({ url: 'redis://redis-cluster:6379' });
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient, prefix: 'sess:' }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: '__Secure-sid', // Prefijo de seguridad de cookies
      cookie: {
        httpOnly: true, // Previene lectura vía XSS (JavaScript)
        secure: true,   // Solo se transmite sobre HTTPS
        sameSite: 'lax',// Mitiga ataques CSRF
        maxAge: 1000 * 60 * 60 * 24, // 24 horas
      },
    })
  );
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `MemoryStore` en producción o cookies sin flags `httpOnly` y `secure`.
  - 🟢 *Green Flag*: Desactiva `resave: false` y `saveUninitialized: false` para optimizar escrituras y cumplir con regulaciones de privacidad (GDPR).

---

### 72. ¿Cómo mitigar ataques de *Session Fixation* regenerando el ID de sesión tras el login con `req.session.regenerate()`?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  En un ataque de **Fijación de Sesión (Session Fixation)**, el atacante obtiene un ID de sesión válido anónimo (ej. visitando el sitio) y fuerza a la víctima a autenticarse usando ese mismo ID (a través de un enlace manipulado). Si el servidor mantiene el mismo identificador tras la autenticación, el atacante puede acceder a la cuenta de la víctima.
  *Defensa obligatoria*: Siempre regenerar el ID de sesión inmediatamente tras validar las credenciales de login:
  ```javascript
  app.post('/api/auth/login', async (req, res, next) => {
    const user = await validateCredentials(req.body.email, req.body.password);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Regenerar el identificador de sesión antes de almacenar datos del usuario
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user.id;
      req.session.role = user.role;

      req.session.save((err) => {
        if (err) return next(err);
        res.json({ message: 'Login exitoso' });
      });
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Almacenar `req.session.userId = user.id` directamente sin llamar a `regenerate()`.
  - 🟢 *Green Flag*: Explica cómo la regeneración de sesión invalida el token previo en Redis e instruye al navegador a guardar una nueva cookie.

---

### 73. ¿Cómo configurar Content Security Policy (CSP) avanzada con Nonces criptográficos usando `helmet`?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Una política CSP estricta prohíbe scripts en línea (`inline scripts`). Para permitir scripts dinámicos legítimos generados por el servidor sin usar `'unsafe-inline'`, se utiliza un **Nonce criptográfico** (número usado una sola vez) generado por cada petición:
  ```javascript
  import helmet from 'helmet';
  import crypto from 'node:crypto';

  // Middleware para generar nonce aleatorio único
  app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  });

  app.use((req, res, next) => {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", `'nonce-${res.locals.cspNonce}'`],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://images.empresa.com'],
        },
      },
    })(req, res, next);
  });
  ```
  En la plantilla HTML: `<script nonce="<%= cspNonce %>">console.log('Script permitido');</script>`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `scriptSrc: ["'unsafe-inline'"]` en CSP, dejando abierta la puerta a ataques XSS.
  - 🟢 *Green Flag*: Conoce la propagación de Nonces criptográficos en plantillas SSR para cumplimiento PCI-DSS.

---

### 74. ¿Cómo mitigar ataques de CSRF (Cross-Site Request Forgery) con tokens `SameSite=Lax/Strict` vs `csurf` double-submit cookies?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  El ataque CSRF engaña al navegador de un usuario autenticado para que ejecute acciones no deseadas en una aplicación donde tiene una sesión activa.
  - **Enfoque Moderno (Cookie SameSite)**:
    Configurar `SameSite=Lax` o `SameSite=Strict` en las cookies de sesión hace que los navegadores modernos **no envíen la cookie en peticiones transversales entre sitios (cross-origin)** disparadas por scripts o formularios de terceros.
  - **Enfoque Double Submit Cookie (Tokens CSRF)**:
    Para APIs que soportan navegadores antiguos o endpoints sensibles (transferencias de dinero):
    El servidor emite un token aleatorio en una cookie y el frontend debe leerlo e incluirlo en la cabecera personalizada `X-CSRF-Token`. Dado que un atacante cross-origin no puede leer las cookies del dominio (gracias al Same-Origin Policy), no puede construir la cabecera requerida.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Depender exclusivamente de tokens CSRF en APIs REST que utilizan cabeceras de autorización Bearer JWT (las APIs sin cookies nativas no son vulnerables a CSRF clásico).
  - 🟢 *Green Flag*: Explica la diferencia de mitigación entre arquitecturas basadas en cookies de sesión y arquitecturas stateless basadas en Authorization headers.

---

### 75. ¿Cómo proteger una API de Express contra Parameter Pollution con el middleware `hpp`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El ataque **HTTP Parameter Pollution (HPP)** consiste en enviar múltiples parámetros con el mismo nombre en la query string:
  `GET /api/transfer?toAccount=123&toAccount=999&amount=500`.
  En Express, `req.query.toAccount` pasará de ser un string a convertirse en un **Array**: `['123', '999']`. Si el código de negocio esperaba un string simple (`toAccount.trim()`), la aplicación crasheará con un `TypeError` o transferirá dinero a una cuenta inesperada.
  *Solución*: El middleware `hpp`:
  ```javascript
  import hpp from 'hpp';

  app.use(hpp({ whitelist: ['filter', 'tags'] })); // Permitir arrays solo en campos autorizados
  ```
  `hpp` selecciona el último valor enviado (`toAccount: '999'`) y descarta los duplicados no autorizados.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer que Express transforma parámetros repetidos en arrays automáticamente.
  - 🟢 *Green Flag*: Aplica esquemas de validación estricta (Zod, Joi) o el middleware `hpp` para blindar controladores.

---

### 76. ¿Cómo implementar Rate Limiting distribuido con algoritmo Sliding Window en Redis con `express-rate-limit`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Un Rate Limiter en memoria local falla cuando la aplicación corre en un clúster de Kubernetes: un atacante que rote entre pods puede multiplicar su cuota de peticiones.
  Se utiliza **`express-rate-limit`** con un almacén en Redis (**`rate-limit-redis`**) que implementa el algoritmo **Sliding Window Log / Counter**:
  ```javascript
  import rateLimit from 'express-rate-limit';
  import { RedisStore } from 'rate-limit-redis';
  import { createClient } from 'redis';

  const redisClient = createClient({ url: 'redis://redis-server:6379' });
  await redisClient.connect();

  export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
    limit: 100, // Límite de 100 peticiones por ventana e IP
    standardHeaders: 'draft-7', // Devuelve cabeceras RateLimit-* estandarizadas
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:',
    }),
    message: {
      status: 429,
      error: 'Too Many Requests',
      message: 'Límite de peticiones excedido. Intente más tarde.',
    },
  });

  app.use('/api/', apiLimiter);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar rate limiters en memoria en clústeres distribuidos sin sincronización centralizada.
  - 🟢 *Green Flag*: Configura las cabeceras estándar del IETF (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).

---

### 77. ¿Cómo prevenir ataques de Path Traversal al servir archivos estáticos con `express.static()` y `res.sendFile()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El ataque **Path Traversal** (Directory Traversal) intenta acceder a archivos sensibles del sistema operativo fuera del directorio permitido mediante secuencias `../` (ej. `GET /files/../../../../etc/passwd`).
  - `express.static()` previene esto internamente utilizando la librería `send`, que bloquea secuencias `../` y resuelve rutas canónicas.
  - Al usar `res.sendFile()`, se debe configurar siempre la opción **`root`** absoluta y validar la ruta canónica con `path.resolve()`:
  ```javascript
  import path from 'node:path';

  app.get('/download', (req, res) => {
    const filename = req.query.file;
    const safeDir = path.resolve('/var/www/uploads');
    const targetPath = path.resolve(safeDir, filename);

    // Verificación de frontera canónica
    if (!targetPath.startsWith(safeDir)) {
      return res.status(403).send('Acceso denegado: Intento de Path Traversal detectado.');
    }

    res.sendFile(filename, { root: safeDir });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Concatenar directamente strings: `res.sendFile('/uploads/' + req.query.file)`.
  - 🟢 *Green Flag*: Utiliza `path.resolve()` comparando con el directorio raíz seguro para erradicar escapes de carpeta.

---

### 78. ¿Cómo sanitizar payloads contra inyecciones NoSQL en MongoDB/Mongoose con `express-mongo-sanitize`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Las inyecciones NoSQL ocurren cuando un atacante envía operadores de MongoDB en el cuerpo JSON (ej. `{ "username": "admin", "password": { "$gt": "" } }`).
  Si la consulta utiliza `db.users.findOne({ username: req.body.username, password: req.body.password })`, la condición `$gt: ""` evalúa a verdadero para cualquier contraseña existente, permitiendo al atacante iniciar sesión sin conocer la clave.
  *Mitigación*:
  ```javascript
  import mongoSanitize from 'express-mongo-sanitize';

  // Elimina cualquier clave que comience por '$' o contenga '.'
  app.use(
    mongoSanitize({
      replaceWith: '_', // O elimina la clave por defecto
    })
  );
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que por no usar SQL no existen inyecciones en bases de datos documentales.
  - 🟢 *Green Flag*: Combina sanitización de operadores con esquemas de validación tipados estrictos (Zod) que rechazan objetos donde se esperan primitivos.

---

### 79. ¿Cómo implementar autenticación OAuth2 / OIDC con Passport.js y gestión de refresh tokens?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Passport.js abstrae flujos de autenticación mediante estrategias modulares (`passport-oauth2`, `passport-google-oauth20`):
  ```javascript
  import passport from 'passport';
  import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'https://mi-api.com/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, accessToken, refreshToken);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      // Emitir JWT propio de la aplicación hacia el cliente
      const appToken = generateAppJwt(req.user);
      res.redirect(`https://app.empresa.com/login-success?token=${appToken}`);
    }
  );
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Guardar el Access Token de Google/OAuth2 como token de sesión en la app cliente en lugar de emitir un token propio con control de revocación.
  - 🟢 *Green Flag*: Cifra y almacena de forma segura el `refreshToken` en la base de datos para renovar accesos en segundo plano.

---

### 80. ¿Cómo implementar autenticación basada en API Keys con rotación de claves y hashing seguro en Express?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Las API Keys para integraciones B2B nunca deben almacenarse en texto plano en la base de datos (si la base de datos se filtra, todas las integraciones quedan comprometidas).
  *Arquitectura Segura*:
  1. Generar la clave con formato identificable: `prefix_publicKey_secretPart` (ej. `sk_live_abc123_xyz789`).
  2. Almacenar en base de datos únicamente el hash criptográfico (`SHA-256` o `scrypt`) del secreto.
  3. Middleware de autenticación en Express:
  ```javascript
  import crypto from 'node:crypto';

  export async function apiKeyAuth(req, res, next) {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey) return res.status(401).json({ error: 'API Key requerida' });

    const [prefix, id, secret] = rawKey.split('_');
    const clientRecord = await db.clients.findById(id);
    if (!clientRecord || clientRecord.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'API Key inválida o revocada' });
    }

    const hashedInput = crypto.createHash('sha256').update(secret).digest('hex');
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(hashedInput, 'hex'),
      Buffer.from(clientRecord.secretHash, 'hex')
    );

    if (!isMatch) return res.status(401).json({ error: 'API Key inválida' });

    req.client = clientRecord;
    next();
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Almacenar API Keys en texto plano y compararlas con `===` vulnerable a timing attacks.
  - 🟢 *Green Flag*: Diseña un sistema con prefijos legibles y soporte de claves duales activas para permitir rotación sin tiempo de inactividad.

---

## 9. Resiliencia, Idempotencia, Caché y Rendimiento

### 81. ¿Cómo implementar el estándar de cabecera `Idempotency-Key` con Redis para prevenir pagos duplicados en Express?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Si la conexión de red se corta tras procesar un pago pero antes de que el cliente reciba la respuesta HTTP, el cliente reintentará la petición. Para evitar cobros duplicados en peticiones `POST`:
  ```javascript
  import { createClient } from 'redis';

  const redis = createClient();

  export function idempotencyMiddleware(ttlSeconds = 86400) {
    return async (req, res, next) => {
      const key = req.headers['idempotency-key'];
      if (!key) return next(); // Opcional o requerido según la ruta

      const redisKey = `idemp:${key}`;
      const cached = await redis.get(redisKey);

      if (cached) {
        const { status, body } = JSON.parse(cached);
        res.setHeader('X-Cache-Idempotency', 'HIT');
        return res.status(status).json(body);
      }

      // Interceptar la respuesta saliente para guardarla en Redis
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setEx(redisKey, ttlSeconds, JSON.stringify({ status: res.statusCode, body }));
        }
        return originalJson(body);
      };

      next();
    };
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Almacenar la clave de idempotencia en memoria local o cachear respuestas de error 500 que deben poder ser reintentadas.
  - 🟢 *Green Flag*: Maneja estados intermedios (`IN_PROGRESS`) en Redis para evitar que peticiones concurrentes con la misma clave se ejecuten a la vez.

---

### 82. ¿Cómo configurar adecuadamente la cabecera `Cache-Control` (`max-age`, `s-maxage`, `stale-while-revalidate`) en Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  La cabecera `Cache-Control` gobierna cómo los navegadores y los proxies de CDN almacenan respuestas HTTP:
  - `private`: Solo puede cachearse en el navegador del usuario final (prohibido en CDNs intermedias; obligatorio para datos de usuario).
  - `public`: Puede ser almacenado por CDNs y proxies compartidos.
  - `s-maxage=N`: Tiempo de vida en la CDN (anula `max-age` para proxies compartidos).
  - `stale-while-revalidate=N`: Permite a la CDN servir inmediatamente una versión expirada (stale) mientras solicita de forma asíncrona una versión fresca al backend de Express en segundo plano, logrando latencias de 5ms.
  ```javascript
  app.get('/api/public-catalog', (req, res) => {
    res.setHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=600'
    );
    res.json(catalogData);
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Poner `public` en endpoints que contienen datos privados del usuario autenticado.
  - 🟢 *Green Flag*: Explica cómo `stale-while-revalidate` erradica picos de latencia en peticiones frecuentes.

---

### 83. ¿Cómo funciona la generación condicional de ETags y respuestas `304 Not Modified` en Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Express genera automáticamente un **ETag débil (W/"...")** calculando un hash sobre el cuerpo de la respuesta mediante la librería interna `etag`:
  1. En la primera petición, Express responde con el payload y el header `ETag: W/"12345"`.
  2. En la siguiente petición, el navegador envía el header `If-None-Match: W/"12345"`.
  3. En Express, el método `res.send()` compara `req.headers['if-none-match']` con el nuevo hash generado.
  4. Si coinciden, Express descarta el cuerpo y responde instantáneamente con **`HTTP 304 Not Modified`**, ahorrando ancho de banda.
  *Optimización avanzada*: Para evitar consultar la base de datos si los datos no cambiaron, se puede comparar la versión o timestamp de actualización (`updated_at`) antes de ejecutar queries pesadas.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desactivar ETags con `app.set('etag', false)` sin entender que ahorran ancho de banda masivo en APIs de solo lectura.
  - 🟢 *Green Flag*: Conoce la diferencia entre ETag fuerte (coincidencia byte a byte) y ETag débil (equivalencia semántica).

---

### 84. ¿Cómo implementar un Circuit Breaker con `opossum` en llamadas HTTP externas invocadas desde Express?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Si un microservicio externo downstream está caído, continuar llamándolo ralentiza la cola de conexiones de Express.
  Se envuelve la llamada HTTP con **`opossum`**:
  ```javascript
  import CircuitBreaker from 'opossum';

  async function fetchBillingService(userId) {
    const res = await fetch(`https://billing.internal/users/${userId}`);
    if (!res.ok) throw new Error('Billing service error');
    return res.json();
  }

  const breaker = new CircuitBreaker(fetchBillingService, {
    timeout: 3000,           // Si tarda más de 3s, se considera fallo
    errorThresholdPercentage: 50, // Si el 50% de las llamadas fallan...
    resetTimeout: 30000,      // Abre el circuito durante 30s
  });

  breaker.fallback(() => ({ status: 'DEGRADED', billingAvailable: false }));

  app.get('/user-profile/:id', async (req, res, next) => {
    try {
      const billing = await breaker.fire(req.params.id);
      res.json({ billing });
    } catch (err) {
      next(err);
    }
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar que peticiones lentas downstream consuman sockets y memoria de Express hasta tumbar todo el servidor.
  - 🟢 *Green Flag*: Configura callbacks de fallback que permiten servir respuestas degradadas sin error 500 al usuario.

---

### 85. ¿Cómo implementar una cola de peticiones desacoplada con BullMQ para procesos pesados en Express?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Operaciones intensivas (ej. generación de PDFs, transcodificación de vídeo, envíos masivos de email) nunca deben ejecutarse síncronamente dentro del ciclo de vida de una petición HTTP de Express.
  *Arquitectura asíncrona con BullMQ y Redis*:
  ```javascript
  import { Queue } from 'bullmq';

  const reportQueue = new Queue('reports', { connection: { host: 'redis', port: 6379 } });

  app.post('/api/reports/export', async (req, res) => {
    // 1. Encolar el trabajo de inmediato
    const job = await reportQueue.add('generateReport', {
      userId: req.user.id,
      filters: req.body,
    });

    // 2. Responder HTTP 202 Accepted de inmediato (< 10ms)
    res.status(202).json({
      message: 'Reporte encolado para procesamiento.',
      jobId: job.id,
      statusUrl: `/api/reports/status/${job.id}`,
    });
  });
  ```
  Un proceso Worker separado de Node.js procesa la cola sin congelar el Event Loop de Express.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ejecutar la generación de reportes síncronamente en el controlador manteniendo el socket HTTP abierto durante 60 segundos.
  - 🟢 *Green Flag*: Utiliza el código semántico `HTTP 202 Accepted` y provee endpoints de consulta de estado del job.

---

### 86. ¿Cómo optimizar el consumo de memoria transmitiendo millones de registros de base de datos como streaming JSON hacia `res`?
- **Nivel**: Senior / Performance
- **Respuesta Técnica**:
  Si una consulta devuelve 500,000 registros y se carga en memoria con `const rows = await db.query(...)` y se envía con `res.json(rows)`, el proceso superará el límite de heap de V8 y crasheará con `Out of Memory`.
  *Técnica de Streaming JSON con Backpressure*:
  ```javascript
  import QueryStream from 'pg-query-stream';
  import JSONStream from 'JSONStream';
  import { pipeline } from 'node:stream/promises';

  app.get('/api/export-audit-logs', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');

    const client = await pgPool.connect();
    try {
      const query = new QueryStream('SELECT * FROM massive_audit_logs');
      const dbStream = client.query(query);

      // JSONStream.stringify convierte objetos en un array JSON [ {...}, {...} ] en streaming
      await pipeline(dbStream, JSONStream.stringify(), res);
    } catch (err) {
      if (!res.headersSent) next(err);
    } finally {
      client.release();
    }
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Cargar arrays gigantescos en memoria en lugar de utilizar pipelines de streaming.
  - 🟢 *Green Flag*: Utiliza `pipeline` de Node.js garantizando backpressure automático para no inundar el socket de red.

---

### 87. ¿Cómo implementar un middleware de graceful degradation que responda con caché o estado degradado si la base de datos externa falla?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Cuando la base de datos principal se satura o cae, una aplicación resiliente no devuelve un error 500 a todos los usuarios; sirve una versión en caché (*Graceful Degradation*):
  ```javascript
  app.get('/api/home-feed', async (req, res) => {
    try {
      // Intentar leer datos frescos de la BD con timeout agresivo de 1.5s
      const freshData = await fetchFromDbWithTimeout(1500);
      // Actualizar caché de respaldo
      await redis.set('backup:home-feed', JSON.stringify(freshData));
      return res.json(freshData);
    } catch (dbErr) {
      console.warn('BD primaria no disponible. Activando degradación elegante...');
      const fallback = await redis.get('backup:home-feed');
      if (fallback) {
        res.setHeader('X-Degraded-Mode', 'true');
        return res.json(JSON.parse(fallback));
      }
      res.status(503).json({ error: 'Servicio temporalmente no disponible' });
    }
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Propagar el fallo directo de la base de datos al usuario final sin mecanismos de contingencia.
  - 🟢 *Green Flag*: Señaliza el modo degradado mediante cabeceras HTTP personalizadas para alertar a los sistemas de monitoreo.

---

### 88. ¿Cómo configurar Express detrás de proxies inversos múltiples (Cloudflare -> ALB -> Nginx -> Express) usando `app.set('trust proxy', n)`?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  Si Express está detrás de proxies inversos, `req.ip` será por defecto la IP interna del proxy local (ej. `10.0.0.1`), rompiendo rate limiters, geolocalización y registros de auditoría.
  La cabecera `X-Forwarded-For` contiene una lista separada por comas de todas las IPs intermediarias: `clientIp, proxy1, proxy2`.
  *Configuración de `trust proxy`*:
  - `app.set('trust proxy', true)`: Inseguro si no se controlan todos los proxies (permite que un atacante inyecte una IP falsa en el header).
  - **Recomendado (Salto numérico)**: Si la arquitectura tiene 2 proxies conocidos (ALB y Nginx):
    `app.set('trust proxy', 2)`
    Express contará 2 saltos hacia atrás desde la conexión de confianza para extraer la verdadera IP del cliente.
  - **O por rangos de subred**: `app.set('trust proxy', 'loopback, 10.0.0.0/8')`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `req.headers['x-forwarded-for'].split(',')[0]` manualmente (permite spoofing trivial de IP).
  - 🟢 *Green Flag*: Sintoniza `trust proxy` con el número exacto de saltos de proxies de la infraestructura cloud.

---

### 89. ¿Cómo gestionar el consumo de CPU y límites de payload (`body-parser limit`) para prevenir ataques DoS por agotamiento de memoria?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Si Express tiene configurado `express.json()` sin límites explícitos o con un límite gigante (ej. 50MB):
  Un atacante puede enviar simultáneamente 100 peticiones con cuerpos JSON de 50MB que contengan arrays gigantescos.
  - El buffer de Node.js consumirá 5GB de RAM.
  - La serialización/parsing de JSON bloqueará el hilo del Event Loop durante segundos.
  *Configuración Defensiva*:
  ```javascript
  // Límite estricto por defecto (ej. 100KB para endpoints típicos)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Aplicar límites mayores únicamente en las rutas que lo requieren
  app.use('/api/documents/import', express.json({ limit: '10mb' }));
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Configurar `limit: '50mb'` globalmente en toda la aplicación.
  - 🟢 *Green Flag*: Aplica el principio de mínimo privilegio en el tamaño de los cuerpos HTTP por ruta.

---

### 90. ¿Cómo monitorizar en tiempo real el throughput (RPS), latencia y tasa de errores de Express usando Prometheus y Grafana?
- **Nivel**: Senior / SRE
- **Respuesta Técnica**:
  Utilizando la librería estándar `prom-client`:
  ```javascript
  import client from 'prom-client';

  // Recolectar métricas del runtime de Node.js por defecto (Event loop lag, Heap, GC)
  client.collectDefaultMetrics({ prefix: 'nodejs_' });

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de peticiones HTTP en segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  });

  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // Endpoint de raspado de Prometheus
  app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Medir performance registrando logs en consola sin exponer métricas agregadas en percentiles.
  - 🟢 *Green Flag*: Configura buckets exponenciales adecuados para medir con precisión las latencias de percentiles p95 y p99.

---

## 10. Arquitectura Hexagonal, Testing Avanzado y TypeScript en Express

### 91. ¿Cómo estructurar un proyecto Express enterprise siguiendo Arquitectura Hexagonal (Puertos y Adaptadores)?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  En **Arquitectura Hexagonal**, el núcleo del negocio (*Dominio y Casos de Uso*) no debe tener ninguna dependencia de Express ni de librerías HTTP.
  ```
  src/
  ├── domain/               # Entidades de negocio, Value Objects, Errores de Dominio
  │   ├── user.entity.ts
  │   └── user.repository.port.ts   # Interfaz pura de TypeScript
  ├── application/          # Casos de uso / Servicios de aplicación
  │   └── create-user.use-case.ts
  └── infrastructure/       # Adaptadores de entrada y salida
      ├── http/             # Adaptador Primario (Controladores y Rutas de Express)
      │   ├── user.controller.ts
      │   └── user.routes.ts
      └── database/         # Adaptador Secundario (PostgreSQL / Prisma)
          └── postgres-user.repository.ts
  ```
  El controlador de Express traduce `req.body` al comando de aplicación y envía la respuesta HTTP, permitiendo sustituir Express por Fastify o una CLI sin modificar una sola línea de lógica de negocio.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Escribir consultas SQL o lógica de validación de reglas de negocio directamente dentro de las funciones de middleware de Express.
  - 🟢 *Green Flag*: Demuestra cómo la inversión de dependencias hace que la aplicación de Express sea 100% testeable con mocks unitarios.

---

### 92. ¿Cómo implementar Inversión de Dependencias (IoC) en Express usando contenedores ligeros como Awilix?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Sin IoC, las dependencias se instancian manualmente en cada archivo con `new Repository()`, provocando acoplamiento rígido.
  **Awilix** provee resolución de dependencias por inyección en el constructor:
  ```typescript
  import { createContainer, asClass, asValue, InjectionMode } from 'awilix';

  const container = createContainer({ injectionMode: InjectionMode.PROXY });

  container.register({
    dbClient: asValue(dbPool),
    userRepository: asClass(PostgresUserRepository).singleton(),
    createUserUseCase: asClass(CreateUserUseCase).scoped(),
    userController: asClass(UserController).scoped(),
  });

  // Middleware para inyectar el contenedor en cada request (Request Scoping)
  app.use((req, res, next) => {
    req.scope = container.createScope();
    next();
  });

  app.post('/users', (req, res) => {
    const controller = req.scope.resolve('userController');
    controller.create(req, res);
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Importar directamente instancias de repositorios como singletons globales en los controladores.
  - 🟢 *Green Flag*: Conoce el ciclo de vida Scoped por petición para gestionar transacciones atómicas de base de datos.

---

### 93. ¿Cómo tipar de forma estricta parámetros de ruta, query params, cuerpo y respuesta en controladores Express con TypeScript?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  La interfaz `RequestHandler` de `@types/express` acepta 5 parámetros genéricos:
  `RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>`:
  ```typescript
  import { Request, Response, NextFunction } from 'express';

  interface RouteParams {
    userId: string;
  }

  interface UserResponseBody {
    id: string;
    email: string;
    role: string;
  }

  interface UpdateUserRequestBody {
    email: string;
  }

  interface FilterQuery {
    includeDetails?: string;
  }

  export async function updateUserController(
    req: Request<RouteParams, UserResponseBody, UpdateUserRequestBody, FilterQuery>,
    res: Response<UserResponseBody>,
    next: NextFunction
  ): Promise<void> {
    const { userId } = req.params;      // Tipado como string
    const { email } = req.body;          // Tipado como string
    const { includeDetails } = req.query;// Tipado como string | undefined

    // res.json({ id: 123 }); // ERROR DE COMPILACIÓN: id debe ser string
    res.json({ id: userId, email, role: 'USER' }); // Compilación válida
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `req: any` o `res: any` en controladores perdiendo todos los beneficios de TypeScript.
  - 🟢 *Green Flag*: Aprovecha los 4 genéricos de `Request` para autocompletado y validación de tipos estática en el IDE.

---

### 94. ¿Cómo validar DTOs en Express utilizando librerías modernas como Zod con inferencia automática de tipos?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  En lugar de escribir comprobaciones manuales `if (!req.body.email)`, se utiliza **Zod** para validar el payload en runtime e inferir el tipo estático de TypeScript simultáneamente:
  ```typescript
  import { z } from 'zod';
  import { Request, Response, NextFunction } from 'express';

  export const CreateUserSchema = z.object({
    body: z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(8, 'Contraseña mínima de 8 caracteres'),
      age: z.number().int().positive().optional(),
    }),
  });

  export type CreateUserDto = z.infer<typeof CreateUserSchema>['body'];

  export function validate(schema: z.ZodSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        req.body = parsed.body;
        next();
      } catch (err: any) {
        return res.status(400).json({ error: 'Validación fallida', details: err.errors });
      }
    };
  }

  app.post('/api/users', validate(CreateUserSchema), (req, res) => {
    // req.body es 100% seguro y tipado como CreateUserDto
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Duplicar interfaces de TypeScript y esquemas de validación manuales desincronizados.
  - 🟢 *Green Flag*: Utiliza `z.infer` para derivar automáticamente tipos TypeScript desde esquemas Zod en una sola fuente de verdad.

---

### 95. ¿Cómo escribir pruebas de integración con `supertest` inyectando dependencias falsas (Fakes) sin levantar bases de datos de desarrollo?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Mediante una función factoría de aplicación (`createApp(dependencies)`):
  ```typescript
  // app.ts
  export function createApp(userRepository: IUserRepository) {
    const app = express();
    app.use(express.json());

    app.post('/users', async (req, res) => {
      const user = await userRepository.save(req.body);
      res.status(201).json(user);
    });

    return app;
  }

  // app.test.ts
  import request from 'supertest';
  import { describe, it, expect } from 'vitest';

  describe('POST /users (Integration Test)', () => {
    it('debe responder 201 y retornar usuario creado usando FakeRepository en memoria', async () => {
      const fakeRepo = {
        save: async (u: any) => ({ id: 'usr-123', ...u }),
        findById: async () => null,
      };

      const app = createApp(fakeRepo);

      const response = await request(app)
        .post('/users')
        .send({ email: 'test@empresa.com' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'usr-123', email: 'test@empresa.com' });
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Crear instancias de `app` acopladas estáticamente a conexiones de bases de datos que no se pueden mockear en tests.
  - 🟢 *Green Flag*: Diseña una factoría de aplicación que permite testear endpoints HTTP puros en milisegundos con Fakes en memoria.

---

### 96. ¿Cómo testear middlewares de Express de forma aislada sin levantar un servidor HTTP completo simulando `req`, `res` y `next`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Para probar lógica de middleware unitariamente (ej. autenticación o rate limit):
  ```typescript
  import { describe, it, expect, vi } from 'vitest';
  import { authMiddleware } from './auth.middleware';

  describe('authMiddleware Unit Test', () => {
    it('debe llamar a next con error 401 si no hay cabecera de autorización', () => {
      const req = { headers: {} } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token requerido' }));
      expect(next).not.toHaveBeenCalled();
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Levantar servidores TCP reales con Supertest para probar middlewares sencillos de 10 líneas.
  - 🟢 *Green Flag*: Utiliza mocks o stubs ligeros con `vi.fn()` para verificar llamadas a `next()` de forma síncrona e instantánea.

---

### 97. ¿Cómo estructurar un pipeline de manejo de errores de dominio desacoplado de HTTP mapeando errores a RFC 7807?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Las capas de dominio no deben conocer códigos de estado HTTP (`status 404`); deben emitir excepciones de dominio ricas (`UserNotFoundError`, `InsufficientBalanceError`).
  El middleware de error de Express actúa como el adaptador de salida traduciendo errores de negocio a respuestas estandarizadas **RFC 7807 (Problem Details)**:
  ```typescript
  import { ErrorRequestHandler } from 'express';

  export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    // 1. Error de Dominio: Entidad no encontrada
    if (err instanceof EntityNotFoundError) {
      return res.status(404).json({
        type: 'https://api.empresa.com/errors/not-found',
        title: 'Recurso No Encontrado',
        status: 404,
        detail: err.message,
        instance: req.originalUrl,
      });
    }

    // 2. Error de Dominio: Invariante violado
    if (err instanceof DomainRuleViolationError) {
      return res.status(422).json({
        type: 'https://api.empresa.com/errors/unprocessable-entity',
        title: 'Regla de Negocio Incumplida',
        status: 422,
        detail: err.message,
        instance: req.originalUrl,
      });
    }

    // 3. Error no previsto (Fallo de servidor)
    console.error('Error no capturado:', err);
    return res.status(500).json({
      type: 'https://api.empresa.com/errors/internal-error',
      title: 'Error Interno del Servidor',
      status: 500,
      detail: 'Ha ocurrido un error inesperado.',
    });
  };
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Inyectar `new HttpError(404, ...)` dentro de las entidades de dominio puro o servicios de aplicación.
  - 🟢 *Green Flag*: Mantiene el dominio puro y centraliza el mapeo semántico de códigos HTTP en la capa de infraestructura.

---

### 98. ¿Cómo implementar hot-reload de código en desarrollo con TypeScript usando herramientas modernas (`tsx --watch`)?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Históricamente se utilizaba `nodemon` combinado con `ts-node`, lo que provocaba reinicios lentos (2-5 segundos por ciclo) al compilar todo el árbol de TypeScript.
  Herramientas modernas como **`tsx`** (impulsadas por esbuild) ofrecen recarga instantánea:
  ```json
  // package.json
  {
    "scripts": {
      "dev": "tsx watch --clear-screen=false src/server.ts"
    }
  }
  ```
  `tsx watch` escucha los cambios en el sistema de archivos, transpila únicamente el módulo modificado con esbuild en milisegundos y reinicia el proceso de Express en < 100ms.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Depender de pipelines pesados de compilación previa en disco (`tsc -w` con `nodemon dist/`) para desarrollo local.
  - 🟢 *Green Flag*: Conoce `tsx` o `node --watch` nativo para un bucle de feedback de desarrollo ultra-rápido.

---

### 99. ¿Cómo compilar y empaquetar una aplicación Express enterprise a un único artefacto para producción con `tsup` o `esbuild`?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  Desplegar proyectos de Node.js con miles de archivos en `node_modules` ralentiza el build de Docker y el arranque de lambdas/contenedores.
  **`tsup`** empaqueta todo el código y dependencias en un único archivo JavaScript ultra-optimizado:
  ```typescript
  // tsup.config.ts
  import { defineConfig } from 'tsup';

  export default defineConfig({
    entry: ['src/server.ts'],
    format: ['esm'],
    target: 'node20',
    clean: true,
    sourcemap: true,
    minify: true,
    // Dejar paquetes con binarios nativos de C++ fuera del bundle
    external: ['pg-native', 'bcrypt', 'sharp'],
  });
  ```
  El resultado es un único archivo `dist/server.js` de unos pocos megabytes que arranca instantáneamente y reduce el tamaño de la imagen Docker en un 80%.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar empaquetar librerías nativas con extensiones C++ (`.node`) dentro del bundle plano sin marcarlas como `external`.
  - 🟢 *Green Flag*: Optimiza artefactos de despliegue mediante tree-shaking y minificación para entornos de contenedores o serverless.

---

### 100. ¿Cuál es la estrategia recomendada de migración gradual de una aplicación legacy en Express hacia NestJS o Fastify?
- **Nivel**: Staff Engineer / Systems Architect
- **Respuesta Técnica**:
  Reescribir una aplicación enterprise completa desde cero (*Big Bang Rewrite*) casi siempre fracasa debido a regresiones y parálisis de nuevas funcionalidades.
  *Estrategia de Migración Gradual (Patrón Strangler Fig)*:
  1. **Hacia NestJS**:
     - NestJS utiliza Express como motor HTTP subyacente por defecto (`@nestjs/platform-express`).
     - Puedes montar la aplicación legacy de Express directamente dentro de NestJS como un middleware o sub-aplicación:
       ```typescript
       const app = await NestFactory.create(AppModule);
       app.use('/legacy', legacyExpressApp);
       await app.listen(3000);
       ```
     - Los nuevos módulos se desarrollan con arquitectura limpia de NestJS, y las rutas legacy se migran endpoint a endpoint.
  2. **Hacia Fastify**:
     - Desacoplar primero los controladores de `req` y `res` utilizando DTOs limpios.
     - Reemplazar librerías específicas de Express (ej. middlewares de 4 argumentos) por plugins equivalentes de Fastify.
     - Colocar un API Gateway (Envoy/Kong) delante y enrutar porcentajes de tráfico hacia la nueva versión.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Proponer congelar el desarrollo de producto durante 6 meses para reescribir todo el backend de Express.
  - 🟢 *Green Flag*: Aplica el patrón Strangler Fig para migrar incrementalmente garantizando paridad funcional y cero downtime de negocio.
