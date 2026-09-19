# 🚂 Express.js Level 03: Express 4 vs Express 5

Análisis de la evolución histórica más esperada en Node.js: la eliminación de la trampa de promesas no capturadas y los cambios de ruptura en Express 5.

---

## ⚡ 1. La Trampa de los Handlers Asíncronos en Express 4

Express 4 se diseñó en 2014, antes de que las promesas y `async/await` fueran estándar en JavaScript (ES2017).

### El Problema de Express 4:
Si una función `async` lanzaba una excepción dentro de un handler, Express 4 era completamente ciego al rechazo de la promesa:

```typescript
// ❌ En Express 4:
app.get('/orders', async (req, res) => {
  const data = await db.query('SELECT * FROM orders'); // Si esto falla y lanza un Error:
  res.json(data);
});
```

**Consecuencias Catastróficas en Express 4**:
1. El error **nunca llegaba al middleware de errores** `(err, req, res, next)`.
2. El cliente HTTP se quedaba esperando una respuesta indefinidamente hasta que el socket TCP agotaba el timeout (típicamente 2 minutos de pantalla congelada).
3. En Node.js 16+, los rechazos no capturados terminaban disparando `unhandledRejection` y podían tumbar el proceso completo si no se configuraba un manejador global.

### Los Parches que Tuvimos que Usar Durante 10 Años:
1. **Helper `asyncHandler`**:
   ```typescript
   const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
     Promise.resolve(fn(req, res, next)).catch(next);
   ```
2. **Monkey-Patching Global (`express-async-errors`)**: Parcheaba el prototipo de `Layer.prototype.handle_request`.

---

## 🚀 2. La Solución Nativa de Express 5

En **Express 5** (lanzado oficialmente a finales de 2024), el despachador interno de capas reconoce de forma nativa las promesas retornadas por cualquier middleware:

```javascript
// Implementación conceptual en Express 5:
try {
  const result = fn(req, res, next);
  if (result && typeof result.catch === 'function') {
    result.catch(next); // ¡Captura automática y reenvío a next(err)!
  }
} catch (syncErr) {
  next(syncErr);
}
```

Ahora en Express 5 puedes escribir código limpio sin ningún wrapper:
```typescript
// ✅ En Express 5 (Funciona de forma segura y nativa):
app.get('/orders', async (req, res) => {
  const data = await db.query('SELECT * FROM orders');
  res.json(data); // Si db.query falla, Express 5 invoca automáticamente next(err)
});
```

---

## ⚠️ 3. Cambios de Ruptura (*Breaking Changes*) en Express 5

1. **Nuevo Motor de Rutas (`path-to-regexp` v0.1 -> v8.0)**:
   - Ya no se permiten asteriscos sueltos como comodines: `app.get('/user/*', ...)` ahora debe escribirse como `app.get('/user/{*splat}', ...)`.
   - Las expresiones regulares en rutas son más estrictas.
2. **Eliminación de Firmas Obsoletas**:
   - `res.send(status, body)` eliminado: debe usarse obligatoriamente `res.status(status).send(body)`.
   - `res.redirect(status, url)` deprecado: usar `res.redirect(url)` o `res.redirect(status, url)`.
3. **`req.query` Más Estricto**:
   - Soporte configurable para `extended: false` (usando el parser simple `querystring` nativo) o `extended: true` (usando la biblioteca `qs`).
