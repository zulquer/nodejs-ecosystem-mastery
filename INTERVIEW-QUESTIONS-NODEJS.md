# 🟢 Node.js Core & Runtime Mastery: Las 100 Preguntas Más Comunes en Entrevistas Técnicas

Guía de referencia técnica profunda para preparación de entrevistas en roles de **Senior Node.js Engineer, Systems Engineer, Backend Tech Lead y Staff Engineer (V8, Libuv, Concurrencia e Internals)**.

---

## 📑 Tabla de Contenidos

1. [Motor V8, Gestión de Memoria y Garbage Collection (Preguntas 1-12)](#1-motor-v8-gestión-de-memoria-y-garbage-collection)
2. [Arquitectura Libuv, Event Loop y Microtasks (Preguntas 13-25)](#2-arquitectura-libuv-event-loop-y-microtasks)
3. [Buffers, Streams y Manejo de Backpressure (Preguntas 26-35)](#3-buffers-streams-y-manejo-de-backpressure)
4. [Concurrencia: Worker Threads, Cluster y Child Processes (Preguntas 36-43)](#4-concurrencia-worker-threads-cluster-y-child-processes)
5. [Diagnóstico, Profiling, Observabilidad y CJS vs ESM (Preguntas 44-50)](#5-diagnóstico-profiling-observabilidad-y-cjs-vs-esm)
6. [Sockets TCP/UDP, TLS/SSL y Redes de Bajo Nivel (Preguntas 51-60)](#6-sockets-tcpudp-tlsssl-y-redes-de-bajo-nivel)
7. [HTTP/2, HTTP/3 (QUIC) y WebSockets Internals (Preguntas 61-70)](#7-http2-http3-quic-y-websockets-internals)
8. [Diagnostics Channel, Tracing, OpenTelemetry y Perfilado (Preguntas 71-80)](#8-diagnostics-channel-tracing-opentelemetry-y-perfilado)
9. [Seguridad de Runtime, Permission Model y WebCrypto (Preguntas 81-90)](#9-seguridad-de-runtime-permission-model-y-webcrypto)
10. [WASI, N-API/Node-API C++ Addons y Patrones de Resiliencia (Preguntas 91-100)](#10-wasi-n-apinode-api-c-addons-y-patrones-de-resiliencia)

---

## 1. Motor V8, Gestión de Memoria y Garbage Collection

### 1. ¿Cómo compila y ejecuta JavaScript el motor V8 mediante el compilador Ignition y el optimizador TurboFan?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  V8 utiliza una arquitectura de compilación en dos fases (*Two-Tier JIT Compiler*):
  1. **Ignition (Intérprete y Compilador Rápido)**:
     - Parsea el código JavaScript a un Abstract Syntax Tree (AST) y genera **Bytecode**.
     - El arranque es instantáneo y consume poca memoria.
     - Mientras interpreta el bytecode, recolecta información de perfilado (*Inline Caching - IC* y tipos de datos que pasan por cada función).
  2. **TurboFan (Compilador JIT Optimizador)**:
     - Cuando una función se ejecuta muchas veces (*Hot Function*), TurboFan toma el bytecode y los metadatos de tipos recolectados y genera **código máquina binario ultra optimizado nativo de la CPU** (x86, ARM).
     - **Desoptimización (Deopt)**: Como JavaScript es dinámico, si una función que siempre recibía números enteros de repente recibe un string, las asunciones de TurboFan se invalidan: el motor aborta la ejecución optimizada, descarta el código máquina (*Bailout*) y regresa a la interpretación en Ignition.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que V8 interpreta JavaScript directamente desde el archivo de texto en cada ejecución.
  - 🟢 **Green Flag**: Explicar el concepto de funciones monomórficas vs polimórficas y cómo el polimorfismo excesivo provoca desoptimizaciones en TurboFan.

---

### 2. ¿Qué son los "Hidden Classes" (Shapes / Maps) en V8 y por qué el orden de asignación de propiedades altera el rendimiento?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En C++ o Java, el diseño de un objeto en memoria está fijo por su clase en tiempo de compilación. En JavaScript, los objetos pueden mutar dinámicamente sus propiedades.
  Para lograr accesos a propiedades en tiempo constante $O(1)$ sin búsquedas lentas en diccionarios:
  - V8 crea internamente estructuras ocultas llamadas **Hidden Classes (o Shapes/Maps)**:
    - Cuando se crea `const a = {};`, tiene la Hidden Class $C_0$.
    - Al hacer `a.x = 1;`, transiciona a $C_1$ con un offset en memoria para `x`.
    - Al hacer `a.y = 2;`, transiciona a $C_2$.
  - **El Problema del Orden de Asignación**:
    - Si otro objeto se inicializa en orden inverso: `b.y = 2; b.x = 1;`.
    - V8 genera una **cadena de transiciones de Hidden Classes completamente diferente**: los objetos `a` y `b` ya no comparten la misma Hidden Class.
    - El compilador no puede reutilizar las optimizaciones de **Inline Caching**, duplicando el tiempo de acceso a propiedades.
  - **Regla Senior**: Inicializar siempre todas las propiedades de los objetos en el mismo orden (típicamente dentro del constructor).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Desconocer qué es una Hidden Class en V8 y creer que los objetos en JS son simples hash maps de C++.
  - 🟢 **Green Flag**: Advertir contra el uso del operador `delete obj.prop` porque transmuta el objeto al modo diccionario lento (*Dictionary Mode / Slow Mode*).

---

### 3. ¿Cómo está segmentado el Heap de V8 (New Space, Old Space, Large Object Space, Code Space)?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  V8 divide su espacio de memoria en diferentes regiones según la naturaleza y longevidad de los objetos:
  1. **New Space (Young Generation)**:
     - Muy pequeño (típicamente 16MB a 64MB).
     - Dividido en dos semiespacios (*From-Space* y *To-Space*). Aquí nacen todos los objetos nuevos. Se limpia con el recolector ultrarrápido **Scavenger**.
  2. **Old Pointer Space & Old Data Space (Old Generation)**:
     - Almacena objetos longevos que sobrevivieron a dos ciclos de recolección en el New Space. Se limpia con **Mark-Sweep-Compact**.
  3. **Large Object Space**:
     - Objetos que superan el tamaño máximo del New Space. Se asignan directamente aquí y **nunca son movidos por el recolector de basura** para evitar el sobrecoste de copiar bloques gigantes de memoria.
  4. **Code Space**:
     - Memoria donde residen las instrucciones de código máquina compiladas por TurboFan (requiere permisos ejecutables de memoria `W^X`).
  5. **Map Space (Shape Space)**:
     - Almacena las Hidden Classes de los objetos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Pensar que el Heap de V8 es una sola bolsa de memoria no estructurada.
  - 🟢 **Green Flag**: Explicar la directiva `--max-old-space-size=4096` y detallar qué espacio de memoria se satura en escenarios de Out Of Memory.

---

### 4. ¿Cómo funciona el recolector Scavenger (Algoritmo Cheney) en la generación joven (New Space)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El New Space se divide en dos mitades contiguas de igual tamaño: **From-Space** y **To-Space**:
  1. Los objetos nuevos se asignan de forma ultra rápida en el *From-Space* incrementando un puntero de asignación secuencial.
  2. Cuando el *From-Space* se llena, se activa el **Scavenger**:
     - Recorre los objetos alcanzables desde los punteros raíz (variables locales en el stack).
     - Copia los objetos vivos de forma compacta y contigua en el *To-Space*.
     - Los objetos que ya no están referenciados se descartan simplemente ignorándolos (cero coste de barrido individual).
  3. Si un objeto ya sobrevivió a un ciclo anterior de Scavenge, es **promovido inmediatamente al Old Space** (*Tenuring*).
  4. Finalmente, se intercambian los roles de ambos semiespacios: el *To-Space* pasa a ser el nuevo *From-Space*, y el viejo *From-Space* queda 100% limpio y listo para nuevas asignaciones.
  - **Tiempo de ejecución**: Microsegundos (1-3ms), prácticamente imperceptible.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que todos los objetos en Node.js son recolectados por el mismo algoritmo pesado de barrido.
  - 🟢 **Green Flag**: Explicar por qué el algoritmo Scavenger es proporcional únicamente al número de objetos *vivos* y no al de muertos.

---

### 5. ¿Cómo funciona el Major GC (Orinoco: Mark-Sweep-Compact) en el Old Space de V8?
- **Nivel**: Staff / Principal Architect
- **Respuesta Técnica**:
  El recolector Orinoco de V8 optimizó el Major GC tradicional para eliminar las pausas que congelaban el servidor web (*Stop-the-World pauses*):
  1. **Incremental & Concurrent Marking (Marcado Concurrente)**:
     - Hilos secundarios de C++ recorren el grafo de memoria marcando objetos vivos mientras el hilo principal de JavaScript continúa ejecutando peticiones web con normalidad.
     - Se utilizan barreras de escritura (*Write Barriers*) para detectar si JavaScript muta referencias mientras se marca.
  2. **Concurrent Sweeping (Barrido Concurrente)**:
     - Hilos en segundo plano liberan la memoria de los bloques muertos sin detener el Event Loop.
  3. **Parallel Compacting (Compactación Paralela)**:
     - Reorganiza y desfragmenta las páginas de memoria del Heap para que queden bloques contiguos libres, mitigando la fragmentación de memoria en procesos de larga duración.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que el Major GC de Node.js siempre congela la ejecución durante segundos en cada ciclo.
  - 🟢 **Green Flag**: Citar las técnicas de Orinoco (Concurrent Marking con Write Barriers y Lazy Sweeping).

---

### 6. ¿Cómo se toma y analiza un Heap Snapshot de V8 para encontrar una fuga de memoria en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  1. **Generación del Snapshot**:
     - Usar el módulo nativo `node:v8`:
       ```javascript
       import v8 from 'node:v8';
       import fs from 'node:fs';

       const snapshotStream = v8.getHeapSnapshot();
       const fileStream = fs.createWriteStream(`heap-${Date.now()}.heapsnapshot`);
       snapshotStream.pipe(fileStream);
       ```
     - O mediante el Inspector Protocol enviando la señal `SIGUSR1`.
  2. **Análisis en Chrome DevTools**:
     - Abrir `chrome://inspect` $\to$ Cargar el archivo `.heapsnapshot`.
     - Comparar dos snapshots tomados en momentos distintos (*Comparison View*).
     - Filtrar por **`Objects allocated between Snapshot 1 and 2`**.
     - Identificar las clases o constructores cuyo número de instancias (`# Delta`) o tamaño retenido (`Retained Size`) no para de crecer.
     - Inspeccionar el **Retainer Tree**: revela la cadena exacta de punteros que mantiene el objeto atado a la raíz global impidiendo que el GC lo libere.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar buscar memory leaks poniendo `console.log(process.memoryUsage())` a ciegas.
  - 🟢 **Green Flag**: Distinguir rigurosamente entre **Shallow Size** (memoria propia del objeto) y **Retained Size** (memoria que se liberaría si el objeto fuera destruido junto con sus hijos).

---

### 7. ¿Qué es el "Slab Allocation" de 8KB en el módulo Buffer de Node.js y cómo puede causar una fuga de memoria sutil?
- **Nivel**: Staff / Principal Engineer
- **Respuesta Técnica**:
  Los Buffers se asignan fuera del Heap de V8 mediante memoria en C++:
  - Para buffers menores a 4KB (4096 bytes), Node.js pre-asigna un bloque continuo de **8192 bytes (8KB)** llamado *Slab* (`Buffer.poolSize`).
  - Al ejecutar `Buffer.from(pequenoString)` o `buffer.subarray(0, 10)`:
    - Node.js asigna una porción (*Slice*) dentro de ese Slab compartido de 8KB.
  - **La Fuga de Memoria Oculta**:
    - Si tu aplicación procesa un mensaje de 8KB, extrae un pequeño ID de 20 bytes con `.subarray()` y guarda ese pequeño buffer en una variable global o caché en memoria:
    - Como el pequeño buffer mantiene una referencia viva a la memoria base del Slab, **el Garbage Collector NO puede liberar ninguno de los 8192 bytes de memoria C++ subyacente**.
    - Retener 100 pequeños buffers de 20 bytes puede terminar reteniendo **800 Kilobytes de RAM** en memoria nativa sin justificación.
  - **Solución**: Usar `Buffer.copy()` hacia un buffer nuevo independiente de tamaño exacto.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que cada Buffer en Node.js asigna un bloque de memoria independiente en el kernel de Linux.
  - 🟢 **Green Flag**: Citar `Buffer.poolSize = 8192` y la diferencia entre `.slice()` / `.subarray()` (vista compartida) vs `.copy()` (clonación física).

---

### 8. ¿Por qué `Buffer.allocUnsafe()` es peligroso para la seguridad si no se limpia inmediatamente?
- **Nivel**: Junior / Mid-Level / Security
- **Respuesta Técnica**:
  - **`Buffer.alloc(size)`**: Asigna la memoria y escribe ceros (`0x00`) en cada uno de los bytes (*Zero-Fill*), garantizando que no contenga datos residuales previos, a costa de un ligero sobrecoste de CPU.
  - **`Buffer.allocUnsafe(size)`**: Asigna el bloque de memoria de forma instantánea **SIN limpiar ni sobreescribir los datos que residían previamente en esa región de la memoria RAM**.
  - **Peligro de Seguridad**:
    - Si ese buffer se envía por la red hacia un cliente antes de llenarlo por completo con datos nuevos, **el cliente recibirá fragmentos residuales de memoria de la aplicación**: contraseñas en texto claro, tokens JWT de otros usuarios, claves privadas TLS o fragmentos de código fuente.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `Buffer.allocUnsafe()` por defecto en toda la aplicación para "hacerla más rápida" sin garantizar que se sobreescriba cada byte.
  - 🟢 **Green Flag**: Recordar la vulnerabilidad histórica del ecosistema npm donde paquetes emitían buffers inseguros hacia sockets de internet.

---

### 9. ¿Cuál es la diferencia entre `process.memoryUsage()` y las métricas del sistema operativo?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El método `process.memoryUsage()` desglosa el consumo interno de Node.js:
  - **`rss` (Resident Set Size)**: La cantidad total de memoria física RAM asignada al proceso por el kernel del sistema operativo (incluye el Heap, el Stack de C++, código compilado y módulos nativos).
  - **`heapTotal`**: El tamaño total de memoria reservado para el Heap de V8.
  - **`heapUsed`**: La memoria real ocupada actualmente por objetos, strings y closures vivos de JavaScript.
  - **`external`**: Memoria en C++ enlazada a objetos de JavaScript (como los `ArrayBuffers` y descriptores de Libuv).
  - **`arrayBuffers`**: Memoria asignada específicamente para `Buffer`s y `SharedArrayBuffer`s.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Mirar únicamente `heapUsed` para diagnosticar un Out of Memory en contenedores de Docker (un pod muere por límite de RSS impuesto por los cgroups de Linux, el cual incluye memoria externa).
  - 🟢 **Green Flag**: Explicar la discrepancia entre `heapTotal` y `rss` debida a la fragmentación de páginas del sistema operativo.

---

### 10. ¿Cómo afecta el tamaño del Heap (`--max-old-space-size`) al despliegue en contenedores de Kubernetes?
- **Nivel**: Senior / Staff / DevOps
- **Respuesta Técnica**:
  Por defecto, en versiones de Node.js antiguas el límite del Old Space se calculaba en 1.4GB o basándose en la RAM total del nodo físico y no en los límites del cgroup del contenedor.
  - Si un pod de Kubernetes tiene un límite de memoria de `resources.limits.memory = 1000Mi` y Node.js se configura con `--max-old-space-size=1500`:
    - V8 no activará su recolección de basura agresiva porque cree que aún tiene espacio libre.
    - El consumo de memoria RSS crecerá hasta sobrepasar los 1000MB del pod.
    - El kernel de Linux activará el **OOM Killer** y terminará abruptamente el proceso (`Exit Code 137 / OOMKilled`).
  - **Regla de Dimensionamiento Senior**:
    $$\text{--max-old-space-size} \le \text{Límite de RAM del Contenedor} \times 0.75$$
    Reservar al menos un **25% de margen** para la memoria del runtime en C++, buffers externos, pila de hilos de Libuv y descriptores del sistema operativo.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Configurar `--max-old-space-size` igual al límite exacto de memoria del pod en Kubernetes.
  - 🟢 **Green Flag**: Conocer las mejoras de detección automática de cgroups de memoria integradas en Node.js 20+.

---

### 11. ¿Qué es el "Inline Caching" (IC) y cómo optimiza V8 el acceso a propiedades de objetos?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Acceder a una propiedad (`user.name`) requeriría buscar la clave en una tabla Hash en cada llamada.
  - **Inline Caching**:
    - V8 almacena en el propio sitio de la llamada del bytecode un caché de la **Hidden Class** del objeto y el **offset numérico exacto en memoria** donde reside esa propiedad.
    - En las siguientes llamadas, si el objeto entrante tiene la misma Hidden Class, V8 salta directamente a la dirección de memoria en una sola instrucción de CPU.
  - **Estados de Inline Cache**:
    1. **Monomorphic (Monomórfico - Estado Óptimo)**: El sitio de la llamada siempre recibe objetos con la **misma Hidden Class**. Velocidad máxima de compilación nativa en TurboFan.
    2. **Polymorphic (Polimórfico)**: Recibe entre 2 y 4 Hidden Classes diferentes. TurboFan genera una pequeña cadena de comprobaciones condicionales.
    3. **Megamorphic (Megamórfico - Degenerado)**: Recibe más de 4 Hidden Classes distintas. V8 se rinde, desoptimiza la función y pasa a una búsqueda genérica lenta en diccionarios.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Pasar objetos con estructuras totalmente diferentes a funciones de alta frecuencia de cálculo.
  - 🟢 **Green Flag**: Diseñar objetos con formas idénticas (mismas propiedades inicializadas con `null`) para preservar el estado Monomórfico.

---

### 12. ¿Por qué crear objetos con propiedades dinámicas aleatorias degrada el rendimiento de la CPU en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Cuando agregas y eliminas propiedades dinámicamente de objetos (`delete obj.prop` o agregando propiedades en orden aleatorio):
  - El motor V8 abandona el modelo de Hidden Classes y convierte el objeto al modo **Slow Dictionary Mode (Hash Table en C++)**.
  - Cada acceso a propiedad se convierte en un hash lookup lento en lugar de un offset de memoria directo.
  - Impide la vectorización de bucles e invalida las optimizaciones JIT de TurboFan.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar el operador `delete` en código de alto rendimiento (en su lugar, asignar `obj.prop = undefined` o usar un `Map`).
  - 🟢 **Green Flag**: Recomendar la clase nativa `Map` para colecciones con claves dinámicas arbitrarias y reservar `Object` para estructuras con esquemas fijos.

---

## 2. Arquitectura Libuv, Event Loop y Microtasks

### 13. ¿Cuáles son las 6 fases del Event Loop en Libuv y en qué orden exacto se ejecutan?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El Event Loop de Libuv itera en un bucle continuo compuesto por 6 fases principales:
  1. **Timers**: Ejecuta los callbacks programados por `setTimeout()` y `setInterval()` cuyos tiempos hayan expirado.
  2. **Pending Callbacks (I/O Callbacks)**: Ejecuta callbacks de operaciones del sistema operativo diferidas (como errores de red `ECONNREFUSED` de ciertos sockets TCP).
  3. **Idle, Prepare**: Utilizada internamente por Libuv para operaciones preparatorias de housekeeping.
  4. **Poll**: Recupera nuevos eventos de I/O (lectura de sockets, disco). Calcula cuánto tiempo debe bloquearse esperando eventos del sistema operativo (`epoll`/`kqueue`) y ejecuta los callbacks de I/O completados.
  5. **Check**: Fase dedicada exclusivamente a ejecutar callbacks programados por **`setImmediate()`**.
  6. **Close Callbacks**: Ejecuta callbacks de cierre de recursos y sockets (ej. `socket.on('close', ...)`).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Responder que `process.nextTick()` y las Promesas son una "fase" del Event Loop.
  - 🟢 **Green Flag**: Aclarar que las colas de Microtasks (`process.nextTick` y `Promise`) **NO son fases del Event Loop**: son colas intermedias que se vacían por completo **entre cada fase individual** y después de cada callback individual en JavaScript.

---

### 14. ¿Cuál es la diferencia de ejecución entre `process.nextTick()` y `queueMicrotask()` / `Promise.then()`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Ambos programan Microtareas, pero residen en colas separadas con diferente precedencia en Node.js:
  1. **NextTick Queue (`process.nextTick`)**:
     - Gestionada por Node.js en C++.
     - **Tiene prioridad absoluta sobre todas las demás microtareas**.
     - Antes de que Node.js evalúe cualquier promesa resuelta, **vacía la cola de nextTicks en su totalidad**.
  2. **Microtask Queue (`Promise.resolve().then()`, `queueMicrotask()`)**:
     - Gestionada por el estándar de ECMAScript en V8.
     - Se ejecuta inmediatamente después de que la cola de `process.nextTick` se vacía a cero.
  - **Orden Determinista**:
    ```javascript
    Promise.resolve().then(() => console.log('Promise'));
    process.nextTick(() => console.log('nextTick'));
    // Salida garantizada:
    // 1. nextTick
    // 2. Promise
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que `queueMicrotask` y `process.nextTick` son sinónimos idénticos.
  - 🟢 **Green Flag**: Explicar que `queueMicrotask` es el estándar multiplataforma moderno de la web (HTML5/ECMAScript), mientras que `process.nextTick` es exclusivo de Node.js.

---

### 15. ¿Cuándo se ejecuta `setImmediate()` antes que `setTimeout(fn, 0)` y cuándo se invierte el orden?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El comportamiento depende del contexto de ejecución:
  - **Caso 1: En el módulo principal (Top-Level Scope)**:
    ```javascript
    setTimeout(() => console.log('timeout'), 0);
    setImmediate(() => console.log('immediate'));
    ```
    - **El orden es NO DETERMINISTA** (aleatorio):
    - `setTimeout(fn, 0)` se normaliza internamente a `setTimeout(fn, 1)` (1 milisegundo mínimo).
    - Si la CPU de la máquina tarda menos de 1ms en iniciar el Event Loop, el timer aún no ha expirado cuando entra a la fase de Timers: el loop salta a Poll/Check y ejecuta `setImmediate` primero. Si tarda más de 1ms, ejecuta `setTimeout` primero.
  - **Caso 2: Dentro de un ciclo de I/O (ej. dentro de un callback de `fs.readFile`)**:
    ```javascript
    fs.readFile('file.txt', () => {
      setTimeout(() => console.log('timeout'), 0);
      setImmediate(() => console.log('immediate'));
    });
    ```
    - **`setImmediate` SIEMPRE se ejecuta primero con 100% de garantía**.
    - Razón: El callback de `fs.readFile` se ejecuta en la fase de **Poll**. La siguiente fase inmediata en el ciclo de Libuv es la fase de **Check** (donde corre `setImmediate`), antes de que el loop vuelva a dar la vuelta completa para llegar a Timers.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Afirmar categóricamente que `setTimeout(0)` siempre se ejecuta antes que `setImmediate`.
  - 🟢 **Green Flag**: Explicar la mecánica de la fase Poll $\to$ Check para justificar por qué en callbacks de I/O `setImmediate` tiene la garantía absoluta de ganar.

---

### 16. ¿Qué es el Event Loop Lag y cómo medirlo con `perf_hooks.monitorEventLoopDelay()`?
- **Nivel**: Senior / Staff / SRE
- **Respuesta Técnica**:
  El Event Loop Lag es el retraso temporal que experimenta el loop de Libuv debido a que el hilo principal de JavaScript está bloqueado ejecutando código síncrono intensivo de CPU:
  - Si programas un timer para dentro de 10ms pero el hilo principal estuvo ejecutando un bucle de ordenamiento durante 50ms, el timer tardará 60ms en ejecutarse (un lag de 50ms).
  - **Medición de Producción**:
    ```javascript
    import { monitorEventLoopDelay } from 'node:perf_hooks';

    const histogram = monitorEventLoopDelay({ resolution: 10 }); // Muestrea cada 10ms
    histogram.enable();

    setInterval(() => {
      console.log(`Event Loop Lag p50: ${histogram.percentile(50) / 1e6}ms`);
      console.log(`Event Loop Lag p99: ${histogram.percentile(99) / 1e6}ms`);
      histogram.reset();
    }, 5000);
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar medir el lag con un simple `setInterval` manual (el propio timer manual sufre del lag que intenta medir).
  - 🟢 **Green Flag**: Utilizar el histograma nativo de nanosegundos en C++ que provee `monitorEventLoopDelay` y exportar métricas a Prometheus.

---

### 17. ¿Cómo interactúa Libuv con las llamadas al sistema del kernel de Linux (`epoll`), macOS (`kqueue`) y Windows (`IOCP`)?
- **Nivel**: Staff / Principal Systems Engineer
- **Respuesta Técnica**:
  Libuv es una capa de abstracción multiplataforma en C para I/O asíncrono no bloqueante:
  - En lugar de mantener un hilo bloqueado por cada conexión de socket abierta:
  - En **Linux**: Registra los descriptores de archivo (*File Descriptors - FDs*) en el subsistema del kernel **`epoll`**. El kernel de Linux notifica a Libuv únicamente cuando un socket tiene bytes listos para leer o enviar.
  - En **macOS/BSD**: Utiliza **`kqueue`**.
  - En **Windows**: Utiliza **`IOCP` (Input/Output Completion Ports)**, que opera bajo un modelo proactivo de compleción en lugar de readiness.
  - Esto permite que un único hilo de Node.js gestione más de **100,000 conexiones concurrentes** de sockets de red con consumo de memoria mínimo.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Confundir el multiplexado de sockets en el kernel (`epoll`) con el Thread Pool interno de Libuv.
  - 🟢 **Green Flag**: Explicar la diferencia entre notificación por nivel (*Level-Triggered*) y notificación por borde (*Edge-Triggered*) en llamadas al kernel.

---

### 18. ¿Por qué las operaciones de sistema de archivos (`fs`) se ejecutan en el Thread Pool de Libuv y no en el Event Loop directo?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  A diferencia de los sockets de red (donde `epoll` permite I/O no bloqueante estandarizado en todos los sistemas operativos):
  - Los kernels de los sistemas operativos tradicionales (Linux/Windows/macOS) **NO ofrecen APIs verdaderamente no bloqueantes y asíncronas para el sistema de archivos ordinario**. Incluso con llamadas asíncronas, operaciones como abrir un archivo, lectura de metadatos (`stat`) o bloqueos de inodos pueden bloquear el hilo a nivel de kernel.
  - **La Solución de Libuv**:
    - Para que las llamadas a `fs.readFile()` parezcan asíncronas y no bloqueen el Event Loop de JavaScript, Libuv **envía la llamada síncrona de C hacia su piscina de hilos en segundo plano (Thread Pool)**.
    - El hilo secundario del Thread Pool ejecuta la operación bloqueante en el disco; al terminar, encola el callback en el Event Loop principal para que JavaScript reciba los datos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que el I/O de disco corre directamente en el kernel mediante `epoll` igual que los sockets de red.
  - 🟢 **Green Flag**: Conocer tecnologías modernas de kernel emergentes en Linux como **`io_uring`**, diseñada para I/O de disco no bloqueante real.

---

### 19. ¿Cuál es el valor por defecto de `UV_THREADPOOL_SIZE` y cómo optimizarlo para cargas pesadas de I/O de disco o Criptografía?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - El tamaño por defecto del Thread Pool de Libuv es de **4 hilos**.
  - Puede aumentarse hasta un máximo de **1024 hilos** mediante la variable de entorno:
    ```bash
    UV_THREADPOOL_SIZE=64 node server.js
    ```
  - **Punto Crítico**: Debe configurarse **ANTES de que el proceso de Node.js arranque**. No se puede modificar dinámicamente desde dentro del código de JavaScript con `process.env.UV_THREADPOOL_SIZE = 64` una vez que Libuv ha inicializado su piscina.
  - **Cuándo incrementarlo**: En servidores que realizan operaciones criptográficas intensivas simultáneas (`crypto.pbkdf2`, `bcrypt`), compresión continua (`zlib`) o cientos de lecturas concurrentes de disco.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar cambiar `UV_THREADPOOL_SIZE` dentro de un script de JavaScript tras el arranque del runtime.
  - 🟢 **Green Flag**: Advertir que fijar un valor desproporcionado (ej. 500 hilos en una máquina de 4 núcleos) provocará degradación de rendimiento por cambios de contexto (*Context Switching*) excesivos en la CPU.

---

### 20. ¿Qué operaciones de la API estándar de Node.js consumen hilos del Thread Pool de Libuv?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Las 4 familias de APIs que consumen hilos del Thread Pool de Libuv:
  1. **Sistema de Archivos (`fs`)**: Todas las funciones asíncronas de archivos (`fs.promises.*`, `fs.readFile`, `fs.writeFile`, `fs.readdir`).
  2. **Resolución DNS (`dns.lookup`)**: Porque utiliza la llamada síncrona bloqueante `getaddrinfo()` de la biblioteca C estándar del sistema operativo.
  3. **Criptografía (`crypto`)**: Funciones asíncronas de cálculo de hashes y cifrado pesado (`crypto.pbkdf2()`, `crypto.scrypt()`, `crypto.randomBytes()`, `crypto.generateKeyPair()`).
  4. **Compresión (`zlib`)**: Operaciones asíncronas de compresión y descompresión (`zlib.gzip`, `zlib.deflate`, `zlib.brotliCompress`).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Pensar que las llamadas HTTP con `fetch()` o sockets con `net.connect()` consumen hilos de Libuv (los sockets de red son atendidos por el Event Loop directo).
  - 🟢 **Green Flag**: Diferenciar `dns.lookup()` (usa Thread Pool) frente a `dns.resolve()` (usa canales de red asíncronos nativos sin consumir hilos de Libuv).

---

### 21. ¿Qué es el fenómeno de "Microtask Starvation" y cómo un bucle de `process.nextTick` congela el servidor?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El Event Loop de Libuv solo avanza a la siguiente fase (o atiende nuevos eventos de red en Poll) **después de haber vaciado por completo la cola de microtareas**.
  Si el código ejecuta llamadas recursivas continuas a `process.nextTick()`:
  ```javascript
  function recurse() {
    process.nextTick(recurse); // Agrega tareas a la cola más rápido de lo que se vacía
  }
  recurse();
  ```
  - Cada vez que una microtarea termina, la siguiente ya está esperando en la cola.
  - **El Event Loop queda atrapado en un bucle infinito en la fase actual**.
  - Los sockets de red dejan de recibir peticiones, las conexiones activas quedan congeladas, los temporizadores no se disparan y la aplicación deja de responder a health checks, provocando la caída completa del servidor.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que Node.js tiene un temporizador que interrumpe bucles de microtareas infinitos de forma automática.
  - 🟢 **Green Flag**: Utilizar `setImmediate()` en su lugar cuando se requiere procesar trabajo recursivo en lotes sin bloquear el I/O del servidor.

---

### 22. ¿Cómo se utiliza `setImmediate()` para "trocear" (Chunking) tareas de CPU intensivas y ceder el control al Event Loop?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Si tienes que iterar sobre un array de 1,000,000 de elementos y ejecutar un cálculo de CPU:
  - Ejecutarlo en un bucle `for` síncrono ordinario bloqueará el hilo principal durante 500ms, disparando el lag y retrasando peticiones de red.
  - **Técnica de Chunking con `setImmediate`**:
    ```javascript
    function processInChunks(items, index = 0, chunkSize = 1000) {
      const end = Math.min(index + chunkSize, items.length);

      for (let i = index; i < end; i++) {
        compute(items[i]); // Procesa un lote pequeño de 1,000 elementos
      }

      if (end < items.length) {
        // Cede el control al Event Loop; atiende peticiones de red antes del siguiente lote:
        setImmediate(() => processInChunks(items, end, chunkSize));
      }
    }
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `process.nextTick()` para trocear tareas (provoca Starvation del Event Loop igual que un bucle síncrono).
  - 🟢 **Green Flag**: Explicar la nueva API nativa de navegadores/Node.js `scheduler.yield()` como la evolución estándar de este patrón.

---

### 23. ¿Cuál es el orden de resolución del siguiente bloque de código asíncrono y por qué?
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
process.nextTick(() => console.log('4'));
setImmediate(() => console.log('5'));
console.log('6');
```
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **Salida exacta garantizada**:
    1. `1` (Síncrono en Stack principal).
    2. `6` (Síncrono en Stack principal).
    3. `4` (Microtask Queue: `process.nextTick` tiene máxima prioridad).
    4. `3` (Microtask Queue: `Promise` se vacía tras los nextTicks).
    5. `2` o `5` (Macrotasks: depende de si el timer de 1ms expiró antes de entrar a Timers o Check; en top-level el orden entre `2` y `5` es no determinista).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Decir que el `3` o el `4` se imprimen al final después del `2`.
  - 🟢 **Green Flag**: Explicar por qué `4` precede a `3` y señalar el no-determinismo exacto entre `2` y `5` en el scope global.

---

### 24. ¿Qué es el método `server.closeAllConnections()` introducido en Node.js 18.2+ y cómo mejora el Graceful Shutdown?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Tradicionalmente, `server.close()` solo dejaba de aceptar conexiones nuevas; esperaba pacientemente a que las conexiones abiertas se cerraran por sí mismas:
  - **El Problema con HTTP Keep-Alive**: Los navegadores y balanceadores modernos mantienen conexiones TCP inactivas (*Idle Keep-Alive*) abiertas durante minutos esperando futuras peticiones. Con `server.close()`, el proceso de Node.js podía tardar minutos en apagarse hasta que expirara el timeout de Keep-Alive de los clientes inactivos.
  - **Métodos Modernos de Node.js 18.2+**:
    - **`server.closeIdleConnections()`**: Cierra inmediatamente todos los sockets TCP que no estén procesando activamente una petición en ese milisegundo, permitiendo un apagado ultrarrápido sin interrumpir peticiones activas.
    - **`server.closeAllConnections()`**: Destruye forzadamente el 100% de los sockets abiertos del servidor de inmediato.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Rastrear sockets manualmente en arrays globales escuchando el evento `server.on('connection')` en proyectos modernos.
  - 🟢 **Green Flag**: Combinar `server.close()` con `server.closeIdleConnections()` en el script de terminación de Kubernetes para reducir el tiempo de drenado de pods a segundos.

---

### 25. ¿Cómo funciona la arquitectura de Señales del Sistema Operativo (`process.on('SIGTERM')`) en contenedores Docker de Node.js?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Cuando Docker o Kubernetes detiene un contenedor:
  1. El orquestador envía la señal POSIX **`SIGTERM`** al proceso principal con **PID 1** dentro del contenedor.
  2. La aplicación debe escuchar la señal:
     ```javascript
     process.on('SIGTERM', async () => {
       console.log('Señal SIGTERM recibida. Cerrando recursos ordenadamente...');
       await cleanup();
       process.exit(0);
     });
     ```
  3. **El Error Clásico de Docker**: Si en el `Dockerfile` escribes `CMD npm start` en lugar de `CMD ["node", "server.js"]`:
     - El PID 1 será el proceso shell de `npm`.
     - Por defecto en Linux, **PID 1 no reenvía las señales POSIX a los sub-procesos hijos**.
     - El script de Node.js nunca recibirá la señal `SIGTERM`, ignorará el Graceful Shutdown y Kubernetes terminará matando el contenedor forzadamente con `SIGKILL` tras 30 segundos, cortando transacciones de datos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `CMD npm start` o sintaxis de shell de texto en Dockerfiles de producción.
  - 🟢 **Green Flag**: Usar la sintaxis Exec Form `CMD ["node", "dist/server.js"]` o utilizar gestores ligeros de init como **`tini`** para adopción correcta del PID 1.

---

## 3. Buffers, Streams y Manejo de Backpressure

### 26. ¿Cuáles son los 4 tipos fundamentales de Streams en Node.js y en qué se diferencian?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  1. **`Readable Stream`**: Fuente de datos de solo lectura que emite eventos `'data'`, `'end'`, `'error'`. Permite leer fragmentos de datos bajo demanda (ej. `fs.createReadStream`, `req` en un servidor HTTP).
  2. **`Writable Stream`**: Destino de datos de solo escritura que implementa los métodos `.write(chunk)` y `.end()`, emitiendo eventos `'drain'`, `'finish'` (ej. `fs.createWriteStream`, `res` en HTTP).
  3. **`Duplex Stream`**: Stream que implementa simultáneamente las interfaces de Readable y Writable de forma independiente (los datos leídos no están necesariamente vinculados a los escritos). Ejemplo: un socket de red TCP (`net.Socket`).
  4. **`Transform Stream`**: Tipo especializado de Duplex Stream donde **los datos de salida se computan transformando los datos de entrada en tiempo real**. Ejemplo: compresión de datos con `zlib.createGzip()` o cifrado con `crypto.createCipheriv()`.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Confundir un Duplex Stream con un Transform Stream (en un Duplex el canal de entrada y salida son independientes; en un Transform están conectados mediante una función `_transform`).
  - 🟢 **Green Flag**: Demostrar la creación de un Transform Stream personalizado extendiendo de `stream.Transform` e implementando `_transform(chunk, encoding, callback)`.

---

### 27. ¿Cómo se produce el fenómeno de Backpressure y cómo gestionarlo manualmente con el evento `'drain'`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Ocurre cuando la tasa de producción de datos supera la tasa de consumo:
  ```javascript
  const readable = fs.createReadStream('huge-file.mp4');
  const writable = fs.createWriteStream('destination.mp4');

  readable.on('data', (chunk) => {
    // Si el buffer interno del Writable se llena (supera el highWaterMark):
    const canContinue = writable.write(chunk);
    if (!canContinue) {
      // 1. Pausamos la lectura inmediatamente para no saturar la RAM:
      readable.pause();
    }
  });

  // 2. Cuando el buffer interno del destino se drena físicamente en el disco:
  writable.on('drain', () => {
    // 3. Reanudamos la lectura del origen:
    readable.resume();
  });
  ```
  Si se ignora el valor de retorno de `write(chunk)` y no se pausa el stream, Node.js acumulará todos los chunks excedentes en la memoria RAM del proceso, disparando el uso de memoria hasta colapsar el servidor con un Out Of Memory.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Desconocer qué indica el valor de retorno booleano de `writable.write(chunk)`.
  - 🟢 **Green Flag**: Saber que `stream.pipeline()` implementa toda esta máquina de estados de pausa y reanudación automáticamente en C++.

---

### 28. ¿Por qué `readable.pipe(writable)` es considerado un antipatrón en código moderno de producción y qué lo sustituye?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El método `.pipe()` arrastra una limitación de diseño histórica:
  - **No gestiona la propagación ni limpieza de errores**:
    Si el `readable` o el `writable` arrojan un error a mitad de la transmisión (ej. socket cerrado por el cliente):
    - `.pipe()` **NO destruye el otro extremo del stream automáticamente**.
    - Los descriptores de archivo permanecen abiertos en el kernel de Linux (`File Descriptor Leak`) y los streams quedan colgados en memoria.
  - **El Estándar Moderno Obligatorio**:
    La utilidad nativa **`stream.pipeline()`** del módulo `node:stream/promises`:
    ```javascript
    import { pipeline } from 'node:stream/promises';

    try {
      await pipeline(
        fs.createReadStream('input.tar'),
        zlib.createGzip(),
        fs.createWriteStream('output.tar.gz'),
      );
      console.log('Canalización completada con éxito');
    } catch (err) {
      console.error('La canalización falló de forma limpia y todos los streams fueron destruidos:', err);
    }
    ```
    Si cualquier stream en la cadena falla, `pipeline()` destruye inmediatamente todos los streams involucrados y cierra los descriptores de archivo de forma segura.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Seguir escribiendo `stream.pipe(res)` en aplicaciones críticas sin escuchar los eventos de error.
  - 🟢 **Green Flag**: Destacar la integración de `pipeline()` con promesas asíncronas (`async/await`) y soporte para `AbortSignal`.

---

### 29. ¿Qué es `highWaterMark` en la configuración de Streams y cómo afecta al consumo de memoria y throughput?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `highWaterMark` define el tamaño máximo del búfer interno que un stream puede acumular antes de activar el Backpressure:
  - **Valores por Defecto**:
    - Streams binarios ordinarios: **64 KB** (en `fs` streams) o **16 KB** (en streams genéricos de red).
    - Streams en modo objeto (`objectMode: true`): **16 objetos**.
  - **Afinación de Rendimiento (Tuning)**:
    - Si se transfiere tráfico masivo en redes locales de 10 Gbps, aumentar `highWaterMark` a 1MB o 4MB reduce el número de pausas de I/O y maximiza el throughput saturando la tarjeta de red.
    - Si el servidor tiene memoria RAM limitada y atiende 10,000 streams simultáneos, reducir `highWaterMark` mantiene el consumo de memoria acotado evitando colapsos del servidor.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que `highWaterMark` impone un límite estricto de seguridad que impide físicamente escribir más bytes (solo es un umbral que retorna `false` en `write()`).
  - 🟢 **Green Flag**: Explicar la diferencia de métrica de `highWaterMark` en modo binario (bytes) frente a modo objeto (número de referencias a objetos).

---

### 30. ¿Cómo funciona la API de Generadores Asíncronos (`for await...of`) en el consumo de Streams de Node.js?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Desde Node.js 10+, todos los Readable Streams implementan el protocolo del **Iterador Asíncrono (`Symbol.asyncIterator`)**:
  ```javascript
  import fs from 'node:fs';

  async function processLogs(filePath) {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    // Consumo natural sin callbacks ni eventos:
    for await (const chunk of stream) {
      console.log(`Chunk recibido de longitud: ${chunk.length}`);
      await processChunk(chunk); // ¡Aplica Backpressure automático natural!
    }
  }
  ```
  - **Ventaja de Rendimiento Crítica**: Como el bucle `for await...of` espera a que el cuerpo del bucle resuelva su promesa antes de pedir el siguiente chunk al stream, **el Backpressure se gestiona de forma implícita y automática sin escribir código de pausa o resume**.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escribir complejos listeners de eventos `.on('data')` y `.on('end')` cuando la sintaxis declarativa `for await...of` resuelve el problema limpiamente.
  - 🟢 **Green Flag**: Advertir que si el bucle arroja una excepción, el iterador asíncrono destruye el stream de forma determinista equivaliendo a un bloque `finally`.

---

### 31. ¿Qué es y cómo se usa `stream.finished()` para detectar la finalización segura de un stream?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Detectar cuándo un stream ha terminado de procesar datos es engañoso:
  - Un Readable emite `'end'`.
  - Un Writable emite `'finish'`.
  - Un socket TCP emite `'close'`.
  - Y cualquiera puede emitir `'error'`.
  - **La Utilidad `stream.finished()`**:
    Provee una función única universal compatible con Promesas que se resuelve **cuando el stream se ha completado satisfactoriamente o cuando se ha destruido prematuramente por un error**:
    ```javascript
    import { finished } from 'node:stream/promises';

    const writeStream = fs.createWriteStream('file.txt');
    writeStream.write('Hola ');
    writeStream.end('Mundo');

    // Espera de forma determinista:
    await finished(writeStream);
    console.log('El archivo está 100% volcado y cerrado en disco.');
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Escuchar únicamente el evento `'finish'` y no enterarse de que el stream fue abortado con un error antes de cerrarse.
  - 🟢 **Green Flag**: Utilizar `finished()` en controladores de Express antes de emitir la respuesta al cliente.

---

### 32. ¿Qué diferencia hay entre `Buffer.from()`, `Buffer.alloc()` y `Buffer.allocUnsafeSlow()`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - **`Buffer.alloc(size)`**: Asigna memoria segura limpia con ceros (`0x00`). Utiliza el Slab pool de 8KB si el tamaño es pequeño.
  - **`Buffer.from(array/string/buffer)`**: Crea un nuevo buffer copiando los datos del origen proporcionado. Si es pequeño, se asigna dentro del Slab compartido de 8KB.
  - **`Buffer.allocUnsafeSlow(size)`**:
    - Asigna un buffer no inicializado **FORZANDO a que se asigne de forma completamente independiente fuera del Slab pool de 8KB de Node.js**.
    - Utiliza `malloc` directo en C++.
    - **Cuándo usarlo**: Cuando sabes que vas a retener este buffer en memoria durante mucho tiempo (ej. una caché global) y deseas **garantizar que no mantenga atado un Slab completo de 8KB en memoria RAM**.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: No conocer la existencia de `allocUnsafeSlow()` ni su impacto en la prevención de fragmentación del Slab pool.
  - 🟢 **Green Flag**: Explicar cómo la palabra "Slow" en el nombre no significa que la ejecución sea lenta, sino que se salta la piscina rápida pre-asignada de Node.js.

---

### 33. ¿Cómo funciona la codificación de caracteres y por qué `buffer.toString('utf-8')` puede corromper caracteres multibyte si se trocea a mitad?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  En UTF-8, los caracteres en inglés (ASCII) ocupan 1 byte, pero caracteres con acentos, letras en cirílico o emojis ocupan **entre 2 y 4 bytes** (ej. un emoji `🚀` son 4 bytes en memoria: `F0 9F 9A 80`).
  - Si un stream divide un chunk de lectura en el byte número 2 de un emoji de 4 bytes:
    - Al llamar a `chunk1.toString('utf-8')`, V8 no puede interpretar los 2 bytes incompletos y los reemplaza por el carácter de reemplazo Unicode corrupto: **``**.
    - Al llegar el siguiente chunk con los otros 2 bytes, también se corrompe.
  - **La Solución Nativa con `StringDecoder`**:
    ```javascript
    import { StringDecoder } from 'node:string_decoder';
    const decoder = new StringDecoder('utf-8');

    // StringDecoder retiene internamente los bytes incompletos en un buffer auxiliar
    // y solo los emite cuando el carácter multibyte está completo:
    const str1 = decoder.write(chunk1);
    const str2 = decoder.write(chunk2);
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Convertir chunks de streams de texto llamando a `chunk.toString()` directamente en cada evento `'data'`.
  - 🟢 **Green Flag**: Explicar el uso de `StringDecoder` o configurar la opción `{ encoding: 'utf-8' }` en el propio `createReadStream`.

---

### 34. ¿Qué es el método `stream.compose()` introducido en Node.js moderno?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  `stream.compose()` permite combinar múltiples Transform Streams o funciones generadoras en un único stream unificado y reutilizable:
  ```javascript
  import { compose } from 'node:stream';

  const transformPipeline = compose(
    split2(), // Divide por saltos de línea
    async function* (source) {
      for await (const line of source) {
        yield JSON.parse(line);
      }
    },
    zlib.createGzip(),
  );

  // Se puede reutilizar como una sola tubería estándar:
  fs.createReadStream('logs.txt').pipe(transformPipeline).pipe(res);
  ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Encadenar manualmente 5 llamadas a `.pipe()` creando código verboso y difícil de componer.
  - 🟢 **Green Flag**: Utilizar funciones generadoras asíncronas (`async function*`) directamente como Transform Streams dentro de `compose()`.

---

### 35. ¿Cómo implementar un Duplex Stream personalizado y cuándo es necesario?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Se extiende de la clase `stream.Duplex` y se implementan obligatoriamente dos métodos en C++/JS:
  1. `_read(size)`: Alimentar datos al buffer de lectura mediante `this.push(data)`.
  2. `_write(chunk, encoding, callback)`: Escribir los datos recibidos en el destino subyacente y llamar a `callback()`.
  - **Caso de Uso**: Canales de comunicación bidireccional sobre protocolos binarios propietarios, clientes de túneles SSH/VPN o emuladores de sockets en memoria para pruebas de integración.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar implementar un stream Duplex implementando solo `_write` (arrojará un error de método no implementado).
  - 🟢 **Green Flag**: Explicar la independencia de los dos buffers internos (el buffer de lectura y el buffer de escritura no comparten datos por defecto).

---

## 4. Concurrencia: Worker Threads, Cluster y Child Processes

### 36. ¿Cómo se comunican los Worker Threads mediante `postMessage()` y cuál es la diferencia entre Clonación Estructurada y Transferencia de Memoria (`Transferable Objects`)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - **Clonación Estructurada (Structured Clone Algorithm - Por Defecto)**:
    - Cuando envías un objeto con `worker.postMessage(data)`:
    - Node.js serializa el objeto en C++ y realiza una **copia física profunda** en el espacio de memoria del Worker Thread receptor.
    - Si envías un `ArrayBuffer` de 500MB, el proceso duplicará 500MB de RAM (consumirá 1GB en total) y gastará cientos de milisegundos de CPU en la copia.
  - **Transferencia de Memoria (`Transferable Objects`)**:
    - Permite **transferir la propiedad del bloque de memoria física** sin copiar ningún byte:
      ```javascript
      const buffer = new ArrayBuffer(500 * 1024 * 1024); // 500MB
      // Se pasa el buffer en el array de transferencia como segundo argumento:
      worker.postMessage({ buffer }, [buffer]);
      ```
    - **Operación en Tiempo Constante $O(1)$ (0 milisegundos)**:
    - El puntero de memoria simplemente se reasigna al Worker Thread receptor.
    - **Efecto Inmediato**: El hilo emisor original **pierde el acceso al buffer**: `buffer.byteLength` pasa a ser automáticamente `0` (*Detached Buffer*).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar acceder a un ArrayBuffer en el hilo emisor después de haberlo transferido (estará detached y vacío).
  - 🟢 **Green Flag**: Utilizar Transferable Objects para streaming de vídeo o procesamiento masivo de datasets binarios entre hilos con cero sobrecoste de memoria.

---

### 37. ¿Cómo funciona `SharedArrayBuffer` y por qué exige el uso obligatorio de primitivas `Atomics`?
- **Nivel**: Senior / Staff / Architect
- **Respuesta Técnica**:
  A diferencia de los Transferable Objects (donde solo un hilo puede tener la propiedad del dato a la vez):
  - **`SharedArrayBuffer`**: Permite asignar una región de memoria binaria fija compartida simultáneamente por **múltiples Worker Threads en el mismo proceso**.
  - Ambos hilos pueden leer y escribir en los mismos índices de memoria en tiempo real sin serialización.
  - **El Peligro Crítico de Condiciones de Carrera (Race Conditions)**:
    - Si dos hilos ejecutan `view[0]++` al mismo tiempo: la operación consta de 3 instrucciones de CPU (leer, incrementar, escribir). Si los hilos se solapan, una escritura sobrescribirá a la otra de forma destructiva.
  - **Primitivas `Atomics` Obligatorias**:
    - Garantizan operaciones atómicas a nivel de hardware de CPU:
      - `Atomics.add(view, 0, 1)`: Incremento seguro en un solo ciclo atómico.
      - `Atomics.compareExchange(view, 0, expected, replacement)`: Implementación de cerrojos optimistas (*CAS - Compare and Swap*).
      - `Atomics.wait(view, index, value)` y `Atomics.notify(view, index, count)`: Primitivas de sincronización y suspensión de hilos (equivalente a semáforos/mutex).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que JavaScript monohilo hace imposible que existan condiciones de carrera a nivel de memoria RAM cuando se usan Worker Threads.
  - 🟢 **Green Flag**: Explicar por qué `Atomics.wait()` está estrictamente bloqueado en el hilo principal de Node.js para no congelar el Event Loop.

---

### 38. ¿Cómo funciona el módulo `Cluster` y cómo el proceso maestro balancea las conexiones entrantes (Round-Robin vs OS delegation)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El módulo `cluster` permite levantar múltiples procesos de Node.js que comparten el mismo puerto TCP de red:
  - **Modo Round-Robin (Por Defecto en Linux/macOS - `cluster.schedulingPolicy = cluster.SCHED_RR`)**:
    1. El proceso maestro es el **único que abre y escucha físicamente el socket TCP** en el puerto 3000.
    2. Cuando entra una nueva conexión TCP de un cliente, el proceso maestro acepta el socket.
    3. Distribuye el descriptor de la conexión (*File Descriptor*) a los procesos workers hijos en una cola circular de turno rotativo (**Round-Robin**) a través de canales IPC internos.
    4. El proceso worker recibe el socket y procesa la petición HTTP de forma aislada.
  - **Modo del Sistema Operativo (`cluster.SCHED_NONE`)**:
    - El proceso maestro crea el socket de escucha y lo comparte con todos los workers; los workers intentan hacer `accept()` directamente.
    - En la práctica, genera un desbalanceo extremo: el planificador de Linux suele despertar siempre al mismo proceso caliente (*Thundering Herd*), saturando un núcleo mientras los demás están ociosos.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que en el modo Cluster cada worker intenta abrir el puerto 3000 de forma independiente (lo que provocaría errores de `EADDRINUSE`).
  - 🟢 **Green Flag**: Explicar la delegación de File Descriptors vía IPC y argumentar por qué en Kubernetes moderno se prefiere escalar réplicas de pods en lugar de usar Cluster internamente.

---

### 39. ¿Cuál es la diferencia entre `child_process.spawn()`, `exec()`, `execFile()` y `fork()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **`spawn(command, args)`**: Lanza un nuevo proceso del sistema operativo y retorna Streams (`stdout`, `stderr`). Es asíncrono y no tiene límite de buffer de salida; ideal para procesos que emiten grandes volúmenes de datos continuos (ej. ffmpeg).
  - **`exec(command, callback)`**: Inicia un sub-shell (`/bin/sh` en Linux) y concatena toda la salida en un buffer en memoria (por defecto máx 1MB). **Peligroso**: vulnerable a inyección de comandos si usa inputs de usuario.
  - **`execFile(file, args, callback)`**: Ejecuta directamente un archivo ejecutable **sin invocar una shell**. Más seguro y rápido que `exec()`.
  - **`fork(modulePath)`**: Variante especializada de `spawn()` para ejecutar módulos de Node.js. Crea una nueva instancia de V8 y establece un **canal de comunicación IPC nativo bidireccional (`process.send()` y `process.on('message')`)** entre el proceso padre y el hijo.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Usar `exec()` para procesar archivos de log gigantescos provocando un error de buffer desbordado (`maxBuffer exceeded`).
  - 🟢 **Green Flag**: Destacar el canal IPC preconfigurado que aporta `fork()` para coordinación de procesos en Node.js.

---

### 40. ¿Qué es un Piscina / Worker Pool y por qué NUNCA se debe instanciar un `new Worker()` por cada petición HTTP entrante?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Instanciar un Worker Thread (`new Worker('./task.js')`):
  - Inicia un nuevo hilo del sistema operativo.
  - Instancia un nuevo **V8 Isolate** completo, inicializa un nuevo Event Loop de Libuv y compila el script.
  - **Coste**: Cada Worker Thread consume entre **30MB y 50MB de RAM** y tarda entre 50 y 150 milisegundos en inicializarse.
  - **Peligro**: Si instanciaras un Worker Thread por cada petición en un servidor con 500 RPS, el servidor crearía 500 hilos y consumiría **25 GB de RAM en segundos**, saturando el planificador del kernel y congelando el servidor por completo.
  - **Solución con Worker Pools (ej. librería `piscina`)**:
    - Pre-asigna una piscina fija de hilos reutilizables (típicamente igual al número de núcleos físicos de CPU: `navigator.hardwareConcurrency`).
    - Encola las tareas entrantes y las reparte a los workers que queden libres mediante colas de tareas eficientes.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Crear Workers bajo demanda en controladores de Express creyendo que son tan ligeros como las Goroutines de Go.
  - 🟢 **Green Flag**: Citar la librería `piscina` y el uso de `MessageChannel` para comunicar hilos directamente sin pasar por el hilo principal.

---

### 41. ¿Cómo se comunican dos Worker Threads directamente entre sí sin saturar el hilo principal usando `MessageChannel`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El hilo principal puede crear un canal de comunicación desacoplado mediante **`MessageChannel`**:
  ```javascript
  import { Worker, MessageChannel } from 'node:worker_threads';

  const worker1 = new Worker('./worker1.js');
  const worker2 = new Worker('./worker2.js');

  const { port1, port2 } = new MessageChannel();

  // Se transfiere un puerto a cada worker:
  worker1.postMessage({ port: port1 }, [port1]);
  worker2.postMessage({ port: port2 }, [port2]);
  ```
  - A partir de ese milisegundo, `worker1` y `worker2` se comunican directamente a través de sus puertos (`port.postMessage()` y `port.on('message')`).
  - **El hilo principal queda 100% liberado**: ningún mensaje entre los trabajadores tiene que atravesar el Event Loop del servidor web, eliminando cuellos de botella.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Enviar todos los mensajes del Worker 1 al hilo principal para que el hilo principal los reenvíe al Worker 2.
  - 🟢 **Green Flag**: Transferir los puertos `MessagePort` como Transferable Objects para establecer túneles de comunicación peer-to-peer entre hilos.

---

### 42. ¿Qué ocurre con los Worker Threads si el proceso principal de Node.js recibe una excepción no capturada?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Si el proceso principal de Node.js finaliza (bien sea por un `process.exit()` voluntario o por un `uncaughtException` no controlado):
  - **Todos los Worker Threads pertenecientes a ese proceso son destruidos de forma inmediata y forzada por el kernel**.
  - No se garantiza la ejecución de bloques `finally` ni la finalización limpia de escrituras de archivos en los workers.
  - Por ello, los errores dentro de los workers deben ser escuchados en el hilo principal mediante:
    ```javascript
    worker.on('error', (err) => console.error('Error fatal en worker:', err));
    worker.on('exit', (code) => console.log(`Worker finalizó con código: ${code}`));
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Olvidar registrar el listener `.on('error')` en una instancia de Worker Thread.
  - 🟢 **Green Flag**: Implementar un supervisor de hilos que reemplace automáticamente a cualquier worker que muera por una excepción no controlada.

---

### 43. ¿Cómo evitar el ataque "Zip Bomb" o desbordamiento al procesar compresión en Worker Threads?
- **Nivel**: Senior / Staff / Security
- **Respuesta Técnica**:
  Una Zip Bomb es un archivo comprimido diminuto (ej. 42 Kilobytes) que al descomprimirse se expande a **4.5 Petabytes** de datos:
  - Si un Worker Thread intenta descomprimirlo en memoria sin límites, agotará el Heap y el proceso colapsará por OOM.
  - **Defensa Multicapa**:
    1. Medir los bytes emitidos por el Transform Stream de descompresión: si supera un umbral máximo razonable (ej. 100MB), abortar y destruir el stream inmediatamente.
    2. Limitar el ratio de compresión permitido: si el ratio de descompresión supera 100:1, clasificar el archivo como malicioso.
    3. Aislar la descompresión en un proceso efímero (`child_process`) con límites de memoria de cgroup estrictos para que un fallo no afecte a los workers principales.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Descomprimir archivos de usuarios directamente con `zlib.unzipSync()` en el hilo principal.
  - 🟢 **Green Flag**: Utilizar contadores de bytes emitidos en streams transformadores con límites de cuota estrictos.

---

## 5. Diagnóstico, Profiling, Observabilidad y CJS vs ESM

### 44. ¿Cómo generar y analizar un CPU Profile de V8 con `node --cpu-prof` y Flamegraphs?
- **Nivel**: Senior / Staff / Performance
- **Respuesta Técnica**:
  1. **Generación del Perfil**:
     - Iniciar la aplicación con el flag nativo de V8:
       `node --cpu-prof --cpu-prof-interval=1000 server.js`
     - V8 muestrea la pila de llamadas de la CPU cada 1,000 microsegundos (1ms) y genera un archivo `.cpuprofile`.
  2. **Análisis con Flamegraphs (Gráficos de Llama)**:
     - Cargar el archivo en el panel *Performance* de Chrome DevTools o usar herramientas como **`0x`** o Speedscope.
     - **Cómo interpretar el Flamegraph**:
       - Eje horizontal ($X$): Representa el tiempo total transcurrido o porcentaje de muestras de CPU. **Los bloques más anchos son las funciones que más CPU consumieron**.
       - Eje vertical ($Y$): Representa la profundidad de la pila de llamadas (Call Stack).
       - Permite localizar instantáneamente cuellos de botella (ej. un método `JSON.stringify` de un objeto complejo o un bucle `find` cuadrático $O(N^2)$).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Intentar resolver lentitud de CPU agregando `console.time()` manualmente en 50 funciones aleatorias.
  - 🟢 **Green Flag**: Identificar funciones monomórficas vs megamórficas y analizar el tiempo propio de la función (*Self Time*) frente al tiempo total (*Total Time*).

---

### 45. ¿Qué es `Diagnostics Channel` (`node:diagnostics_channel`) y por qué es el futuro de la instrumentación de APMs en Node.js?
- **Nivel**: Staff / Principal Architect
- **Respuesta Técnica**:
  Tradicionalmente, las herramientas de monitoreo APM (Datadog, New Relic) utilizaban **Monkey Patching** agresivo: interceptaban y sobrescribían las funciones internas del núcleo de Node.js (`http.request`, `fs.open`) para medir tiempos. Esto era frágil, propenso a romper librerías y causaba pérdidas de rendimiento en V8.
  - **`node:diagnostics_channel`**:
    - API nativa de publicación y suscripción de telemetría de alto rendimiento integrada en el propio core de Node.js.
    - Los módulos internos del runtime (`undici`, `http`, `net`) publican eventos en canales bien definidos:
      ```javascript
      import diagnostics_channel from 'node:diagnostics_channel';

      const channel = diagnostics_channel.channel('undici:request:create');
      channel.subscribe((message) => {
        console.log('Petición HTTP saliente detectada:', message.request.origin);
      });
      ```
    - **Cero Sobrecoste**: Si no hay ningún suscriptor escuchando un canal, la llamada a publicar es una comprobación booleana que cuesta **menos de 1 nanosegundo de CPU**.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Desconocer `diagnostics_channel` y defender el Monkey Patching de prototipos como método estándar de monitoreo.
  - 🟢 **Green Flag**: Explicar cómo el SDK oficial de OpenTelemetry para Node.js está migrando sus instrumentaciones hacia `diagnostics_channel`.

---

### 46. ¿Cómo se produce un Deadlock en `import()` dinámico y evaluación de módulos circulares en ESM?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  A diferencia de CommonJS (donde los módulos se evalúan síncronamente a medida que se encuentran los `require`), ECMAScript Modules (ESM) se evalúan en 3 fases estrictas: **Construcción (Parseo) $\to$ Instanciación $\to$ Evaluación**.
  - **El Deadlock con Top-Level Await y Dependencias Circulares**:
    - Si el Módulo A importa el Módulo B, y el Módulo B importa el Módulo A.
    - Si ambos utilizan **Top-Level Await** esperando la resolución de una promesa que depende directa o indirectamente del otro módulo para resolverse.
    - El Grafo de Módulos de V8 entra en un **Deadlock Asíncrono**: el Módulo A no puede completar su evaluación hasta que B termine, pero B está suspendido esperando a A. El proceso queda colgado indefinidamente en el arranque sin arrojar error sintáctico.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Creer que Top-Level Await no tiene ningún impacto en el orden de carga de los módulos dependientes.
  - 🟢 **Green Flag**: Diseñar módulos de configuración libres de dependencias circulares y usar inicialización diferida (*Lazy Initialization*) para romper ciclos.

---

### 47. ¿Qué es el flag `--experimental-strip-types` introducido en Node.js 22.6+ y cómo cambia el ecosistema de TypeScript?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Históricamente, para ejecutar código TypeScript en Node.js se requería compilarlo previamente a JavaScript (`tsc`), o usar empaquetadores en tiempo de desarrollo (`ts-node`, `tsx`, `esbuild`).
  - **`node --experimental-strip-types` (Nativo en Node.js 22.6+)**:
    - Permite ejecutar archivos `.ts` **directamente en Node.js sin instalar ninguna dependencia externa**:
      `node --experimental-strip-types app.ts`
    - **Mecánica**: Utiliza el parser ultra rápido de C++ de V8 para **remover o vaciar quirúrgicamente las anotaciones de tipo de TypeScript** en memoria convirtiéndolas en espacios en blanco, y luego pasa el código JavaScript puro al motor de evaluación.
    - **Limitación intencional**: Solo soporta sintaxis de tipos estándar de TypeScript. No soporta funcionalidades que emiten código en tiempo de ejecución (como `enum`s numéricos no const o `namespaces` antiguos de TS).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Afirmar que Node.js 22 "valida y comprueba los tipos de TypeScript" en tiempo de ejecución (solo hace *strip*, la comprobación estática se delega a `tsc --noEmit`).
  - 🟢 **Green Flag**: Explicar la eliminación de herramientas intermedias complejas de transpilación para scripts de utilidad y microservicios modernos.

---

### 48. ¿Cómo funciona el algoritmo de resolución de paquetes (`exports` field en `package.json`) y qué son los "Conditional Exports"?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El campo `"exports"` en el `package.json` reemplazó al tradicional `"main"` introduciendo encapsulación estricta:
  - **Encapsulación de Paquetes**: Cualquier archivo que no esté explícitamente declarado en `"exports"` es **privado e inaccesible** desde fuera del paquete (evita que los usuarios hagan `require('libreria/dist/internal.js')`).
  - **Conditional Exports (Exportaciones Condicionales)**:
    Permite servir diferentes puntos de entrada según cómo sea consumido el paquete:
    ```json
    {
      "exports": {
        ".": {
          "import": "./dist/index.mjs",
          "require": "./dist/index.cjs",
          "types": "./dist/index.d.ts",
          "default": "./dist/index.js"
        }
      }
    }
    ```
    Si el usuario usa `import`, Node.js carga la versión ESM nativa; si usa `require()`, carga la versión compilada en CommonJS (*Dual-Package Hazard Mitigation*).
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Seguir usando únicamente `"main": "index.js"` en librerías modernas publicadas en npm.
  - 🟢 **Green Flag**: Alertar sobre el *Dual Package Hazard* (instanciación de dos singletons separados si una app consume la versión CJS y ESM del mismo paquete en la misma ejecución).

---

### 49. ¿Por qué `node --trace-warnings` y `process.on('warning')` son indispensables para la salud de una aplicación?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  Node.js emite advertencias procesables ante el uso de APIs deprecadas, fugas potenciales de memoria o promesas no controladas:
  - Por defecto, las advertencias se imprimen como texto suelto en la consola sin stack trace.
  - **`node --trace-warnings server.js`**: Obliga a Node.js a imprimir el **stack trace completo** que originó la advertencia, permitiendo localizar en qué línea exacta de qué librería de `node_modules` se produjo.
  - **Captura Programática**:
    ```javascript
    process.on('warning', (warning) => {
      console.warn(`[${warning.name}] ${warning.message}`);
      console.warn(warning.stack);
      // Enviar a Datadog / Sentry si es una advertencia crítica (ej. MaxListenersExceededWarning)
    });
    ```
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Ignorar las advertencias de Node.js en consola considerándolas "mensajes sin importancia".
  - 🟢 **Green Flag**: Utilizar `node --trace-deprecation` para auditar incompatibilidades antes de realizar actualizaciones mayores de versión de Node.js.

---

### 50. ¿Cómo construir un sistema de Graceful Degradation y Health Checks en Kubernetes para un proceso de Node.js?
- **Nivel**: Senior / Staff / SRE
- **Respuesta Técnica**:
  En Kubernetes, la aplicación debe exponer dos endpoints HTTP de chequeo de salud desacoplados:
  1. **Liveness Probe (`/healthz`)**:
     - Comprueba **exclusivamente si el proceso y el Event Loop de Node.js están vivos**.
     - Debe ser una comprobación ultra ligera en memoria: si el Event Loop no tiene un lag superior a 2 segundos, responde `HTTP 200`.
     - **Peligro**: Si incluyes la base de datos externa en el Liveness Probe y la base de datos se satura, Kubernetes matará y reiniciará todos los pods de Node.js en bucle, empeorando el colapso.
  2. **Readiness Probe (`/ready`)**:
     - Comprueba si el pod está **listo para recibir tráfico de usuarios**.
     - Aquí sí se comprueba la conectividad con dependencias críticas (PostgreSQL, Redis, colas).
     - Si la base de datos se satura, el Readiness Probe devuelve `HTTP 503`: el balanceador retira el pod del tráfico temporalmente sin matarlo, permitiéndole recuperarse.
- **Diferenciadores en la entrevista**:
  - 🚩 **Red Flag**: Apuntar tanto el Liveness como el Readiness al mismo endpoint que consulta la base de datos.
  - 🟢 **Green Flag**: Integrar la medición de Event Loop Lag (`monitorEventLoopDelay`) dentro del Liveness Probe para reiniciar pods congelados por operaciones bloqueantes de CPU.


---

## 6. Sockets TCP/UDP, TLS/SSL y Redes de Bajo Nivel

### 51. ¿Cómo funciona internamente el módulo `net` de Node.js y cómo gestiona el kernel los buffers de socket TCP (`SO_RCVBUF`, `SO_SNDBUF`)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El módulo `net` de Node.js expone una abstracción basada en streams de Libuv (`uv_tcp_t`) sobre las llamadas al sistema del kernel (`socket()`, `bind()`, `listen()`, `accept()`).
  A nivel del kernel Linux, cada conexión TCP asigna dos buffers de memoria en espacio de kernel:
  - **`SO_RCVBUF` (Receive Buffer)**: Almacena los paquetes TCP entrantes (ventana de recepción TCP Window) antes de que Node.js invoque `read()` para moverlos al espacio de usuario (V8 Heap o Buffer).
  - **`SO_SNDBUF` (Send Buffer)**: Almacena los datos escritos mediante `socket.write()` hasta que el stack TCP del kernel recibe la confirmación ACK del cliente remoto.
  Si el cliente remoto es lento y no envía ACKs, `SO_SNDBUF` se llena. En ese instante, Libuv notifica a Node.js que el socket no puede recibir más escrituras, y `socket.write(chunk)` retorna `false` para activar el mecanismo de Backpressure.
  ```javascript
  import net from 'node:net';

  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const canWriteMore = socket.write('ACK: ' + data.length);
      if (!canWriteMore) {
        socket.pause(); // Pausar lectura si el buffer de envío está saturado
        socket.once('drain', () => socket.resume());
      }
    });
  });
  server.listen(9000);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Pensar que los buffers de socket residen en la memoria heap de JavaScript o ignorar la existencia del buffer de kernel.
  - 🟢 *Green Flag*: Explica cómo sintonizar los límites de buffer a nivel de sistema operativo (`sysctl net.ipv4.tcp_rmem` y `net.ipv4.tcp_wmem`) para balancear memoria y throughput.

---

### 52. ¿Qué es y cómo se mitiga el problema de SYN Flood y sockets en estado `TIME_WAIT` en servidores TCP de alto tráfico en Node.js?
- **Nivel**: Staff / Systems Engineer
- **Respuesta Técnica**:
  - **SYN Flood**: Un atacante envía ráfagas de paquetes TCP `SYN` pero nunca responde con el último `ACK`, saturando la cola de conexiones semiabiertas (*SYN Queue* o `tcp_max_syn_backlog`) del kernel, impidiendo que el servidor acepte nuevas conexiones legítimas.
    *Mitigación*: Activar SYN Cookies en el kernel (`net.ipv4.tcp_syncookies = 1`) y configurar un backlog adecuado en Node.js: `server.listen({ port: 3000, backlog: 2048 })`.
  - **TIME_WAIT Accumulation**: Cuando Node.js cierra activamente conexiones TCP con clientes, el socket permanece en estado `TIME_WAIT` durante 2 * MSL (Maximum Segment Lifetime, usualmente 60 segundos) para garantizar que los paquetes rezagados en la red no corrompan conexiones futuras. Si se abren y cierran miles de conexiones por segundo, se agotan los puertos efímeros (*Ephemeral Port Exhaustion* `EADDRNOTAVAIL`).
    *Mitigación*: Reutilizar conexiones HTTP mediante agentes con `keepAlive: true`, y en el kernel activar `net.ipv4.tcp_tw_reuse = 1`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar resolver problemas de TIME_WAIT modificando código de aplicación sin comprender los estados de la máquina de estados de TCP.
  - 🟢 *Green Flag*: Recomienda arquitecturas donde los reverse proxies (Envoy/Nginx) absorben las conexiones externas con TCP pooling hacia Node.js.

---

### 53. ¿Cómo implementa Node.js la terminación TLS con `tls.createServer()` y cómo gestionar la renovación de certificados SNI (*Server Name Indication*) sin downtime?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Node.js delega el cifrado criptográfico a OpenSSL mediante bindings de C++. Para servir múltiples dominios con certificados SSL independientes sobre la misma IP y puerto, TLS utiliza **SNI (Server Name Indication)**.
  Para renovar certificados en caliente (Zero Downtime) sin reiniciar el proceso de Node.js, se utiliza la opción `SNICallback`:
  ```javascript
  import tls from 'node:tls';
  import fs from 'node:fs';

  const certStore = new Map();

  function loadCert(domain) {
    const secureContext = tls.createSecureContext({
      key: fs.readFileSync(`/etc/certs/${domain}/privkey.pem`),
      cert: fs.readFileSync(`/etc/certs/${domain}/fullchain.pem`),
    });
    certStore.set(domain, secureContext);
    return secureContext;
  }

  const server = tls.createServer({
    SNICallback: (servername, cb) => {
      let ctx = certStore.get(servername);
      if (!ctx) ctx = loadCert(servername);
      cb(null, ctx);
    },
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Reiniciar el servidor Node.js entero cada vez que Let's Encrypt renueva un certificado, cortando conexiones en curso.
  - 🟢 *Green Flag*: Implementa `tls.createSecureContext()` con caché dinámico en memoria y recarga atómica.

---

### 54. ¿Cuál es la diferencia entre sockets TCP e IPC mediante Unix Domain Sockets (`/var/run/app.sock`) en rendimiento en Linux?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **Sockets TCP (127.0.0.1)**: Los datos deben atravesar todo el stack de red del kernel Linux (encapsulación IP, checksums TCP, números de secuencia, tablas de ruteo y loopback interface), con sobrecoste de CPU e interrupciones de contexto.
  - **Unix Domain Sockets (UDS)**: Son archivos especiales en el sistema de archivos POSIX. El kernel transfiere los datos directamente entre los buffers de memoria de ambos procesos mediante copia de páginas en el kernel sin encapsulación de red, sin sumas de verificación y con latencias hasta 50% menores y el doble de throughput.
  ```javascript
  import net from 'node:net';

  const server = net.createServer((c) => {
    c.write('Respuesta ultra-rápida vía Unix Socket');
  });
  server.listen('/tmp/node-microservice.sock');
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar conexiones TCP sobre localhost para comunicar microservicios que residen en el mismo pod o host físico.
  - 🟢 *Green Flag*: Demuestra cómo configurar Nginx como frontend para reenviar tráfico hacia Node.js vía Unix Domain Socket para máxima densidad y eficiencia.

---

### 55. ¿Cómo funciona el módulo `dgram` (UDP) en Node.js y en qué casos de uso de streaming o telemetría supera a TCP?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El módulo `node:dgram` provee implementación de sockets de datagramas UDP (User Datagram Protocol). A diferencia de TCP:
  - UDP **no es orientado a conexión** (no existe handshake de 3 vías ni sincronización de estado).
  - **No garantiza entrega ni orden** (paquetes perdidos no se retransmiten).
  - Cero sobrecarga de control de congestión o backpressure de kernel.
  *Casos de uso ideales*: Métricas de alta frecuencia (ej. clientes de StatsD / Datadog), streaming de audio/video en tiempo real (WebRTC media transport), telemetría DNS y gaming en tiempo real.
  ```javascript
  import dgram from 'node:dgram';

  const client = dgram.createSocket('udp4');
  const message = Buffer.from('metric.cpu.usage:78.5|g');
  client.send(message, 8125, 'localhost', (err) => {
    client.close();
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar usar UDP para transacciones bancarias o transmisión de documentos donde la pérdida de 1 solo paquete corrompe el sistema.
  - 🟢 *Green Flag*: Explica cómo el cliente StatsD dispara paquetes UDP sin bloquear el Event Loop ni esperar confirmación de recepción.

---

### 56. ¿Cómo opera el algoritmo de Nagle (`socket.setNoDelay(true)`) y cuándo desactivarlo para minimizar latencia en microservicios?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El algoritmo de Nagle (RFC 896) fue diseñado para reducir la congestión en redes WAN combinando múltiples paquetes pequeños en un único segmento TCP antes de enviarlo. Espera a que el cliente remoto confirme con ACK los paquetes anteriores antes de enviar el buffer acumulado.
  - **El Conflicto con Delayed ACK**: La mayoría de sistemas operativos combinan el algoritmo de Nagle con TCP Delayed ACK (el receptor retrasa su ACK hasta 200ms para enviarlo junto a datos de respuesta). Esto genera un retardo artificial catastrófico de 40ms a 200ms en llamadas RPC con payloads JSON pequeños.
  - En Node.js, `socket.setNoDelay(true)` activa el flag `TCP_NODELAY`, desactivando el algoritmo de Nagle para que cada `socket.write()` emita inmediatamente el segmento a la red física, erradicando latencias residuales en arquitecturas de microservicios.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer por qué peticiones pequeñas a redis o microservicios sufren picos de latencia de 40-200ms.
  - 🟢 *Green Flag*: Sabe que frameworks HTTP modernos (como Fastify o Express bajo Node.js) activan `TCP_NODELAY` por defecto en servidores HTTP.

---

### 57. ¿Cómo gestionar la reconexión con backoff exponencial con jitter en clientes TCP/WebSocket resilientes?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Si 10,000 instancias de Node.js pierden conexión con un clúster de Redis o RabbitMQ e intentan reconectar inmediatamente a intervalos fijos (ej. cada 1 segundo), provocarán el fenómeno de **Thundering Herd** (Avalancha), tumbando al servidor tan pronto como se recupere.
  El patrón **Full Jitter Exponential Backoff** distribuye uniformemente los reintentos:
  ```typescript
  function calculateBackoff(attempt: number, baseMs = 100, maxMs = 30_000): number {
    const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    // Full Jitter: valor aleatorio entre 0 y el límite exponencial
    return Math.floor(Math.random() * exponential);
  }

  async function connectWithRetry(client: any, attempt = 0): Promise<void> {
    try {
      await client.connect();
    } catch (err) {
      const delay = calculateBackoff(attempt);
      console.warn(`Fallo de conexión. Reintentando en ${delay}ms (Intento ${attempt + 1})...`);
      await new Promise(r => setTimeout(r, delay));
      return connectWithRetry(client, attempt + 1);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Implementar reintentos en bucle cerrado (`while(true)`) sin delay o reintentos con intervalo fijo sin jitter.
  - 🟢 *Green Flag*: Explica cómo el jitter rompe la sincronización destructiva de miles de clientes distribuidos.

---

### 58. ¿Cómo transferir descriptores de archivo de sockets entre procesos usando `child_process.send(msg, socket)`?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  En sistemas POSIX, los procesos tienen tablas de descriptores de archivo (*file descriptors*) aisladas. Sin embargo, mediante sockets de dominio Unix auxiliares y la llamada `sendmsg()` con metadatos de control `SCM_RIGHTS`, el kernel Linux puede duplicar un descriptor de socket TCP hacia otro proceso hijo.
  Node.js abstrae esto mediante el método `subprocess.send(message, sendHandle)`:
  ```javascript
  // master.js
  import { fork } from 'node:child_process';
  import net from 'node:net';

  const worker = fork('worker.js');
  const server = net.createServer((socket) => {
    // Transfiere la gestión del socket TCP completo al proceso hijo
    worker.send('handle_socket', socket);
  });
  server.listen(8080);

  // worker.js
  process.on('message', (msg, socket) => {
    if (msg === 'handle_socket' && socket) {
      socket.end('¡Socket atendido directamente por el worker hijo!
');
    }
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que los sockets TCP se serializan a JSON para enviarse entre procesos.
  - 🟢 *Green Flag*: Explica que el módulo nativo `cluster` de Node.js utiliza exactamente esta primitiva interna para distribuir conexiones entrantes en modo Round-Robin.

---

### 59. ¿Qué es el *Keep-Alive* a nivel de TCP (`socket.setKeepAlive()`) frente al header HTTP `Connection: keep-alive`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Son mecanismos en capas OSI completamente distintas:
  1. **HTTP Keep-Alive (Capa 7)**: Indica al cliente y al servidor que reutilicen la misma conexión TCP para múltiples peticiones y respuestas HTTP sucesivas en lugar de cerrarla tras cada intercambio.
  2. **TCP Keep-Alive (Capa 4)**: Opera a nivel de protocolo de transporte. Si una conexión TCP permanece inactiva sin intercambiar paquetes durante un tiempo (`SO_KEEPALIVE`), el kernel envía paquetes sonda vacíos (ACKs) para verificar si el otro extremo sigue vivo o si el cable se desconectó/el router intermedio cerró el socket silenciosamente.
  ```javascript
  socket.setKeepAlive(true, 60_000); // Enviar sondas tras 60 segundos de inactividad
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Confundir ambos términos y pensar que configurar TCP Keep-Alive afecta a los headers HTTP.
  - 🟢 *Green Flag*: Explica cómo TCP Keep-Alive previene la acumulación de sockets zombis en balanceadores y firewalls estatales (Stateful NATs).

---

### 60. ¿Cómo detectar y prevenir *Half-Open TCP Connections* y timeouts fantasmas en sockets de Node.js?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Una conexión TCP se vuelve **Half-Open** cuando uno de los extremos se apaga repentinamente (ej. corte de energía, pérdida de cobertura móvil o reinicio de pod) sin enviar el paquete TCP `FIN` o `RST`. El servidor Node.js cree que la conexión sigue abierta y mantiene recursos asignados indefinidamente.
  *Mecanismo de Detección y Prevención*:
  1. Configurar timeouts en el socket: `socket.setTimeout(timeoutMs, callback)`.
  2. Al dispararse el evento `'timeout'`, el servidor debe cerrar ordenadamente o destruir el socket (`socket.destroy()`).
  ```javascript
  socket.setTimeout(30_000); // 30 segundos
  socket.on('timeout', () => {
    console.warn('Socket inactivo detectado. Destruyendo conexión half-open...');
    socket.destroy(new Error('ETIMEDOUT'));
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar sockets sin timeout configurado confiando en que el cliente siempre enviará un cierre limpio.
  - 🟢 *Green Flag*: Combina `socket.setTimeout()` con `socket.setKeepAlive()` para limpiar sockets muertos a nivel de red y de aplicación.

---

## 7. HTTP/2, HTTP/3 (QUIC) y WebSockets Internals

### 61. ¿Cómo funciona la multiplexación de streams sobre una única conexión TCP en el módulo `http2` de Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En HTTP/1.1, cada petición HTTP requería su propia conexión TCP (o pipelining que sufría Head-of-Line blocking a nivel de capa 7).
  En HTTP/2 (`node:http2`), el protocolo divide el flujo de datos en **Frames binarios** (DATA, HEADERS, SETTINGS, RST_STREAM) asignados a un identificador numérico de **Stream ID**:
  - Múltiples peticiones y respuestas se intercalan simultáneamente en paquetes TCP independientes sobre un solo socket.
  - Los streams pares los inicia el cliente; los streams impares el servidor.
  ```javascript
  import http2 from 'node:http2';

  const server = http2.createSecureServer({ cert, key });
  server.on('stream', (stream, headers) => {
    // Cada stream es un duplex stream independiente
    stream.respond({
      'content-type': 'application/json; charset=utf-8',
      ':status': 200,
    });
    stream.end(JSON.stringify({ streamId: stream.id, message: 'Multiplexed' }));
  });
  server.listen(8443);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Pensar que HTTP/2 requiere abrir más conexiones TCP para procesar más peticiones simultáneas.
  - 🟢 *Green Flag*: Explica cómo la multiplexación reduce el consumo de memoria en el servidor al evitar abrir 6 conexiones TCP paralelas por cliente.

---

### 62. ¿Qué es HPACK en HTTP/2 y cómo mitiga la vulnerabilidad CRIME comprimiendo cabeceras?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  En HTTP/1.1 las cabeceras se transmitían como texto plano repetitivo en cada petición (cookies, User-Agent de 1KB).
  En HTTP/2, **HPACK (RFC 7541)** comprime cabeceras mediante:
  1. **Tabla Estática**: Un diccionario de 61 cabeceras comunes predefinidas por la especificación (ej. `:method: GET` es el índice 2).
  2. **Tabla Dinámica**: Almacena cabeceras nuevas vistas durante la sesión. Si el cliente envía una Cookie grande, las peticiones subsiguientes solo envían el índice entero asignado.
  3. **Codificación Huffman**: Cifra caracteres individuales con árboles de frecuencia.
  *Mitigación de CRIME*: Los algoritmos tradicionales como gzip comprimían cabeceras y cuerpo juntos, permitiendo a un atacante deducir tokens secretos mediante ataques de oráculo basados en el tamaño del payload comprimido. HPACK separa estrictamente la compresión de cabeceras impidiendo esta correlación.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer que las cabeceras en HTTP/2 son binarias y con estado de sesión dinámico.
  - 🟢 *Green Flag*: Advierte sobre el consumo de memoria de la tabla dinámica de HPACK en servidores con millones de streams concurrentes.

---

### 63. ¿Qué es el control de flujo a nivel de stream y de conexión en HTTP/2 (`WINDOW_UPDATE`)?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  En HTTP/2, debido a que muchos streams lógicos comparten una única conexión física TCP, el control de flujo de TCP es insuficiente: un stream de descarga de un archivo de 10GB podría acaparar toda la ventana de recepción TCP ahogando a streams pequeños de llamadas RPC críticas.
  HTTP/2 implementa **Flow Control en la Capa de Aplicación**:
  - Cada stream individual tiene su propia ventana de crédito (`Stream Window`).
  - La conexión completa tiene una ventana global (`Connection Window`).
  - Cada vez que el receptor procesa y consume un frame de datos, envía un frame `WINDOW_UPDATE` otorgando más bytes de crédito al emisor. Si el crédito se agota, el emisor debe detener ese stream particular sin afectar a los demás.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que el backpressure en HTTP/2 se delega completamente al kernel de Linux.
  - 🟢 *Green Flag*: Detalla la interacción entre el backpressure de streams de Node.js y los frames `WINDOW_UPDATE` de HTTP/2.

---

### 64. ¿Cómo funcionaba Server Push en HTTP/2 y por qué fue deprecado en navegadores en favor de `103 Early Hints`?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  - **Server Push**: Permitía al servidor enviar proactivamente recursos secundarios (CSS, JS, imágenes) al cliente antes de que este los solicitara, usando frames `PUSH_PROMISE`.
  - **Por qué fracasó**:
    1. El servidor enviaba archivos que el cliente ya tenía cacheados en disco, desperdiciando ancho de banda móvil.
    2. Competía por la prioridad de red contra el HTML principal.
    3. Complejidad extrema de implementación en CDNs y microservicios.
  Chrome y otros navegadores deprecaron Server Push y adoptaron **`103 Early Hints`**: el servidor devuelve un código HTTP 103 preliminar con cabeceras `Link: </style.css>; rel=preload` mientras procesa la respuesta pesada, permitiendo al navegador descargar activos en paralelo sin push no deseado.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Continuar recomendando Server Push de HTTP/2 como técnica moderna de optimización web.
  - 🟢 *Green Flag*: Demuestra cómo emitir cabeceras 103 Early Hints en Node.js de forma compatible con CDNs modernas.

---

### 65. ¿Qué es el código de estado `103 Early Hints` y cómo se implementa nativamente en Node.js?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El código de respuesta informativa `103 Early Hints` (RFC 8297) permite que el servidor web envíe cabeceras de precarga de recursos al cliente mientras el backend aún está ejecutando consultas lentas de base de datos o lógica de negocio.
  En Node.js nativo (v18.11+):
  ```javascript
  import http from 'node:http';

  const server = http.createServer(async (req, res) => {
    // 1. Enviar Early Hints inmediatamente
    res.writeEarlyHints({
      link: [
        '</app.css>; rel=preload; as=style',
        '</main.js>; rel=preload; as=script',
      ],
    });

    // 2. Simular operación asíncrona de 200ms
    await new Promise(r => setTimeout(r, 200));

    // 3. Enviar respuesta final
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html><head><link rel="stylesheet" href="/app.css"></head><body>Hola</body></html>');
  });
  server.listen(3000);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar emitir Early Hints usando `res.writeHead(103)` y romper la secuencia de headers de la librería HTTP.
  - 🟢 *Green Flag*: Integra Early Hints con CDNs compatibles (Cloudflare, Fastly) para maximizar métricas LCP y FCP.

---

### 66. ¿Cómo funciona el handshake HTTP de WebSockets (`Upgrade: websocket`) y la validación de `Sec-WebSocket-Accept`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Una conexión WebSocket comienza como una petición HTTP/1.1 estándar con cabeceras de elevación de protocolo:
  - Cliente envía:
    - `Connection: Upgrade`
    - `Upgrade: websocket`
    - `Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==` (16 bytes en Base64 aleatorio)
  - El servidor valida la petición y calcula `Sec-WebSocket-Accept`:
    Concatena el `Sec-WebSocket-Key` con un GUID estandarizado por el RFC 6455 (`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`), calcula el hash **SHA-1** binario y lo codifica en **Base64**:
    ```javascript
    import crypto from 'node:crypto';

    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const clientKey = 'dGhlIHNhbXBsZSBub25jZQ==';
    const acceptKey = crypto
      .createHash('sha1')
      .update(clientKey + GUID)
      .digest('base64');
    // Resultado: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
    ```
  El servidor responde con status `101 Switching Protocols`. A partir de ese byte, el socket abandona el parser HTTP y transiciona al protocolo binario WebSocket.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Pensar que el hash `Sec-WebSocket-Accept` es un mecanismo de autenticación o cifrado para proteger datos.
  - 🟢 *Green Flag*: Explica que el handshake previene que clientes HTTP antiguos o proxies intermediarios almacenen la conexión en caché como una respuesta HTTP normal.

---

### 67. ¿Cómo maneja el protocolo de WebSocket el enmarcado binario (*Framing Protocol*: FIN, Opcode, Masking Key)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Una vez establecido el handshake, los datos se transmiten en **Frames** binarios con una cabecera compacta de 2 a 14 bytes:
  - **FIN (1 bit)**: Indica si es el fragmento final del mensaje.
  - **Opcode (4 bits)**: Tipo de contenido (`0x1` texto UTF-8, `0x2` datos binarios, `0x8` cierre de conexión, `0x9` Ping, `0xA` Pong).
  - **MASK (1 bit)**: Si los datos están enmascarados. **Regla del RFC 6455**: Todos los frames enviados del cliente al servidor **DEBEN estar obligatoriamente enmascarados**; si el servidor recibe un frame sin máscara, debe terminar el socket inmediatamente.
  - **Masking Key (4 bytes)**: Clave pseudoaleatoria. Los datos del payload se desenmascaran mediante una operación XOR bit a bit: `OriginalByte[i] = MaskedByte[i] ^ MaskKey[i % 4]`.
  *Propósito del Masking*: Prevenir ataques de *Cache Poisoning* en proxies corporativos transparentes.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Enmascarar frames enviados desde el servidor hacia el cliente (el RFC estipula que el servidor NUNCA debe enmascarar sus envíos).
  - 🟢 *Green Flag*: Conoce la optimización de desenmascarado XOR con punteros enteros de 32/64 bits en C++ de librerías como `ws` o `uWebSockets`.

---

### 68. ¿Cómo escalar WebSockets en un cluster de múltiples procesos de Node.js o pods de Kubernetes?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  Los WebSockets son **conexiones con estado de larga duración** vinculadas a la memoria del proceso físico que mantiene abierto el socket TCP.
  Para escalar a miles de usuarios distribuidos:
  1. **Balanceo de Carga con Sticky Sessions (Afinidad de Sesión)**: El balanceador (Ingress Nginx/Traefik) debe garantizar que el handshake HTTP y la conexión inicial caigan en el mismo pod usando cookies de afinidad.
  2. **Backplane / Bus de Eventos Distribuido (Redis Pub/Sub, Kafka o NATS)**:
     Cuando el usuario A (conectado al Pod 1) envía un mensaje al canal de chat, el Pod 1 publica el evento en Redis (`PUBLISH room_123 payload`).
     Todos los pods suscritos a dicho canal (`SUBSCRIBE room_123`) reciben el evento y lo reenvían localmente a sus clientes WebSocket conectados.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que almacenar sockets en memoria global o en un array de JavaScript permite que otros pods envíen mensajes a ese usuario.
  - 🟢 *Green Flag*: Propone adaptadores Redis con streams o cluster de Redis para evitar que la pérdida de un nodo de Redis tire las salas de chat.

---

### 69. ¿Cómo implementar Heartbeats / Ping-Pong en WebSockets para limpiar conexiones zombis sin saturar el Event Loop?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Los sockets de teléfonos móviles pierden cobertura sin enviar paquetes `close`, dejando conexiones zombis en el servidor que consumen memoria y file descriptors.
  Se implementa un ciclo de **Ping/Pong** a nivel de protocolo (Opcodes `0x9` y `0xA`):
  ```javascript
  import { WebSocketServer } from 'ws';

  const wss = new WebSocketServer({ port: 8080 });

  function heartbeat() {
    this.isAlive = true;
  }

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        // No respondió al ping anterior: zombi detectado
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping(); // Envía frame 0x9; el cliente responde automáticamente con pong 0xA
    });
  }, 30_000);

  wss.on('close', () => clearInterval(interval));
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Enviar pings como mensajes JSON en capa de aplicación (`{ type: 'ping' }`) en lugar de usar los frames nativos del protocolo WebSocket.
  - 🟢 *Green Flag*: Usa `ws.terminate()` en lugar de `ws.close()` cuando la conexión no responde, liberando inmediatamente el socket a nivel de kernel.

---

### 70. ¿Qué ventajas introduce HTTP/3 sobre QUIC (UDP) frente a HTTP/2 sobre TCP respecto al *Head-of-Line Blocking*?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Aunque HTTP/2 solucionó el Head-of-Line blocking a nivel de aplicación (capa 7), **sigue sufriendo Head-of-Line blocking a nivel de transporte (capa 4 de TCP)**:
  - En TCP, si se pierde un solo paquete en la red física, la pila TCP del receptor congela la entrega de **todos** los paquetes posteriores hasta que el paquete perdido sea retransmitido y confirmado con ACK.
  - Por tanto, en HTTP/2, la pérdida de un paquete de una imagen detiene la entrega de todos los demás streams multiplexados en esa conexión TCP.
  **La solución de HTTP/3 (QUIC)**:
  - QUIC opera sobre **UDP**. Implementa la entrega confiable y el control de congestión directamente en espacio de usuario.
  - Cada stream de HTTP/3 es completamente independiente: si se pierde un paquete del stream 3, los paquetes de los streams 1, 2 y 4 se entregan inmediatamente a Node.js sin esperar la retransmisión del stream 3.
  - Conexión 0-RTT y migración de conexión nativa (si el usuario pasa de Wi-Fi a 5G, la IP cambia pero el Connection ID de QUIC preserva la sesión abierta sin reconectar).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Afirmar que HTTP/2 no tiene ningún tipo de bloqueo Head-of-Line.
  - 🟢 *Green Flag*: Explica la diferencia crítica entre HoL blocking a nivel de capa 7 (HTTP) y HoL blocking a nivel de capa 4 (TCP).

---

## 8. Diagnostics Channel, Tracing, OpenTelemetry y Perfilado

### 71. ¿Qué es `diagnostics_channel` en Node.js y cómo desacopla la instrumentación de telemetría de las librerías de aplicación?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Históricamente, librerías como Datadog o New Relic utilizaban *monkey patching* (sobreescribir prototipos de `http`, `pg` o `redis`), lo que rompía optimizaciones del motor V8 y causaba incompatibilidades en tiempo de ejecución.
  `node:diagnostics_channel` provee un sistema nativo de mensajería desacoplado de publicación/suscripción síncrono y de cero coste cuando no hay oyentes:
  ```javascript
  import diagnostics_channel from 'node:diagnostics_channel';

  // En la librería de base de datos o HTTP:
  const queryChannel = diagnostics_channel.channel('db.query.start');

  function executeQuery(sql) {
    if (queryChannel.hasSubscribers) {
      queryChannel.publish({ sql, timestamp: performance.now() });
    }
    // Ejecutar consulta real...
  }

  // En el agente de telemetría (OpenTelemetry):
  diagnostics_channel.subscribe('db.query.start', (message) => {
    console.log(`[Tracing] Query ejecutada: ${message.sql}`);
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar EventEmitter global para telemetría de alta frecuencia (los EventEmitters generan sobrecarga de microtasks e instancias).
  - 🟢 *Green Flag*: Destaca que `channel.hasSubscribers` evita crear objetos de telemetría si nadie está escuchando, garantizando overhead cero en runtime.

---

### 72. ¿Cómo interactúa `AsyncLocalStorage` con OpenTelemetry para propagar el contexto `traceparent` (W3C Trace Context)?
- **Nivel**: Senior / Architect
- **Respuesta Técnica**:
  El estándar **W3C Trace Context** define la cabecera `traceparent`:
  `version-traceId-spanId-traceFlags` (ej. `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`).
  Para propagar este contexto a través de callbacks asíncronos, eventos de base de datos y llamadas externas sin pasarlo como argumento en cada función de la aplicación:
  ```javascript
  import { AsyncLocalStorage } from 'node:async_hooks';

  const tracerStorage = new AsyncLocalStorage();

  // Middleware HTTP de entrada
  function traceMiddleware(req, res, next) {
    const parentHeader = req.headers['traceparent'] || generateNewTrace();
    const spanContext = parseTraceParent(parentHeader);

    tracerStorage.run(spanContext, () => {
      next();
    });
  }

  // En cualquier cliente HTTP de salida downstream
  async function callMicroservice(url) {
    const ctx = tracerStorage.getStore();
    return fetch(url, {
      headers: {
        traceparent: `00-${ctx.traceId}-${generateSpanId()}-01`,
      },
    });
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Almacenar el contexto de traza en variables globales que se corrompen cuando dos peticiones concurrentes entran a Node.js.
  - 🟢 *Green Flag*: Explica cómo `AsyncLocalStorage` se propaga a través de la cola de microtasks y promesas nativas de V8.

---

### 73. ¿Cómo utilizar `perf` en Linux con `--perf-basic-prof` para inspeccionar llamadas C++ nativas y código JIT de JavaScript en un mismo Flamegraph?
- **Nivel**: Staff Engineer / Performance
- **Respuesta Técnica**:
  Herramientas del sistema operativo como Linux `perf` solo ven símbolos de binarios compilados en C/C++ (Libuv, V8, kernel). El código JavaScript compilado en memoria por TurboFan no tiene símbolos en disco, apareciendo en `perf` como direcciones anónimas `[0x7f43a9b...]`.
  *La Técnica de Símbolos Mixtos*:
  1. Iniciar Node.js con: `node --perf-basic-prof app.js`
     (V8 crea un archivo de mapa en `/tmp/perf-<PID>.map` vinculando direcciones de memoria a nombres de funciones JS).
  2. Capturar muestras con `perf record`:
     `sudo perf record -F 99 -p <PID> -g -- sleep 30`
  3. Generar el Flamegraph interactivo combinando código JavaScript y C++:
     ```bash
     sudo perf script | ./stackcollapse-perf.pl | ./flamegraph.pl > mixed-flamegraph.svg
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Confiar únicamente en `console.time` para diagnosticar cuellos de botella de CPU complejos.
  - 🟢 *Green Flag*: Sabe leer un Flamegraph: mesetas anchas representan funciones que acaparan la CPU (*on-CPU time*).

---

### 74. ¿Qué es el *Sampling Heap Profiler* (`v8.getHeapSnapshot()` vs `v8.getHeapSpaceStatistics()`) y cuál tiene menor overhead en producción?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **`v8.writeHeapSnapshot()`**: Realiza un volcado completo de cada objeto en la memoria heap a disco. **Pausa completamente el Event Loop (Stop-The-World)** durante segundos o minutos dependiendo del tamaño del heap (1-4GB), lo que puede causar desconexión en balanceadores y reinicio por liveness probe en Kubernetes.
  - **Sampling Heap Profiler (`inspector.Session` con `HeapProfiler.startSampling`)**: Muestrea probabilísticamente asignaciones cada N bytes (ej. cada 512KB). Introduce menos del 1-2% de sobrecarga en CPU y cero pausas perceptibles, permitiendo perfilado continuo de memoria en producción para detectar Memory Leaks sin degradar a los usuarios.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ejecutar `writeHeapSnapshot()` de forma síncrona en producción durante el pico de tráfico.
  - 🟢 *Green Flag*: Configura sampling de memoria o drena el pod de tráfico antes de disparar un heap snapshot completo.

---

### 75. ¿Cómo monitorear de forma continua el retardo del Event Loop usando `perf_hooks.monitorEventLoopDelay()`?
- **Nivel**: Senior / SRE
- **Respuesta Técnica**:
  El retraso del Event Loop (*Event Loop Lag*) mide el tiempo que transcurre entre que un timer o evento debería ejecutarse y el momento en que el Event Loop realmente puede atenderlo debido a código síncrono bloqueante.
  Node.js incluye un monitor nativo en C++ de alta precisión:
  ```javascript
  import { monitorEventLoopDelay } from 'node:perf_hooks';

  const histogram = monitorEventLoopDelay({ resolution: 10 }); // Resolución en ms
  histogram.enable();

  setInterval(() => {
    console.log({
      minMs: (histogram.min / 1e6).toFixed(2),
      maxMs: (histogram.max / 1e6).toFixed(2),
      meanMs: (histogram.mean / 1e6).toFixed(2),
      p50Ms: (histogram.percentile(50) / 1e6).toFixed(2),
      p99Ms: (histogram.percentile(99) / 1e6).toFixed(2),
    });
    histogram.reset();
  }, 10_000);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Medir lag del Event Loop con un `setInterval(..., 1000)` casero que calcula la diferencia con `Date.now()` (impreciso y sufre de drift).
  - 🟢 *Green Flag*: Utiliza percentiles p95 y p99 de `monitorEventLoopDelay()` para disparar alertas en Prometheus/Grafana.

---

### 76. ¿Cómo se utiliza el módulo `trace_events` de Node.js para generar trazas compatibles con `chrome://tracing`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  El módulo `node:trace_events` permite registrar eventos internos de V8, Libuv y Node.js con formato estándar JSON de Chromium:
  ```javascript
  import trace_events from 'node:trace_events';

  // Habilitar categorías de tracing selectivas
  const tracing = trace_events.createTracing({
    categories: ['node', 'v8', 'node.async_hooks'],
  });

  tracing.enable();
  // Ejecutar operaciones críticas...
  setTimeout(() => {
    tracing.disable();
    console.log('Traza guardada en node_trace.1.log. Abrir en chrome://tracing');
  }, 5000);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer herramientas visuales nativas de Chromium para inspeccionar la cola de tareas del motor V8.
  - 🟢 *Green Flag*: Utiliza trace categories para auditar el overhead de `node.async_hooks` en microservicios de alta concurrencia.

---

### 77. ¿Qué es `process.report` (Diagnostic Reports) y cómo configurarlo para generar volcados JSON automáticos ante OOM o Uncaught Exceptions?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  Node.js incorpora la API `process.report` para emitir diagnósticos en formato JSON human-readable conteniendo:
  - Stack trace de JavaScript y stack trace nativo en C++.
  - Estado del Heap de V8, espacio de memoria usada y límites del sistema operativo (`ulimit`).
  - Lista de descriptores de archivos abiertos y librerías dinámicas cargadas.
  *Configuración automática por CLI*:
  `node --report-on-fatalerror --report-on-signal --report-uncaught-exception app.js`
  *O programáticamente*:
  ```javascript
  process.report.reportOnFatalError = true;
  process.report.directory = '/var/log/node-reports';
  process.report.filename = 'crash-report-[pid]-[time].json';
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar que el proceso muera en silencio por OOM sin dejar registro forense de qué código consumió la memoria.
  - 🟢 *Green Flag*: Automatiza la recolección de Diagnostic Reports en S3 o almacén persistente para análisis post-mortem.

---

### 78. ¿Cómo depurar un proceso de Node.js congelado en producción mediante `gdb` o `lldb` inspeccionando los stacks de hilos de Libuv?
- **Nivel**: Staff / Systems Engineer
- **Respuesta Técnica**:
  Si un proceso de Node.js tiene el Event Loop congelado al 100% de CPU y no responde al inspector ni a peticiones HTTP:
  1. Conectar el depurador nativo sin matar el proceso:
     `sudo gdb -p <PID>`
  2. Imprimir el stack trace de todos los hilos del proceso:
     `(gdb) thread apply all bt`
  3. Si el hilo principal está ejecutando código de JavaScript nativo, invocar la macro interna de V8 para imprimir el stack trace de JS:
     `(gdb) call v8::internal::Isolate::Current()->PrintCurrentStackTrace(stdout)`
  4. Desconectar el depurador de forma segura permitiendo que el proceso continúe:
     `(gdb) detach`
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Matar con `kill -9` el proceso sin intentar obtener evidencia forense del bloqueo.
  - 🟢 *Green Flag*: Maneja herramientas de sistemas operativos para depurar la capa nativa C++ de Node.js y Libuv.

---

### 79. ¿Cómo medir la fragmentación de memoria en V8 comparando `heapUsed` con `rss` y qué papel juega un asignador alternativo como `jemalloc`?
- **Nivel**: Staff Engineer / Architecture
- **Respuesta Técnica**:
  Al invocar `process.memoryUsage()`:
  - `heapUsed`: Memoria real ocupada por objetos JavaScript activos.
  - `rss` (Resident Set Size): Memoria física RAM total asignada al proceso por el kernel.
  Si `heapUsed` es 200MB pero `rss` supera 1.5GB, existe una severa **Fragmentación de Memoria**:
  El asignador estándar de Linux (`glibc ptmalloc`) no siempre puede devolver páginas de memoria desocupadas al kernel si quedan pequeños fragmentos de memoria retenidos en medio de las páginas.
  *Solución*: Reemplazar el asignador de memoria por **`jemalloc`** o **`mimalloc`** (utilizado comúnmente en contenedores Docker de Node.js):
  ```dockerfile
  RUN apt-get install -y libjemalloc-dev
  ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
  ```
  `jemalloc` maneja la asignación de buffers pequeños y su liberación evitando que el RSS crezca descontroladamente.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Confundir fragmentación de memoria del allocator nativo con una fuga de memoria (*Memory Leak*) de objetos de JavaScript.
  - 🟢 *Green Flag*: Explica cómo `LD_PRELOAD=libjemalloc.so` reduce drásticamente el consumo de RAM en microservicios con alta rotación de buffers y strings.

---

### 80. ¿Cómo funciona el tracking de recursos no recolectados con `FinalizationRegistry` y `WeakRef` en depuración avanzada de Node.js?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  - `WeakRef`: Permite mantener una referencia a un objeto sin impedir que el Garbage Collector lo destruya. `ref.deref()` devuelve el objeto o `undefined` si ya fue recolectado.
  - `FinalizationRegistry`: Permite registrar un callback que se ejecuta de forma asíncrona cuando el recolector de basura limpia un objeto determinado:
  ```javascript
  const registry = new FinalizationRegistry((heldValue) => {
    console.log(`[GC Cleanup] Recurso limpiado por el recolector: ${heldValue}`);
  });

  function trackResourceLeak(resource, id) {
    registry.register(resource, id);
  }
  ```
  *Uso en testing*: Permite verificar programáticamente que instancias temporales (ej. conexiones cerradas o buffers de requests) son efectivamente destruidas por el GC sin quedar retenidas en closures o listeners globales.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `FinalizationRegistry` para lógica de negocio crítica (el estándar no garantiza cuándo ni si el GC se ejecutará).
  - 🟢 *Green Flag*: Utiliza estas primitivas exclusivamente para herramientas de observabilidad y detección automática de leaks en suites de test.

---

## 9. Seguridad de Runtime, Permission Model y WebCrypto

### 81. ¿Cómo funciona el nuevo *Permission Model* de Node.js (`--permission`, `--allow-fs-read`, `--allow-net`) para sandboxing?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Históricamente, cualquier paquete instalado de npm tenía acceso ilimitado a leer `/etc/passwd`, ejecutar procesos secundarios o abrir conexiones de red.
  Desde Node.js 20+, el **Permission Model** restringe las capacidades del proceso a nivel de runtime:
  ```bash
  node --permission --allow-fs-read=/app/data --allow-net=api.stripe.com app.js
  ```
  Si una dependencia maliciosa intenta ejecutar `fs.readFileSync('/etc/shadow')` o abrir un socket hacia un servidor no autorizado, Node.js lanza una excepción de seguridad:
  `ERR_ACCESS_DENIED`.
  Programáticamente se pueden consultar permisos:
  ```javascript
  const hasAccess = process.permission.has('fs.read', '/app/data/file.txt');
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que las dependencias de Node.js están aisladas por defecto.
  - 🟢 *Green Flag*: Explica cómo el Permission Model previene ataques de cadena de suministro (*Supply Chain Attacks*) en microservicios e integración con contenedores.

---

### 82. ¿Cómo previene Node.js ataques de *Prototype Pollution* en deserialización de objetos y cómo mitigarlo con `Object.freeze()` o `Object.create(null)`?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  El ataque de **Prototype Pollution** ocurre cuando un atacante inyecta propiedades especiales (`__proto__`, `constructor`, `prototype`) en objetos JSON que se fusionan de forma recursiva sin sanitización (*Deep Merge vulnerable*), modificando `Object.prototype` global.
  *Mecanismos de defensa de producción*:
  1. Flag del runtime: Iniciar Node.js con `node --disable-proto=delete` o `--disable-proto=throw` para desactivar la propiedad mágica `__proto__`.
  2. Uso de mapas limpios sin prototipo:
     ```javascript
     const safeDictionary = Object.create(null); // No hereda de Object.prototype
     ```
  3. Congelamiento del prototipo global en el arranque de la app:
     ```javascript
     Object.freeze(Object.prototype);
     Object.freeze(Array.prototype);
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar funciones caseras de `merge(target, source)` recursivas sin filtrar claves prohibidas (`__proto__`, `constructor`).
  - 🟢 *Green Flag*: Explica cómo congelar el prototipo o usar `Map` nativo erradica completamente esta clase de vulnerabilidad.

---

### 83. ¿Cuál es la diferencia entre la API criptográfica clásica `node:crypto` y la API estándar `globalThis.crypto.subtle` (WebCrypto) en Node.js?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **`node:crypto`**: API propietaria histórica de Node.js. Soporta operaciones síncronas (`crypto.randomBytes`, `crypto.pbkdf2Sync`) y streaming. No es interoperable con navegadores ni Cloudflare Workers / Deno.
  - **WebCrypto (`globalThis.crypto.subtle`)**: Estándar oficial de la W3C disponible nativamente en Node.js 16+.
    - Todas sus operaciones son estrictamente **asíncronas basadas en Promesas** (`Promise<ArrayBuffer>`).
    - Es 100% interoperable con cualquier entorno moderno (Node.js, Edge Runtimes, Browser).
    - Utiliza identificadores de claves estructurados (`CryptoKey`) que pueden marcarse como no exportables para que la clave privada nunca pueda ser leída en memoria plana de JavaScript.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar métodos síncronos pesados como `crypto.pbkdf2Sync` en el hilo principal bloqueando el Event Loop.
  - 🟢 *Green Flag*: Recomienda WebCrypto para librerías isomórficas o SDKs compartidos entre frontend y backend.

---

### 84. ¿Cómo generar claves de cifrado seguras derivadas de contraseñas con `crypto.scrypt` o Argon2 evitando ataques de fuerza bruta?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Hashes rápidos como MD5, SHA-1 o SHA-256 fueron diseñados para validar integridad de datos a alta velocidad. En contraseñas, un atacante con GPUs puede probar miles de millones de hashes por segundo.
  Las funciones de derivación de claves seguras (**KDF**) como **scrypt** o **Argon2** son intencionalmente lentas y consumidoras de memoria (*Memory-Hard Functions*):
  ```javascript
  import crypto from 'node:crypto';

  function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
      // N: coste de CPU/memoria (debe ser potencia de 2, ej. 16384)
      // r: tamaño de bloque, p: paralelización
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex'));
      });
    });
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Hashear contraseñas usando `crypto.createHash('sha256').update(pass).digest('hex')`.
  - 🟢 *Green Flag*: Explica la resistencia contra ataques basados en circuitos integrados específicos (ASICs/GPUs) que proveen las funciones con coste de memoria.

---

### 85. ¿Cómo implementar cifrado autenticado AES-256-GCM validando el *Authentication Tag* para prevenir manipulación de datos cifrados?
- **Nivel**: Senior / Security
- **Respuesta Técnica**:
  Modos antiguos como AES-CBC son vulnerables a ataques de oráculo de padding (*Padding Oracle Attacks*).
  **AES-256-GCM (Galois/Counter Mode)** es un algoritmo de cifrado autenticado con datos asociados (**AEAD**). No solo cifra los datos, sino que genera una etiqueta de autenticación (*Auth Tag* de 16 bytes) que garantiza matemáticamente que el mensaje no ha sido alterado:
  ```javascript
  import crypto from 'node:crypto';

  function encrypt(text, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag(); // Etiqueta criptográfica de 128 bits
    return { encrypted, authTag: authTag.toString('hex') };
  }

  function decrypt(encryptedHex, authTagHex, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8'); // Lanza excepción si el texto o tag fueron modificados
    return decrypted;
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Cifrar sin verificar el `authTag` o reutilizar el mismo IV (Initialization Vector) con la misma clave en AES-GCM (compromete totalmente la seguridad).
  - 🟢 *Green Flag*: Genera siempre un nuevo IV criptográfico aleatorio (`crypto.randomBytes(12)`) para cada cifrado.

---

### 86. ¿Qué es la aleatoriedad criptográfica (`crypto.randomBytes()`) frente a `Math.random()` y por qué este último nunca debe usarse en seguridad?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **`Math.random()`**: Utiliza un generador de números pseudoaleatorios lineal (*xorshift128+* en V8). Es determinista: observando unas pocas salidas sucesivas, un atacante puede deducir el estado interno de la semilla y predecir los siguientes números generados.
  - **`crypto.randomBytes(n)` / `crypto.getRandomValues()`**: Es un generador criptográficamente seguro (**CSPRNG**). En Linux extrae entropía directa del sistema operativo (`/dev/urandom` mediante `getrandom()`), garantizando impredecibilidad absoluta y resistencia a ataques de oráculo.
  *Regla*: Para tokens de restablecimiento de contraseña, claves de API, IDs de sesión o IVs, `Math.random()` está prohibido.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Generar tokens de sesión con `Math.random().toString(36).substring(2)`.
  - 🟢 *Green Flag*: Utiliza `crypto.randomBytes` o `crypto.randomUUID()` para cualquier identificador sensible.

---

### 87. ¿Cómo mitigar ataques de temporización (*Timing Attacks*) en comparación de hashes o firmas con `crypto.timingSafeEqual()`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  El operador estándar `a === b` compara cadenas de izquierda a derecha y **se detiene en el primer carácter que no coincide** (*fail-fast*).
  Un atacante remoto puede medir las diferencias nanométricas en el tiempo de respuesta HTTP para deducir carácter por carácter una firma HMAC o token secreto.
  `crypto.timingSafeEqual(bufA, bufB)` realiza una comparación en **tiempo constante**: siempre compara todos los bytes independientemente de dónde ocurra la primera discrepancia:
  ```javascript
  import crypto from 'node:crypto';

  export function verifyHmacSignature(receivedHex, expectedHex) {
    const bufA = Buffer.from(receivedHex, 'hex');
    const bufB = Buffer.from(expectedHex, 'hex');

    // Deben tener idéntica longitud antes de comparar para evitar fallos de buffer
    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `token === expectedToken` para verificar webhooks de Stripe, GitHub o firmas HMAC.
  - 🟢 *Green Flag*: Valida primero la longitud de los buffers para evitar excepciones en `timingSafeEqual` y asegurar tiempo constante.

---

### 88. ¿Cómo gestionar la validación estricta de políticas CORS y Headers de seguridad a nivel de servidor HTTP nativo sin dependencias externas?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  En un servidor HTTP nativo sin frameworks, se deben gestionar las peticiones pre-vuelo (*Preflight Options*) y los orígenes permitidos de forma estricta:
  ```javascript
  import http from 'node:http';

  const ALLOWED_ORIGINS = new Set(['https://mi-empresa.com', 'https://admin.mi-empresa.com']);

  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Manejar Preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Headers de Seguridad Defensivos
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
  server.listen(4000);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Responder con `Access-Control-Allow-Origin: *` cuando la API maneja cookies de sesión autenticadas.
  - 🟢 *Green Flag*: Implementa una lista blanca dinámica comparando el header `Origin` entrante.

---

### 89. ¿Cómo prevenir ataques ReDoS (Regular Expression Denial of Service) analizando la complejidad de autómatas?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Los motores de expresiones regulares que utilizan autómatas finitos no deterministas (NFA) con retroceso (*Backtracking*) sufren de **Catastrophic Backtracking** cuando la regex contiene patrones superpuestos repetidos (ej. `/(a+)+$/` o `/([a-zA-Z]+)*$/`):
  - Ante una entrada como `aaaaaaaaaaaaaaaaaaaaaaaaaaaa!`, el motor prueba exponencialmente (`O(2^n)`) todas las combinaciones posibles antes de fallar.
  - Esto congela el hilo único del Event Loop de Node.js al 100% de CPU durante horas con una sola petición.
  *Mitigaciones*:
  1. No usar regex con anidamiento de cuantificadores repetitivos.
  2. Usar flags de límite en Node.js o librerías de validación como `validator.js` o `re2` (motor de Google basado en DFA que garantiza tiempo lineal `O(n)`).
  3. Ejecutar análisis estáticos con herramientas como `safe-regex` en CI.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer por qué una expresión regular sencilla puede tumbar un clúster entero de Node.js.
  - 🟢 *Green Flag*: Explica cómo reemplazar regex vulnerables por validadores basados en analizadores léxicos simples o autómatas DFA.

---

### 90. ¿Cómo firmar y verificar tokens JWT de forma nativa con claves asimétricas RSA/ECDSA usando `crypto.createSign` y `crypto.createVerify`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  El estándar JWT asimétrico (RS256 / ES256) permite que el servidor de autenticación firme con la clave privada, y cualquier microservicio verifique la autenticidad con la clave pública sin compartir el secreto:
  ```javascript
  import crypto from 'node:crypto';

  function createSignedJwt(payload, privateKeyPem) {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const message = `${header}.${body}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    const signature = sign.sign(privateKeyPem, 'base64url');

    return `${message}.${signature}`;
  }

  function verifyJwt(jwtToken, publicKeyPem) {
    const [header, body, signature] = jwtToken.split('.');
    const message = `${header}.${body}`;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    const isValid = verify.verify(publicKeyPem, signature, 'base64url');

    return isValid ? JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) : null;
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar algoritmos simétricos (HS256) compartiendo la clave secreta con clientes o microservicios que solo necesitan validar.
  - 🟢 *Green Flag*: Utiliza `base64url` nativo de Buffer y maneja claves en formato PEM con firmas asimétricas.

---

## 10. WASI, N-API/Node-API C++ Addons y Patrones de Resiliencia

### 91. ¿Qué es Node-API (anteriormente N-API) y qué garantiza su estabilidad ABI (*Application Binary Interface*) entre versiones mayores de Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Históricamente, los addons nativos en C/C++ dependían directamente de las cabeceras internas de V8 (`v8.h`). Cada vez que Node.js actualizaba su versión de V8, la ABI cambiaba y el addon dejaba de compilar o crasheaba, requiriendo recompilaciones con `node-gyp`.
  **Node-API (N-API)** es una capa de abstracción en C estable a nivel de binario (*Application Binary Interface - ABI*):
  - Los binarios compilados contra Node-API para Node.js v16 pueden ejecutarse sin recompilar en Node.js v18, v20 o v22.
  - Aísla al desarrollador de cambios internos en el Garbage Collector o el motor de ejecución de V8.
  - Provee wrappers orientados a objetos con la librería oficial `node-addon-api` en C++.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desarrollar addons usando directamente APIs crudas de V8 que se rompen al actualizar parches menores.
  - 🟢 *Green Flag*: Utiliza `node-addon-api` y pre-empaqueta binarios multiplataforma con `prebuildify`.

---

### 92. ¿Cómo se comunican los Addons de C++ con el Event Loop de Node.js mediante `napi_create_async_work` y `napi_queue_async_work`?
- **Nivel**: Staff Engineer / Systems
- **Respuesta Técnica**:
  Si un addon de C++ ejecuta un cálculo matemático pesado directamente en la llamada invocada desde JavaScript, bloqueará el hilo principal de Node.js.
  Para delegar el trabajo al Threadpool de Libuv:
  1. **`napi_create_async_work`**: Define dos callbacks en C++:
     - `execute`: Se ejecuta en un **hilo del pool de Libuv en paralelo**. Aquí se realiza el cálculo pesado en C++. **No se puede acceder a objetos de V8 aquí**.
     - `complete`: Se ejecuta de vuelta en el **hilo principal de Node.js**. Transforma los resultados nativos de C++ en tipos de JavaScript (`napi_value`) y resuelve la Promesa.
  2. **`napi_queue_async_work`**: Encola la tarea en el threadpool.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar manipular objetos de JavaScript dentro del hilo secundario de Libuv (provoca un Crash/Segmentation Fault inmediato).
  - 🟢 *Green Flag*: Demuestra cómo Node-API garantiza el traspaso seguro de memoria nativa al contexto de V8.

---

### 93. ¿Qué es WASI (WebAssembly System Interface) en Node.js y cómo permite ejecutar binarios WebAssembly con acceso controlado al sistema de archivos?
- **Nivel**: Senior
- **Respuesta Técnica**:
  WebAssembly tradicional fue diseñado para correr en navegadores sin acceso al sistema de archivos ni sockets.
  **WASI (WebAssembly System Interface)** es un estándar POSIX para WebAssembly que permite ejecutar módulos Wasm en el servidor (compilados desde Rust, C++ o Go) con acceso explícito y seguro a recursos del sistema:
  ```javascript
  import { readFile } from 'node:fs/promises';
  import { WASI } from 'node:wasi';

  const wasi = new WASI({
    version: 'preview1',
    args: process.argv,
    env: process.env,
    preopens: {
      '/sandbox': './safe-folder', // Solo puede leer/escribir en esta carpeta
    },
  });

  const wasmBuffer = await readFile('./module.wasm');
  const { instance } = await WebAssembly.instantiate(wasmBuffer, wasi.getImports());

  wasi.start(instance);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que WebAssembly en Node.js tiene acceso sin restricciones a todos los archivos del servidor por defecto.
  - 🟢 *Green Flag*: Destaca la capacidad de WASI para correr código no confiable en sandboxes seguros de alto rendimiento.

---

### 94. ¿Cuándo compilar funciones matemáticas pesadas a WebAssembly (Rust/C) frente a ejecutarlas en JavaScript puro optimizado por V8?
- **Nivel**: Staff Engineer / Performance
- **Respuesta Técnica**:
  El compilador TurboFan de V8 es extremadamente rápido en código JavaScript monomórfico simple; de hecho, para operaciones pequeñas, el coste de cruzar la frontera entre JavaScript y WebAssembly (*Call Boundary Crossing Overhead*) hace que Wasm sea más lento.
  *Cuándo usar WebAssembly*:
  1. **Predictibilidad de Rendimiento**: WebAssembly no tiene pausas de Garbage Collection ni sufre de desoptimizaciones JIT por polimorfismo.
  2. **Operaciones intensivas en memoria contigua**: Procesamiento de imágenes (sharp/libvips), compresión (brotli/zstd), criptografía pesada o compiladores (SWC/esbuild).
  3. **Reutilización de código existente**: Librerías maduras en Rust o C++ que no tienen equivalente en el ecosistema JS.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Afirmar que WebAssembly siempre es 10x más rápido que JavaScript para cualquier tarea trivial.
  - 🟢 *Green Flag*: Realiza benchmarks midiendo el overhead de transferencia de buffers y conversión de tipos entre JS y Wasm.

---

### 95. ¿Cómo implementar un patrón Circuit Breaker nativo con estados Closed, Open y Half-Open para proteger servicios downstream?
- **Nivel**: Senior / Resiliencia
- **Respuesta Técnica**:
  Cuando un servicio downstream (ej. API de pagos externa) falla, continuar bombardeándolo con peticiones empeora el fallo y agota los recursos de Node.js.
  El **Circuit Breaker** gestiona 3 estados:
  - **Closed (Cerrado)**: Funcionamiento normal. Si la tasa de fallos supera un umbral (ej. 50% en 10s), transiciona a **Open**.
  - **Open (Abierto)**: Rechaza instantáneamente las peticiones entrantes (*Fail-Fast*) sin llamar al servicio externo, retornando una respuesta de fallback.
  - **Half-Open (Semiabierto)**: Tras un tiempo de enfriamiento (ej. 30s), permite pasar un número limitado de peticiones de prueba. Si tienen éxito, vuelve a **Closed**; si fallan, regresa a **Open**.
  ```typescript
  export class CircuitBreaker {
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private failureCount = 0;
    private nextAttempt = Date.now();

    constructor(private threshold = 5, private cooldownMs = 30_000) {}

    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (this.state === 'OPEN') {
        if (Date.now() > this.nextAttempt) {
          this.state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit Breaker ABIERTO: Servicio temporalmente degradado');
        }
      }

      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (err) {
        this.onFailure();
        throw err;
      }
    }

    private onSuccess() {
      this.failureCount = 0;
      this.state = 'CLOSED';
    }

    private onFailure() {
      this.failureCount++;
      if (this.failureCount >= this.threshold || this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.cooldownMs;
      }
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar que las peticiones se acumulen esperando timeouts de 30 segundos saturando el pool de conexiones de Node.js.
  - 🟢 *Green Flag*: Explica cómo el Circuit Breaker protege al cliente y al servidor downstream durante incidentes de degradación.

---

### 96. ¿Cómo implementar un mecanismo de *Graceful Drain* en servidores HTTP cerrando conexiones existentes con `server.closeIdleConnections()`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Históricamente, al invocar `server.close()`, Node.js dejaba de aceptar nuevas conexiones pero mantenía abiertos los sockets HTTP con Keep-Alive indefinidamente hasta que el cliente los cerrara, bloqueando el proceso durante el despliegue.
  Node.js 18.2+ introdujo `server.closeIdleConnections()` y `server.closeAllConnections()`:
  ```javascript
  async function gracefulShutdown(server, dbPool) {
    console.log('Iniciando apagado ordenado...');

    // 1. Dejar de aceptar nuevas conexiones
    server.close(() => console.log('Servidor HTTP cerrado'));

    // 2. Cerrar sockets HTTP que estén en espera (Keep-Alive inactivos)
    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }

    // 3. Timeout forzado de seguridad (ej. 15 segundos)
    const forceTimeout = setTimeout(() => {
      console.warn('Forzando cierre de sockets activos...');
      server.closeAllConnections();
      process.exit(1);
    }, 15_000);
    forceTimeout.unref(); // No retener el Event Loop

    // 4. Cerrar base de datos
    await dbPool.end();
    process.exit(0);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Matar el servidor con `process.exit(0)` abruptamente cortando peticiones en pleno vuelo.
  - 🟢 *Green Flag*: Combina `closeIdleConnections()` con timeouts no referenciados (`unref()`) para apagar pods de Kubernetes en segundos sin errores 502 Bad Gateway.

---

### 97. ¿Cómo funciona el módulo `readline` y el procesamiento de streams de entrada interactiva con soporte VT100/ANSI?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  El módulo `node:readline` provee una interfaz para leer líneas de texto desde un `ReadableStream` (como `process.stdin`) de forma incremental y eficiente en memoria:
  ```javascript
  import readline from 'node:readline';
  import fs from 'node:fs';

  async function processHugeLogFile(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // Reconoce 
 y 
 unificadamente
    });

    for await (const line of rl) {
      if (line.includes('ERROR_CRITICAL')) {
        console.log(`Encontrado: ${line}`);
      }
    }
  }
  ```
  Soporta secuencias de escape ANSI/VT100 para crear interfaces de terminal interactivas (prompts, contraseñas ocultas con `terminal: true`, autocompletado con tabuladores).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Cargar un archivo de log de 10GB en memoria con `fs.readFile` y hacer `content.split('\n')`.
  - 🟢 *Green Flag*: Utiliza `for await...of` con `readline` para procesar archivos de cualquier tamaño con memoria constante O(1).

---

### 98. ¿Cómo gestionar la sincronización de tiempo y el problema de los segundos intercalares (*Leap Seconds*) usando `process.hrtime.bigint()`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **`Date.now()` y `new Date()`**: Devuelven la hora del reloj de pared (*Wall Clock Time*). Este reloj es sincronizado mediante NTP (Network Time Protocol). Puede retroceder en el tiempo, saltar hacia adelante o congelarse durante un segundo intercalar (*Leap Second*), haciendo que `Date.now() - start` pueda ser negativo.
  - **`process.hrtime.bigint()`**: Devuelve nanosegundos desde un punto arbitrario en el pasado utilizando un **Reloj Monótono del sistema operativo** (*Monotonic Clock* `CLOCK_MONOTONIC`).
    - Nunca retrocede en el tiempo.
    - No se ve afectado por ajustes de NTP ni cambios de zona horaria.
    - Es la única forma precisa de medir latencia y duraciones de operaciones:
  ```javascript
  const start = process.hrtime.bigint();
  await executeDatabaseQuery();
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  console.log(`Latencia exacta: ${durationMs.toFixed(3)} ms`);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Medir tiempos de respuesta o expiración de tokens usando restas de `Date.now()`.
  - 🟢 *Green Flag*: Conoce el impacto del reloj monótono en métricas de alta precisión y benchmarking.

---

### 99. ¿Cómo orquestar un proceso Node.js como demonio systemd en Linux gestionando señales `SIGTERM`, `SIGHUP` y `systemd-notify`?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  En entornos Linux de producción sin contenedores, Node.js se gestiona mediante `systemd`:
  ```ini
  # /etc/systemd/system/node-app.service
  [Unit]
  Description=Node.js Enterprise Service
  After=network.target

  [Service]
  Type=simple
  User=nodeuser
  ExecStart=/usr/bin/node /app/dist/server.js
  Restart=always
  RestartSec=5s
  LimitNOFILE=65536
  StandardOutput=journal
  StandardError=journal
  TimeoutStopSec=30s
  KillMode=mixed
  ```
  - **`SIGTERM`**: Enviado por systemd al detener o reiniciar el servicio (`systemctl stop`). Node.js debe capturarlo e iniciar el graceful shutdown.
  - **`SIGHUP`**: Utilizado convencionalmente para recargar configuraciones en caliente sin reiniciar el proceso.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No gestionar `SIGTERM` en Node.js, provocando que systemd espere `TimeoutStopSec` y luego mate el proceso a la fuerza con `SIGKILL`.
  - 🟢 *Green Flag*: Ajusta `LimitNOFILE` (file descriptors) en systemd para permitir más de 1024 sockets concurrentes.

---

### 100. ¿Cómo construir una arquitectura de microservicios resiliente en Node.js basada en el principio de *Crash Early, Crash Often* supervisada por un orquestador?
- **Nivel**: Staff Engineer / Systems Architect
- **Respuesta Técnica**:
  En el diseño de sistemas distribuidos, un proceso de Node.js que ha sufrido un error imprevisto (ej. `TypeError` no capturado o estado de memoria corrupto) **no debe intentar continuar ejecutándose**:
  - Si una Promesa no capturada corrompió una variable de sesión global o dejó una transacción SQL semiabierta, intentar continuar expone al sistema a fugas de datos y corrupción de base de datos.
  - **Principio Fail-Fast (Crash Early)**:
    1. Ante `uncaughtException` o `unhandledRejection`, se registra el error con stack trace completo.
    2. Se cierra el servidor HTTP para no recibir más tráfico.
    3. El proceso se autodestruye inmediatamente con `process.exit(1)`.
    4. El orquestador de nivel superior (**Kubernetes Kubelet** o **systemd**) detecta el código de salida no cero y levanta un nuevo Pod/proceso con memoria limpia en milisegundos.
  La resiliencia no se logra evitando que un proceso muera, sino diseñando la arquitectura para que cualquier nodo pueda morir en cualquier microsegundo sin pérdida de servicio (*Disposable Processes* de The Twelve-Factor App).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Colocar un bloque gigante `process.on('uncaughtException', (err) => { /* ignorar y seguir */ })` para evitar que el servidor se caiga.
  - 🟢 *Green Flag*: Explica la filosofía Erlang/OTP (*Let it crash*) aplicada a la orquestación moderna en Kubernetes y The Twelve-Factor App.
