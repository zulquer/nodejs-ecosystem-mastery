# Módulo 05: Concurrencia, Hilos y Escalabilidad Multiproceso

Una de las confusiones más comunes entre desarrolladores junior y mid es la frase: *"Node.js es single-threaded"*.

Un **Senior Developer** sabe que:
- Solo el **Call Stack de JavaScript** se ejecuta en un único hilo.
- **Libuv** mantiene un **Threadpool en C/C++** (4 hilos por defecto) para tareas síncronas del sistema operativo.
- El módulo **`worker_threads`** permite paralelismo real de CPU en múltiples núcleos compartiendo memoria mediante `SharedArrayBuffer`.
- El módulo **`cluster`** permite escalar horizontalmente en la misma máquina aprovechando todos los núcleos de CPU.

---

## 🏛️ Los 4 Modelos de Concurrencia en Node.js

```
+-------------------------------------------------------------------------------+
|                               NODE.JS RUNTIME                                 |
|                                                                               |
| 1. MAIN THREAD (JS)      2. LIBUV THREADPOOL       3. WORKER THREADS (JS)     |
|    - Call Stack             - 4 hilos por defecto     - V8 Isolate separado   |
|    - Event Loop             - Tareas: fs, crypto,     - Comparte memoria con  |
|    - Non-blocking I/O         zlib, dns.lookup          SharedArrayBuffer     |
|      (epoll / kqueue)       - UV_THREADPOOL_SIZE                            |
|                                                                               |
+-------------------------------------------------------------------------------+
| 4. CLUSTER & CHILD PROCESS (Múltiples Procesos del SO)                       |
|    - Procesos independientes con memoria aislada                              |
|    - Comparten el mismo puerto de red (Round-Robin en Linux/macOS)            |
+-------------------------------------------------------------------------------+
```

---

## ⚖️ Cuándo usar cada herramienta

| Caso de Uso | Herramienta Correcta | Razón Arquitectónica |
| :--- | :--- | :--- |
| Peticiones HTTP, consultas SQL, sockets de red | **Event Loop estándar** | I/O no bloqueante gestionado directamente por el kernel del SO (sin hilos). |
| Hasheo de contraseñas (`pbkdf2`, `scrypt`), compresión `gzip`, lectura masiva de disco | **Libuv Threadpool** (`UV_THREADPOOL_SIZE`) | Son operaciones C++ delegadas a hilos de fondo. Requiere calibrar el tamaño del pool. |
| Algoritmos pesados de CPU (procesamiento de imágenes, IA, ML, compresión custom, criptografía) | **`worker_threads`** | Evita congelar el Event Loop del Main Thread sin crear la sobrecarga de un nuevo proceso. |
| Escalar una API HTTP en un servidor multicore (ej. servidor de 16 cores) | **`cluster`** o PM2 / Kubernetes | Crea 1 proceso Node por núcleo, repartiendo la carga de peticiones entrantes. |

---

## 📂 Scripts del Módulo

1. **`01-libuv-threadpool-starvation.js`**:
   - Demostración de inanición del Threadpool de Libuv: cómo 4 tareas de hashing saturan todos los hilos y retrasan operaciones de lectura de archivos (`fs`), y cómo calibrar `UV_THREADPOOL_SIZE`.
2. **`02-worker-threads-and-atomics.js`**:
   - Hilos de trabajo reales (`worker_threads`). Demostración de una **Race Condition** real en JavaScript con `SharedArrayBuffer` y cómo resolverla con operaciones atómicas seguras (`Atomics.add()`).
3. **`03-cluster-and-zero-downtime.js`**:
   - Creación de un clúster multicore y demostración del patrón de **Rolling Restart** (reciclaje de workers con cero caídas de servicio).
