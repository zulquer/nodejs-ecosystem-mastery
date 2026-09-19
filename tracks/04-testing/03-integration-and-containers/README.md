# 🧪 Testing Level 03: Pruebas de Integración y Testcontainers

La arquitectura del Testing Trophy, los peligros de las bases de datos en memoria y el estándar industrial con Testcontainers.

---

## 🏆 1. El Testing Trophy vs La Pirámide Clásica

La pirámide de testing tradicional (popularizada por Mike Cohn) sugería tener un 80% de pruebas unitarias aisladas. En la ingeniería de backend moderna, este enfoque suele fallar porque **los bugs reales ocurren en los límites de integración**: consultas SQL mal formuladas, transacciones rotas o serialización de payloads.

```
       ▲  [ End-to-End (E2E) ]         -> Pocos, cubren flujos críticos de negocio
      ╱ ╲
     ╱   ╲  [ INTEGRATION ] (Máximo ROI) -> Componentes + Base de Datos Real
    ╱─────╲
   ╱ UNIT  ╲                            -> Funciones puras, algoritmos complejos
  ╱─────────╲
 ╱  STATIC   ╲                          -> TypeScript estricto, ESLint
```

### Por qué las Pruebas de Integración tienen el Máximo Retorno de Inversión (ROI):
- Verifican que los componentes funcionen juntos tal como lo harán en producción.
- Son resilientes a la refactorización: si cambias la implementación interna de una clase pero su comportamiento y persistencia siguen intactos, la prueba de integración continúa pasando.

---

## ⚠️ 2. La Trampa de las Bases de Datos en Memoria (SQLite / H2)

Un antipatrón muy extendido en proyectos Node.js es usar PostgreSQL en producción, pero ejecutar las pruebas con SQLite en memoria (`sqlite3 :memory:`):

### Por qué Rompe en Producción:
1. **Diferencias de Sintaxis SQL**: SQLite no soporta nativamente sentencias avanzadas de PostgreSQL como:
   - `INSERT ... ON CONFLICT (id) DO UPDATE` (Upsert).
   - `RETURNING *` en sentencias de actualización.
   - Operadores de búsqueda en `JSONB` (`@>`, `?|`).
2. **Concurrencia Falsa**: SQLite bloquea todo el archivo para escrituras, mientras que PostgreSQL utiliza MVCC con bloqueos a nivel de fila (`SELECT ... FOR UPDATE`).
3. **Resultado**: Las pruebas pasan al 100% en el entorno de desarrollo, pero el despliegue a producción colapsa con errores de sintaxis SQL.

---

## 🐳 3. Testcontainers: Fidelidad Real al 100%

**Testcontainers** es una biblioteca que permite arrancar contenedores Docker reales (PostgreSQL, Redis, RabbitMQ, Kafka) directamente desde el código de tus pruebas en TypeScript:

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';

describe('Integración con PostgreSQL Real', () => {
  let container: any;
  let pool: Pool;

  beforeAll(async () => {
    // Levanta una instancia real de PostgreSQL 16 en Docker:
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .start();

    pool = new Pool({ connectionString: container.getConnectionString() });
    await pool.query(`CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE);`);
  }, 60000); // 60s timeout para descarga de imagen

  afterAll(async () => {
    await pool.end();
    await container.stop(); // Destruye el contenedor automáticamente
  });

  it('debe insertar y leer usuarios garantizando unicidad', async () => {
    await pool.query(`INSERT INTO users (email) VALUES ('dev@empresa.com')`);
    
    // Si intentamos duplicar, PostgreSQL real lanza el error 23505 (unique_violation)
    await expect(pool.query(`INSERT INTO users (email) VALUES ('dev@empresa.com')`))
      .rejects.toThrow();
  });
});
```
