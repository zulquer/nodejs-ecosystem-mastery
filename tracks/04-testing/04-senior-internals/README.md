# 🧪 Testing Level 04: Senior & Staff Internals

Laboratorios ejecutables de bajo nivel sobre arquitectura de test runners, motores de espías, tiempo virtual y mutation testing.

---

## 🔬 Laboratorios de este Nivel

### 1. `01-custom-test-runner-engine.ts`:
- Reconstrucción didáctica del núcleo de un test runner moderno (estilo Vitest / Jest / `node:test`).
- Soporte para bloques jerárquicos `describe()`, tests `it()`, aserciones `expect()` encadenables (`toBe`, `toEqual`, `toThrow`, `toBeGreaterThan`), timeouts asíncronos y formateo ANSI de errores.

### 2. `02-mock-system-and-spies.ts`:
- Implementación de un motor de espías con registro de argumentos, llamadas y valores devueltos (`fn()`, `spyOn()`).
- Implementación de un **Reloj Virtual (Fake Timers)** que intercepta la cola de timers de V8 para avanzar 24 horas en 0ms de CPU.

### 3. `03-mutation-testing-and-coverage.ts`:
- Demostración de por qué una suite con **100% de cobertura de líneas** puede dejar escapar bugs graves si las aserciones son débiles o inexistentes.
- Motor de **Mutation Testing** que inyecta mutantes sintácticos (operadores `<`, `>`, `&&`, `||`) para auditar la calidad real de las pruebas.

---

## ⚡ Comandos Rápidos

```bash
npm run test:senior:01   # Motor Test Runner (describe, it, expect, async)
npm run test:senior:02   # Mocks, Spies y Fake Timers Deterministas
npm run test:senior:03   # Mutation Testing vs Cobertura de Líneas
```
