# 🧪 Testing Level 02: Taxonomía de Dobles de Prueba y Mocking

La taxonomía rigurosa de dobles de prueba (*Test Doubles* de Gerard Meszaros), intercepción de red con MSW y control determinista del tiempo.

---

## 🎭 1. Los 5 Tipos de Dobles de Prueba (*Test Doubles*)

Un error frecuente en entrevistas y equipos es llamar "mock" a cualquier objeto simulado:

```
                      ┌──────────────────────┐
                      │     Test Double      │
                      └──────────┬───────────┘
         ┌──────────────┬────────┼──────────────┬──────────────┐
         ▼              ▼        ▼              ▼              ▼
    [ Dummy ]       [ Stub ]  [ Spy ]       [ Mock ]       [ Fake ]
```

1. **Dummy (Maniquí)**:
   - Objetos que se pasan simplemente para llenar la lista de parámetros obligatorios, pero que nunca son invocados ni evaluados:
   ```typescript
   const dummyLogger = { info: () => {}, error: () => {} };
   const service = new PaymentService(dummyLogger);
   ```
2. **Stub (Respuesta Enlatada)**:
   - Proporciona respuestas prefabricadas a llamadas realizadas durante la prueba. No le importa cuántas veces es llamado ni con qué argumentos exactos:
   ```typescript
   const userStub = { findById: async () => ({ id: 1, name: 'Alice' }) };
   ```
3. **Spy (Espía)**:
   - Envuelve una función real o un stub para registrar telemetría sobre cómo fue invocado: número de llamadas, argumentos pasados y valores retornados:
   ```typescript
   const sendEmailSpy = vi.spyOn(mailer, 'sendEmail');
   await service.registerUser('alice@test.com');
   expect(sendEmailSpy).toHaveBeenCalledWith('alice@test.com');
   ```
4. **Mock (Objeto con Expectativas Estrictas)**:
   - Objeto pre-programado con expectativas de interacción que forman parte del criterio de aceptación de la prueba. Si no se llama de la forma esperada, la prueba falla.
5. **Fake (Implementación Funcional Ligera)**:
   - **El favorito de los ingenieros Senior**. Es una implementación 100% funcional que toma atajos para no ser apta para producción (ej. una base de datos en memoria con un `Map<string, User>`):
   ```typescript
   export class InMemoryUserRepository implements UserRepository {
     private users = new Map<string, User>();
     async save(user: User) { this.users.set(user.id, user); }
     async findById(id: string) { return this.users.get(id) ?? null; }
   }
   ```
   *Ventaja*: Cero fragilidad ante refactorizaciones, sin necesidad de configurar decenas de `.mockResolvedValueOnce()`.

---

## 🌐 2. Mocking de Red: MSW (Mock Service Worker)

El antipatrón tradicional de hacer monkey-patching sobre `global.fetch` o usar librerías que sobreescriben sockets como `nock` suele romper clientes HTTP modernos (`undici`, `axios`).

### La Revolución de MSW:
- **Mock Service Worker (MSW)** intercepta las peticiones en la capa de red del sistema operativo (en Node.js mediante interceptores HTTP estándar y en navegador mediante Service Workers reales).
- Permite escribir un único contrato de simulación que se comparte entre:
  1. Tests unitarios e integración (Vitest / Jest).
  2. Entorno visual de componentes (Storybook).
  3. Desarrollo local offline con el frontend.

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  http.get('https://api.banco.com/v1/accounts/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, balance: 1500 });
  })
);
```

---

## ⏱️ 3. Tiempo Determinista: Fake Timers

### El Antipatrón Mortal: Esperas Reales con `setTimeout`:
```typescript
// ❌ PÉSIMA PRÁCTICA:
it('debe expirar la sesión tras 30 minutos', async () => {
  session.start();
  await new Promise(r => setTimeout(r, 1800000)); // 💥 Esperar 30 minutos en el CI...
});
```

### La Solución Senior: `useFakeTimers()`:
Manipula el reloj virtual de la máquina virtual de V8, permitiendo avanzar el tiempo de forma instantánea sin consumir ciclos de CPU ni generar pruebas intermitentes (*flaky tests*):

```typescript
it('debe expirar la sesión tras 30 minutos', () => {
  vi.useFakeTimers();
  session.start();

  // Avanzamos 30 minutos de forma síncrona en 0 milisegundos:
  vi.advanceTimersByTime(30 * 60 * 1000);

  expect(session.isExpired()).toBe(true);
  vi.useRealTimers(); // Restaurar el reloj real
});
```
