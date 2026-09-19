# Nivel 02: Trainee (Desarrollador en Formación)

Este nivel consolida el control del flujo asíncrono básico, la manipulación del sistema de archivos y el manejo de errores.

---

## 🎯 Qué debe saber un desarrollador en este nivel

1. **Evolución del Flujo Asíncrono**:
   - **Error-First Callbacks**: La convención tradicional `(err, result) => { ... }`.
   - **Callback Hell**: Cómo la anidación excesiva destruye la legibilidad y el control de errores.
   - **Promises & Promise Chaining**: `.then()`, `.catch()`, `Promise.all()`, `Promise.allSettled()`.
   - **`async` / `await`**: Sintaxis imperativa limpia sobre Promises, manejo con bloques `try / catch`.
2. **Sistema de Archivos Básico (`node:fs/promises`)**:
   - Lectura y escritura asíncrona de ficheros con `fs.readFile()` y `fs.writeFile()`.
   - Por qué jamás se debe usar `fs.readFileSync()` en el ciclo de vida de peticiones.
3. **Módulo `node:path`**:
   - `path.join()` vs `path.resolve()`: prevención de bugs multiplataforma (Windows `\` vs Linux/macOS `/`).
4. **Manejo de Errores y Excepciones**:
   - Diferencia entre errores operativos (fallo de red, archivo no encontrado) y errores de programador (TypeError, ReferenceError).
   - Eventos del proceso: `unhandledRejection` y `uncaughtException`.
