# 🔷 TypeScript, Testing & Modern ECMAScript Mastery: Las 100 Preguntas Más Comunes en Entrevistas Técnicas

Guía de referencia técnica profunda para preparación de entrevistas en roles de **Senior TypeScript Engineer, Backend Quality Architect, Tech Lead y Staff Engineer (Type Systems, Testing Paradigms & ECMAScript Internals)**.

---

## 📑 Tabla de Contenidos

1. [Sistema de Tipos de TypeScript Avanzado (Preguntas 1-12)](#1-sistema-de-tipos-de-typescript-avanzado)
2. [Configuración del Compilador, Módulos y Arquitectura TS (Preguntas 13-20)](#2-configuración-del-compilador-módulos-y-arquitectura-ts)
3. [Estrategias y Fundamentos de Testing en Node.js (Preguntas 21-30)](#3-estrategias-y-fundamentos-de-testing-en-nodejs)
4. [Testing de Integración, End-to-End y Base de Datos (Preguntas 31-40)](#4-testing-de-integración-end-to-end-y-base-de-datos)
5. [ECMAScript Moderno, JavaScript Internals y Best Practices (Preguntas 41-50)](#5-ecmascript-moderno-javascript-internals-y-best-practices)
6. [Type Gymnastics Extremos, Recursión y Metaprogramación (Preguntas 51-60)](#6-type-gymnastics-extremos-recursión-y-metaprogramación)
7. [Arquitectura del Compilador, AST Transformers y Declaration Files (Preguntas 61-70)](#7-arquitectura-del-compilador-ast-transformers-y-declaration-files)
8. [Testing de Tipos, TDD de Tipos y Quality Engineering (Preguntas 71-80)](#8-testing-de-tipos-tdd-de-tipos-y-quality-engineering)
9. [Patrones de Diseño Tipados, Inversión de Control y Domain Modeling (Preguntas 81-90)](#9-patrones-de-diseño-tipados-inversión-de-control-y-domain-modeling)
10. [ECMAScript Moderno, Runtimes Alternativos y Tooling (Preguntas 91-100)](#10-ecmascript-moderno-runtimes-alternativos-y-tooling)

---

## 1. Sistema de Tipos de TypeScript Avanzado

### 1. ¿Cómo funcionan los *Conditional Types* y la palabra clave `infer` en TypeScript? Proporciona un ejemplo que extraiga el tipo resuelto de una Promesa anidada.
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Un *Conditional Type* toma la forma `T extends U ? X : Y`. Evalúa si `T` es asignable a `U`; de ser así, resuelve a `X`, de lo contrario a `Y`.
  La palabra clave `infer` permite introducir una variable de tipo dentro de la cláusula `extends` para que el compilador deduzca automáticamente dicho tipo a partir de la estructura del genérico.

  Para desenvolver recursivamente cualquier nivel de promesas anidadas (similar al utilitario nativo `Awaited<T>` introducido en TS 4.5):
  ```typescript
  export type DeepAwaited<T> = T extends Promise<infer U>
    ? DeepAwaited<U>
    : T extends PromiseLike<infer U>
      ? DeepAwaited<U>
      : T;

  type T1 = DeepAwaited<Promise<Promise<string>>>; // string
  type T2 = DeepAwaited<number>;                   // number
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar resolver tipos asíncronos en tiempo de ejecución o no saber cómo `infer` extrae tipos de retorno de funciones o parámetros.
  - 🟢 *Green Flag*: Explica la evaluación distributiva de condicionales sobre *unions* desnudas (`T extends any`) y cómo desactivarla encapsulando entre corchetes `[T] extends [U]`.

---

### 2. ¿Qué son los *Mapped Types* y cómo se utiliza el *Key Remapping* (`as`) para transformar las propiedades de un contrato?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Los *Mapped Types* permiten construir nuevos tipos iterando sobre las claves de un tipo existente mediante la sintaxis `[K in keyof T]`. Con TypeScript 4.1+, se introdujo *Key Remapping* utilizando la cláusula `as`, permitiendo filtrar claves (resolviendo a `never`) o transformarlas utilizando *Template Literal Types*.

  ```typescript
  interface UserDomain {
    id: string;
    email: string;
    internalPasswordHash: string;
    createdAt: Date;
  }

  // Generador de Getters tipados filtrando campos sensibles
  export type PublicGetters<T> = {
    [K in keyof T as K extends `internal${string}` ? never : `get${Capitalize<string & K>}`]: () => T[K];
  };

  type UserGetters = PublicGetters<UserDomain>;
  // Resultado:
  // {
  //   getId: () => string;
  //   getEmail: () => string;
  //   getCreatedAt: () => Date;
  // }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer que retornar `never` en el remapeo elimina la propiedad del objeto resultante.
  - 🟢 *Green Flag*: Combina modificadores homomórficos (`readonly`, `?`, `-readonly`, `-?`) y sabe transformar interfaces complejas a nivel de metadatos de tipos.

---

### 3. ¿Qué son los *Branded Types* (o *Nominal Typing*) en TypeScript y qué problema crítico de modelado de dominio resuelven?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  TypeScript utiliza un sistema de tipos **estructural** (*duck typing*): dos tipos con la misma forma son intercambiables. Esto genera vulnerabilidades en DDD (*Domain-Driven Design*), donde un `UserId` (string UUID) puede pasarse accidentalmente donde se espera un `OrderId` (string UUID), compilando sin errores.

  Los *Branded Types* (o *Flavored Types*) asocian una marca fantasma (*phantom property* o `unique symbol`) al tipo primitivo en tiempo de compilación sin sobrecoste en tiempo de ejecución:
  ```typescript
  declare const BrandSymbol: unique symbol;

  export type Brand<T, B extends string> = T & { readonly [BrandSymbol]: B };

  export type UserId = Brand<string, 'UserId'>;
  export type OrderId = Brand<string, 'OrderId'>;

  export function createUserId(id: string): UserId {
    // Validación de invariantes (ej. formato UUID v4)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error(`Identificador UserId inválido: ${id}`);
    }
    return id as UserId;
  }

  function processPayment(userId: UserId, orderId: OrderId) { /* ... */ }

  const uId = createUserId('11111111-1111-4111-8111-111111111111');
  const oId = 'algun-string' as OrderId;

  // processPayment(oId, uId); // ERROR DE COMPILACIÓN: Tipo 'OrderId' no asignable a 'UserId'
  processPayment(uId, oId);    // Válido
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que TypeScript valida nominalmente clases o primitivos por defecto.
  - 🟢 *Green Flag*: Demuestra cómo los *Smart Constructors* junto a *Branded Types* previenen bugs lógicos de Primitive Obsession en sistemas financieros o médicos.

---

### 4. Explica la diferencia entre *Covarianza* y *Contravarianza* en el sistema de tipos de TypeScript y cuándo aplica el flag `strictFunctionTypes`.
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Sea un subtipo `Gato extends Animal`:
  - **Covarianza**: Preserva la dirección del subtipado. `Array<Gato>` es asignable a `Array<Animal>`. Si `A extends B`, entonces `F<A> extends F<B>`. Las posiciones de salida (*retorno de funciones*) son covariantes.
  - **Contravarianza**: Invierte la dirección del subtipado. `(a: Animal) => void` es asignable a `(g: Gato) => void`. Si `A extends B`, entonces `F<B> extends F<A>`. Las posiciones de entrada (*parámetros de funciones*) deben ser contravariantes para garantizar *Type Safety*.

  Con `strictFunctionTypes: false` (o en métodos de interfaces de forma bivariante histórica), TypeScript permite pasar funciones con argumentos más específicos, provocando *runtime crashes*. Con `strictFunctionTypes: true`, los parámetros de funciones son estrictamente contravariantes:
  ```typescript
  class Animal { name = 'animal'; }
  class Gato extends Animal { maullar() { return 'miau'; } }

  type Handler<T> = (param: T) => void;

  let animalHandler: Handler<Animal> = (a: Animal) => console.log(a.name);
  let gatoHandler: Handler<Gato> = (g: Gato) => g.maullar();

  gatoHandler = animalHandler; // SEGURO: animalHandler solo accede a propiedades de Animal
  // animalHandler = gatoHandler; 
  // ERROR con strictFunctionTypes: Si animalHandler recibe un Perro, gatoHandler intentaría llamar a .maullar()
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Pensar que los argumentos de una función son covariantes como los tipos de retorno.
  - 🟢 *Green Flag*: Explica la bivariancia de los métodos de interfaz (`method(): void`) diseñada intencionalmente para compatibilidad con `Array.prototype.push` y la distinción con sintaxis de propiedad de función (`prop: () => void`).

---

### 5. ¿Cómo se implementa un *Exhaustiveness Check* exhaustivo en *Discriminated Unions* utilizando el tipo `never`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Cuando se modelan estados finitos o eventos de dominio con uniones discriminadas, un *exhaustiveness check* garantiza que si en el futuro se añade una nueva variante a la unión, el compilador lance un error de compilación en todos los `switch` o sentencias condicionales que no la hayan manejado:

  ```typescript
  type PaymentMethod =
    | { type: 'CREDIT_CARD'; pan: string; cvv: string }
    | { type: 'PIX'; key: string }
    | { type: 'CRYPTO'; walletAddress: string };

  function assertUnreachable(x: never): never {
    throw new Error(`Caso no contemplado en discriminación de tipos: ${JSON.stringify(x)}`);
  }

  export function processPayment(payment: PaymentMethod): void {
    switch (payment.type) {
      case 'CREDIT_CARD':
        // payment es { type: 'CREDIT_CARD'; pan: string; cvv: string }
        return;
      case 'PIX':
        // payment es { type: 'PIX'; key: string }
        return;
      case 'CRYPTO':
        return;
      default:
        // Si se añade 'PAYPAL' a PaymentMethod, payment aquí será de tipo { type: 'PAYPAL' }
        // y TS fallará al compilar porque no es asignable a never.
        return assertUnreachable(payment);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar un bloque `default` vacío o simplemente lanzar un error de ejecución sin validación de tipo estático `never`.
  - 🟢 *Green Flag*: Muestra dominio de *Narrowing* y *Control Flow Analysis* (CFA) de TypeScript.

---

### 6. ¿Cuál es la diferencia entre *Type Guards* definidos por el usuario (`param is Type`) y *Assertion Functions* (`asserts condition`)?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **Type Guard (`target is Type`)**: Retorna un valor booleano. Se utiliza dentro de estructuras de control (`if (isUser(val)) { ... }`). En la rama verdadera, el compilador estrecha el tipo.
  - **Assertion Function (`asserts target is Type` o `asserts condition`)**: No retorna nada (o `void`). Si la aserción falla, lanza una excepción en ejecución; si no lanza, el compilador asume que el valor tiene el tipo asegurado para todo el flujo subsiguiente, evitando indentación excesiva:

  ```typescript
  interface AdminUser {
    id: string;
    role: 'ADMIN';
    permissions: string[];
  }

  // Type Guard
  export function isAdmin(user: unknown): user is AdminUser {
    return (
      typeof user === 'object' &&
      user !== null &&
      'role' in user &&
      (user as { role: string }).role === 'ADMIN'
    );
  }

  // Assertion Function
  export function assertIsAdmin(user: unknown): asserts user is AdminUser {
    if (!isAdmin(user)) {
      throw new Error('Acceso denegado: El usuario no posee rol de Administrador');
    }
    // A partir de aquí, TS estrecha 'user' a AdminUser en el scope actual
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Utilizar `as AdminUser` (type assertion insegura) en lugar de una función de validación con estrechamiento seguro.
  - 🟢 *Green Flag*: Explica cómo las assertion functions limpian código reduciendo bloques anidados `if/else` en controladores y casos de uso.

---

### 7. ¿Cómo opera el operador `satisfies` (TS 4.9+) y en qué se diferencia de una anotación de tipo explícita (`const x: Type = ...`) y de un type cast (`as Type`)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **Anotación explícita (`: Type`)**: Fuerza al objeto a satisfacer el tipo pero **amplía** el tipo al contrato más general, perdiendo la información de literales específicos o propiedades exactas.
  - **Type Assertion (`as Type`)**: Desactiva validaciones rigurosas, silencia advertencias del compilador y es propensa a bugs si faltan propiedades.
  - **Operador `satisfies`**: Valida que la expresión cumpla con una estructura o contrato determinado **sin cambiar ni ensanchar el tipo inferido resultante**:

  ```typescript
  type RGB = [red: number, green: number, blue: number];
  type Color = RGB | string;

  interface ThemeConfig {
    primary: Color;
    secondary: Color;
    accent?: Color;
  }

  // Con anotación : ThemeConfig, palette.primary es de tipo 'Color' (RGB | string)
  // palette.primary.toUpperCase() fallaría porque podría ser una tupla RGB.

  // Con satisfies:
  const palette = {
    primary: '#4f46e5',
    secondary: [34, 197, 94],
  } satisfies ThemeConfig;

  // TypeScript preserva los tipos exactos literales:
  const hex = palette.primary.toUpperCase(); // Válido: TS sabe que es un string
  const green = palette.secondary[1];       // Válido: TS sabe que es una tupla numérice
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que `satisfies` compila a código JavaScript o confundirlo con un casteador en runtime.
  - 🟢 *Green Flag*: Ilustra casos de uso en configuraciones tipadas, mapas de rutas y tablas de traducción donde se requiere validación contra un contrato sin perder autocompletado literal.

---

### 8. Implementa desde cero los tipos utilitarios nativos `ReturnType<T>`, `Parameters<T>` y `Pick<T, K>` explicando su lógica interna.
- **Nivel**: Senior
- **Respuesta Técnica**:
  Los utilitarios nativos de TypeScript se construyen aprovechando *Conditional Types*, `infer` y *Mapped Types*:

  ```typescript
  // 1. ReturnType: extrae el tipo de retorno de una función
  export type MyReturnType<T extends (...args: any[]) => any> =
    T extends (...args: any[]) => infer R ? R : never;

  // 2. Parameters: extrae la tupla de parámetros de una función
  export type MyParameters<T extends (...args: any[]) => any> =
    T extends (...args: infer P) => any ? P : never;

  // 3. Pick: construye un tipo eligiendo el conjunto de propiedades K de T
  export type MyPick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  // Ejemplo de verificación
  function createAccount(email: string, age: number): { id: string; active: boolean } {
    return { id: 'uuid', active: true };
  }

  type FnParams = MyParameters<typeof createAccount>; // [email: string, age: number]
  type FnReturn = MyReturnType<typeof createAccount>; // { id: string; active: boolean }
  type PublicAccount = MyPick<FnReturn, 'id'>;         // { id: string }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No utilizar constraints (`extends keyof T` o `extends (...args: any[]) => any`).
  - 🟢 *Green Flag*: Explica cómo `Omit<T, K>` se define como `Pick<T, Exclude<keyof T, K>>` y cómo `Exclude<T, U>` opera mediante distribución de tipos condicionales.

---

### 9. ¿Cuál es la diferencia conceptual y práctica entre `unknown`, `any`, `never` y `void` en TypeScript?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  - `any`: Desactiva completamente el sistema de tipos. Permite llamar a cualquier método o acceder a cualquier propiedad sin comprobación (*escape hatch* inseguro).
  - `unknown`: El *top type* seguro. Cualquier valor puede asignarse a `unknown`, pero ninguna operación puede realizarse sobre él hasta que se estreche mediante type guards (`typeof`, `instanceof`) o validaciones.
  - `never`: El *bottom type*. Representa un valor que nunca existirá (unión vacía). Ocurre en funciones que siempre lanzan excepciones, bucles infinitos o ramas de código inalcanzables.
  - `void`: Representa la ausencia intencional de un valor de retorno en una función. Técnicamente en runtime retorna `undefined`, pero en tipado indica que el llamador no debe depender del resultado.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `any` como valor por defecto en payloads desconocidos o catch blocks en lugar de `unknown`.
  - 🟢 *Green Flag*: Explica por qué en TypeScript 4.0+ los bloques `catch (err: unknown)` fuerzan validación defensiva antes de acceder a `err.message`.

---

### 10. ¿Qué son los *Template Literal Types* y cómo permiten validar formatos complejos (como slugs, URLs o kebab-case) en tiempo de compilación?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Los *Template Literal Types* (TS 4.1+) permiten componer y transformar cadenas de texto en el sistema de tipos usando la sintaxis de backticks `${}`.

  ```typescript
  type Protocol = 'http' | 'https';
  type Domain = `${string}.${'com' | 'org' | 'io' | 'dev'}`;
  type Path = `/${string}`;

  export type SafeUrl = `${Protocol}://${Domain}${Path}`;

  const validUrl: SafeUrl = 'https://api.empresa.dev/v1/users'; // Compila OK
  // const invalidUrl: SafeUrl = 'ftp://bad-url'; // ERROR de compilación

  // Conversión de CamelCase a KebabCase a nivel de tipos:
  export type CamelToKebab<S extends string> = S extends `${infer T}${infer U}`
    ? U extends Uncapitalize<U>
      ? `${Lowercase<T>}${CamelToKebab<U>}`
      : `${Lowercase<T>}-${CamelToKebab<Uncapitalize<U>>}`
    : S;

  type Result = CamelToKebab<'getUserProfileData'>; // 'get-user-profile-data'
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que los tipos en TypeScript solo manejan primitivos básicos y no pueden realizar transformaciones de cadenas complejas.
  - 🟢 *Green Flag*: Utiliza recursividad de tipos para analizar y formatear strings estáticamente, mencionando el límite de recursividad del compilador.

---

### 11. ¿Cómo funcionan las *Variadic Tuple Types* y las etiquetas de tuplas en TypeScript?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Introducidas en TS 4.0, las *Variadic Tuple Types* permiten que la sintaxis de propagación (`...T`) se use en cualquier posición de una tupla, no solo al final. Permiten tipar funciones de composición (`pipe`, `curry`, `concat`) con estricta preservación de tipos de argumentos:

  ```typescript
  type Prefix<T extends unknown[]> = ['START', ...T, 'END'];
  type Numbers = [1, 2, 3];
  type Wrapped = Prefix<Numbers>; // ['START', 1, 2, 3, 'END']

  // Tuplas etiquetadas para documentación y autocompletado en IDE
  type Coordinates3D = [latitude: number, longitude: number, altitude: number];

  function setFlightPath(...coords: [origin: Coordinates3D, destination: Coordinates3D]): void {
    const [latOrig, lonOrig, altOrig] = coords[0];
    console.log(`Ruta fijada desde altitud: ${altOrig}m`);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Tratar tuplas simplemente como arrays corrientes `Array<T>`, perdiendo la longitud y tipos posicionales exactos.
  - 🟢 *Green Flag*: Domina la inferencia de parámetros variádicos en arquitecturas de middleware o composición funcional.

---

### 12. ¿Qué ocurre cuando aplicas `as const` a un objeto o array y por qué es indispensable al tipar configuraciones de dominio?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  La aserción `as const` (const assertion) instruye al compilador a:
  1. No ampliar (*widen*) los tipos literales (ej. `'POST'` se mantiene como `'POST'`, no como `string`).
  2. Aplicar `readonly` recursivo a todas las propiedades de objetos y elementos de arrays/tuplas.
  3. Prevenir mutaciones accidentales en tiempo de desarrollo.

  Permite derivar tipos directamente de valores reales (evitando duplicar contratos):
  ```typescript
  export const USER_ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'] as const;

  // Derivación automática del tipo Union:
  export type UserRole = (typeof USER_ROLES)[number]; 
  // 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'

  export const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
  } as const;
  // DB_CONFIG.port es 5432 (tipo literal número), no number.
  // DB_CONFIG.port = 3306; // ERROR: Cannot assign to 'port' because it is a read-only property
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Duplicar manualmente el enum/tipo TypeScript y el array de constantes en JS.
  - 🟢 *Green Flag*: Explica cómo `as const` reemplaza ventajosamente a los `enum` numéricos clásicos de TypeScript sin generar código runtime innecesario.

---

## 2. Configuración del Compilador, Módulos y Arquitectura TS

### 13. ¿Cuáles son los flags más críticos de `tsconfig.json` para garantizar máxima robustez en un backend enterprise?
- **Nivel**: Senior / Lead
- **Respuesta Técnica**:
  Más allá del paraguas `"strict": true` (que activa `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, etc.), un proyecto empresarial debe activar:
  - `"noUncheckedIndexedAccess": true`: Al acceder a arrays o diccionarios (`dict[key]`), el tipo resultante incluye `| undefined`, forzando comprobaciones de existencia previas.
  - `"exactOptionalPropertyTypes": true`: Prohíbe explícitamente pasar `{ key: undefined }` cuando la propiedad fue declarada como opcional `key?: string`.
  - `"noImplicitOverride": true`: Requiere la palabra clave `override` en métodos de subclases que reemplacen lógica del padre.
  - `"verbatimModuleSyntax": true`: Obliga a distinguir entre importaciones de tipos (`import type`) y código real, evitando artefactos o dependencias circulares fantasma en bundlers/compiladores.
  - `"target": "ES2022"` o `"ES2023"`: Emite sintaxis moderna soportada por versiones activas de Node.js sin sobrecoste de transpilación innecesaria.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar configuraciones laxas (`strict: false`) para evitar errores del compilador o ignorar `noUncheckedIndexedAccess`.
  - 🟢 *Green Flag*: Justifica el impacto de `noUncheckedIndexedAccess` para erradicar el infame `TypeError: Cannot read properties of undefined` en accesos a índices.

---

### 14. ¿Cuál es la diferencia entre `moduleResolution: "node16"` (o `"nodenext"`) y `moduleResolution: "bundler"` en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - `"node16"` / `"nodenext"`: Emula estrictamente el algoritmo de resolución de módulos nativo de Node.js a partir de la v16+. Requiere que las importaciones relativas en archivos ESM incluyan extensiones explícitas (ej. `import { service } from './service.js';` incluso dentro de archivos `.ts`). Valida los campos `"exports"` e `"imports"` de `package.json`.
  - `"bundler"` (introducido en TS 5.0): Diseñado para cuando el código será procesado por empaquetadores como Vite, esbuild o Webpack. Permite importar rutas sin extensiones y respeta el campo `"exports"` de `package.json`, pero no asume que Node.js ejecutará los archivos de forma directa sin bundling.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Sorprenderse de que en TypeScript ESM se deba escribir `.js` al importar archivos `.ts` en modo `node16`.
  - 🟢 *Green Flag*: Explica la regla de oro del compilador TypeScript: *TypeScript no reescribe extensiones de importación*. Lo que escribes en el `import` es lo que emite a JavaScript.

---

### 15. ¿Qué es *Declaration Merging* y cómo se utiliza para extender interfaces globales o de terceros en Node.js (ej. `Express.Request`)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  TypeScript fusiona automáticamente declaraciones que comparten el mismo identificador si son del mismo tipo compatible (ej. dos `interface` con el mismo nombre en el mismo scope unen sus miembros).

  Para extender interfaces declaradas en librerías externas o globales dentro de Node.js (como añadir propiedades de sesión o usuario autenticado a `Express.Request`):
  ```typescript
  // types/express-augmentation.d.ts
  import { UserSession } from '../modules/auth/user-session.interface';

  declare global {
    namespace Express {
      interface Request {
        user?: UserSession;
        traceId: string;
      }
    }
  }

  // Ahora en cualquier controlador:
  // req.user y req.traceId están tipados correctamente sin necesidad de casteos 'as any'.
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `(req as any).user` en los controladores en vez de usar augmentations del namespace global.
  - 🟢 *Green Flag*: Distingue entre archivos de script y módulos (la presencia de `import`/`export` requiere encapsular en `declare global { ... }`).

---

### 16. ¿Cuál es el propósito de `import type` y qué problemas previene en compiladores modernos como esbuild, SWC o Vite?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Herramientas de transpilación rápida como SWC, esbuild o Babel procesan cada archivo de forma aislada (*single-file transpile*) sin realizar análisis de tipos a nivel de todo el proyecto.
  Cuando se importa un identificador que solo existe en el sistema de tipos (ej. una `interface` o un `type`), el compilador aislado no siempre puede determinar si dicho identificador tiene representación en runtime o no. Si emite una sentencia `import` normal, Node.js lanzará en tiempo de ejecución:
  `SyntaxError: The requested module does not provide an export named 'X'`.

  Al usar `import type { UserDto } from './user.dto'`, el transpilador elimina con 100% de certeza esa sentencia del JavaScript emitido, garantizando cero artefactos en runtime y previniendo dependencias circulares que solo existan a nivel de contratos de tipos.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que `import type` genera código en tiempo de ejecución.
  - 🟢 *Green Flag*: Menciona el flag `"verbatimModuleSyntax": true` en TS 5+ que estandariza e impone esta separación.

---

### 17. ¿Cómo funcionan los *Project References* en TypeScript (`composite: true`) en un monorepo?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En monorepos con múltiples paquetes o dominios interdependientes, compilar todo el código desde un único `tsconfig.json` degrada exponencialmente el tiempo de compilación y el uso de memoria.
  Las *Project References* permiten dividir un proyecto TypeScript en programas independientes y compilables por separado:
  1. Cada submódulo configura en su `tsconfig.json` `"composite": true`, lo que fuerza la emisión de archivos `.d.ts` y metadatos de build (`tsconfig.tsbuildinfo`).
  2. Los paquetes dependientes declaran la referencia:
     ```json
     {
       "references": [
         { "path": "../core-domain" },
         { "path": "../shared-utils" }
       ]
     }
     ```
  3. Se ejecuta `tsc --build` (`tsc -b`). TypeScript utiliza compilación incremental inteligente: solo recompila los paquetes cuyos fuentes o firmas de tipos hayan cambiado, reduciendo builds de minutos a milisegundos.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No saber cómo estructurar monorepos en TypeScript o usar rutas relativas cruzadas sin control de fronteras de build.
  - 🟢 *Green Flag*: Explica la interacción entre Project References, Yarn/pnpm workspaces y herramientas de orquestación como Turborepo o Nx.

---

### 18. Compara la compilación con `tsc` frente a transpiladores como `swc`, `esbuild` o `tsup` en el ecosistema Node.js.
- **Nivel**: Senior
- **Respuesta Técnica**:
  - `tsc` (TypeScript Compiler oficial): Realiza *Type Checking* completo y emite código JavaScript. Sin embargo, al estar escrito en JavaScript sobre Node.js, es significativamente más lento en bases de código grandes.
  - `esbuild` (Go) y `swc` (Rust): Son órdenes de magnitud más rápidos (10x a 50x) porque se ejecutan en binario nativo altamente paralelizado. **No realizan Type Checking**: simplemente eliminan los tipos de TypeScript mediante parsing de sintaxis.
  - `tsup`: Empaquetador zero-config impulsado por esbuild optimizado para librerías y backends Node.js (emite CJS/ESM y opcionalmente invoca `tsc` en un hilo separado con `--dts` para generar los `.d.ts`).

  **Estrategia recomendada para producción**:
  Usar SWC/esbuild para desarrollo local y builds rápidas, y desacoplar la validación de tipos ejecutando `tsc --noEmit` en un paso paralelo del pipeline de CI/CD.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que esbuild o SWC validan si un tipo o propiedad existe.
  - 🟢 *Green Flag*: Diseña un pipeline de CI donde el Type Checking (`tsc --noEmit`) y la transpilación/empaquetado corren en paralelo para optimizar feedback de build.

---

### 19. ¿Cuál es la diferencia entre *Stage 3 Decorators* (TS 5.0+ / ECMAScript estándar) y los antiguos *Experimental Decorators* (`experimentalDecorators: true`)?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  - **Legacy Experimental Decorators** (propuesta original de 2014): Requerían `experimentalDecorators: true` y `emitDecoratorMetadata: true`. Dependían de la librería `reflect-metadata` para leer tipos de TypeScript en tiempo de ejecución (usado extensivamente en NestJS y TypeORM).
  - **Stage 3 Decorators** (estándar oficial ECMAScript en TS 5.0+): No requieren flags experimentales. Tienen una firma de contexto rica (`ClassMethodDecoratorContext`, etc.) y proporcionan métodos para interceptar la inicialización (`addInitializer`). **No soportan inferencia de metadatos de tipos de TypeScript en runtime (`emitDecoratorMetadata`)**, ya que el comité TC39 diseñó la especificación independiente del sistema de tipos de TypeScript.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar usar Stage 3 decorators en NestJS v9/v10 sin comprender que NestJS depende fundamentalmente de `reflect-metadata` y requiere mantener activo `experimentalDecorators: true`.
  - 🟢 *Green Flag*: Explica con claridad la separación entre el estándar de JavaScript de TC39 y las extensiones de metadatos propietarias del compilador TS.

---

### 20. ¿Por qué el uso de `enum` en TypeScript suele desaconsejarse en equipos de ingeniería modernos y qué alternativa idiomática se prefiere?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Los `enum` numéricos y heterogéneos de TypeScript presentan varios problemas de diseño:
  1. Generan código en runtime (un objeto con mapeo inverso complejo `Enum[Enum["KEY"] = 0] = "KEY"`), rompiendo la filosofía de que el sistema de tipos debe evaporarse al compilar.
  2. Los enums numéricos no son estrictos en versiones tempranas (admitían cualquier número).
  3. No son compatibles de forma transparente con TypeScript en modo `isolatedModules` o transpiladores puros como Babel/SWC sin configuraciones especiales.

  **Alternativa idiomática**: Objeto constante congelado con `as const` y extracción de tipos con `keyof typeof`:
  ```typescript
  export const OrderStatus = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
  } as const;

  export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Defender `enum` sin conocer el código JavaScript contaminante que emite o los problemas de asignabilidad inversa.
  - 🟢 *Green Flag*: Demuestra cómo los objetos constantes con `as const` proveen mejor interoperabilidad con JSON, menor tamaño de bundle y total seguridad de tipos.

---

## 3. Estrategias y Fundamentos de Testing en Node.js

### 21. Explica la diferencia formal entre los 5 tipos de *Test Doubles* según Gerard Meszaros y Martin Fowler: Dummy, Stub, Spy, Mock y Fake.
- **Nivel**: Senior / Lead
- **Respuesta Técnica**:
  1. **Dummy**: Objeto que se pasa pero nunca se utiliza realmente. Sirve únicamente para rellenar parámetros obligatorios de un constructor o método.
  2. **Stub**: Proporciona respuestas prefabricadas (*canned answers*) a las llamadas realizadas durante el test, sin responder a nada fuera de lo configurado.
  3. **Spy**: Un stub o wrapper que además registra información sobre cómo fue llamado (número de invocaciones, argumentos recibidos, valores retornados).
  4. **Mock**: Objeto pre-programado con *expectativas* sobre qué llamadas debe recibir. Verifica el **comportamiento** de la interacción; si las expectativas no se cumplen al finalizar, el test falla.
  5. **Fake**: Implementación funcional real pero simplificada, no apta para producción (ej. un `InMemoryUserRepository` con un `Map<string, User>` en memoria en lugar de conectar a PostgreSQL).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Llamar a cualquier double "mock" indistintamente o no saber diferenciar entre un Stub (control de estado) y un Mock (verificación de comportamiento).
  - 🟢 *Green Flag*: Explica por qué favorecer Fakes en arquitectura hexagonal proporciona tests más resistentes al refactor que el exceso de mocks de implementación.

---

### 22. ¿Cómo funciona el ejecutor nativo `node:test` y el módulo de aserciones `node:assert` introducidos en Node.js? ¿Cuándo prescindir de Jest/Vitest?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Desde Node.js v18+ (estable en v20+), Node.js incluye un test runner integrado de alto rendimiento accesible mediante `node:test`:
  - Cero dependencias externas en `node_modules`.
  - Soporte nativo para suites (`describe`), tests (`it`/`test`), hooks de ciclo de vida (`before`, `afterEach`), mocking integrado (`mock.fn()`, `mock.method()`) y reportería TAP / Spec.
  - Compatible con TypeScript mediante loaders directos o ejecución con `tsx` / `--loader ts-node/esm`.

  ```typescript
  import { test, describe, it, mock } from 'node:test';
  import assert from 'node:assert/strict';

  describe('Calculator Service', () => {
    it('debe calcular impuestos correctamente invocando el logger', () => {
      const loggerSpy = mock.fn();
      const calculate = (val: number) => {
        loggerSpy(val);
        return val * 1.21;
      };

      const result = calculate(100);

      assert.equal(result, 121);
      assert.equal(loggerSpy.mock.callCount(), 1);
      assert.deepEqual(loggerSpy.mock.calls[0].arguments, [100]);
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Instalar paquetes pesados de 200MB de testing solo para correr tests unitarios básicos en microservicios ligeros o lambdas.
  - 🟢 *Green Flag*: Justifica la reducción drástica de tiempos de CI y vector de ataque en dependencias al adoptar herramientas nativas del runtime.

---

### 23. Compara Jest y Vitest en entornos Node.js con TypeScript. ¿Por qué la industria está migrando activamente a Vitest?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **Jest**:
    - Históricamente la herramienta estándar.
    - Ejecuta tests en un entorno Node.js transformado por Babel o `ts-jest`, lo cual es extremadamente lento en bases de código grandes.
    - Su soporte nativo para ECMAScript Modules (ESM) es complejo y requiere flags experimentales (`NODE_OPTIONS=--experimental-vm-modules`).
    - Mantiene su propio pipeline de módulos en memoria, generando problemas con librerías nativas y timers.
  - **Vitest**:
    - Desarrollado sobre el motor de **Vite** y **esbuild/Rollup**.
    - Soporte ESM nativo de primera clase y resolución inmediata de TypeScript sin transpilación previa en disco.
    - API casi 100% compatible con Jest (`vi.fn()`, `expect()`, `describe()`).
    - Multi-threading ultra rápido mediante Worker Threads o aislamiento por procesos (`pool: 'threads'`).
    - Hot Module Replacement (HMR) en modo watch: solo re-ejecuta los tests del archivo modificado instantáneamente.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No haber experimentado la lentitud de `ts-jest` en proyectos grandes ni los conflictos de ESM con Jest.
  - 🟢 *Green Flag*: Explica cómo Vitest unifica la configuración de build y testing bajo un mismo pipeline de herramientas.

---

### 24. ¿Qué es la estructura de pruebas AAA (Arrange, Act, Assert) frente a Four-Phase Test y por qué es una buena práctica aislar el estado?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **Arrange (Preparar)**: Se instancian las dependencias, se configuran los datos de prueba, fakes o stubs y se deja el sistema bajo prueba (SUT) en el estado inicial deseado.
  - **Act (Actuar)**: Se invoca la función o método específico bajo prueba, capturando el resultado o el error emitido. Debe ser usualmente una única línea de código.
  - **Assert (Verificar)**: Se valida que el resultado obtenido coincida con las expectativas o que los efectos colaterales esperados hayan ocurrido.
  
  El patrón **Four-Phase Test** añade explícitamente una cuarta fase: **Teardown (Desmontaje)**. Garantiza que cualquier recurso persistido (conexiones a BD, archivos temporales, timers simulados o sockets) sea destruido después de cada test para evitar contaminación de estado (*test leakage*) entre pruebas.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mezclar múltiples acciones y aserciones consecutivas en un solo test largo ("test spaghetti") que no se sabe qué fallo específico reporta.
  - 🟢 *Green Flag*: Demuestra rigor en el principio de independencia y determinismo de tests unitarios: cualquier test debe poder ejecutarse en orden aleatorio y de forma aislada.

---

### 25. ¿Cómo se prueban adecuadamente funciones que dependen del paso del tiempo o timers asíncronos (`setTimeout`, `setInterval`) sin introducir sleeps reales?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Introducir `await new Promise(r => setTimeout(r, 5000))` en los tests hace que la suite sea lenta y propensa a *flakiness*. Se deben utilizar **Fake Timers**:

  ```typescript
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

  class RateLimiter {
    private tokens = 5;
    constructor() {
      setInterval(() => { this.tokens = 5; }, 60_000); // Resetea cada minuto
    }
    consume(): boolean {
      if (this.tokens > 0) { this.tokens--; return true; }
      return false;
    }
  }

  describe('RateLimiter', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('debe restablecer tokens tras transcurrir 60 segundos', () => {
      const limiter = new RateLimiter();
      for (let i = 0; i < 5; i++) limiter.consume();
      expect(limiter.consume()).toBe(false); // Agotado

      // Avanzar el tiempo 60 segundos de forma sincrónica e instantánea
      vi.advanceTimersByTime(60_000);

      expect(limiter.consume()).toBe(true); // Restaurado
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar pausas con sleeps reales en tests unitarios o no restablecer los timers reales en `afterEach`.
  - 🟢 *Green Flag*: Explica la diferencia entre `advanceTimersByTime`, `runAllTimers` y el peligro de bucles infinitos con `runAllTimers` ante intervalos continuos.

---

### 26. ¿Cómo se testea de forma confiable un `ReadableStream` o un `TransformStream` en Node.js?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Para testear streams no se debe recurrir a callbacks ambiguos con `data` y `end`. La técnica moderna aprovecha `events.once`, pipelines con promesas o la iteración asíncrona mediante `for await...of`:

  ```typescript
  import { Readable, Transform } from 'node:stream';
  import { describe, it, expect } from 'vitest';

  function createUpperStream() {
    return new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
      },
    });
  }

  describe('Stream Testing', () => {
    it('debe transformar correctamente los chunks a mayúsculas', async () => {
      const inputStream = Readable.from(['hola ', 'mundo ', 'node']);
      const transformStream = createUpperStream();

      const outputChunks: string[] = [];
      const pipelineStream = inputStream.pipe(transformStream);

      for await (const chunk of pipelineStream) {
        outputChunks.push(chunk.toString());
      }

      expect(outputChunks.join('')).toBe('HOLA MUNDO NODE');
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar timeouts arbitrarios esperando que el stream termine de emitir.
  - 🟢 *Green Flag*: Utiliza `for await...of` o `stream/promises` y testea escenarios de error forzando destrucción con `stream.destroy(new Error('Boom'))`.

---

### 27. ¿Qué es *Mutation Testing* (con herramientas como Stryker) y qué problema fundamental del *Code Coverage* tradicional resuelve?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El *Code Coverage* tradicional (líneas, ramas, instrucciones) solo indica qué código fue **ejecutado**, pero no si las aserciones son capaces de detectar un cambio erróneo en la lógica de negocio (puedes tener 100% de cobertura sin ningún `expect`).

  El **Mutation Testing** (Testing de Mutaciones):
  1. Analiza el código fuente e introduce pequeñas modificaciones deliberadas llamadas **Mutantes** (ej. cambia `>` por `>=`, altera un operador `+` a `-`, o reemplaza el retorno de una función por `null`).
  2. Ejecuta la suite de tests contra cada mutante.
  3. Si algún test falla, el mutante es **Killed (Eliminado)** (buena señal: los tests detectaron la anomalía).
  4. Si todos los tests pasan, el mutante **Survived (Sobrevivió)** (alerta: hay un hueco en las aserciones).
  El reporte final genera el **Mutation Score Indicator (MSI)**, que mide la verdadera efectividad y calidad de los tests.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer ciegamente que un 100% de code coverage garantiza ausencia de errores de testing.
  - 🟢 *Green Flag*: Describe la integración de Stryker en pipelines nocturnos de CI para validar la calidad de las pruebas críticas de cálculo o facturación.

---

### 28. ¿Cómo se testean correctamente excepciones y promesas rechazadas con tipado estricto en Vitest/Jest?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  Al verificar rechazos asíncronos o errores síncronos, se debe comprobar tanto que la promesa sea rechazada como que la clase de error y su código de dominio sean los esperados:

  ```typescript
  export class InsufficientFundsError extends Error {
    constructor(public readonly shortfall: number) {
      super(`Fondos insuficientes: Faltan $${shortfall}`);
      this.name = 'InsufficientFundsError';
    }
  }

  export async function withdraw(accountBalance: number, amount: number): Promise<number> {
    if (amount > accountBalance) {
      throw new InsufficientFundsError(amount - accountBalance);
    }
    return accountBalance - amount;
  }

  // En el test:
  it('debe rechazar con InsufficientFundsError cuando el monto supera el saldo', async () => {
    // 1. Usando rejects de expect (forma idiomática)
    await expect(withdraw(100, 150))
      .rejects
      .toThrow(InsufficientFundsError);

    // 2. Con validación exhaustiva de propiedades internas del error
    await expect(withdraw(100, 150))
      .rejects
      .toMatchObject({
        name: 'InsufficientFundsError',
        shortfall: 50,
      });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Olvidar el `await` antes de `expect(promise).rejects...`, provocando que el test pase como falso positivo silencioso.
  - 🟢 *Green Flag*: Valida tanto la instancia del error como sus propiedades de dominio personalizadas.

---

### 29. ¿Por qué el *Snapshot Testing* puede ser un antipatrón en pruebas de backend y cuándo es estrictamente legítimo usarlo?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **Por qué suele ser antipatrón**:
    - Los desarrolladores tienden a actualizar los snapshots a ciegas (`jest -u`) cuando fallan, sin inspeccionar si la causa fue una regresión real.
    - No expresan la intención del test ni documentan qué invariante específica se está verificando.
    - Cambios menores e irrelevantes (ej. formateo de fechas o reordenamiento de keys en JSON) rompen suites enteras generando ruido y fatiga de alertas.
  - **Cuándo es legítimo y útil**:
    - Generación de artefactos complejos donde la salida debe coincidir byte a byte: generadores de esquemas GraphQL/OpenAPI, ASTs de compiladores, emisión de plantillas SQL complejas o reportes PDF/SVG generados por código.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar snapshots para validar respuestas HTTP completas de endpoints REST con timestamps dinámicos.
  - 🟢 *Green Flag*: Prefiere aserciones explícitas de propiedades críticas (`expect.objectContaining`) y reserva snapshots solo para generadores de esquemas o compiladores.

---

### 30. ¿Qué diferencia hay entre *Statement*, *Branch*, *Line* y *Function Coverage* y cuál es el más vulnerable?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  - **Line Coverage**: Porcentaje de líneas de código visitadas al menos una vez durante las pruebas.
  - **Statement Coverage**: Porcentaje de sentencias ejecutadas (puede haber múltiples sentencias en una sola línea física).
  - **Function Coverage**: Porcentaje de funciones declaradas que fueron invocadas.
  - **Branch Coverage**: Porcentaje de ramas de decisión ejecutadas (cada `if`, `else`, operador ternario `? :`, o condición booleana compuesta `&&`, `||`).
  
  **El más vulnerable**: *Line Coverage* y *Function Coverage*. Puedes tener 100% de Line Coverage en un bloque `if (a && b)` si siempre se prueba con valores verdaderos, pero se dejan completamente sin probar las ramas donde `a` o `b` son falsos, ocultando graves fallas en ramas alternativas.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Exigir únicamente 80% de Line Coverage en CI ignorando por completo el Branch Coverage.
  - 🟢 *Green Flag*: Prioriza un alto Branch Coverage y diseño de casos de prueba guiados por clases de equivalencia y análisis de valores límite (*Boundary Value Analysis*).

---

## 4. Testing de Integración, End-to-End y Base de Datos

### 31. ¿Cómo se utiliza la librería `Testcontainers` para pruebas de integración con instancias reales de PostgreSQL y Redis en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  `Testcontainers` es una librería que permite iniciar y orquestar contenedores Docker reales y efímeros directamente desde el código de test en Node.js/TypeScript. Garantiza que las pruebas de integración corran contra el mismo motor de base de datos que en producción:

  ```typescript
  import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
  import { Client } from 'pg';
  import { beforeAll, afterAll, describe, it, expect } from 'vitest';

  describe('PostgreSQL Integration Test', () => {
    let container: StartedPostgreSqlContainer;
    let pgClient: Client;

    beforeAll(async () => {
      // Inicia contenedor efímero en un puerto aleatorio libre
      container = await new PostgreSqlContainer('postgres:16-alpine')
        .withDatabase('test_db')
        .withUsername('test_user')
        .withPassword('test_pass')
        .start();

      pgClient = new Client({ connectionString: container.getConnectionUri() });
      await pgClient.connect();
      await pgClient.query('CREATE TABLE accounts (id SERIAL PRIMARY KEY, balance INT);');
    }, 60_000); // Timeout extendido para pull de imagen

    afterAll(async () => {
      await pgClient?.end();
      await container?.stop(); // Elimina el contenedor Docker
    });

    it('debe persistir y consultar transacciones atómicas', async () => {
      await pgClient.query('INSERT INTO accounts (balance) VALUES (500);');
      const res = await pgClient.query('SELECT balance FROM accounts WHERE id = 1;');
      expect(res.rows[0].balance).toBe(500);
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar SQLite en memoria para tests de integración cuando en producción se utiliza PostgreSQL con extensiones o sintaxis propietaria (JSONB, triggers, locking).
  - 🟢 *Green Flag*: Explica cómo Testcontainers elimina problemas de puertos colisionados en CI y garantiza entornos limpios y reproducibles.

---

### 32. Compara las 3 estrategias de aislamiento de base de datos en tests de integración: Transacciones Rollback, TRUNCATE y Database-per-Worker.
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  1. **Transacciones Rollback**:
     - Cada test arranca una transacción `BEGIN`, ejecuta su lógica y al finalizar hace `ROLLBACK`.
     - *Pros*: Extremadamente rápido.
     - *Contras*: Falla si el código bajo prueba maneja transacciones anidadas explícitas o múltiples conexiones/hilos concurrentes.
  2. **TRUNCATE de tablas en `afterEach`**:
     - Se vacían las tablas afectadas (`TRUNCATE table1, table2 CASCADE;`).
     - *Pros*: Soporta transacciones reales completas sin interferencia.
     - *Contras*: Más lento que rollback; requiere deshabilitar temporalmente constraints de claves foráneas o truncar en cascada.
  3. **Database-per-Worker / Schema-per-Suite**:
     - Cada hilo o proceso de prueba (Vitest worker) opera sobre una base de datos o esquema dedicado (ej. `test_db_worker_1`).
     - *Pros*: Permite paralelismo total sin colisiones de claves primarias ni bloqueos de tabla.
     - *Contras*: Mayor consumo de memoria en el servidor PostgreSQL.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ejecutar tests en serie por miedo a colisiones en la base de datos o no limpiar el estado entre ejecuciones.
  - 🟢 *Green Flag*: Diseña una estrategia híbrida: Schema-per-worker para paralelismo con TRUNCATE ultra-rápido entre tests.

---

### 33. ¿Cómo se mockean peticiones HTTP externas en tests de integración usando MSW (`msw/node`) frente a `nock`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **Nock**:
    - Histórico en Node.js. Intercepta el módulo interno `http.ClientRequest` sobreescribiendo métodos de red.
    - Soporte irregular para el `fetch` nativo de Node.js (undici) sin adaptadores especiales.
  - **MSW (Mock Service Worker) Node**:
    - Estándar moderno. Utiliza `@mswjs/interceptors` para interceptar a bajo nivel peticiones tanto de `http`, `https`, `fetch` nativo, `axios` o `got`.
    - Permite reutilizar los mismos handlers de simulación de API en backend y frontend.

  ```typescript
  import { setupServer } from 'msw/node';
  import { http, HttpResponse } from 'msw';
  import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';

  const server = setupServer(
    http.get('https://api.stripe.com/v1/charges', () => {
      return HttpResponse.json({ status: 'succeeded', amount: 2000 });
    })
  );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('debe procesar el cobro contra Stripe simulado', async () => {
    const res = await fetch('https://api.stripe.com/v1/charges');
    const data = await res.json();
    expect(data.status).toBe('succeeded');
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar peticiones HTTP reales saliendo a internet en tests unitarios o de integración.
  - 🟢 *Green Flag*: Configura `{ onUnhandledRequest: 'error' }` en MSW para que cualquier petición no capturada rompa el test inmediatamente, evitando llamadas silenciosas externas.

---

### 34. ¿Qué es *Contract Testing* con Pact y qué problema crítico de los tests E2E resuelve en arquitecturas de microservicios?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En microservicios, los tests End-to-End (E2E) completos son frágiles, lentos, costosos de mantener y requieren levantar docenas de servicios simultáneamente.
  El **Contract Testing (con Pact)** valida las interacciones entre un **Consumidor** (cliente API) y un **Proveedor** (servicio backend) de forma asíncrona e independiente:
  1. El consumidor ejecuta tests unitarios contra un mock de Pact, definiendo el contrato: *"Cuando pido GET /users/1, espero este payload JSON con status 200"*.
  2. Pact genera un archivo de contrato estandarizado (`pact.json`) y lo sube al **Pact Broker**.
  3. El proveedor descarga el contrato en su propio pipeline de CI y ejecuta sus tests locales contra su API real para verificar si satisface el contrato.
  4. La herramienta `can-i-deploy` del Pact Broker garantiza si ambas versiones son compatibles antes del despliegue a producción, erradicando breaking changes.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Proponer montar todos los microservicios de la empresa en Docker Compose en CI como única estrategia de integración.
  - 🟢 *Green Flag*: Explica cómo el Consumer-Driven Contract Testing permite desplegar microservicios de forma desacoplada y continua sin necesidad de entornos compartidos frágiles.

---

### 35. ¿Qué es *Property-Based Testing* y cómo se aplica con librerías como `fast-check` en TypeScript?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En lugar de probar con 2 o 3 ejemplos fijos elegidos manualmente por el desarrollador (*Example-Based Testing*), el **Property-Based Testing** define propiedades o invariantes universales del sistema y genera automáticamente cientos o miles de casos aleatorios (incluyendo cadenas vacías, caracteres Unicode extraños, números negativos, desbordamientos de enteros y arrays gigantes):

  ```typescript
  import { describe, it } from 'vitest';
  import fc from 'fast-check';

  // Invariante de dominio: Comprimir y descomprimir un payload debe devolver el original
  function encode(str: string): string { return Buffer.from(str).toString('base64'); }
  function decode(b64: string): string { return Buffer.from(b64, 'base64').toString('utf-8'); }

  describe('Property-Based Testing con fast-check', () => {
    it('invariante: decode(encode(x)) === x para cualquier string posible', () => {
      fc.assert(
        fc.property(fc.fullUnicodeString(), (text) => {
          return decode(encode(text)) === text;
        }),
        { numRuns: 1000 } // 1000 ejecuciones con inputs aleatorios extremos
      );
    });
  });
  ```
  Si una propiedad falla, `fast-check` aplica **Shrinking** (reducción): simplifica sistemáticamente el input fallido hasta encontrar el contraejemplo mínimo reproducible.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer la técnica o depender únicamente de casos felices manuales.
  - 🟢 *Green Flag*: Destaca la capacidad de *Shrinking* para descubrir edge cases inesperados en serializadores, algoritmos de cálculo y validadores de negocio.

---

### 36. ¿Cómo se testean sistemas guiados por eventos (ej. consumidores y publicadores de Apache Kafka o RabbitMQ)?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Se debe separar la prueba en dos niveles:
  1. **Nivel Lógico / Dominio**: Se testea el manejador (*Event Handler*) de forma aislada pasándole el evento de dominio como un objeto plano en memoria, validando que invoque a los casos de uso correctos.
  2. **Nivel de Integración de Infraestructura**:
     - Se levanta una instancia de Kafka/RabbitMQ efímera usando `Testcontainers`.
     - El test publica un mensaje real en el broker con un identificador de correlación único (`correlationId`).
     - El test espera la confirmación de procesamiento escuchando un tópico de salida o consultando la base de datos con un mecanismo de polling reactivo (usando librerías como `wait-for-expect` o `p-wait-for` con timeout estricto), evitando callbacks o sleeps ciegos.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Poner un `sleep(3000)` en el test esperando que el consumidor de Kafka haya terminado de procesar.
  - 🟢 *Green Flag*: Utiliza polling asíncrono determinista con timeout y limpia los offsets y tópicos entre pruebas.

---

### 37. ¿Cómo se diseñan pruebas de concurrencia para verificar condiciones de carrera (*Race Conditions*) en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Aunque Node.js es single-threaded a nivel de JavaScript, las operaciones asíncronas intercaladas contra bases de datos pueden provocar graves problemas de concurrencia (ej. *Double Spending* o actualizaciones perdidas):

  ```typescript
  it('debe prevenir sobregiro en retiros concurrentes simultáneos', async () => {
    const accountId = await createAccountWithBalance(100);

    // Disparar 5 peticiones simultáneas de retiro de $80 usando Promise.all
    const results = await Promise.allSettled([
      bankService.withdraw(accountId, 80),
      bankService.withdraw(accountId, 80),
      bankService.withdraw(accountId, 80),
      bankService.withdraw(accountId, 80),
      bankService.withdraw(accountId, 80),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Con bloqueo pesimista (SELECT FOR UPDATE) o control optimista:
    // Solo 1 retiro debió tener éxito y 4 debieron ser rechazados.
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(4);

    const finalBalance = await getAccountBalance(accountId);
    expect(finalBalance).toBe(20); // 100 - 80
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que por ser Node.js monohilo no existen problemas de concurrencia en transacciones de bases de datos.
  - 🟢 *Green Flag*: Explica cómo orquestar promesas concurrentes con `Promise.all` para probar mecanismos de bloqueo pesimista (`FOR UPDATE`) o versionado optimista (`version` column).

---

### 38. ¿Qué es Supertest y cómo permite testear aplicaciones Express/NestJS sin necesidad de abrir sockets TCP reales en el sistema operativo?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  `supertest` es un wrapper sobre `superagent` diseñado para HTTP assertions. Cuando se le pasa la instancia de la aplicación (ej. `app` de Express o `app.getHttpServer()` de NestJS), **no necesita invocar `server.listen(port)`** abriendo puertos TCP reales en la red del sistema operativo.
  
  En su lugar, Supertest se acopla directamente al listener interno de Node.js (`http.createServer(app)`), emitiendo peticiones en memoria simuladas a través del protocolo HTTP local. Esto elimina problemas de colisión de puertos (`EADDRINUSE`) cuando múltiples suites de tests corren en paralelo en la misma máquina o contenedor de CI.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Abrir puertos duros fijos (ej. `3000`) en cada test de integración, impidiendo la ejecución concurrente.
  - 🟢 *Green Flag*: Pasa la referencia del handler de la app a Supertest y cierra adecuadamente las conexiones subyacentes con `app.close()`.

---

### 39. ¿Cómo se integran pruebas de rendimiento y carga (Load Testing) con herramientas como k6 o autocannon en el ciclo de CI/CD?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Las pruebas de carga no deben realizarse solo manualmente antes de un lanzamiento; deben automatizarse con umbrales estrictos (*SLO / Performance Budgets*) en pipelines de staging:
  - **k6**: Escrito en Go, permite escribir escenarios de prueba en JavaScript/TypeScript, definiendo métricas y *Thresholds*:
    ```javascript
    export const options = {
      vus: 50,
      duration: '30s',
      thresholds: {
        http_req_failed: ['rate<0.01'], // Menos del 1% de errores
        http_req_duration: ['p(95)<150'], // El percentil 95 debe responder en < 150ms
      },
    };
    ```
  - **autocannon**: Herramienta basada en Node.js ultra-rápida ejecutable vía CLI o script programático para medir peticiones por segundo y latencia.
  Si el percentil p95 o la tasa de errores supera el umbral configurado, el step de CI devuelve código de salida no cero, bloqueando el merge del Pull Request.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Medir performance únicamente por el tiempo promedio de respuesta en lugar de percentiles p95 o p99.
  - 🟢 *Green Flag*: Explica el impacto de los percentiles de cola (*tail latency*) y cómo automatizar los umbrales de regresión de performance en CI.

---

### 40. ¿Cuál es la diferencia entre *Unit Tests*, *Integration Tests* y *Acceptance / E2E Tests* según la arquitectura hexagonal?
- **Nivel**: Senior / Lead
- **Respuesta Técnica**:
  En **Arquitectura Hexagonal (Ports & Adapters)**:
  - **Unit Tests**: Prueban el **Núcleo de Dominio** y los casos de uso (*Application Services*). Todas las dependencias externas (puertos de salida: bases de datos, APIs de terceros) se sustituyen por Fakes o Stubs en memoria. Son ultra-rápidos y puramente sincrónicos/asincrónicos en memoria.
  - **Integration Tests**: Prueban los **Adaptadores** de infraestructura contra sus contrapartes reales o de integración (ej. el `PostgresOrderRepository` contra un PostgreSQL real con Testcontainers, o el `StripePaymentGateway` contra MSW). Verifican la serialización, mapeo relacional y queries.
  - **E2E / Acceptance Tests**: Atraviesan toda la aplicación desde los adaptadores primarios de entrada (Controladores HTTP) hasta la infraestructura persistente, validando el cumplimiento de los criterios de aceptación del usuario o historias de usuario completas.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Acoplar tests unitarios de dominio a librerías de infraestructura como TypeORM, Mongoose o Prisma.
  - 🟢 *Green Flag*: Diseña una suite donde las reglas de negocio del dominio se prueban a la velocidad de la luz sin dependencias de base de datos ni frameworks web.

---

## 5. ECMAScript Moderno, JavaScript Internals y Best Practices

### 41. ¿Cómo funcionan los operadores *Nullish Coalescing* (`??`), *Optional Chaining* (`?.`) y *Logical Assignment* (`||=`, `&&=`, `??=`)?
- **Nivel**: Junior / Mid-Level
- **Respuesta Técnica**:
  - **Nullish Coalescing (`??`)**: Retorna el operando derecho únicamente si el izquierdo es estrictamente `null` o `undefined`. A diferencia de `||`, valores falsy legítimos como `0`, `""` o `false` son preservados:
    ```typescript
    const port = config.port ?? 3000; // Si config.port es 0, preserva 0. Con || asignaría 3000.
    ```
  - **Optional Chaining (`?.`)**: Cortocircuita la evaluación retornando `undefined` si la referencia es nula o indefinida, aplicable a propiedades (`a?.b`), llamadas a funciones (`fn?.()`) o índices (`arr?.[0]`).
  - **Logical Assignment**:
    - `x ||= y`: Asigna `y` si `x` es falsy (`x || (x = y)`).
    - `x &&= y`: Asigna `y` si `x` es truthy.
    - `x ??= y`: Asigna `y` únicamente si `x` es `null` o `undefined` (ideal para inicializar caches o valores por defecto perezosos).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `||` para valores de configuración donde `0` o `false` son entradas válidas, introduciendo bugs sutiles.
  - 🟢 *Green Flag*: Comprende el cortocircuito exacto de la especificación ECMAScript.

---

### 42. ¿Qué son `WeakMap` y `WeakSet`, en qué difieren de `Map` y `Set`, y cómo previenen Memory Leaks en caches de metadatos?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En un `Map` estándar, si un objeto se utiliza como clave, el Map mantiene una **referencia fuerte** (*Strong Reference*) a dicho objeto. Incluso si el resto del programa descarta todas las variables que apuntaban al objeto, el Garbage Collector **no puede liberarlo de la memoria**, provocando fugas de memoria.

  En un `WeakMap`:
  1. Las claves **deben ser estrictamente objetos** o símbolos no registrados.
  2. Las referencias a las claves son **débiles** (*Weak References*). Si no existen otras referencias vivas al objeto clave en la aplicación, el Garbage Collector lo reclama y destruye automáticamente la entrada del `WeakMap`.
  3. No son iterables y no poseen propiedad `.size` ni método `.clear()` (su contenido es indeterminado en cualquier momento debido al GC).
  4. Caso de uso principal: Almacenamiento de metadatos privados asociados a instancias de objetos, o caches asociadas al ciclo de vida de peticiones HTTP.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Crear caches globales usando `Map<Object, any>` sin políticas de expulsión y no entender por qué la memoria crece infinitamente.
  - 🟢 *Green Flag*: Explica cómo `WeakMap` permite asociar estado privado a objetos de terceros sin modificar la estructura original ni impedir la recolección de basura.

---

### 43. Compara los campos privados nativos de clase ECMAScript (`#privateField`) frente a la palabra clave `private` de TypeScript.
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **TypeScript `private`**:
    - Es una restricción puramente en tiempo de compilación (*Soft Privacy*).
    - Al transpilar a JavaScript, la propiedad se emite como un campo público normal.
    - En tiempo de ejecución cualquiera puede acceder a ella mediante `(instance as any).privateProperty` o `instance['privateProperty']`.
  - **ECMAScript `#privateField`**:
    - Privacidad forzada a nivel de motor de JavaScript (*Hard Privacy*).
    - Se gestiona internamente mediante un mecanismo similar a *Private Names / WeakMaps* en el motor V8.
    - Intentar acceder desde el exterior produce un error de sintaxis en tiempo de ejecución (`SyntaxError: Private field '#privateField' must be declared in an enclosing class`).
    - Ni siquiera `Object.keys()`, `JSON.stringify()` ni la introspección reflexiva pueden leerlo directamente.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que `private` de TypeScript protege secretos o claves criptográficas en runtime.
  - 🟢 *Green Flag*: Elige `#field` cuando la encapsulación debe ser inviolable en tiempo de ejecución (ej. en SDKs o librerías de seguridad).

---

### 44. ¿Cómo operan los *Generadores Asíncronos* (`async function*`) y el bucle `for await...of` en el procesamiento de grandes volúmenes de datos?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Un generador asíncrono combina generadores (`function*` con `yield`) con promesas (`async`). Permite emitir valores a demanda (*pull-based streams*) pausando la ejecución de la función hasta que el consumidor solicite el siguiente dato:

  ```typescript
  // Paginación asíncrona de base de datos como flujo de datos infinito o finito
  async function* fetchAllAuditLogs(pageSize = 100): AsyncGenerator<AuditLog, void, unknown> {
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const response = await db.logs.findMany({ take: pageSize, cursor: cursor ? { id: cursor } : undefined });
      if (response.length === 0) break;

      for (const log of response) {
        yield log; // Emite un elemento a la vez perezosamente
      }

      cursor = response[response.length - 1].id;
      hasMore = response.length === pageSize;
    }
  }

  // Consumo con consumo de memoria O(1) independiente del volumen total de registros:
  for await (const log of fetchAllAuditLogs()) {
    await processLogEntry(log);
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Descargar 1 millón de registros cargándolos todos en un array en memoria `const all = await fetchAll()`, provocando un choque por OOM.
  - 🟢 *Green Flag*: Explica cómo `for await...of` implementa el protocolo `Symbol.asyncIterator`, permitiendo procesamiento en streaming limpio y memory-safe.

---

### 45. Compara en profundidad los 4 combinadores de Promesas: `Promise.all`, `Promise.allSettled`, `Promise.race` y `Promise.any`.
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  | Método | Resolución (Éxito) | Rechazo (Fallo) | Caso de Uso Típico |
  | :--- | :--- | :--- | :--- |
  | `Promise.all` | Cuando **todas** se resuelven exitosamente (array de resultados). | Se rechaza **inmediatamente** al fallar la primera (*Fail-Fast*). | Operaciones interdependientes donde si una falla, todo el proceso carece de sentido. |
  | `Promise.allSettled` | Espera a que **todas** terminen, sin importar si tuvieron éxito o fallaron. | Nunca se rechaza (retorna array de `{status: 'fulfilled', value} \| {status: 'rejected', reason}`). | Tareas batch masivas donde se deben procesar todos los elementos y reportar los fallos individuales. |
  | `Promise.race` | Se resuelve o rechaza tan pronto como la **primera** promesa del iterable termine. | Se rechaza si la primera en terminar falla. | Implementación de timeouts manuales contra sockets o promesas externas. |
  | `Promise.any` | Se resuelve tan pronto como la **primera** promesa tenga **éxito**. | Se rechaza únicamente si **todas** fallan (retorna un `AggregateError`). | Consultas redundantes a réplicas o mirrors: obtener el primer resultado válido disponible. |
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `Promise.all` en procesos batch donde el fallo de una tarea no debe interrumpir el procesamiento de las restantes.
  - 🟢 *Green Flag*: Conoce `AggregateError` de `Promise.any` y sabe cuándo aplicar `allSettled` para auditorías de procesos batch concurrentes.

---

### 46. ¿Cómo se utiliza `AbortController` y `AbortSignal` para la cancelación cooperativa de peticiones HTTP, timers y operaciones I/O en Node.js moderno?
- **Nivel**: Senior
- **Respuesta Técnica**:
  `AbortController` provee un mecanismo unificado y estándar de cancelación en Node.js (soportado por `fetch`, `http`, `events`, `child_process`, `fs/promises` y drivers de bases de datos modernos).
  Cuando el cliente cancela una solicitud HTTP entrante, o expira un timeout de seguridad, se debe abortar la operación para no desperdiciar CPU y conexiones:

  ```typescript
  export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    // AbortSignal.timeout() introduce cancelación automática (Node.js 18+)
    const timeoutSignal = AbortSignal.timeout(timeoutMs);

    try {
      const res = await fetch(url, { signal: timeoutSignal });
      return res;
    } catch (err: any) {
      if (err.name === 'TimeoutError' || timeoutSignal.aborted) {
        throw new Error(`Petición abortada: Excedió el tiempo límite de ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  // Composición de múltiples señales con AbortSignal.any (Node.js 20+):
  // const combinedSignal = AbortSignal.any([userCancelSignal, timeoutSignal]);
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No propagar el `req.signal` a las llamadas de base de datos o microservicios downstream, provocando *zombie queries* en el cluster.
  - 🟢 *Green Flag*: Muestra dominio de `AbortSignal.timeout()` y `AbortSignal.any()` para orquestar cancelaciones compuestas en sistemas distribuidos.

---

### 47. ¿Por qué `structuredClone()` es la solución nativa recomendada para clonación profunda frente a `JSON.parse(JSON.stringify())` y cuáles son sus límites?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  El hack histórico `JSON.parse(JSON.stringify(obj))` presenta graves deficiencias:
  - Convierte instancias de `Date` en strings ISO.
  - Elimina propiedades con valores `undefined`, funciones y `Symbol`.
  - Convierte `NaN` e `Infinity` a `null`.
  - Falla catastróficamente con un `TypeError` ante **referencias circulares**.
  - No soporta `Map`, `Set`, `RegExp`, `ArrayBuffer` ni tipos binarios.

  `structuredClone()` es el algoritmo nativo del estándar HTML/ECMAScript disponible globalmente en Node.js 17+:
  - Clona fielmente grafos de objetos con **referencias circulares**.
  - Preserva `Date`, `RegExp`, `Map`, `Set`, `TypedArrays`, `ArrayBuffers` y primitivos especiales.
  - **Límites**: No puede clonar funciones ni métodos de clase, prototipos de clases personalizadas (el objeto clonado pierde su prototipo y pasa a ser un `Object` plano), ni descriptores de propiedades (getters/setters).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Recomendar `JSON.parse/stringify` sin advertir sobre referencias circulares o mutación de fechas.
  - 🟢 *Green Flag*: Explica el soporte de tipos transferibles (*Transferable Objects*) en `structuredClone(obj, { transfer: [buffer] })` para mover memoria entre Worker Threads con coste O(1).

---

### 48. ¿Cómo se originan y cómo se previenen los Memory Leaks causados por *Closures retenidas* y *Event Listeners olvidados* en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  1. **Closures retenidas**:
     Si una función interna mantiene referencia a un objeto grande en su lexical scope circundante y dicha función es almacenada en una variable global, singleton o cache de larga vida, todo el lexical scope circundante (incluyendo variables no usadas) es retenido por el Garbage Collector:
     ```typescript
     let theThing: any = null;
     function replaceThing() {
       const originalThing = theThing;
       const unused = function () { if (originalThing) console.log('hi'); };
       // originalThing es compartido en el contexto léxico y retenido indefinidamente
       theThing = { longStr: new Array(1000000).join('*'), someMethod: function () {} };
     }
     ```
  2. **Event Listeners no removidos**:
     Registrar `emitter.on('event', listener)` sin llamar a `emitter.off()` o `removeListener()` cuando el consumidor es destruido. Node.js advierte por defecto con `MaxListenersExceededWarning` al superar 10 oyentes.
     *Prevención moderna*: Usar `{ once: true }` o pasar un `AbortSignal`:
     ```typescript
     emitter.on('data', handler, { signal: abortController.signal });
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Ignorar las advertencias de `MaxListenersExceededWarning` aumentando arbitrariamente `setMaxListeners(0)` sin investigar la causa raíz.
  - 🟢 *Green Flag*: Utiliza `AbortSignal` para limpieza automática y sabe capturar heap snapshots con Chrome DevTools o `v8.writeHeapSnapshot()` para comparar retenedores (*retaining trees*).

---

### 49. ¿Cuál es la diferencia entre `Object.freeze()`, `Object.seal()` y el modificador `Readonly<T>` de TypeScript?
- **Nivel**: Mid-Level
- **Respuesta Técnica**:
  - `Readonly<T>`: Restricción en **tiempo de compilación**. El compilador de TypeScript rechaza asignaciones directas (`obj.prop = val`), pero no produce ningún efecto en tiempo de ejecución.
  - `Object.seal(obj)`: Restricción en **tiempo de ejecución**. Previene añadir nuevas propiedades o eliminar las existentes, y marca todas las propiedades existentes como no configurables (`configurable: false`). Sin embargo, los valores de las propiedades existentes **sí pueden ser modificados** si son escribibles (`writable: true`).
  - `Object.freeze(obj)`: Restricción en **tiempo de ejecución**. Aplica todo lo de `seal()` y además hace que todas las propiedades existentes sean de solo lectura (`writable: false`).
  - **Importante**: Tanto `freeze` como `seal` son superficiales (*shallow*). Para inmutabilidad profunda en runtime se requiere una función recursiva o librerías optimizadas como Immer.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que `Readonly<T>` de TypeScript congela el objeto en runtime o que `Object.freeze` es profundo por defecto.
  - 🟢 *Green Flag*: Explica cómo combinar `DeepReadonly<T>` a nivel de tipos con inmutabilidad estructural o congelamiento defensivo en capas críticas de dominio.

---

### 50. ¿Qué es *Top-Level Await* en ECMAScript y cuáles son sus ventajas y peligros en la inicialización de módulos en Node.js?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  En módulos ECMAScript (ESM), *Top-Level Await* permite utilizar la palabra clave `await` fuera de funciones `async` en el nivel superior de un archivo.
  
  - **Ventajas**:
    - Inicialización limpia de conexiones a bases de datos, lectura de certificados o carga dinámica de configuraciones antes de exportar miembros.
    - Elimina la necesidad del patrón antipatrón de wrappers `(async () => { await init(); })()`.
  - **Peligros y Comportamiento Interno**:
    - Bloquea la resolución del módulo y la ejecución de todos los módulos padres que lo importan hasta que la promesa resuelva.
    - Si dos módulos con Top-Level Await tienen dependencias circulares y esperan el uno por el otro, pueden generar un **Deadlock** en el arranque de la aplicación.
    - Si la promesa se rechaza y no se captura, el proceso de Node.js se aborta con `UncaughtException` antes de arrancar cualquier servidor web.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer que un top-level await detiene la carga de toda la cadena de dependencias que lo importa.
  - 🟢 *Green Flag*: Recomienda su uso estricto para inicialización de infraestructura esencial (fails-fast ante configs corruptas) aislando fallos con try/catch explícitos.


---

## 6. Type Gymnastics Extremos, Recursión y Metaprogramación

### 51. ¿Cómo implementar un parser de cadenas de consulta o rutas URL a nivel del sistema de tipos (`type ParseRoute<T>`)?
- **Nivel**: Staff Engineer / Type Systems
- **Respuesta Técnica**:
  Mediante *Template Literal Types*, *Conditional Types* y recursión en el evaluador de tipos de TypeScript:
  ```typescript
  // Extrae todos los parámetros :param de una ruta '/users/:userId/posts/:postId'
  export type ParseRouteParams<T extends string> =
    T extends `${string}:${infer Param}/${infer Rest}`
      ? Param | ParseRouteParams<`/${Rest}`>
      : T extends `${string}:${infer Param}`
        ? Param
        : never;

  export type RouteParamsObject<T extends string> = {
    [K in ParseRouteParams<T>]: string;
  };

  // Verificación estática:
  type MyRoute = '/api/v1/orgs/:orgId/projects/:projectId/issues/:issueId';
  type Extracted = ParseRouteParams<MyRoute>; 
  // 'orgId' | 'projectId' | 'issueId'

  type Params = RouteParamsObject<MyRoute>;
  // { orgId: string; projectId: string; issueId: string }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar parsear strings de tipos mediante expresiones regulares o afirmar que TypeScript no puede analizar substrings estáticamente.
  - 🟢 *Green Flag*: Explica cómo descomponer cadenas con separadores y recursividad terminal para autocompletar `req.params` según la URL declarada.

---

### 52. ¿Cómo superar el límite de recursividad de tipos de TypeScript (*Type instantiation is excessively deep*) mediante acumulación por tuplas?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  TypeScript impone un límite estricto de recursión (normalmente 50 a 100 iteraciones antes de abortar con `error TS2589: Type instantiation is excessively deep and possibly infinite`).
  Para superar este límite en operaciones como generación de números o desempaquetado de listas:
  - **Técnica de Acumulación por Tuplas (Tail-Call Optimization de Tipos)**: En lugar de construir tipos anidados `F<F<F<T>>>`, se pasa una tupla acumuladora `Acc extends unknown[] = []`. TypeScript optimiza las llamadas terminales recursivas si el resultado no se computa en el retorno de la rama condicional:
  ```typescript
  // Generador de tupla de longitud N con recursión optimizada
  type BuildTuple<L extends number, Acc extends unknown[] = []> =
    Acc['length'] extends L
      ? Acc
      : BuildTuple<L, [...Acc, unknown]>;

  type Tuple100 = BuildTuple<100>; // Tupla de 100 elementos sin desbordar el compilador
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer por qué TypeScript aborta la compilación al anidar tipos condicionales profundos.
  - 🟢 *Green Flag*: Aplica patrones de paso de acumulador en la cola (*Tail-Recursive Types*) reconocidos por el compilador de TypeScript desde la v4.5+.

---

### 53. ¿Cómo implementar operaciones aritméticas a nivel de tipos (`Add<A, B>`, `Subtract<A, B>`) utilizando la longitud de tuplas?
- **Nivel**: Staff Engineer / Type Gymnastics
- **Respuesta Técnica**:
  TypeScript no tiene operadores aritméticos en su sistema de tipos (ej. `type X = 2 + 3` no compila). Sin embargo, la propiedad `['length']` de una tupla es un tipo numérico literal exacto.
  Se pueden implementar sumas y restas uniendo tuplas:
  ```typescript
  type TupleOf<N extends number, T extends unknown[] = []> =
    T['length'] extends N ? T : TupleOf<N, [...T, unknown]>;

  // Suma: Une dos tuplas de longitud A y B y mide su longitud combinada
  export type Add<A extends number, B extends number> =
    [...TupleOf<A>, ...TupleOf<B>]['length'];

  // Resta: Si TupleOf<A> extiende [...TupleOf<B>, ...infer Rest], la longitud de Rest es A - B
  export type Subtract<A extends number, B extends number> =
    TupleOf<A> extends [...TupleOf<B>, ...infer Rest] ? Rest['length'] : never;

  type Sum = Add<3, 5>;       // 8 (tipo numérico literal)
  type Diff = Subtract<10, 4>; // 6 (tipo numérico literal)
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que los tipos en TypeScript solo sirven para validar interfaces y no constituyen un lenguaje funcional Turing-completo.
  - 🟢 *Green Flag*: Conoce los límites prácticos (solo para enteros positivos pequeños) y advierte sobre el sobrecoste en el tiempo de compilación.

---

### 54. ¿Cómo modelar la transformación de una unión en una intersección (`UnionToIntersection<U>`) aprovechando la contravarianza?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Este es uno de los trucos más sofisticados del sistema de tipos de TypeScript. Aprovecha que los **parámetros de función están en posición contravariante**: cuando una unión de funciones se evalúa como parámetro, TypeScript debe inferir la intersección para mantener la seguridad de tipos:
  ```typescript
  export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
      ? I
      : never;

  // Verificación:
  type InputUnion = { a: string } | { b: number } | { c: boolean };
  type ResultIntersection = UnionToIntersection<InputUnion>;
  // { a: string } & { b: number } & { c: boolean }
  ```
  1. `U extends any` distribuye la unión, creando una unión de funciones: `((k: {a: string}) => void) | ((k: {b: number}) => void)`.
  2. Al inferir `infer I` en la posición del argumento `k`, la contravarianza fuerza a que `I` sea asignable a ambas ramas, deduciendo la intersección `A & B`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar resolverlo con condicionales planos o ignorar las reglas de varianza en argumentos de función.
  - 🟢 *Green Flag*: Explica la contravarianza formal del argumento de función como base matemática de la inferencia.

---

### 55. ¿Cómo implementar un validador de esquemas JSON a tipos estáticos (`JSONSchemaToType<T>`) en TypeScript puro?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Similar a como opera la librería `json-schema-to-ts`:
  ```typescript
  type JSONSchema =
    | { type: 'string' }
    | { type: 'number' }
    | { type: 'boolean' }
    | { type: 'object'; properties: Record<string, JSONSchema>; required?: readonly string[] };

  export type FromSchema<T extends JSONSchema> =
    T extends { type: 'string' } ? string :
    T extends { type: 'number' } ? number :
    T extends { type: 'boolean' } ? boolean :
    T extends { type: 'object'; properties: infer P }
      ? { [K in keyof P]: P[K] extends JSONSchema ? FromSchema<P[K]> : never }
      : unknown;

  const userSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      age: { type: 'number' },
    },
  } as const;

  type InferredUser = FromSchema<typeof userSchema>;
  // { id: string; age: number }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Requerir que el usuario defina manualmente la interface TypeScript y el esquema JSON por duplicado.
  - 🟢 *Green Flag*: Utiliza `as const` para inferir esquemas profundos sin perder literales ni campos obligatorios.

---

### 56. ¿Cómo crear tipos de acceso a rutas anidadas profundas seguras (`type Path<T>`, `type PathValue<T, P>`) con autocompletado en IDE?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Para librerías como Lodash `get(obj, 'user.address.street')` o formularios con claves tipo dot-notation:
  ```typescript
  export type Path<T> = T extends object
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends object
            ? K | `${K}.${Path<T[K]>}`
            : K
          : never;
      }[keyof T]
    : never;

  export type PathValue<T, P extends Path<T>> =
    P extends `${infer Key}.${infer Rest}`
      ? Key extends keyof T
        ? Rest extends Path<T[Key]>
          ? PathValue<T[Key], Rest>
          : never
        : never
      : P extends keyof T
        ? T[P]
        : never;

  interface UserProfile {
    user: {
      address: {
        city: string;
        zipCode: number;
      };
    };
  }

  function getDeepValue<T, P extends Path<T>>(obj: T, path: P): PathValue<T, P> {
    return path.split('.').reduce((acc: any, part) => acc[part], obj);
  }

  const profile: UserProfile = { user: { address: { city: 'Madrid', zipCode: 28001 } } };
  const city = getDeepValue(profile, 'user.address.city'); // Tipo inferido: string
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar strings sueltos no tipados (`path: string`) retornando `any`.
  - 🟢 *Green Flag*: Diseña tipos recursivos con autocompletado nativo en el editor que detectan typos en rutas anidadas en tiempo de compilación.

---

### 57. ¿Cómo implementar tipos de diferenciación de objetos (`Diff<T, U>`, `ExclusiveOr<T, U>`) para contratos mutuamente excluyentes?
- **Nivel**: Senior
- **Respuesta Técnica**:
  En TypeScript, una unión `A | B` permite que un objeto contenga **ambas** propiedades simultáneamente. Para forzar que el objeto contenga **exclusivamente las propiedades de A o exclusivamente las de B, pero nunca ambas**:
  ```typescript
  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  export type XOR<T, U> = T | U extends object
    ? (Without<T, U> & U) | (Without<U, T> & T)
    : T | U;

  interface CreditCardPayment {
    cardNumber: string;
    cvv: string;
  }

  interface PayPalPayment {
    paypalEmail: string;
  }

  type SafePayment = XOR<CreditCardPayment, PayPalPayment>;

  const valid1: SafePayment = { cardNumber: '1234', cvv: '123' }; // OK
  const valid2: SafePayment = { paypalEmail: 'user@paypal.com' };   // OK
  // const invalid: SafePayment = { cardNumber: '1234', cvv: '123', paypalEmail: 'bad' }; // ERROR: paypalEmail no puede existir
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que el operador `|` de TypeScript es mutuamente excluyente por defecto.
  - 🟢 *Green Flag*: Utiliza tipos con propiedades opcionales marcadas como `?: never` para forzar la exclusión en runtime y compilación.

---

### 58. ¿Cómo extraer y tipar funciones sobrecargadas (*Function Overloads*) utilizando trucos avanzados de tuplas e `infer`?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Cuando una función tiene múltiples sobrecargas en TypeScript:
  ```typescript
  function process(x: string): number;
  function process(x: number, y: boolean): string;
  function process(x: any, y?: any): any { return null; }
  ```
  El utilitario estándar `ReturnType<typeof process>` **solo extrae el tipo de la última sobrecarga**.
  Para inspeccionar sobrecargas se utilizan intersecciones de funciones combinadas con `infer` selectivo:
  ```typescript
  type Overloads<T> =
    T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2 }
      ? [ (...args: A1) => R1, (...args: A2) => R2 ]
      : T extends (...args: infer A) => infer R
        ? [ (...args: A) => R ]
        : never;
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Asumir que `Parameters` y `ReturnType` resuelven todas las ramas de una sobrecarga automáticamente.
  - 🟢 *Green Flag*: Explica cómo el evaluador de TypeScript prioriza la última sobrecarga declarada en la resolución de tipos condicionales simples.

---

### 59. ¿Cómo transformar un tipo objeto en una tupla de sus pares clave-valor (`type Entries<T>`) preservando tipos literales?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El método nativo `Object.entries(obj)` de JavaScript devuelve `[string, any][]`, perdiendo la correlación entre la clave y el tipo específico del valor.
  En TypeScript estricto:
  ```typescript
  export type Entry<T> = {
    [K in keyof T]: [K, T[K]];
  }[keyof T];

  interface Config {
    port: number;
    host: string;
    ssl: boolean;
  }

  type ConfigEntry = Entry<Config>;
  // ['port', number] | ['host', string] | ['ssl', boolean]

  export function typedEntries<T extends object>(obj: T): Entry<T>[] {
    return Object.entries(obj) as any;
  }

  for (const [key, val] of typedEntries(config)) {
    // Si key === 'port', TS sabe que val es number
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Aceptar pasivamente el tipo `[string, any][]` en código crítico perdiendo la seguridad de tipos.
  - 🟢 *Green Flag*: Combina tipos indexados sobre un mapped type para generar la unión discriminada de tuplas clave-valor.

---

### 60. ¿Cómo implementar tipado estricto para máquinas de estados finitos (FSM) garantizando transiciones válidas estáticamente?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Para prevenir transiciones ilegales en tiempo de compilación (ej. pasar una orden de `CANCELLED` a `DELIVERED`):
  ```typescript
  type State = 'DRAFT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

  // Mapa exhaustivo de transiciones legales
  type ValidTransitions = {
    DRAFT: 'PAID' | 'CANCELLED';
    PAID: 'SHIPPED' | 'CANCELLED';
    SHIPPED: 'DELIVERED';
    DELIVERED: never;
    CANCELLED: never;
  };

  export class OrderFsm<CurrentState extends State> {
    constructor(public readonly state: CurrentState) {}

    transitionTo<NextState extends ValidTransitions[CurrentState]>(
      next: NextState
    ): OrderFsm<NextState> {
      console.log(`Transición válida: ${this.state} -> ${next}`);
      return new OrderFsm(next);
    }
  }

  const order = new OrderFsm('DRAFT');
  const paid = order.transitionTo('PAID'); // Válido
  const shipped = paid.transitionTo('SHIPPED'); // Válido
  // shipped.transitionTo('DRAFT'); // ERROR DE COMPILACIÓN: 'DRAFT' no es asignable a 'DELIVERED'
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar la validación de transiciones de estados únicamente a sentencias `if` en tiempo de ejecución.
  - 🟢 *Green Flag*: Modela la máquina de estados con tipos genéricos inmutables donde cada transición devuelve un nuevo tipo que restringe las operaciones subsiguientes.

---

## 7. Arquitectura del Compilador, AST Transformers y Declaration Files

### 61. ¿Cómo funciona el ciclo del compilador de TypeScript: Scanner, Parser, Binder, Checker y Emitter?
- **Nivel**: Staff Engineer / Compiler Architecture
- **Respuesta Técnica**:
  El compilador de TypeScript (`tsc`) opera en 5 etapas secuenciales:
  1. **Scanner**: Toma el código fuente en texto y lo divide en un stream de **Tokens** léxicos.
  2. **Parser**: Consume los tokens y construye el **AST (Abstract Syntax Tree)**, representando la gramática en nodos jerárquicos (`SourceFile`).
  3. **Binder**: Recorre el AST y crea **Symbols** (asocia identificadores con sus declaraciones de scope: variables, funciones, interfaces). Construye la tabla de símbolos.
  4. **Type Checker**: El corazón de `tsc` (ocupa el 80% del tiempo de compilación). Resuelve y comprueba los tipos, valida asignabilidad, infiere genéricos y reporta errores diagnósticos.
  5. **Emitter**: Transforma el AST comprobado a código JavaScript de salida (`.js`), archivos de declaración (`.d.ts`) y mapas de origen (`.js.map`).
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Pensar que herramientas como esbuild o Babel ejecutan el Binder y el Checker (solo ejecutan Scanner y Parser superficial eliminando tipos).
  - 🟢 *Green Flag*: Explica la interacción entre Nodos del AST y Símbolos del Binder durante la resolución de tipos en el Checker.

---

### 62. ¿Cómo crear un AST Custom Transformer (`ts.TransformerFactory`) para inyectar o modificar código durante la compilación?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Los *Custom Transformers* permiten modificar el AST antes de que el Emitter emita el JavaScript final (ej. para inyectar logs, medir rendimiento o eliminar llamadas de debug):
  ```typescript
  import ts from 'typescript';

  export function removeConsoleLogsTransformer<T extends ts.Node>(context: ts.TransformationContext): ts.Transformer<T> {
    return (rootNode) => {
      function visit(node: ts.Node): ts.Node | undefined {
        // Detectar console.log(...)
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'console' &&
          node.expression.name.text === 'log'
        ) {
          return undefined; // Elimina el nodo del AST emitido
        }
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(rootNode, visit);
    };
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar expresiones regulares o manipulación de cadenas para modificar código TypeScript generado en lugar de visitadores de AST formales.
  - 🟢 *Green Flag*: Utiliza `ts.visitEachChild` y conoce herramientas de compilación que soportan transformers (como `ts-patch` o TTransformer de webpack).

---

### 63. ¿Cómo diseñar archivos de definición ambientales (`.d.ts`) y qué diferencia hay entre `declare module`, `declare namespace` y `declare global`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - **`declare namespace`**: Define un grupo de tipos agrupados bajo un identificador en el espacio global o de un módulo. Históricamente emulaba namespaces de TypeScript.
  - **`declare module 'libreria'`**: Sobreescribe o declara las firmas de tipos de un paquete externo que no incluye tipos nativos:
    ```typescript
    declare module 'legacy-analytics' {
      export function trackEvent(name: string, data: Record<string, unknown>): void;
    }
    ```
  - **`declare global`**: Se utiliza dentro de un archivo con módulos (`import`/`export`) para inyectar tipos en el ámbito global del entorno (ej. agregar propiedades a `globalThis` o `Window`):
    ```typescript
    declare global {
      var __APP_METRICS__: { requests: number };
    }
    ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Poner `declare module` sin entender que los archivos que contienen `import` se consideran módulos aislados y no scripts ambientales.
  - 🟢 *Green Flag*: Domina el uso de `declare global` para extender contratos nativos de Node.js de forma compatible con ESM.

---

### 64. ¿Cómo publicar paquetes npm híbridos con soporte simultáneo CJS y ESM (*Dual Package Hazard*) usando `tsup` o sub-path exports?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El **Dual Package Hazard** ocurre cuando un consumidor en CJS hace `require('paquete')` y otro en ESM hace `import 'paquete'`, cargando dos copias independientes del módulo en memoria, duplicando singletons o estados globales.
  *Estructura de `package.json` moderna con `exports` condicionales*:
  ```json
  {
    "name": "mi-libreria",
    "type": "module",
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
      ".": {
        "import": {
          "types": "./dist/index.d.ts",
          "default": "./dist/index.js"
        },
        "require": {
          "types": "./dist/index.d.cts",
          "default": "./dist/index.cjs"
        }
      }
    }
  }
  ```
  Con `tsup`: `tsup src/index.ts --format cjs,esm --dts` emite automáticamente los bundles `.js`, `.cjs`, `.d.ts` y `.d.cts`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Publicar solo archivos transpilados a ESM sin declarar extensiones `.d.cts` rompiendo a los consumidores de CommonJS.
  - 🟢 *Green Flag*: Respeta el orden estricto de las claves en `exports` (`types` debe ir primero).

---

### 65. ¿Qué es el flag `preserveValueImports` frente a `verbatimModuleSyntax` y por qué este último es el estándar moderno?
- **Nivel**: Senior
- **Respuesta Técnica**:
  - En versiones anteriores de TS, el flag `importsNotUsedAsValues` y `preserveValueImports` intentaban controlar cómo se eliminaban las importaciones que solo se usaban como tipos.
  - **`verbatimModuleSyntax` (TS 5.0+)**: Deprecó todos los flags anteriores y unificó el modelo:
    - Cualquier `import { Type }` sin la palabra clave `type` se asume que es un valor real y **el compilador garantiza que se emitirá en el JavaScript final**.
    - Cualquier importación que sea puramente un tipo **DEBE escribirse obligatoriamente como `import type { Type }`**, o de lo contrario el compilador emitirá un error.
    - Garantiza predictibilidad absoluta para bundlers rápidos (esbuild, SWC, Vite) que no hacen type checking.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mantener flags obsoletos como `importsNotUsedAsValues: "error"` en configuraciones nuevas de TS 5+.
  - 🟢 *Green Flag*: Activa `verbatimModuleSyntax: true` en bases de código modernas para eliminar discrepancias entre el Checker y el Emitter.

---

### 66. ¿Cómo resolver conflictos de tipado causados por múltiples versiones de la misma librería en `node_modules` (*Duplicate Identifier Errors*)?
- **Nivel**: Senior / Monorepo
- **Respuesta Técnica**:
  Cuando dos dependencias instalan versiones menores diferentes de `@types/react` o `@types/node`, TypeScript intenta evaluar ambos archivos `.d.ts` en el mismo ámbito global, arrojando errores como `Duplicate identifier 'Property'`.
  *Estrategias de Resolución*:
  1. En `tsconfig.json`, especificar explícitamente qué paquetes globales deben incluirse:
     ```json
     { "compilerOptions": { "types": ["node", "vitest"] } }
     ```
  2. En gestores de paquetes modernos (pnpm o Yarn Berry): Usar `overrides` (npm/pnpm) o `resolutions` (Yarn) en `package.json` para forzar una única versión consolidada de la dependencia de tipos en todo el árbol.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `"skipLibCheck": true` como única respuesta sin entender qué causa el conflicto de dependencias duplicadas.
  - 🟢 *Green Flag*: Explica cómo dedupicar dependencias con `pnpm dedupe` o configurar el campo `types` de forma restrictiva.

---

### 67. ¿Cómo optimizar el rendimiento del Type Checker en monorepos descomponiendo proyectos con Project References y `tsbuildinfo`?
- **Nivel**: Staff Engineer / Architecture
- **Respuesta Técnica**:
  En monorepos con cientos de miles de líneas de código, ejecutar `tsc --noEmit` sobre todo el repositorio consume gigabytes de RAM y minutos de espera.
  *Arquitectura de Project References*:
  1. Cada paquete declara su propio `tsconfig.json` con `"composite": true`.
  2. Se habilita `"incremental": true`, lo que genera un archivo binario de metadatos de compilación previa: `tsconfig.tsbuildinfo`.
  3. El compilador se invoca con el flag de construcción: `tsc --build` (`tsc -b`).
  TypeScript detecta qué paquetes no han cambiado en sus fuentes ni en sus definiciones de tipos emitidas (`.d.ts`) y **omite por completo el re-análisis del Type Checker**, reduciendo tiempos de validación de 3 minutos a 2 segundos en builds incrementales.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mantener un único `tsconfig.json` monolítico gigante en la raíz del monorepo que recalcula todo el proyecto en cada cambio.
  - 🟢 *Green Flag*: Diseña una jerarquía de Project References integrada con Turborepo o Nx para caché remota de builds.

---

### 68. ¿Cómo configurar `isolatedModules: true` y qué restricciones de sintaxis impone para permitir transpilación con esbuild/Babel?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Herramientas como SWC, esbuild o Babel transpilan cada archivo de forma individual sin analizar otros archivos.
  El flag `"isolatedModules": true` obliga a TypeScript a reportar errores si se utiliza sintaxis que no puede transpilarse de forma aislada:
  1. **Prohíbe re-exportar tipos sin la palabra clave `type`**:
     `export { User } from './user';` falla si `User` es una interface; debe ser `export type { User }`.
  2. **Prohíbe enums constantes (`const enum`)**: Porque `const enum` requiere evaluar el valor del enum en otro archivo para reemplazarlo inline.
  3. **Exige que todo archivo sea un módulo**: Archivos sin sentencias `import` o `export` deben incluir obligatoriamente `export {}`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `const enum` en librerías que serán consumidas por empaquetadores basados en esbuild/Vite.
  - 🟢 *Green Flag*: Activa siempre `isolatedModules: true` cuando la compilación de producción utiliza herramientas distintas de `tsc`.

---

### 69. ¿Cómo tipar variables globales del runtime de Node.js sin contaminar el tipado de otros paquetes en el monorepo?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Si un archivo de types `globals.d.ts` añade una propiedad a `globalThis` sin encapsulación, puede colisionar con otros paquetes del monorepo que no tienen dicha variable.
  *Patrón seguro*:
  ```typescript
  // src/types/app-globals.ts
  export interface CustomGlobalContext {
    appVersion: string;
    metricsCollector: any;
  }

  declare global {
    var __CONTEXT__: CustomGlobalContext | undefined;
  }

  // Importar explícitamente en el punto de entrada de la aplicación
  ```
  Al incluir al menos un `export {}`, TypeScript trata el archivo como un módulo y no como un script ambiental global, limitando la extensión del ámbito a los proyectos que incluyan dicho archivo en su configuración `include` de `tsconfig.json`.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Crear archivos `.d.ts` sueltos sin `export` que se filtran accidentalmente en todo el monorepo.
  - 🟢 *Green Flag*: Controla la visibilidad de los tipos mediante la propiedad `include` y `files` de `tsconfig.json`.

---

### 70. ¿Cómo funciona la resolución de tipos con `@types` y el campo `typesVersions` de `package.json` para retrocompatibilidad?
- **Nivel**: Senior / Package Maintainer
- **Respuesta Técnica**:
  Cuando una librería de npm utiliza características de TypeScript avanzadas recién introducidas (ej. decoradores Stage 3 de TS 5.0 o template literals de TS 4.1), los consumidores que aún utilicen versiones antiguas de TypeScript fallarán al leer los archivos `.d.ts`.
  El campo **`typesVersions`** en `package.json` permite redirigir al compilador a diferentes definiciones de tipos según la versión de TypeScript del cliente:
  ```json
  {
    "types": "./dist/types/index.d.ts",
    "typesVersions": {
      "<5.0": {
        "*": ["./dist/types/ts4.9/*"]
      }
    }
  }
  ```
  Si el consumidor compila con TypeScript 4.9, el compilador leerá los tipos compatibles generados con utilitarios retrocompatibles; si compila con TypeScript 5+, leerá las definiciones modernas.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Romper compatibilidad con consumidores de versiones anteriores de TypeScript en librerías open-source empresariales.
  - 🟢 *Green Flag*: Utiliza herramientas como `downlevel-dts` junto a `typesVersions` para soportar múltiples versiones del compilador.

---

## 8. Testing de Tipos, TDD de Tipos y Quality Engineering

### 71. ¿Cómo realizar pruebas unitarias sobre el propio sistema de tipos usando librerías como `tsd` o `expect-type`?
- **Nivel**: Senior / Quality Engineering
- **Respuesta Técnica**:
  En bases de código que implementan tipos complejos (ej. clientes de base de datos, DTOs con Zod, o generadores de consultas SQL), las regresiones en los tipos pueden romper la compilación de cientos de archivos sin ser detectadas por pruebas unitarias ordinarias en runtime.
  Se utiliza **`expect-type`** o **`tsd`** para escribir aserciones en tiempo de compilación:
  ```typescript
  import { expectTypeOf } from 'expect-type';
  import { DeepAwaited } from './types';

  test('Pruebas unitarias sobre DeepAwaited', () => {
    // Aserción de que el tipo resuelto sea exactamente string
    expectTypeOf<DeepAwaited<Promise<Promise<string>>>>().toEqualTypeOf<string>();

    // Aserción de no asignabilidad
    expectTypeOf<DeepAwaited<number>>().not.toBeString();

    // Aserción de parámetros de función
    expectTypeOf(myServiceMethod).parameter(0).toEqualTypeOf<{ id: string }>();
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Confiar únicamente en tests en tiempo de ejecución (Jest/Vitest) para validar utilitarios de tipos avanzados.
  - 🟢 *Green Flag*: Integra suites de testing de tipos (`expect-type` o `tsd`) en el pipeline de CI para prevenir regresiones en librerías compartidas.

---

### 72. ¿Cómo asertar errores de compilación esperados en tests de tipos (`@ts-expect-error` vs `@ts-ignore`)?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **`@ts-ignore`**: Silencia cualquier error en la línea siguiente. **Peligro**: Si en el futuro un refactor soluciona el error o cambia la lógica, `@ts-ignore` continuará silenciando la línea sin avisar de que la directiva ya no es necesaria.
  - **`@ts-expect-error`**: Indica explícitamente al compilador que la siguiente línea **DEBE arrojar un error de compilación**.
    - Si la línea arroja un error de tipos: La compilación es exitosa (el test de tipo pasa).
    - Si la línea NO arroja ningún error (ej. porque alguien accidentalmente relajó los tipos a `any`): El compilador falla con el error:
      `error TS2578: Unused '@ts-expect-error' directive`.
  *Uso idiomático en testing*:
  ```typescript
  // Validar que pasar argumentos incorrectos es rechazado por el compilador:
  // @ts-expect-error: No debe permitir pasar un número en lugar de un UserId
  processOrder(12345, 'prod-1');
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `@ts-ignore` en suites de prueba o en código de producción para ocultar errores del compilador.
  - 🟢 *Green Flag*: Utiliza siempre `@ts-expect-error` documentando la razón del fallo esperado.

---

### 73. ¿Cómo configurar Vitest con ESM nativo, aliases de ruta (`tsconfig paths`) y cobertura con `@vitest/coverage-v8`?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Vitest se integra de forma nativa con el motor de Vite y esbuild, leyendo automáticamente los aliases configurados en `tsconfig.json` mediante el plugin `vite-tsconfig-paths`:
  ```typescript
  // vitest.config.ts
  import { defineConfig } from 'vitest/config';
  import tsconfigPaths from 'vite-tsconfig-paths';

  export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      globals: true,
      environment: 'node',
      pool: 'threads', // Worker Threads aislados
      coverage: {
        provider: 'v8', // Cobertura nativa en C++ de V8 (ultra-rápida)
        reporter: ['text', 'json-summary', 'html'],
        thresholds: {
          lines: 80,
          branches: 85,
          functions: 80,
          statements: 80,
        },
      },
    },
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Utilizar herramientas de cobertura pesadas basadas en transpilación AST como Babel-Istanbul cuando V8 provee cobertura nativa en binario.
  - 🟢 *Green Flag*: Configura umbrales estrictos de cobertura sobre ramas (`branches: 85`) y utiliza `pool: 'threads'` para ejecución paralela.

---

### 74. ¿Cómo estructurar pruebas de regresión visual o de snapshots de contratos de tipos TypeScript?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Cuando una librería exporta esquemas OpenAPI, esquemas de GraphQL o interfaces complejas derivadas, se pueden generar snapshots estáticos de las declaraciones emitidas:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { generateDtsContract } from './contract-generator';

  describe('Type Contract Snapshots', () => {
    it('el contrato de tipos emitido debe coincidir exactamente con el snapshot', () => {
      const dtsOutput = generateDtsContract(DomainSchema);
      expect(dtsOutput).toMatchSnapshot();
    });
  });
  ```
  Si un cambio en el código fuente altera silenciosamente una propiedad opcional o cambia un tipo numérico a string, el test de snapshot falla en el PR alertando sobre un potencial *Breaking Change* de contrato.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Modificar firmas de contratos públicos de tipos sin validar el impacto en los clientes de la librería.
  - 🟢 *Green Flag*: Utiliza snapshots de definiciones de tipos exclusivamente para vigilar la estabilidad de contratos públicos.

---

### 75. ¿Cómo implementar pruebas de propiedades (*Property-Based Testing*) complejas con generadores personalizados de `fast-check`?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Para testear algoritmos de negocio complejos (ej. cálculo de impuestos, conversiones de moneda o árboles jerárquicos), se crean **Arbitraries** personalizados que respetan las invariantes del dominio:
  ```typescript
  import fc from 'fast-check';
  import { describe, it } from 'vitest';

  // Generador personalizado de cuentas bancarias válidas
  const accountArbitrary = fc.record({
    id: fc.uuid(),
    balance: fc.integer({ min: 0, max: 1_000_000 }),
    tier: fc.constantFrom('STANDARD', 'PREMIUM', 'VIP'),
  });

  describe('Bank Accounting Invariant', () => {
    it('la suma de los saldos tras una transferencia interna debe conservarse idéntica', () => {
      fc.assert(
        fc.property(accountArbitrary, accountArbitrary, fc.integer({ min: 1, max: 500 }), (from, to, amount) => {
          fc.pre(from.id !== to.id && from.balance >= amount); // Pre-condición válida

          const totalBefore = from.balance + to.balance;
          transferMoney(from, to, amount);
          const totalAfter = from.balance + to.balance;

          return totalBefore === totalAfter;
        }),
        { numRuns: 500 }
      );
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Probar únicamente con 2 o 3 casos manuales fijos en operaciones financieras o de cálculo de saldo.
  - 🟢 *Green Flag*: Aplica pre-condiciones con `fc.pre()` y aprovecha el shrinking automático para encontrar casos de borde extremos.

---

### 76. ¿Cómo ejecutar Mutation Testing en un monorepo TypeScript con Stryker sin degradar los tiempos de ejecución de CI?
- **Nivel**: Staff Engineer / Quality
- **Respuesta Técnica**:
  El Mutation Testing genera cientos de mutantes y puede tardar horas si compila todo el proyecto desde cero para cada mutante.
  *Estrategia de Optimización Extrema con Stryker*:
  1. Utilizar el runner de **Vitest** en lugar de Jest (`@stryker-mutator/vitest-runner`).
  2. Configurar **mutación incremental** (`incremental: true`) para que Stryker guarde los resultados en caché en `.stryker-tmp` y solo evalúe mutantes en archivos modificados en el PR:
     ```javascript
     // stryker.config.mjs
     export default {
       packageManager: 'pnpm',
       testRunner: 'vitest',
       reporters: ['html', 'clear-text', 'progress'],
       coverageAnalysis: 'perTest', // Solo corre los tests que cubren el mutante
       incremental: true,
       mutate: ['src/domain/**/*.ts', '!src/**/*.spec.ts'],
       concurrency: 4, // Paralelizar en 4 workers de CPU
     };
     ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mutar archivos de controladores o configuraciones de infraestructura donde el mutation testing genera ruido sin valor.
  - 🟢 *Green Flag*: Limita la mutación estrictamente a la capa de dominio y casos de uso con análisis de cobertura `perTest`.

---

### 77. ¿Cómo mockear módulos nativos de Node.js (`node:fs/promises`, `node:crypto`) y Worker Threads de forma segura en Vitest?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Al mockear módulos nativos en ESM, `vi.mock()` debe declararse en el nivel superior del archivo antes de las importaciones:
  ```typescript
  import { vi, describe, it, expect, beforeEach } from 'vitest';
  import fs from 'node:fs/promises';
  import { readConfigFile } from './config-reader';

  // Mock automático del módulo nativo
  vi.mock('node:fs/promises');

  describe('ConfigReader Test', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('debe leer el archivo y parsear el JSON correctamente', async () => {
      // Configurar el valor simulado
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ port: 8080 }));

      const config = await readConfigFile('/etc/app/config.json');

      expect(fs.readFile).toHaveBeenCalledWith('/etc/app/config.json', 'utf-8');
      expect(config.port).toBe(8080);
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mutar manualmente propiedades en `process` o prototipos globales sin restaurarlos en `afterEach`.
  - 🟢 *Green Flag*: Utiliza `vi.mocked()` para obtener inferencia de tipos estricta sobre las funciones mockeadas.

---

### 78. ¿Cómo probar fugas de memoria (*Memory Leak Testing*) en suites de test de TypeScript midiendo el Heap antes y después?
- **Nivel**: Staff Engineer / Reliability
- **Respuesta Técnica**:
  Para prevenir regresiones de memoria en pipelines de CI:
  ```typescript
  import { describe, it, expect } from 'vitest';

  function triggerGarbageCollection() {
    if (global.gc) {
      global.gc();
    } else {
      console.warn('Ejecutar vitest con flag node --expose-gc para forzar recolección');
    }
  }

  describe('Memory Leak Regression Test', () => {
    it('no debe retener memoria tras procesar y descartar 100,000 eventos', async () => {
      triggerGarbageCollection();
      const initialMemory = process.memoryUsage().heapUsed;

      // Ejecutar operación pesada
      const emitter = new EventHub();
      for (let i = 0; i < 100_000; i++) {
        emitter.emitAndDispose({ data: 'payload' });
      }

      triggerGarbageCollection();
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryDiffMB = (finalMemory - initialMemory) / (1024 * 1024);
      // El incremento no debe superar 5MB de memoria residual
      expect(memoryDiffMB).toBeLessThan(5);
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar medir fugas de memoria sin forzar la recolección de basura con `global.gc()`.
  - 🟢 *Green Flag*: Configura `node --expose-gc` en los scripts de CI para asertar límites máximos de memoria retenida.

---

### 79. ¿Cómo implementar pruebas de contrato de microservicios con Pact en TypeScript asegurando tipado estricto?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Pact permite escribir contratos de consumo tipados en TypeScript:
  ```typescript
  import { PactV3, MatchersV3 } from '@pact-foundation/pact';
  import { describe, it, expect } from 'vitest';

  const provider = new PactV3({
    consumer: 'OrderService',
    provider: 'UserService',
  });

  describe('Pact Consumer Test', () => {
    it('debe validar el contrato para obtener perfil de usuario', async () => {
      provider
        .given('existe un usuario con id usr-123')
        .uponReceiving('una petición GET para obtener el usuario')
        .withRequest({
          method: 'GET',
          path: '/users/usr-123',
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: 'usr-123',
            email: MatchersV3.email('alex@empresa.com'),
            role: MatchersV3.string('ADMIN'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const client = new UserApiClient(mockServer.url);
        const user = await client.getUser('usr-123');
        expect(user.id).toBe('usr-123');
      });
    });
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar valores duros fijos en lugar de los adaptadores de coincidencia (`MatchersV3.email`, `MatchersV3.like`).
  - 🟢 *Green Flag*: Integra la generación automática del archivo de contrato con el broker de Pact en el pipeline de CI.

---

### 80. ¿Cómo estructurar una suite de pruebas End-to-End con Playwright para flujos críticos en TypeScript?
- **Nivel**: Senior
- **Respuesta Técnica**:
  En Playwright con TypeScript, se aplica el patrón **Page Object Model (POM)**:
  ```typescript
  // pages/checkout.page.ts
  import { Page, Locator } from '@playwright/test';

  export class CheckoutPage {
    readonly payButton: Locator;
    readonly totalText: Locator;

    constructor(private readonly page: Page) {
      this.payButton = page.getByRole('button', { name: 'Pagar Ahora' });
      this.totalText = page.getByTestId('order-total');
    }

    async submitPayment() {
      await this.payButton.click();
    }
  }

  // tests/checkout.spec.ts
  import { test, expect } from '@playwright/test';
  import { CheckoutPage } from './pages/checkout.page';

  test('debe procesar el pago correctamente', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await page.goto('/checkout/123');
    await expect(checkout.totalText).toHaveText('$150.00');
    await checkout.submitPayment();
    await expect(page).toHaveURL('/order/success');
  });
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar selectores CSS frágiles (`div > div.btn-blue`) en lugar de selectores de accesibilidad semántica (`getByRole`, `getByTestId`).
  - 🟢 *Green Flag*: Aplica Page Object Model desacoplando los localizadores de la intención del test.

---

## 9. Patrones de Diseño Tipados, Inversión de Control y Domain Modeling

### 81. ¿Cómo implementar el patrón Result / Either (`type Result<T, E>`) para manejo de errores funcional sin excepciones descontroladas?
- **Nivel**: Senior / Architecture
- **Respuesta Técnica**:
  Lanzar excepciones (`throw new Error()`) rompe el flujo de control y no queda documentado en la firma de tipos de TypeScript (`Promise<User>` no dice qué errores puede arrojar).
  El patrón **Result (Either)** modela el éxito o el fallo como un valor retornado explícito con *Discriminated Union*:
  ```typescript
  export type Result<T, E> =
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: E };

  export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
  export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

  // En el servicio de dominio:
  type TransferError = 'INSUFFICIENT_FUNDS' | 'ACCOUNT_LOCKED';

  export function transfer(amount: number, balance: number): Result<number, TransferError> {
    if (amount > balance) return Err('INSUFFICIENT_FUNDS');
    return Ok(balance - amount);
  }

  // En el llamador:
  const res = transfer(100, 50);
  if (res.ok) {
    console.log('Nuevo saldo:', res.value); // TS estrecha a { ok: true, value: number }
  } else {
    console.error('Error de negocio:', res.error); // TS sabe que error es TransferError
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `throw` para errores esperados de negocio (ej. fondos insuficientes o usuario no encontrado).
  - 🟢 *Green Flag*: Explica cómo el tipo `Result` fuerza al consumidor a manejar explícitamente el caso de error antes de poder acceder al valor exitoso.

---

### 82. ¿Cómo implementar el patrón Builder tipado con Type-Safe Staging que prohíba invocar `.build()` hasta completar los campos requeridos?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Mediante **Type-Safe Builder (Phantom Types / State Staging)**:
  ```typescript
  interface HttpRequestConfig {
    url: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
  }

  class RequestBuilder<HasUrl extends boolean = false, HasMethod extends boolean = false> {
    private config: Partial<HttpRequestConfig> = { headers: {} };

    setUrl(url: string): RequestBuilder<true, HasMethod> {
      this.config.url = url;
      return this as any;
    }

    setMethod(method: 'GET' | 'POST'): RequestBuilder<HasUrl, true> {
      this.config.method = method;
      return this as any;
    }

    setHeader(key: string, value: string): this {
      this.config.headers![key] = value;
      return this;
    }

    // Solo se puede invocar si HasUrl y HasMethod son estrictamente TRUE:
    build(this: RequestBuilder<true, true>): HttpRequestConfig {
      return this.config as HttpRequestConfig;
    }
  }

  // Uso:
  const builder = new RequestBuilder();
  // builder.build(); // ERROR DE COMPILACIÓN: 'this' no es asignable a RequestBuilder<true, true>
  const request = builder.setUrl('https://api.com').setMethod('POST').build(); // Válido
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Dejar que el método `.build()` lance excepciones de validación en tiempo de ejecución por propiedades faltantes.
  - 🟢 *Green Flag*: Utiliza el tipado de `this` en el método `build()` para garantizar la completitud del objeto estáticamente.

---

### 83. ¿Cómo implementar el patrón Strategy tipado garantizando que cada estrategia declare sus tipos de entrada y salida?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Para soportar múltiples algoritmos intercambiables (ej. cálculo de comisiones por país o procesadores de pago):
  ```typescript
  export interface PaymentPayloadMap {
    CREDIT_CARD: { pan: string; cvv: string; expMonth: number };
    CRYPTO: { walletAddress: string; network: 'ETH' | 'BTC' };
    BANK_TRANSFER: { iban: string };
  }

  export interface PaymentStrategy<K extends keyof PaymentPayloadMap> {
    readonly type: K;
    process(payload: PaymentPayloadMap[K]): Promise<{ transactionId: string }>;
  }

  export class PaymentContext {
    private strategies = new Map<string, PaymentStrategy<any>>();

    register<K extends keyof PaymentPayloadMap>(strategy: PaymentStrategy<K>) {
      this.strategies.set(strategy.type, strategy);
    }

    execute<K extends keyof PaymentPayloadMap>(
      type: K,
      payload: PaymentPayloadMap[K]
    ): Promise<{ transactionId: string }> {
      const strategy = this.strategies.get(type);
      if (!strategy) throw new Error(`Estrategia no registrada: ${type}`);
      return strategy.process(payload);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `payload: any` en la interfaz de la estrategia perdiendo la verificación de tipos del argumento específico.
  - 🟢 *Green Flag*: Vincula las estrategias mediante un mapa indexado genérico garantizando correspondencia estricta entre el tipo y su payload.

---

### 84. ¿Cómo modelar Value Objects inmutables con validación de invariantes en el constructor y branded types?
- **Nivel**: Senior / DDD
- **Respuesta Técnica**:
  En Domain-Driven Design (DDD), un **Value Object** no tiene identidad y es completamente inmutable:
  ```typescript
  export class Email {
    private readonly _value: string;

    constructor(rawEmail: string) {
      const sanitized = rawEmail.trim().toLowerCase();
      if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(sanitized)) {
        throw new Error(`Formato de email inválido: ${rawEmail}`);
      }
      this._value = sanitized;
      Object.freeze(this); // Inmutabilidad física en runtime
    }

    get value(): string {
      return this._value;
    }

    equals(other?: Email): boolean {
      if (!other) return false;
      return this._value === other._value;
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Permitir que un Email se instancie con cadenas arbitrarias vacías o corruptas sin validar en el constructor.
  - 🟢 *Green Flag*: Aplica inmutabilidad con `Object.freeze` y provee métodos de comparación de igualdad por valor (`equals`).

---

### 85. ¿Cómo implementar Event Sourcing tipado en TypeScript donde cada evento define su payload y el reductor es exhaustivo?
- **Nivel**: Staff Engineer / Architecture
- **Respuesta Técnica**:
  En **Event Sourcing**, el estado de la entidad no se almacena directamente; se reconstruye aplicando secuencialmente un log inmutable de eventos pasados:
  ```typescript
  export type BankAccountEvent =
    | { type: 'ACCOUNT_OPENED'; accountId: string; initialDeposit: number }
    | { type: 'MONEY_DEPOSITED'; amount: number }
    | { type: 'MONEY_WITHDRAWN'; amount: number };

  interface BankAccountState {
    id: string;
    balance: number;
  }

  export function accountReducer(state: BankAccountState, event: BankAccountEvent): BankAccountState {
    switch (event.type) {
      case 'ACCOUNT_OPENED':
        return { id: event.accountId, balance: event.initialDeposit };
      case 'MONEY_DEPOSITED':
        return { ...state, balance: state.balance + event.amount };
      case 'MONEY_WITHDRAWN':
        return { ...state, balance: state.balance - event.amount };
      default:
        const _exhaustive: never = event;
        return _exhaustive;
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Mutar el objeto de estado directamente en lugar de devolver una nueva copia inmutable en el reductor.
  - 🟢 *Green Flag*: Utiliza exhaustiveness checking con `never` para que añadir un nuevo evento obligue a actualizar el reductor.

---

### 86. ¿Cómo tipar de forma segura un bus de eventos pub/sub desacoplado con mapa de tópicos y payloads tipados?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Para erradicar cadenas de texto mágicas y payloads de tipo `any` en EventEmitters:
  ```typescript
  interface AppEventMap {
    'user:registered': { userId: string; email: string };
    'order:shipped': { orderId: string; trackingCode: string };
    'payment:failed': { orderId: string; reason: string };
  }

  export class TypedEventEmitter {
    private listeners = new Map<keyof AppEventMap, Set<(payload: any) => void>>();

    on<K extends keyof AppEventMap>(event: K, listener: (payload: AppEventMap[K]) => void): void {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event)!.add(listener);
    }

    emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
      this.listeners.get(event)?.forEach((fn) => fn(payload));
    }
  }

  const bus = new TypedEventEmitter();
  bus.on('user:registered', (data) => console.log(data.email)); // data tipado automáticamente
  // bus.emit('user:registered', { userId: '123' }); // ERROR DE COMPILACIÓN: falta 'email'
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar `EventEmitter` nativo de Node sin tipar los nombres de eventos ni los argumentos de los listeners.
  - 🟢 *Green Flag*: Restringe los eventos y sus payloads mediante interfaces clave-valor genéricas y autocompletadas.

---

### 87. ¿Cómo implementar Inversión de Control (IoC) ligera puramente tipada usando Symbols de TypeScript como tokens de inyección?
- **Nivel**: Senior
- **Respuesta Técnica**:
  Las interfaces de TypeScript no existen en tiempo de ejecución. Para registrar dependencias contra interfaces sin acoplarse a clases concretas, se utilizan **Symbols únicos**:
  ```typescript
  export interface ILogger {
    log(msg: string): void;
  }

  export const TOKENS = {
    ILogger: Symbol('ILogger'),
    IUserRepository: Symbol('IUserRepository'),
  };

  export class TinyContainer {
    private bindings = new Map<symbol, any>();

    bind<T>(token: symbol, instance: T): void {
      this.bindings.set(token, instance);
    }

    resolve<T>(token: symbol): T {
      const instance = this.bindings.get(token);
      if (!instance) throw new Error(`Token no registrado: ${token.toString()}`);
      return instance as T;
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Usar cadenas de texto sueltas como `'Logger'` propensas a colisiones de nombres o errores tipográficos.
  - 🟢 *Green Flag*: Utiliza `Symbol()` para garantizar unicidad absoluta en las claves del contenedor de dependencias.

---

### 88. ¿Cómo evitar el antipatrón de *Primitive Obsession* modelando identificadores, correos y monedas como tipos de dominio opacos?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  El antipatrón **Primitive Obsession** consiste en usar primitivos planos (`string`, `number`) para todo:
  `function createOrder(userId: string, productId: string, price: number)`.
  Un desarrollador puede pasar accidentalmente `productId` donde se espera `userId` y el compilador lo aceptará silenciosamente.
  *Modelado con Tipos Opacos / Branded Types*:
  ```typescript
  declare const BrandSymbol: unique symbol;
  type Brand<K, T> = K & { readonly [BrandSymbol]: T };

  export type UserId = Brand<string, 'UserId'>;
  export type ProductId = Brand<string, 'ProductId'>;
  export type MoneyCents = Brand<number, 'MoneyCents'>;

  function createOrder(user: UserId, product: ProductId, price: MoneyCents) { /* ... */ }

  // createOrder(prodId, uId, 50); // ERROR DE COMPILACIÓN: Tipos incompatibles
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Permitir que identificadores de diferentes entidades sean intercambiables sin error de compilación.
  - 🟢 *Green Flag*: Aplica Branded Types y Smart Constructors para encapsular validaciones y garantizar corrección estática.

---

### 89. ¿Cómo modelar estructuras de datos recursivas complejas (árboles, grafos dirigidos) con tipos de TypeScript inmutables?
- **Nivel**: Senior
- **Respuesta Técnica**:
  TypeScript soporta tipos recursivos para estructuras en árbol (como sistemas de archivos o menús jerárquicos):
  ```typescript
  export interface TreeNode<T> {
    readonly id: string;
    readonly value: T;
    readonly children?: readonly TreeNode<T>[];
  }

  // Operación inmutable recursiva para buscar un nodo
  export function findNode<T>(root: TreeNode<T>, predicate: (val: T) => boolean): TreeNode<T> | null {
    if (predicate(root.value)) return root;
    if (!root.children) return null;

    for (const child of root.children) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
    return null;
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Permitir arrays mutables en árboles que pueden ser corrompidos durante recorridos transversales.
  - 🟢 *Green Flag*: Utiliza modificadores `readonly` en nodos y arrays de hijos garantizando inmutabilidad estructural.

---

### 90. ¿Cómo implementar el patrón Repository genérico en TypeScript (`IRepository<T, ID>`) respetando el principio Liskov Substitution?
- **Nivel**: Senior / Architecture
- **Respuesta Técnica**:
  El principio de sustitución de Liskov (LSP) exige que las implementaciones de infraestructura (Postgres, Mongo, In-Memory) puedan sustituir a la interfaz de dominio sin alterar la corrección del programa:
  ```typescript
  export interface IRepository<T, ID> {
    findById(id: ID): Promise<T | null>;
    findAll(): Promise<readonly T[]>;
    save(entity: T): Promise<T>;
    delete(id: ID): Promise<void>;
  }

  // Implementación de Dominio Puro en Memoria (Fake para testing)
  export class InMemoryRepository<T extends { id: ID }, ID> implements IRepository<T, ID> {
    protected entities = new Map<ID, T>();

    async findById(id: ID): Promise<T | null> {
      return this.entities.get(id) || null;
    }

    async findAll(): Promise<readonly T[]> {
      return [...this.entities.values()];
    }

    async save(entity: T): Promise<T> {
      this.entities.set(entity.id, entity);
      return entity;
    }

    async delete(id: ID): Promise<void> {
      this.entities.delete(id);
    }
  }
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Hacer que la interfaz del repositorio exponga métodos propietarios de un ORM específico (ej. `findWithQueryBuilder` de TypeORM).
  - 🟢 *Green Flag*: Mantiene el contrato agnóstico a la tecnología de base de datos permitiendo sustitución limpia en tests.

---

## 10. ECMAScript Moderno, Runtimes Alternativos y Tooling

### 91. ¿Cómo funcionan las características modernas de ECMAScript: `Promise.withResolvers()`, `Object.groupBy()`, `Array.prototype.toSorted()`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **`Promise.withResolvers()` (ES2024)**: Devuelve una promesa junto con sus funciones `resolve` y `reject` accesibles externamente sin callbacks anidados:
    ```javascript
    const { promise, resolve, reject } = Promise.withResolvers();
    eventEmitter.once('success', resolve);
    eventEmitter.once('error', reject);
    await promise;
    ```
  - **`Object.groupBy()` (ES2024)**: Agrupa elementos de un iterable por clave sin necesidad de Lodash o `reduce`:
    ```javascript
    const inventory = [{ type: 'meat', name: 'beef' }, { type: 'fruit', name: 'apple' }];
    const grouped = Object.groupBy(inventory, (x) => x.type);
    // { meat: [...], fruit: [...] }
    ```
  - **Change Array by Copy (ES2023)**: `toSorted()`, `toReversed()`, `toSpliced()` devuelven una nueva copia del array sin mutar el original:
    ```javascript
    const numbers = [3, 1, 2];
    const sorted = numbers.toSorted(); // [1, 2, 3] (numbers sigue siendo [3, 1, 2])
    ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Continuar mutando arrays en producción con `.sort()` generando efectos colaterales inesperados.
  - 🟢 *Green Flag*: Demuestra dominio de las últimas incorporaciones estándar de ECMAScript soportadas en Node.js 22+.

---

### 92. ¿Qué es `AsyncContext` (propuesta de TC39) y cómo estandariza lo que hoy hace `AsyncLocalStorage` en Node.js?
- **Nivel**: Staff Engineer
- **Respuesta Técnica**:
  Actualmente, la propagación de contexto asíncrono (`AsyncLocalStorage`) es una API propietaria del runtime de Node.js.
  **AsyncContext (Propuesta de TC39)** es la especificación estándar para llevar este mecanismo a todo el ecosistema de JavaScript (navegadores, Deno, Bun, Cloudflare Workers, Node.js):
  - Introduce dos clases principales: `AsyncContext.Variable` (almacenamiento) y `AsyncContext.Snapshot` (captura y restauración manual de contexto).
  - Permite que herramientas de telemetría (OpenTelemetry) funcionen de forma 100% idéntica en frontend y backend sin depender de bindings nativos de Node.js.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Desconocer los esfuerzos de estandarización en TC39 para la propagación de contexto en el Event Loop.
  - 🟢 *Green Flag*: Explica cómo `AsyncContext` unificará el tracing y manejo de transacciones en todas las plataformas web.

---

### 93. ¿Cómo funciona la propuesta de tipos inmutables `Record` y `Tuple` de TC39 y su impacto en JavaScript?
- **Nivel**: Senior / Staff
- **Respuesta Técnica**:
  Actualmente, los objetos y arrays en JavaScript se comparan por referencia (`{} !== {}`).
  La propuesta de **Record & Tuple** introduce dos nuevos tipos de primitivos inmutables:
  - **Tuple**: `#[1, 2, 3]` (Array inmutable por valor).
  - **Record**: `#{ a: 1, b: 2 }` (Objeto inmutable por valor).
  *Propiedades Revolucionarias*:
  1. **Comparación por Valor**: `#{ a: 1 } === #{ a: 1 }` es estrictamente **true**.
  2. Pueden utilizarse directamente como claves en un `Map` o elementos en un `Set` sin colisiones de referencia.
  3. Cero mutaciones accidentales: son inherentemente de solo lectura por especificación del motor V8.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Confundir la propuesta `Record & Tuple` de JavaScript con el utility type `Record<K, V>` de TypeScript.
  - 🟢 *Green Flag*: Explica el impacto en algoritmos de memorización y reactividad de estado en frameworks modernos.

---

### 94. ¿Cómo interactúa TypeScript con runtimes alternativos modernos como Deno y Bun frente a Node.js?
- **Nivel**: Senior / Architecture
- **Respuesta Técnica**:
  - **Node.js**: Históricamente requería transpilación previa (`tsc`, `tsx`, `ts-node`). En Node.js 22.6+ introdujo soporte experimental para remover tipos (`--experimental-strip-types`).
  - **Deno**: Soporte nativo para TypeScript de serie. Utiliza el compilador oficial de TypeScript y caché en disco. Admite URLs directas en importaciones y aplica seguridad restrictiva por flags.
  - **Bun**: Escrito en Zig sobre JavaScriptCore (motor de Safari). Transpila TypeScript internamente a la velocidad de la luz mediante su propio parser nativo. Ejecuta archivos `.ts` y `.tsx` directamente sin configuración ni flags.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Afirmar que Deno o Bun realizan type-checking estricto en tiempo de ejecución (ningún runtime valida tipos en tiempo de ejecución; solo eliminan la sintaxis de tipos).
  - 🟢 *Green Flag*: Explica que el Type Checking sigue requiriendo `tsc --noEmit` independientemente del runtime de ejecución.

---

### 95. ¿Qué es el flag nativo de Node.js `--experimental-strip-types` (Node.js 22.6+) y cómo permite ejecutar `.ts` sin transpiladores?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Desde Node.js 22.6.0, Node.js incluye soporte experimental nativo para ejecutar archivos TypeScript directamente sin necesidad de `tsx`, `ts-node` ni transpilación previa a `.js`:
  ```bash
  node --experimental-strip-types app.ts
  ```
  *Cómo opera internamente*:
  - Utiliza el transpilador rápido **Amphora/SWC** embebido en C++ para reemplazar las anotaciones de tipos por espacios en blanco (*Type Stripping*) antes de pasar el código a V8.
  - **Limitación**: Solo soporta sintaxis de tipos estándar de TypeScript que se evapora puramente; **no soporta características que emiten código en runtime como `enum`, namespaces o decoradores legacy**.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Intentar usar `--experimental-strip-types` con proyectos NestJS que dependen de `experimentalDecorators` y `emitDecoratorMetadata`.
  - 🟢 *Green Flag*: Identifica esta característica como el camino hacia la adopción de Types-as-Comments en el runtime oficial de Node.js.

---

### 96. ¿Cómo funciona el linter y formateador ultrarrápido Biome (en Rust) frente a ESLint y Prettier en proyectos TypeScript?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  - **ESLint + Prettier tradicional**:
    - Dos herramientas separadas que frecuentemente colisionan en reglas de formato.
    - Escritas en JavaScript; analizan el AST de TypeScript dos veces de forma redundante.
    - Lentas en bases de código grandes (> 10,000 archivos).
  - **Biome (Fork de Rome, escrito en Rust)**:
    - Unifica Linter y Formatter en un único binario nativo.
    - Procesa miles de archivos en menos de 50 milisegundos (hasta 30x más rápido que ESLint/Prettier).
    - Soporte de primera clase para TypeScript, JSX y JSON.
    - Cero configuración de plugins complejos de npm.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: No conocer alternativas modernas de herramientas en binario nativo para acelerar pipelines de CI.
  - 🟢 *Green Flag*: Valida que Biome es ideal para proyectos nuevos pero reconoce que ESLint sigue dominando en proyectos que dependen de plugins propietarios muy especializados.

---

### 97. ¿Cómo optimizar el tree-shaking en librerías TypeScript mediante `"sideEffects": false` en `package.json`?
- **Nivel**: Senior / Performance
- **Respuesta Técnica**:
  Los empaquetadores (Webpack, Rollup, Vite) intentan eliminar código no utilizado (*Dead Code Elimination*). Sin embargo, si un archivo importado contiene efectos colaterales a nivel de módulo (ej. muta un prototipo global o ejecuta `console.log`), el bundler **no puede eliminarlo** aunque ninguna de sus funciones exportadas sea utilizada.
  Al declarar en `package.json`:
  ```json
  {
    "sideEffects": false
  }
  ```
  Le garantizas al empaquetador que ningún archivo de la librería produce efectos colaterales al ser importado, permitiéndole eliminar agresivamente todos los módulos no referenciados, reduciendo el tamaño del bundle hasta en un 60%.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Declarar `sideEffects: false` cuando la librería importa archivos CSS o polyfills globales (hace que el bundler los elimine silenciosamente).
  - 🟢 *Green Flag*: Configura un array de excepciones: `"sideEffects": ["*.css", "./src/polyfills.ts"]`.

---

### 98. ¿Cómo depurar código TypeScript en producción utilizando Source Maps precisos (`--enable-source-maps`) y Sentry?
- **Nivel**: Senior / DevOps
- **Respuesta Técnica**:
  En producción, Node.js ejecuta código JavaScript compilado y minificado; los stack traces de error muestran números de línea que no coinciden con el código TypeScript original.
  *Configuración de Producción*:
  1. En `tsconfig.json`: `"sourceMap": true`.
  2. Al ejecutar Node.js: `node --enable-source-maps dist/server.js`.
     (Node.js traduce automáticamente las líneas de error en consola hacia el archivo `.ts` y la línea original en tiempo real con overhead mínimo).
  3. En herramientas de observabilidad como **Sentry**:
     - Se suben los archivos `.js.map` a Sentry durante el pipeline de CI/CD mediante el CLI oficial.
     - Se eliminan los archivos `.map` del contenedor final de producción para no exponer el código fuente a usuarios externos.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Publicar archivos `.map` en el servidor web público permitiendo que cualquiera descargue el código TypeScript original.
  - 🟢 *Green Flag*: Sube los source maps a Sentry durante el build de CI y los purga del contenedor Docker final.

---

### 99. ¿Cómo implementar esquemas de configuración fuertemente tipados con variables de entorno usando `zod` o `env-schema`?
- **Nivel**: Mid-Level / Senior
- **Respuesta Técnica**:
  Depender de `process.env.PORT` sin validación produce errores en runtime cuando faltan variables requeridas o son de tipo erróneo (un string en lugar de un número).
  *Validación Fail-Fast en el arranque con Zod*:
  ```typescript
  import { z } from 'zod';

  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida de PostgreSQL'),
    JWT_SECRET: z.string().min(32, 'El secreto JWT debe tener al menos 32 caracteres'),
  });

  const parseResult = envSchema.safeParse(process.env);

  if (!parseResult.success) {
    console.error('❌ Variables de entorno inválidas o faltantes:', parseResult.error.format());
    process.exit(1); // Abortar inmediatamente antes de arrancar la app
  }

  export const env = parseResult.data;
  // env.PORT está tipado estrictamente como number; env.DATABASE_URL como string
  ```
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Acceder a `process.env` disperso por todo el código sin validación centralizada en el arranque.
  - 🟢 *Green Flag*: Utiliza `z.coerce` para parsear números y aborta el proceso inmediatamente ante configuraciones inválidas.

---

### 100. ¿Cuál es el futuro del sistema de tipos de TypeScript ante la propuesta oficial de *Type Annotations as Comments* en ECMAScript?
- **Nivel**: Staff Engineer / Thought Leadership
- **Respuesta Técnica**:
  La propuesta de **Type Annotations (Stage 1 en TC39)** busca que los motores de JavaScript nativos (V8, JavaScriptCore, SpiderMonkey) reconozcan la sintaxis de tipos de TypeScript como **espacios en blanco ignorados (comentarios)**:
  - Permitirá que cualquier navegador o runtime ejecute código con sintaxis de tipos directamente sin necesidad de ningún paso de compilación o transpilación.
  - **Consecuencia para TypeScript**:
    - Características de TypeScript que generan código en tiempo de ejecución (como `enum`, namespaces o constructores con modificadores de acceso `constructor(public x: number)`) no formarán parte del estándar y quedarán en desuso.
    - TypeScript se enfocará exclusivamente en el **análisis estático de tipos (Type Checking)**, dejando la ejecución directamente al runtime nativo de JavaScript.
- **Criterio de Evaluación**:
  - 🚩 *Red Flag*: Creer que TC39 añadirá validación de tipos estáticos en tiempo de ejecución a los motores de JavaScript.
  - 🟢 *Green Flag*: Explica con lucidez la transición de TypeScript hacia una sintaxis puramente compatible con tipos como comentarios sin artefactos en runtime.
