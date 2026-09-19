# 🔷 TypeScript Mastery: Ruta por Niveles de Seniority

En TypeScript, un desarrollador junior usa el compilador como un "linter con tipos". Un **Senior / Staff Engineer** utiliza el sistema de tipos como un **lenguaje funcional Turing-completo** en tiempo de compilación para garantizar invariantes de dominio, modelar contratos sin coste en runtime y eliminar clases enteras de bugs antes de ejecutar el código.

---

## 🗺️ Matriz de Progresión por Niveles

```
+-------------------------------------------------------------------------------+
| Nivel                   | Competencias Clave en Tiempo de Compilación        |
+-------------------------------------------------------------------------------+
| 01. Fundamentals        | Primitivos, Type vs Interface, Unions, any vs       |
|                         | unknown vs never, strictNullChecks                  |
+-------------------------------------------------------------------------------+
| 02. Junior              | Generics básicos, Type Narrowing (in, instanceof),  |
|                         | Type Predicates (val is T), as const assertions     |
+-------------------------------------------------------------------------------+
| 03. Intermediate        | Utility Types (Pick, Omit, Record, ReturnType),     |
|                         | Mapped Types, Keyof / Typeof, Declaration Merging   |
+-------------------------------------------------------------------------------+
| 04. Senior (Gymnastics) | Conditional Types, infer, Template Literal Types,   |
|                         | Branded/Nominal Types, satisfies, DeepReadonly      |
+-------------------------------------------------------------------------------+
```

---

## 📂 Contenido de Cada Nivel

### [01. Fundamentals](./01-fundamentals/)
- **`any` vs `unknown` vs `never`**: Por qué `any` apaga el compilador, mientras que `unknown` fuerza narrowing seguro y `never` representa estados imposibles (Exhaustive Checks).
- **`interface` vs `type`**: Cuándo usar cada uno (Declaration Merging vs Unions/Tuplas).
- **Unions & Intersections**: Álgebra de tipos (`A | B` vs `A & B`).

### [02. Junior](./02-junior/)
- **Generics**: Funciones y clases parametrizadas `<T>`.
- **Type Narrowing**: `typeof`, `instanceof`, operador `in`.
- **Custom Type Predicates**: Funciones de guardia `function isUser(val: unknown): val is User`.
- **Const Assertions (`as const`)**: Congelar objetos e inferir tipos literales inmutables sin usar `enum`.

### [03. Intermediate](./03-intermediate/)
- **Mapeo de Tipos (Mapped Types)**: `[K in keyof T]: T[K]`.
- **Utility Types Internals**: Cómo están implementados por dentro `Pick`, `Omit`, `Exclude`, `Extract`, `ReturnType` y `Awaited`.
- **Index Access Types**: `User['address']['zipCode']`.
- **Declaration Merging**: Extender interfaces de librerías externas (ej. añadir propiedades a `Request` de Express).

### [04. Senior & Type Gymnastics](./04-senior-type-gymnastics/)
- **Conditional Types**: `T extends U ? TrueType : FalseType`.
- **La palabra clave `infer`**: Extraer tipos de retorno, promesas, argumentos o elementos de arrays sobre la marcha.
- **Template Literal Types**: `type Event = `${Entity}:${Action}`` para tipado estricto de eventos y rutas.
- **Branded Types (Nominal Typing)**: Evitar que un `UserId` se mezcle accidentalmente con un `OrderId` (ambos siendo `string`).
- **El operador `satisfies`**: Validar que un valor coincide con un tipo sin ampliar (*widen*) su tipo inferido.
- **Tipos Recursivos**: `DeepReadonly<T>`, `DeepPartial<T>` y parseo de JSON en tiempo de compilación.

---

## ⚡ Comandos Rápidos

```bash
# Desde typescript/:
npm run lab:senior:01

# O desde la raíz:
npm run ts:senior:01
```
