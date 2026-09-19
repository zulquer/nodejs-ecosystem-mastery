# Nivel 01: Fundamentals (Fundamentos de Node.js)

Este nivel cubre los conceptos esenciales de qué es Node.js y cómo se ejecuta el código en el entorno de servidor.

---

## 🎯 Qué debe saber un desarrollador en este nivel

1. **¿Qué es Node.js exactamente?**:
   - No es un lenguaje de programación ni un framework: es un **entorno de ejecución (runtime)** de JavaScript para servidores.
   - Basado en el motor de JavaScript **V8** de Google Chrome y la librería multiplataforma **Libuv**.
2. **Sistema de Módulos (CommonJS vs ESM)**:
   - CommonJS (`require` / `module.exports`): Síncrono, estándar histórico de Node.js.
   - ECMAScript Modules (`import` / `export`): Asíncrono, estándar moderno de JavaScript (`"type": "module"` en `package.json`).
3. **Objetos Globales de Node.js**:
   - `process`: Información del proceso del SO (`process.env`, `process.argv`, `process.exit`, `process.pid`).
   - `globalThis` vs `window` de los navegadores.
   - `__dirname` y `__filename` (en CJS) vs `import.meta.url` (en ESM).
4. **CLI de Node.js & Flags Esenciales**:
   - `node app.js`, `node -v`, `node --watch app.js` (recarga en caliente nativa en Node 18+).
   - `--env-file=.env` (carga nativa de variables de entorno sin librerías externas).
