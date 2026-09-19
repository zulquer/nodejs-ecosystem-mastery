# Nivel 04: Intermediate (Desarrollador Semi-Senior / Intermedio)

El desarrollador intermedio comprende la arquitectura en capas, la gestión eficiente de flujos de datos básicos, la concurrencia y la preparación para despliegues en producción.

---

## 🎯 Qué debe saber un desarrollador en este nivel

1. **Introducción a Streams y Buffers**:
   - Por qué `fs.readFile()` de un archivo de 2GB colapsa la memoria RAM y cómo `fs.createReadStream()` lo soluciona con streaming.
   - Manipulación de buffers con `Buffer.from()` y `Buffer.concat()`.
2. **Patrones de Arquitectura Backend**:
   - Separación de responsabilidades: Controladores, Servicios de Negocio, Repositorios (Capa de Persistencia).
   - Patrón Middleware en Node.js (cadena de responsabilidad con `next()`).
   - Principios SOLID e Inversión de Control básica.
3. **Producción e Higiene del Proceso**:
   - **Graceful Shutdown**: Manejo de señales `SIGTERM` y `SIGINT` en contenedores Docker/Kubernetes para cerrar el servidor HTTP y pools de base de datos sin abortar peticiones activas.
   - Healthchecks estándar (`/healthz`, `/readyz`).
   - Logging estructurado en formato JSON (Pino / Winston) para ingesta en Datadog / ELK.
4. **Procesos Hijos Básicos**:
   - Módulo `node:child_process`: diferencias entre `exec()` (con buffer limitado en memoria) y `spawn()` (basado en streams para procesos de larga duración).
