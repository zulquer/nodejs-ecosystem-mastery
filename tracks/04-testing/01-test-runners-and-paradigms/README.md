# 🧪 Testing Level 01: Test Runners Modernos (Jest vs Vitest vs node:test)

Comparativa arquitectónica de los tres ejecutores de pruebas dominantes en el ecosistema Node.js y TypeScript.

---

## 🏛️ 1. Comparativa de Arquitectura: Jest vs Vitest vs `node:test`

| Criterio | **Jest** | **Vitest** | **`node:test`** |
|---|---|---|---|
| **Creador / Origen** | Meta (2014) | Equipo de Vite (2021) | Node.js Core Team (Node 18-20+) |
| **Soporte ESM Nativo** | Complejo / Experimental (`--experimental-vm-modules`) | **Nativo y transparente** | **Nativo y transparente** |
| **Pipeline de Transformación** | Babel / `ts-jest` (lento en proyectos grandes) | **esbuild / Vite** (ultrarrápido, usa el mismo config de la app) | Ninguno (requiere `tsx`, `ts-node` o Node con type stripping) |
| **Aislamiento de Tests** | V8 `vm` context | **Worker Threads (`tinypool`)** o procesos `fork` | Sub-procesos o ejecución concurrente nativa |
| **Dependencias en `node_modules`** | Decenas de paquetes transitorios | Pocas dependencias compartidas con Vite | **CERO dependencias (0 bytes en disco)** |
| **Ecosistema / Mocking** | `jest.mock()`, `jest.fn()`, Istanbul coverage | `vi.mock()`, compatible 100% con API de Jest | `node:test` y `node:assert` con mock básico |

---

## ⚙️ 2. Análisis Detallado de Cada Runner

### A. Jest: El Veterano de la Industria
- **Fortalezas**: Madurez extrema, millones de preguntas resueltas en StackOverflow, soporte para snapshots enriquecidos.
- **Debilidades**:
  - El soporte para ES Modules nativos (`"type": "module"`) sigue requiriendo flags experimentales y genera problemas con librerías modernas de npm que ya no publican CommonJS.
  - Gran consumo de memoria RAM en suites de miles de tests debido a fugas en el módulo `vm` de Node.js.

### B. Vitest: El Estándar Moderno de Alto Rendimiento
- **Fortalezas**:
  - Comparte exactamente los mismos plugins y configuración de `vite.config.ts`.
  - Tiempos de arranque hasta 10 veces más rápidos gracias a esbuild.
  - Modo interactivo (`vitest --ui` o modo watch) inteligente: solo re-ejecuta los tests afectados por el gráfico de importaciones del archivo modificado.
  - Soporte nativo para emulación de DOM ultrarrápida con **`happy-dom`** (hasta 5 veces más ligero que `jsdom`).

### C. `node:test`: El Enfoque Minimalista Nativo
A partir de Node.js 20+, Node incluye su propio test runner nativo sin instalar absolutamente nada:

```typescript
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Servicio de Usuarios', () => {
  it('debe calcular el descuento correctamente', () => {
    const total = 100 - 15;
    assert.equal(total, 85);
  });
});
```
- **Cuándo elegirlo**: Microservicios en Kubernetes, lambdas en AWS Serverless, herramientas CLI donde se prioriza **cero riesgo en la cadena de suministro (supply-chain security)** y arranque instantáneo.

---

## 🚀 3. Entornos de Emulación de DOM: `jsdom` vs `happy-dom`

Cuando se prueban componentes de frontend (React / Angular / Vue) o código que interactúa con `document` o `window`:
- **`jsdom`**: Implementación casi exhaustiva de los estándares W3C del navegador. Es pesada y lenta (consume mucha CPU).
- **`happy-dom`**: Implementación pragmática enfocada exclusivamente en velocidad. Omite partes innecesarias de especificaciones antiguas para lograr ejecuciones de tests entre 2 y 5 veces más rápidas en CI/CD.
