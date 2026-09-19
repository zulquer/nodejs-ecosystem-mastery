# 🚂 Express.js Level 01: Fundamentals

Arquitectura interna de Request/Response, envolturas sobre `node:http` y anatomía del sistema de enrutamiento.

---

## 🎯 1. La Relación entre Node.js Nativo y Express

Express no es un servidor HTTP propio; es una capa delgada de azúcar sintáctico y gestión de middlewares sobre el módulo nativo `node:http`:

```typescript
import http from 'node:http';
import express from 'express';

const app = express();
// Express es simplemente una función callback que satisface:
// (req: http.IncomingMessage, res: http.ServerResponse) => void
const server = http.createServer(app);
server.listen(3000);
```

### Prototipos Aumentados:
- **`req`**: Hereda de `http.IncomingMessage.prototype`. Express le inyecta métodos de conveniencia:
  - `req.params`: Parámetros dinámicos de ruta (`/users/:id`).
  - `req.query`: Objeto parsed de la query string (`?sort=asc`).
  - `req.body`: Payload parseado por middlewares como `express.json()`.
  - `req.get(headerName)`: Lectura de cabeceras insensible a mayúsculas/minúsculas.
- **`res`**: Hereda de `http.ServerResponse.prototype`. Express añade helpers encadenables:
  - `res.status(code)`: Establece el código HTTP y retorna `this` (Fluent API).
  - `res.json(data)`: Serializa con `JSON.stringify()`, inyecta `Content-Type: application/json` y cierra el stream con `res.end()`.

---

## 🚫 2. El Error Clásico: `ERR_HTTP_HEADERS_SENT`

El error más común en código de desarrolladores noveles:
`Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`

### Por qué Ocurre:
El protocolo HTTP especifica que una respuesta consta de **Cabeceras** seguidas del **Cuerpo**. Una vez que se envía el primer byte del cuerpo o se llama a `res.json()`, Node.js envía las cabeceras por el socket TCP y bloquea cualquier mutación adicional.

```typescript
// ❌ CÓDIGO CON ERROR:
app.get('/user', (req, res, next) => {
  if (!req.query.token) {
    res.status(401).json({ error: 'Falta token' });
    // FALTA EL return; la ejecución continúa hacia abajo
  }

  res.json({ user: 'Alice' }); // 💥 CRASH: Intenta enviar headers por segunda vez
});

// ✅ CÓDIGO SENIOR CORREGIDO:
app.get('/user', (req, res) => {
  if (!req.query.token) {
    return res.status(401).json({ error: 'Falta token' }); // Retorno explícito
  }

  return res.json({ user: 'Alice' });
});
```

---

## 🌲 3. Árboles de Enrutamiento con `express.Router()`

En lugar de registrar todas las rutas en `app`, las aplicaciones modulares utilizan sub-enrutadores:

```typescript
// routes/users.router.ts
import { Router } from 'express';

export const usersRouter = Router({ mergeParams: true });

// Pre-carga de entidades con router.param:
usersRouter.param('userId', async (req, res, next, id) => {
  try {
    const user = await db.findUserById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    req.user = user; // Inyecta el usuario precargado en la request
    next();
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/:userId', (req, res) => {
  res.json(req.user);
});
```
