# 🧪 Testing & Quality Engineering: Estrategias, Runners y Arquitectura Senior

Ruta de maestría técnica en **Estrategia y Arquitectura de Pruebas de Software**. Este track desmitifica la comparación entre **Jest**, **Vitest** y **`node:test`**, establece la taxonomía rigurosa de dobles de prueba (*Test Doubles*), y aborda la resiliencia de aserciones mediante **Mutation Testing**.

---

## 🏛️ Organización del Track

```
testing/
├── 01-test-runners-and-paradigms/   # Jest vs Vitest vs node:test, ESM, Worker Threads, jsdom vs happy-dom
├── 02-test-doubles-and-mocking/     # Dummies vs Stubs vs Spies vs Mocks vs Fakes, MSW, Fake Timers
├── 03-integration-and-containers/   # Pruebas de Integración con Testcontainers, In-Memory DB traps
└── 04-senior-internals/             # Laboratorios ejecutables de nivel Senior / Staff
    ├── 01-custom-test-runner-engine.ts     # [Lab 01: Reconstrucción de un Test Runner moderno]
    ├── 02-mock-system-and-spies.ts         # [Lab 02: Sistema de Mocks, Spies y Fake Timers Deterministas]
    └── 03-mutation-testing-and-coverage.ts # [Lab 03: Mutation Testing vs Cobertura de Líneas]
```

---

## 🧠 Matriz de Diferenciación por Seniority

| Dimensión | Junior | Intermediate | Senior / Staff |
|---|---|---|---|
| **Filosofía y Alcance** | "Cuantos más unit tests tengamos, mejor" (probar funciones puras privadas de 2 líneas). | Seguir la Pirámide de Testing tradicional (muchos unitarios, pocos de integración). | **Testing Trophy (Kent C. Dodds)**: Foco en **Pruebas de Integración** que verifican casos de uso reales de extremo a extremo, minimizando el acoplamiento a detalles de implementación volátiles. |
| **Elección del Test Runner** | Usar Jest para todo porque es lo que viene en create-react-app. | Migrar a Vitest por velocidad en proyectos Vite. | **Evaluación Arquitectónica**: Conocer las limitaciones de Jest con ESM nativo y V8 VMs; aprovechar Vitest con Worker Threads y pipeline de esbuild; o adoptar **`node:test`** para microservicios ligeros con **cero dependencias externas**. |
| **Mocks y Dobles** | Mockear toda dependencia externa (bases de datos, repositorios, librerías enteras). | Usar `jest.spyOn()` y librerías como `nock`. | Evitar el sobre-mocking (*Mocking Hell*). Usar **Fakes en memoria** para interfaces desacopladas, **MSW (Mock Service Worker)** a nivel de red, y **Testcontainers** para correr PostgreSQL / Redis reales en Docker durante la integración. |
| **Métricas de Calidad** | Exigir 100% de cobertura de código (*Code Coverage*) en el CI/CD. | Comprobar cobertura de ramas (*Branch Coverage*). | Entender que el 100% de cobertura no impide bugs si las aserciones son débiles o tautológicas. Aplicar **Mutation Testing (Stryker)** para mutar el código fuente y verificar si la suite de pruebas es capaz de detectar y matar los mutantes. |

---

## 🔬 Laboratorios Ejecutables Senior (`04-senior-internals/`)

1. **`01-custom-test-runner-engine.ts`**:
   - Construcción desde cero de un ejecutor de pruebas completo: `describe`, `it`, `expect` encadenable, `beforeEach`/`afterEach`, timeouts y reporte visual ANSI con diff de errores.

2. **`02-mock-system-and-spies.ts`**:
   - Implementación de un motor de espías (`spyOn`, `fn`, `toHaveBeenCalledTimes`) y de **Fake Timers deterministas** (avance de 24 horas en 0 milisegundos de reloj, erradicando *flaky tests*).

3. **`03-mutation-testing-and-coverage.ts`**:
   - Demostración de la mentira del 100% Code Coverage.
   - Inyección automatizada de mutantes sintácticos (operadores alterados, ramas omitidas) y auditoría de la puntuación de mutación (*Mutation Score*).

---

## ⚡ Comandos Rápidos de Ejecución

```bash
# Laboratorios del track de Testing:
npm run test:senior:01   # Motor Test Runner (describe, it, expect, async)
npm run test:senior:02   # Mocks, Spies y Fake Timers Deterministas
npm run test:senior:03   # Mutation Testing vs Cobertura de Líneas
```
