# Nivel 03: Junior (Desarrollador Junior)

En este nivel, el desarrollador es capaz de construir APIs funcionales, interactuar con el protocolo HTTP nativo, estructurar paquetes y escribir pruebas unitarias básicas.

---

## 🎯 Qué debe saber un desarrollador en este nivel

1. **Servidor HTTP Nativo (`node:http`)**:
   - `http.createServer((req, res) => ...)`: Anatomía de `IncomingMessage` y `ServerResponse`.
   - Métodos HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) y códigos de estado (2xx, 3xx, 4xx, 5xx).
   - Parseo manual del cuerpo JSON por chunks (`req.on('data')`, `req.on('end')`).
   - Cabeceras clave: `Content-Type`, `Authorization`, `Accept`.
2. **Gestión de Paquetes y SemVer**:
   - `dependencies` vs `devDependencies` vs `peerDependencies`.
   - Versionado Semántico (SemVer): Diferencia entre `^` (minor/patch) y `~` (solo patch).
   - Importancia crítica de `package-lock.json` para builds deterministas en CI/CD.
3. **Testing Nativo en Node.js**:
   - Módulos nativos `node:test` y `node:assert` (disponibles sin dependencias externas como Jest o Mocha).
4. **Seguridad Básica**:
   - Variables de entorno sensibles (nunca commitear archivos `.env` a git).
   - Concepto de Prototype Pollution en deserialización JSON ingenua.
