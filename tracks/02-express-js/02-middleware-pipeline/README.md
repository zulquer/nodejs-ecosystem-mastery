# 🚂 Express.js Level 02: Middleware Pipeline y la Trampa de la Aridad

El modelo de tubería de middlewares, saltos de control en la cadena y la inspección reflexiva de argumentos en JavaScript.

---

## 🧅 1. El Modelo de Tubería (Middleware Pipeline)

Una aplicación de Express es fundamentalmente una lista enlazada de capas (*Layers*). Cada middleware puede:
1. Ejecutar cualquier código síncrono o asíncrono.
2. Mutar los objetos `req` y `res` (ej. añadir `req.user` tras verificar un token).
3. Finalizar el ciclo emitiendo una respuesta (`res.send()`).
4. Invocar a la siguiente capa mediante `next()`.

```
Petición Entrante ──> [ Auth Middleware ] ──next()──> [ Validation Middleware ] ──next()──> [ Controller ]
                                                                                                    │
                                                                                                res.json()
                                                                                                    │
Petición Resuelta <── [ Logging: res.on('finish') ] <───────────────────────────────────────────────┘
```

---

## ⚠️ 2. La Trampa de la Aridad: ¿Por qué los Error Handlers REQUIEREN 4 Argumentos?

En JavaScript, cada función posee la propiedad estática `length`, que indica el número de parámetros formales declarados en su firma:

```javascript
const m1 = (req, res, next) => {};
console.log(m1.length); // 3

const m2 = (err, req, res, next) => {};
console.log(m2.length); // 4
```

### Cómo Express Despacha Errores Internamente:
En el código fuente de Express (`router/layer.js`):
```javascript
Layer.prototype.handle_error = function handle_error(error, req, res, next) {
  var fn = this.handle;

  if (fn.length === 4) {
    // Es un Middleware de Error legítimo
    fn(error, req, res, next);
  } else {
    // Si tiene 2 o 3 parámetros, NO lo ejecuta como error handler
    // y continúa propagando el error hacia abajo
    next(error);
  }
};
```

> [!CAUTION]
> Si declaras tu middleware de error como `(err, req, res) => { ... }` pensando que no necesitas `next`, `fn.length` valdrá **3**. Express lo tratará como un middleware normal, inyectándole `req` en la variable `err`, desarticulando todo el manejo de excepciones de tu aplicación.

---

## 🔀 3. Saltos de Control Especiales en `next()`

1. **`next(err)`**: Salta inmediatamente todos los middlewares normales y desciende por la tubería hasta encontrar el primer middleware con 4 argumentos (`fn.length === 4`).
2. **`next('route')`**: Solo disponible en handlers de ruta (`app.get()`). Aborta los middlewares restantes de esa ruta específica y salta a la **siguiente ruta que coincida con la misma URL**:
   ```typescript
   app.get('/user/:id', (req, res, next) => {
     if (req.params.id === '0') return next('route'); // Salta al siguiente handler
     res.send('Usuario normal');
   });

   app.get('/user/:id', (req, res) => {
     res.send('Usuario especial de ID 0');
   });
   ```
3. **`next('router')`**: Aborta la ejecución de todo el sub-enrutador actual y devuelve el control al enrutador padre.
