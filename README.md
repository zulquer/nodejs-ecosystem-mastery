# 🟢 Node.js Ecosystem Mastery (Runtime, Frameworks & Tooling)

Repositorio maestro de referencia técnica profunda para consolidar habilidades desde los fundamentos hasta el nivel **Senior / Staff / Principal Node.js Engineer / Tech Lead** en **Runtime Node.js (V8, Libuv, Concurrencia, Memoria), Express.js, NestJS (Arquitectura Empresarial), Testing & Quality Engineering, TypeScript Avanzado y ECMAScript Moderno**.

---

## 🌐 The Mastery Suite (Ecosistema Modular)

Para mantener una arquitectura limpia y desacoplada, los conocimientos especializados de frontend, backend agnóstico, DevOps, ciencia de datos y metodologías se organizan en repositorios dedicados:

| Repositorio | Especialidad Técnica | Enlace |
|---|---|---|
| **`nodejs-ecosystem-mastery`** | 🟢 **Node.js Core, V8, Libuv, Express, NestJS, Testing & TypeScript** | *Este repositorio* |
| **`python-ecosystem-mastery`** | 🐍 **CPython Internals, GIL, FastAPI, Django, PySpark & Pytest** | [Ver Repositorio](../python-ecosystem-mastery/) |
| **`php-ecosystem-mastery`** | 🐘 **Zend Engine, OPcache, JIT, Laravel, Symfony, FrankenPHP & Pest** | [Ver Repositorio](../php-ecosystem-mastery/) |
| **`backend-mastery`** | 🌐 **REST APIs RFC 9110, SQL, NoSQL, Sistemas Distribuidos & Caché** | [Ver Repositorio](../backend-mastery/) |
| **`frontend-mastery`** | ⚛️ **React 19, Angular v2-v19+, Next.js App Router & Web Performance** | [Ver Repositorio](../frontend-mastery/) |
| **`cloud-mastery`** | ☁️ **Cloud Architecture (AWS, Azure, DigitalOcean), K8s, Terraform & FinOps** | [Ver Repositorio](../cloud-mastery/) |
| **`cicd-mastery`** | 🚀 **CI/CD Universal (GitHub Actions, Azure, GitLab), GitOps & Canary** | [Ver Repositorio](../cicd-mastery/) |
| **`agile-mastery`** | 🏃 **Scrum, Kanban, Ley de Little, XP (TDD/Trunk-Based) & Cynefin** | [Ver Repositorio](../agile-mastery/) |

---

## 🏛️ Organización de los 6 Tracks de Node.js

```
nodejs-ecosystem-mastery/
├── tracks/
│   ├── 01-node-js/          # 🟢 Track 1: Runtime Node.js organizado por 5 NIVELES
│   │   ├── 01-fundamentals/ # V8, Libuv, CJS vs ESM, Globals, CLI Flags
│   │   ├── 02-trainee/      # Callbacks, Promises, async/await, fs/promises, path
│   │   ├── 03-junior/       # Servidor HTTP nativo, JSON parsing, SemVer, node:test
│   │   ├── 04-intermediate/ # Streams vs Buffers, capas, Graceful Shutdown, JSON logging
│   │   └── 05-senior/       # 15 Labs ejecutables: Event Loop, Slab 8KB, Backpressure, Workers, Atomics
│   │
│   ├── 02-express-js/       # 🚂 Track 2: Express.js Architecture & Production Middlewares
│   │   ├── 01-fundamentals/     # Wrappers de req/res, socket TCP, árboles de Router modulares
│   │   ├── 02-middleware-pipeline/ # Modelo Onion, aridad de 4 argumentos, next('route')
│   │   ├── 03-express4-vs-express5/ # Promesas nativas en v5 vs sockets colgados en v4
│   │   └── 04-senior-internals/ # Async Error Handling, Tracing con AsyncLocalStorage, Security Stack
│   │
│   ├── 03-nest-js/          # 🔴 Track 3: Arquitectura Empresarial con NestJS (100 Labs)
│   │   ├── 01 a 10 bloques  # Pipeline, IoC, Dynamic Modules, Resiliencia, Microservicios, CQRS
│   │   └── 01-request-lifecycle-pipeline/01-lifecycle-execution-order.ts
│   │
│   ├── 04-testing/          # 🧪 Track 4: Testing & Quality Engineering (Jest, Vitest, node:test)
│   │   ├── 01-test-runners-and-paradigms/ # Jest vs Vitest vs node:test, Worker Threads
│   │   ├── 02-test-doubles-and-mocking/   # Dummies, Stubs, Spies, Mocks, Fakes, MSW
│   │   ├── 03-integration-and-containers/ # Testing Trophy, Testcontainers, In-Memory traps
│   │   └── 04-senior-internals/           # Test Runner Engine, Mutation Testing
│   │
│   ├── 05-typescript/       # 🔷 Track 5: TypeScript por Niveles de Seniority
│   │   ├── 01-fundamentals/     # Types vs Interfaces, Unions, any vs unknown vs never
│   │   ├── 02-junior/           # Generics básicos, Type Narrowing, Custom Type Predicates
│   │   ├── 03-intermediate/     # Utility Types, Mapped Types, Declaration Merging
│   │   └── 04-senior-type-gymnastics/ # Conditional Types, infer, Branded Types, satisfies
│   │
│   └── 06-ecmascript/       # 📜 Track 6: Evolución de JavaScript por Versiones (ES6 a ES2025)
│       ├── 01-es2015-es6/       # Promises, Arrow Functions, Classes, Symbols, Proxy/Reflect
│       ├── 02-es2016-to-es2019/ # async/await, Rest/Spread, for await...of, flat/flatMap
│       ├── 03-es2020-to-es2022/ # Optional Chaining, Nullish Coalescing, BigInt, error.cause
│       └── 04-es2023-to-es2025/ # Change Array by Copy, Object.groupBy, Promise.withResolvers
├── .gitignore
└── package.json
```

---

## ⚡ Comandos Rápidos de Ejecución

Desde la raíz del workspace:

```bash
# 🟢 Node.js Core:
npm run node:senior:m1:1   # Microtasks vs Macrotasks
npm run node:senior:m2:2   # Fugas de memoria por Slab Allocation 8KB
npm run node:senior:m3:1   # Backpressure y drain
npm run node:senior:m4:1   # AsyncLocalStorage y Trace IDs
npm run node:senior:m5:2   # Race Condition en JS y Atomics en Workers

# 🚂 Express.js Senior:
npm run express:senior:01  # Fuga asíncrona de socket (v4 vs v5) y RFC 7807
npm run express:senior:02  # Middleware Onion y Tracing con AsyncLocalStorage
npm run express:senior:03  # Stack Defensivo: Payload Bomb y Prototype Pollution

# 🔴 NestJS:
npm run nest:lab01         # Orden Sagrado de Ejecución del Request Lifecycle

# 🧪 Testing Senior:
npm run test:senior:01     # Motor Test Runner Propio (describe, it, expect)
npm run test:senior:02     # Mocks, Spies y Fake Timers Deterministas
npm run test:senior:03     # Mutation Testing vs 100% Code Coverage Illusion

# 🔷 TypeScript Senior:
npm run ts:senior:01       # Branded Types, infer, Template Literals & satisfies

# 📜 ECMAScript Moderno:
npm run es:modern          # Object.groupBy, Promise.withResolvers, toSorted, error.cause
```
