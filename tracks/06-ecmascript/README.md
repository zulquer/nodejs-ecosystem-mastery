# 📜 ECMAScript Evolution: De ES6 (ES2015) a ES2024 / ES2025

En entrevistas técnicas y arquitectura senior, dominar **qué característica llegó en qué versión de ECMAScript** y por qué fue introducida demuestra si un desarrollador conoce las raíces del lenguaje o simplemente copia código de StackOverflow.

Esta guía documenta la evolución cronológica del estándar oficial de JavaScript año por año.

---

## 🗺️ Línea de Tiempo de ECMAScript

```
+-----------------------------------------------------------------------------------------+
| VERSIÓN  | NOMBRE OFICIAL | CARACTERÍSTICAS MÁS REVOLUCIONARIAS                         |
+-----------------------------------------------------------------------------------------+
| ES6      | ES2015         | Promises, Arrow Functions, Classes, let/const, Modules,     |
|          |                | Destructuring, Map/Set, Symbols, Generators, Proxy/Reflect  |
+-----------------------------------------------------------------------------------------+
| ES7      | ES2016         | Array.includes(), Operador de Exponente (**)                |
+-----------------------------------------------------------------------------------------+
| ES8      | ES2017         | async / await, Object.values(), Object.entries(), Atomics   |
+-----------------------------------------------------------------------------------------+
| ES9      | ES2018         | Rest/Spread en Objetos, for await...of, Promise.finally()    |
+-----------------------------------------------------------------------------------------+
| ES10     | ES2019         | Array.flat(), flatMap(), Object.fromEntries(), optional catch|
+-----------------------------------------------------------------------------------------+
| ES11     | ES2020         | Optional Chaining (?.), Nullish Coalescing (??), BigInt,    |
|          |                | Promise.allSettled(), globalThis, dynamic import()          |
+-----------------------------------------------------------------------------------------+
| ES12     | ES2021         | replaceAll(), Promise.any(), Asignación Lógica (??=, ||=),   |
|          |                | Numeric Separators (1_000_000), WeakRef                     |
+-----------------------------------------------------------------------------------------+
| ES13     | ES2022         | Top-Level await, Campos Privados (#field), Array.at(),      |
|          |                | Object.hasOwn(), Error Cause ({ cause: err })               |
+-----------------------------------------------------------------------------------------+
| ES14     | ES2023         | Change Array by Copy (toSorted, toReversed, with),          |
|          |                | findLast(), findLastIndex(), Hashbang grammar               |
+-----------------------------------------------------------------------------------------+
| ES15     | ES2024         | Object.groupBy(), Map.groupBy(), Promise.withResolvers(),   |
|          |                | ArrayBuffer Transfer & Resize                               |
+-----------------------------------------------------------------------------------------+
| ES16+    | ES2025 / Next  | Explicit Resource Management (using keyword), Temporal API  |
+-----------------------------------------------------------------------------------------+
```

---

## 🔍 Detalle Año por Año

### 💥 ES6 / ES2015 (La Gran Revolución)
- **`let` y `const`**: Ámbito de bloque (*Block Scope*) y Zona Muerta Temporal (*TDZ - Temporal Dead Zone*).
- **Arrow Functions**: Contexto léxico inmutable de `this` (no tienen su propio `this`, `arguments` ni `prototype`).
- **Clases**: Azúcar sintáctico sobre herencia prototípica (`class`, `extends`, `super`).
- **Promesas**: Abstracción nativa de cómputo asíncrono diferido (`new Promise((resolve, reject) => ...)`).
- **Desestructuración y Parámetros por Defecto**: `const { user, age = 18 } = payload;`.
- **Nuevas Estructuras**: `Map` (claves de cualquier tipo), `Set` (valores únicos), `WeakMap` y `WeakSet` (claves referenciadas débilmente sin bloquear al Garbage Collector).
- **`Symbol`**: Tipo primitivo único e inmutable para propiedades privadas y protocolos internos (`Symbol.iterator`, `Symbol.asyncIterator`).
- **Generadores e Iteradores**: Funciones pausable/reanudables (`function*`, `yield`).
- **`Proxy` y `Reflect`**: Metaprogramación nativa e interceptación de operaciones de objetos (*traps* como `get`, `set`, `apply`).

---

### ⚡ ES2016 (ES7)
- **`Array.prototype.includes(value)`**: Reemplaza el torpe `indexOf(value) !== -1` y maneja correctamente `NaN` (`[NaN].includes(NaN)` es `true`, mientras que `indexOf` fallaba).
- **Operador de exponenciación `**`**: `2 ** 10 === 1024` (reemplazo de `Math.pow()`).

---

### 🚀 ES2017 (ES8)
- **`async` / `await`**: Sintaxis imperativa secuencial sobre Promises.
- **`Object.values()` y `Object.entries()`**: Iteración directa de valores y pares `[key, value]`.
- **String Padding**: `str.padStart(length, pad)` y `str.padEnd()`.
- **`SharedArrayBuffer` y `Atomics`**: Memoria compartida y operaciones atómicas para concurrencia multihilo.

---

### 📦 ES2018 (ES9)
- **Rest/Spread en Objetos**: Copia superficial y extracción limpia `const { id, ...rest } = entity;`.
- **Iteración Asíncrona**: `for await (const chunk of stream)`.
- **`Promise.prototype.finally()`**: Ejecutar limpieza garantizada tanto si la promesa resuelve como si rechaza.
- **RegExp Mejorado**: Grupos de captura con nombre (`(?<year>\d{4})`), Lookbehind assertions (`(?<=...)` y `(?<!...)`).

---

### 🧹 ES2019 (ES10)
- **`Array.prototype.flat(depth)` y `flatMap()`**: Aplanar arrays multidimensionales en un solo paso.
- **`Object.fromEntries(entries)`**: La operación inversa a `Object.entries()`, ideal para transformar mapas o query params en objetos.
- **Optional Catch Binding**: `try { ... } catch { ... }` ya no requiere declarar `(error)` si no se va a usar.
- **`String.prototype.trimStart()` y `trimEnd()`**.

---

### 🛡️ ES2020 (ES11)
- **Optional Chaining (`?.`)**: Navegación segura en propiedades potencialmente nulas `user?.profile?.avatar`.
- **Nullish Coalescing (`??`)**: Evalúa el lado derecho solo si el izquierdo es `null` o `undefined` (a diferencia de `||` que también colapsa con `0`, `""` o `false`).
- **`BigInt`**: Soporte para enteros arbitrariamente grandes más allá de `Number.MAX_SAFE_INTEGER` (`2^53 - 1`).
- **`Promise.allSettled()`**: Espera a que todas las promesas finalicen sin abortar si una falla (devuelve array de `{ status: 'fulfilled' | 'rejected', value, reason }`).
- **`globalThis`**: Referencia universal al ámbito global (`window` en navegador, `global` en Node.js, `self` en Web Workers).
- **Dynamic `import()`**: Carga de módulos bajo demanda en tiempo de ejecución.

---

### 🔧 ES2021 (ES12)
- **`String.prototype.replaceAll()`**: Reemplazar todas las ocurrencias sin necesidad de usar RegExp con bandera `/g`.
- **`Promise.any()`**: Retorna la PRIMERA promesa que resuelva exitosamente (ignora rechazos a menos que todas fallen, en cuyo caso lanza `AggregateError`).
- **Operadores de Asignación Lógica**: `a ??= b`, `a ||= b`, `a &&= b`.
- **Separadores Numéricos**: `const unMillon = 1_000_000;`.
- **`WeakRef` & `FinalizationRegistry`**: Referencias débiles directas y callbacks al recolectarse objetos por el GC.

---

### 💎 ES2022 (ES13)
- **Top-Level `await`**: Usar `await` directamente en la raíz de módulos ESM sin necesidad de envolver en una IIFE `(async () => { ... })()`.
- **Campos y Métodos Privados (#)**: Verdadera privacidad a nivel de hardware/motor V8 con `#privateField` (no accesible desde fuera de la clase ni con `Object.keys`).
- **Bloques Estáticos (`static { ... }`)**: Inicialización compleja de clases antes de la primera instancia.
- **`Array.prototype.at(index)`**: Indexación negativa elegante `arr.at(-1)` (último elemento) sin `arr[arr.length - 1]`.
- **`Object.hasOwn(obj, prop)`**: Reemplazo robusto y seguro de `obj.hasOwnProperty(prop)`.
- **Error Cause**: `new Error('Pago fallido', { cause: errorOriginal })` para encadenamiento y diagnóstico de errores en producción.

---

### 🎨 ES2023 (ES14)
- **Change Array by Copy**: Modificar arrays **sin mutar el original** (Programación Funcional pura):
  - `arr.toSorted()` (ordena y retorna un nuevo array).
  - `arr.toReversed()` (invierte y retorna un nuevo array).
  - `arr.toSpliced(start, deleteCount, ...items)` (retorna copia con elementos modificados).
  - `arr.with(index, newValue)` (retorna copia con un elemento reemplazado).
- **`findLast()` y `findLastIndex()`**: Búsqueda desde el final del array hacia el inicio.

---

### 🌟 ES2024 (ES15)
- **`Object.groupBy()` y `Map.groupBy()`**: Agrupación nativa de colecciones según una función selectora (adiós a `lodash.groupBy`).
- **`Promise.withResolvers()`**: Crea una promesa y expone sus funciones `{ promise, resolve, reject }` sin envoltorios complejos.
- **ArrayBuffer Resizing & Transfer**: `buffer.transfer()` y `buffer.resize()` para cambiar tamaño de memoria binaria sin reasignaciones costosas.

---

### 🔮 ES2025 / Next (El Futuro Inmediato)
- **Explicit Resource Management (`using` keyword)**: Liberación automática de recursos (archivos, sockets, conexiones a BD) al salir del bloque de código mediante `Symbol.dispose` y `Symbol.asyncDispose`.
- **Temporal API**: Reemplazo completo del defectuoso objeto `Date` con soporte robusto de zonas horarias, calendarios y duraciones exactas.
