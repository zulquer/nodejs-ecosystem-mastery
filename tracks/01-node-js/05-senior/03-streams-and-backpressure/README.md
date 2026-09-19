# Módulo 03: Streams, Backpressure y Pipeline

Los **Streams** son la abstracción fundamental de Node.js para manejar grandes volúmenes de datos con una huella de memoria (RAM) constante y mínima.

Un desarrollador junior suele cargar archivos enteros en memoria con `fs.readFile()` o acumular arrays gigantes en arrays de JavaScript. Un **Senior**, en cambio, procesa peticiones de gigabytes consumiendo apenas 20 MB de RAM mediante streaming continuo.

---

## 🌊 Anatomía de los Streams

```
+-------------------------------------------------------------+
| 1. READABLE:  Fuente de datos (ej. fs.createReadStream, req)|
|               Emite eventos: 'data', 'end', 'error'         |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 2. TRANSFORM: Modifica datos sobre la marcha                |
|               (ej. zlib.createGzip, cifrado, parseo CSV)    |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 3. WRITABLE:  Destino de datos (ej. fs.createWriteStream,res|
|               Métodos: write(), end(), evento 'drain'       |
+-------------------------------------------------------------+
```

---

## 🛑 El Fenómeno del Backpressure (Presión de Retorno)

¿Qué ocurre cuando la fuente produce datos a **100 MB/s** (ej. disco NVMe rápido) pero el destino solo puede absorber a **1 MB/s** (ej. cliente conectado por 3G o base de datos remota lenta)?

```
[ READABLE (100 MB/s) ] 
         │ 
         ▼ (Empuja datos a toda velocidad)
┌────────────────────────────────────────┐
│  BÚFER INTERNO DE WRITABLE (RAM)       │
│  highWaterMark (16 KB por defecto)     │
│  [xxxx xxxx xxxx xxxx] -> LLENO (16KB) │
│  [xxxx xxxx xxxx xxxx xxxx xxxx xxxx]  │ <-- Si se ignora el retorno false de write(),
│  ... (crece sin límite hasta el OOM)   │     la RAM colapsa (JavaScript heap OOM)
└────────────────────────────────────────┘
         │
         ▼
[ WRITABLE LENTO (1 MB/s) ]
```

### El Contrato de Backpressure:
1. `writable.write(chunk)` devuelve `true` si el búfer interno está por debajo de `highWaterMark`.
2. Si devuelve `false`, **el búfer está lleno**. El productor DEBE pausar (`readable.pause()`).
3. Cuando el consumidor se desahoga y vacía el búfer, el Writable emite el evento `'drain'`.
4. El productor escucha `'drain'` y reanuda el flujo (`readable.resume()`).

---

## ⚠️ ¿Por qué `.pipe()` está PROHIBIDO en código Senior moderno?

El método heredado `readable.pipe(writable)` tiene un fallo arquitectónico severo:
- Si el destino (`writable`) falla o lanza un error, `.pipe()` **NO destruye el readable**.
- El archivo de origen o socket permanece abierto indefinidamente, provocando **fugas de File Descriptors (EMFILE: too many open files)** o sockets zombis.
- No hay propagación centralizada de errores (tienes que registrar `.on('error')` en cada stream individualmente).

### La Solución Senior: `node:stream/promises` (`pipeline`)
```javascript
import { pipeline } from 'node:stream/promises';

// pipeline() garantiza que si CUALQUIERA de los streams falla,
// TODOS los demás son destruidos (.destroy()) y se liberan sockets y archivos.
await pipeline(readableStream, transformStream, writableStream);
```

---

## 📂 Scripts del Módulo

1. **`01-backpressure-and-drain.js`**:
   - Comparación en tiempo real: simulación de escribir millones de datos a un consumidor lento. Observación del pico de RAM al ignorar backpressure frente a consumo plano (<25MB) respetando `'drain'`.
2. **`02-pipeline-vs-pipe-leaks.js`**:
   - Demostración de fuga de descriptores de fichero con `.pipe()` ante errores no controlados frente a la limpieza automática con `pipeline()`.
3. **`03-custom-transform-and-generators.js`**:
   - Construcción de un Transform Stream clásico vs el paradigma moderno con **Async Generators (`for await...of`)** para procesamiento línea a línea de archivos masivos.
