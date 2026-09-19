# 🚂 Express.js: Arquitectura, Pipelines de Middlewares y Producción Senior

Ruta de maestría técnica en **Express.js**, el framework HTTP más extendido y duradero del ecosistema Node.js. Este track desmitifica su modelo interno de tuberías (*pipelines*), el manejo de errores asíncronos, la transición crítica de **Express 4 a Express 5**, y la construcción de middlewares de grado empresarial.

---

## 🏛️ Organización del Track

```
express-js/
├── 01-fundamentals/                             # Request/Response wrappers, ciclo del socket, Routing
├── 02-middleware-pipeline/                      # El Modelo Onion, la trampa de la aridad de errores, next('route')
├── 03-express4-vs-express5/                     # Promesas nativas en v5 vs fugas de sockets colgados en v4
└── 04-senior-internals/                         # Laboratorios Ejecutables Senior
    ├── 01-async-error-handling-and-pipeline.ts   # [Lab 01: Fugas en v4 vs Captura Nativa de Rechazos en v5]
    ├── 02-custom-middleware-onion-and-tracing.ts # [Lab 02: Motor Middleware Onion, Trace IDs y res.on('finish')]
    └── 03-security-and-resilience-stack.ts       # [Lab 03: Stack Defensivo contra Body Bombs, ReDoS y CORS]
```

---

## 🧠 Matriz de Diferenciación por Seniority

| Dimensión | Junior | Intermediate | Senior / Staff |
|---|---|---|---|
| **Manejo de Errores Asíncronos** | Usar `async/await` en handlers de Express 4 sin `try/catch`, provocando que peticiones que fallan se queden colgadas para siempre (*socket hang-up*). | Envolver cada endpoint en un helper `asyncHandler(fn)` o usar el paquete `express-async-errors`. | Comprender la diferencia de arquitectura entre **Express 4** y **Express 5** (manejo nativo de `Promise.reject` en el despachador de capas), middlewares de error formateados en **RFC 7807** y saneamiento de stack traces. |
| **Middlewares y Ciclo de Vida** | Llamar `next()` después de `res.send()`, causando el error `Cannot set headers after they are sent to the client`. | Colocar middlewares en orden secuencial básico (`app.use(express.json())`). | Dominar el modelo **Onion / Pipeline**: interceptación con `res.on('finish')`, propagación de contexto con `AsyncLocalStorage` y salto condicional con `next('route')` o `next('router')`. |
| **La Trampa de la Aridad (4 Argumentos)** | Declarar un middleware de error con 3 parámetros `(err, req, res)`. | Usar los 4 parámetros `(err, req, res, next)` pero sin saber por qué funciona. | Entender que Express inspecciona `fn.length` mediante reflexión en JavaScript (`Function.prototype.length === 4`) para distinguir middlewares ordinarios de manejadores de error. |
| **Seguridad Perimetral** | No limitar el tamaño del payload JSON (`express.json()`), dejando la API vulnerable a ataques de denegación de servicio por agotamiento de RAM (*Body Limit Bomb*). | Añadir `helmet()` y `cors()` sin configuración específica. | Stack blindado: límite estricto de bytes (`limit: '100kb'`), protección contra ataques de prototipo (`proto-pollution`), Content Security Policy y sanitización estricta con Zod. |

---

## 🔬 Laboratorios Ejecutables Senior (`04-senior-internals/`)

1. **`01-async-error-handling-and-pipeline.ts`**:
   - Demostración de por qué una excepción en una función `async` en Express 4 deja el socket HTTP abierto indefinidamente hasta que el cliente agota el timeout.
   - Implementación de la solución nativa de Express 5 y del envoltorio de compatibilidad universal.

2. **`02-custom-middleware-onion-and-tracing.ts`**:
   - Reconstrucción didáctica del motor de ejecución de middlewares de Express.
   - Inyección de identificadores de traza distribuidos (`X-Correlation-ID`) y cálculo de latencia de red en microsegundos mediante el evento nativo `res.on('finish')`.

3. **`03-security-and-resilience-stack.ts`**:
   - Construcción del stack defensivo de middlewares para entornos de alta concurrencia: defensa contra *Payload Bombs*, sanitización de inputs y rate limiting perimetral.

---

## ⚡ Comandos Rápidos de Ejecución

```bash
# Laboratorios ejecutables del track de Express.js:
npm run express:senior:01   # Async Error Trap (Express 4 vs 5)
npm run express:senior:02   # Middleware Onion Pipeline & Tracing
npm run express:senior:03   # Stack Defensivo de Seguridad y Resiliencia
```
