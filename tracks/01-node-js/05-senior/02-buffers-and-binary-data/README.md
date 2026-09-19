# Módulo 02: Buffers, Memoria Binaria y Slab Allocation

Para un desarrollador senior, los **Buffers** son el mecanismo para manipular secuencias de bytes binarios directos en memoria fuera del heap de V8.

Antes de la introducción de `Uint8Array` en ECMAScript 2015, JavaScript no tenía forma de manejar datos binarios eficientemente. Node.js implementó `Buffer` respaldado por código C++ nativo. Hoy en día, `Buffer` hereda de `Uint8Array`, pero incluye optimizaciones propietarias de Node.js que todo arquitecto senior debe dominar.

---

## 🧠 ¿Dónde vive la memoria de un Buffer?

```
+-----------------------------------------------------------+
|                        MEMORIA RAM                        |
|                                                           |
|   +--------------------------+   +--------------------+   |
|   |         V8 Heap          |   |   C++ ArrayBuffer  |   |
|   |  - Objetos JS            |   |   (Memoria Externa)|   |
|   |  - Wrapper Buffer (peq.) |-->|   - Datos binarios |   |
|   |    (puntero a memoria)   |   |     reales en RAM  |   |
|   +--------------------------+   +--------------------+   |
+-----------------------------------------------------------+
```

El objeto JavaScript `Buffer` en V8 es simplemente una estructura liviana (wrapper) con un puntero que apunta a un bloque de memoria sin procesar gestionado en C++.

---

## ⚔️ `Buffer.alloc` vs `Buffer.allocUnsafe`

| Método | Inicialización | Velocidad | Riesgo de Seguridad |
| :--- | :--- | :--- | :--- |
| `Buffer.alloc(size)` | Rellena la memoria con ceros (`0x00`) | Más lento (coste de escritura) | **Seguro**: Nunca expone datos antiguos |
| `Buffer.allocUnsafe(size)` | **NO inicializa**. Reutiliza la RAM tal cual | Extremadamente rápido | 🚨 **Crítico**: Puede filtrar contraseñas, tokens JWT o trozos de peticiones HTTP previas si se envía al cliente sin sobrescribir por completo |

---

## 🧩 El Pool de 8KB (Slab Allocation)

Asignar memoria al sistema operativo o a C++ en cada petición pequeña es muy costoso. Para optimizar esto, Node.js utiliza un **Slab Allocator**:

- Si un buffer mide **4 KB o menos** (`Buffer.poolSize >>> 1`, normalmente 4096 bytes), Node.js **no pide memoria al SO**.
- En su lugar, corta una porción ("slice") de un bloque preasignado de **8192 bytes (8 KB)** (`Buffer.poolSize`).
- **El riesgo Senior (Memory Leak por Retención)**:
  Si cortas un buffer de 10 bytes de un slab de 8 KB y lo guardas en una caché global o closure, **el Garbage Collector no puede liberar ninguno de los 8192 bytes** hasta que ese buffer de 10 bytes sea descartado.
  *Solución*: Usar `Buffer.from(smallBuffer)` o `Buffer.allocUnsafeSlow()` para desacoplarlo del slab compartido.

---

## 📂 Scripts del Módulo

1. **`01-alloc-vs-alloc-unsafe.js`**:
   - Detección visual de basura en memoria RAM residual con `allocUnsafe` y benchmark comparativo de rendimiento.
2. **`02-slab-allocation-and-memory-leaks.js`**:
   - Inspección del slab subyacente con `buf.buffer.byteLength`, demostración de fuga de memoria por retención y cómo resolverla.
3. **`03-buffer-views-and-zero-copy.js`**:
   - Mutación de memoria compartida con `subarray()` (Zero-Copy) vs copias seguras con `Buffer.copy()`.
