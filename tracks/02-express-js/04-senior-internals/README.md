# 🚂 Express.js Level 04: Senior & Staff Internals

Laboratorios ejecutables sobre el despachador asíncrono, arquitectura de middlewares y seguridad perimetral contra denegación de servicio.

---

## 🔬 Laboratorios de este Nivel

### 1. `01-async-error-handling-and-pipeline.ts`:
- Demostración de la histórica trampa de errores asíncronos en Express 4.
- Simulación comparativa del despachador de Express 4 (socket colgado indefinidamente) vs Express 5 (captura y reenvío automático a `next(err)`).
- Implementación de un middleware de errores de grado industrial basado en la especificación **RFC 7807 Problem Details**.

### 2. `02-custom-middleware-onion-and-tracing.ts`:
- Reconstrucción didáctica del motor de middlewares Onion.
- Trazabilidad distribuida de extremo a extremo mediante `AsyncLocalStorage`: inyección de `X-Correlation-ID` en logs sin pasar parámetros manualmente.
- Cálculo de latencia de red en microsegundos y captura de estado HTTP mediante interceptación del evento `finish` del stream de respuesta.

### 3. `03-security-and-resilience-stack.ts`:
- Pipeline de seguridad defensiva:
  - Mitigación de ataques de **Payload Bomb** (agotamiento de RAM por JSON masivo) con corte de stream anticipado y retorno HTTP 413.
  - Inyección de cabeceras defensivas de seguridad (HSTS, No-Sniff, X-Frame-Options).
  - Validación de esquema y sanitización de tipos.

---

## ⚡ Comandos Rápidos

```bash
npm run express:senior:01   # Async Error Trap (Express 4 vs 5)
npm run express:senior:02   # Middleware Onion Pipeline & Tracing
npm run express:senior:03   # Stack Defensivo de Seguridad y Resiliencia
```
