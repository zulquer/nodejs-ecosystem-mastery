/**
 * ============================================================================
 * LAB SENIOR: Type Gymnastics (Branded Types, infer, Template Literals & satisfies)
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR / STAFF:
 * 1. Dominar Branded / Nominal Types para evitar mezclar IDs de dominio en tiempo de compilación.
 * 2. Usar Conditional Types con `infer` para desempaquetar tipos complejos (Promises, funciones).
 * 3. Crear Template Literal Types para generar contratos de permisos y eventos estrictos.
 * 4. Entender el operador `satisfies` (TypeScript 4.9+) para validar estructuras sin perder el tipo literal exacto.
 * ============================================================================
 */

import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB SENIOR: TypeScript Gymnastics & Type-Level Metaprogramming'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// ----------------------------------------------------------------------------
// 1. BRANDED / NOMINAL TYPES (Seguridad Absoluta en Domain-Driven Design)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 1. Branded Types (Tipado Nominal en un Sistema Estructural) ---'));

// Técnica Senior: Inyectar un símbolo/brand fantasma en tiempo de compilación (cero coste en runtime)
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

// Función que requiere específicamente un UserId
function chargeUserAccount(userId: UserId, orderId: OrderId, amount: number) {
  console.log(`  💳 Cobrando $${amount} al usuario [${userId}] para la orden [${orderId}]`);
}

const userAlice = createUserId('usr_9942');
const order101 = createOrderId('ord_5511');

chargeUserAccount(userAlice, order101, 150);

// 🚨 EL COMPILADOR BLOQUEA ESTO SI INVIERTES EL ORDEN:
// chargeUserAccount(order101, userAlice, 150);
// Error TS: Argument of type 'OrderId' is not assignable to parameter of type 'UserId'
console.log(styleText('green', '  ✅ El compilador impide mezclar UserId con OrderId aunque ambos sean strings en runtime.\n'));

// ----------------------------------------------------------------------------
// 2. CONDITIONAL TYPES & INFER (Desempaquetar Tipos)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 2. Conditional Types con "infer" (Desempaquetar Promesas y Handlers) ---'));

// Implementación manual de Awaited recursivo con infer
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

// Extracción de tipos de eventos con infer
type Action<TType extends string, TPayload> = { type: TType; payload: TPayload };

type ExtractPayload<T> = T extends Action<string, infer P> ? P : never;

type LoginAction = Action<'AUTH_LOGIN', { username: string; token: string }>;
type UserPayload = ExtractPayload<LoginAction>;

// Verificamos en tiempo de ejecución
const testPayload: UserPayload = { username: 'marco_dev', token: 'jwt_abc_123' };
console.log(styleText('white', `  • Payload inferido con éxito: usuario "${testPayload.username}"`));
console.log(styleText('green', '  ✅ La palabra clave `infer` deduce variables de tipos dentro de una condición.\n'));

// ----------------------------------------------------------------------------
// 3. TEMPLATE LITERAL TYPES (Generación Combinatoria de Tipos)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 3. Template Literal Types (Álgebra de Cadenas en Tipos) ---'));

type Domain = 'user' | 'billing' | 'inventory';
type Operation = 'create' | 'read' | 'update' | 'delete';

// TypeScript genera automáticamente las 12 combinaciones posibles:
type RBACPermission = `${Domain}:${Operation}`;

const validPermission: RBACPermission = 'billing:update';
console.log(`  • Permiso tipado estrictamente: "${validPermission}"`);
// const invalid: RBACPermission = 'billing:hack'; // ❌ Error de compilación!
console.log(styleText('green', '  ✅ Template Literals generan 12 permisos exactos en tiempo de compilación.\n'));

// ----------------------------------------------------------------------------
// 4. EL OPERADOR "satisfies" (TypeScript 4.9+)
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- 4. El Operador "satisfies" vs Type Annotations ---'));

type RouteConfig = {
  path: string;
  method: 'GET' | 'POST' | 'PUT';
  timeoutMs?: number;
};

// ❌ ENFOQUE TRADICIONAL CON ANOTACIÓN:
// const routes: Record<string, RouteConfig> = { ... }
// Problema: Al usar Record<string, ...>, perdemos el autocompletado de las claves exactas!

// ✅ ENFOQUE SENIOR CON satisfies:
// Valida que el objeto cumple RouteConfig, PERO conserva los tipos literales exactos de cada propiedad!
const apiRoutes = {
  getUser: { path: '/users/:id', method: 'GET', timeoutMs: 3000 },
  createOrder: { path: '/orders', method: 'POST' }
} satisfies Record<string, RouteConfig>;

// TypeScript SABE que apiRoutes.getUser.timeoutMs existe y es number (no number | undefined)
console.log(`  • Timeout exacto inferido para getUser: ${apiRoutes.getUser.timeoutMs}ms`);
console.log(`  • Método inferido para createOrder:     ${apiRoutes.createOrder.method}`);
console.log(styleText('green', '  ✅ `satisfies` valida la estructura sin borrar la especificidad del tipo inferido.\n'));

console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR EN TYPESCRIPT:'));
console.log(styleText('white', '  1. Los Branded Types evitan errores catastróficos en producción (pasar un ID de producto en lugar de cliente).'));
console.log(styleText('white', '  2. `infer` permite crear librerías con APIs fluidas y auto-inferidas (estilo tRPC o Zod).'));
console.log(styleText('white', '  3. Usa `satisfies` siempre que configures diccionarios o configs estáticas para no degradar el autocompletado.\n'));
