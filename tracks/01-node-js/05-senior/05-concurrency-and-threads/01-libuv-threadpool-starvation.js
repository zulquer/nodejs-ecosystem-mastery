/**
 * ============================================================================
 * LECCIÓN 01: El Threadpool de Libuv, Inanición y UV_THREADPOOL_SIZE
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Demostrar empíricamente que Node.js utiliza un Threadpool en C++ (Libuv)
 *    con un tamaño por defecto de exactamente 4 hilos.
 * 2. Visualizar la "Inanición del Threadpool" (Threadpool Starvation):
 *    Cuando 4 tareas pesadas (criptografía, compresión zlib o I/O de disco fs) ocupan los
 *    4 hilos disponibles, cualquier 5ª tarea queda en cola y su tiempo se duplica.
 * 3. Saber cómo calibrar `UV_THREADPOOL_SIZE` antes del arranque del runtime.
 * ============================================================================
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 01: El Threadpool de Libuv (4 Hilos por Defecto) e Inanición'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

console.log(`Tamaño actual de UV_THREADPOOL_SIZE: ${styleText('yellow', process.env.UV_THREADPOOL_SIZE || '4 (valor nativo por defecto)')}\n`);

// ----------------------------------------------------------------------------
// EXPERIMENTO 1: Lanzar 6 operaciones criptográficas simultáneas
// ----------------------------------------------------------------------------
console.log(styleText(['bold', 'yellow'], '--- EXPERIMENTO 1: Saturación del Threadpool con 6 tareas crypto.pbkdf2 ---'));
console.log(styleText('gray', 'Lanzamos 6 tareas de hashing simultáneas (350,000 iteraciones cada una).\n'));

const startCrypto = performance.now();
let completedTasks = 0;

for (let i = 1; i <= 6; i++) {
  crypto.pbkdf2('password_seguro_123', 'salt_aleatorio', 350_000, 64, 'sha512', () => {
    const elapsed = (performance.now() - startCrypto).toFixed(0);
    completedTasks++;

    if (completedTasks <= 4) {
      console.log(
        `${styleText('green', `  [Hilo 1-4] Tarea #${i} completada en ${elapsed}ms`)} ` +
        `${styleText('gray', '(Ocupó uno de los 4 hilos iniciales de Libuv)')}`
      );
    } else {
      console.log(
        `${styleText(['bold', 'red'], `  🚨 [En Cola] Tarea #${i} completada en ${elapsed}ms`)} ` +
        `${styleText('yellow', '(¡Tardó el doble porque esperó a que un hilo se liberase!)')}`
      );
    }
  });
}

// ----------------------------------------------------------------------------
// EXPERIMENTO 2: Cómo la saturación criptográfica retrasa lecturas de disco (fs)
// ----------------------------------------------------------------------------
setTimeout(() => {
  console.log(styleText(['bold', 'yellow'], '\n--- EXPERIMENTO 2: Impacto Cruzado: Crypto bloqueando File System (fs) ---'));
  console.log(styleText('gray', '¿Sabías que `fs.readFile` compite por los MISMOS 4 hilos de Libuv que `crypto`?'));
  console.log(styleText('gray', 'Lanzamos 4 operaciones crypto pesadas y simultáneamente intentamos leer un archivo:\n'));

  const startCross = performance.now();

  // 1. Lanzamos 4 operaciones de crypto que secuestran el pool completo
  for (let i = 1; i <= 4; i++) {
    crypto.pbkdf2('pass', 'salt', 400_000, 64, 'sha512', () => {
      const time = (performance.now() - startCross).toFixed(0);
      console.log(styleText('gray', `     • Crypto #${i} finalizado en ${time}ms`));
    });
  }

  // 2. Intentamos leer un archivo pequeño de disco en el mismo instante
  fs.readFile(__filename, () => {
    const time = (performance.now() - startCross).toFixed(0);
    console.log(styleText(['bold', 'red'], `  🚨 fs.readFile() tardó ${time}ms en completarse!`));
    console.log(styleText('yellow', `     A pesar de que el archivo mide pocos KB, tuvo que esperar en cola a que la crypto terminase.\n`));
  });
}, 300);

// ----------------------------------------------------------------------------
// Conclusiones Senior
// ----------------------------------------------------------------------------
setTimeout(() => {
  console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN ARQUITECTÓNICA SENIOR:'));
  console.log(styleText('white', '  1. El Threadpool de Libuv atiende: `fs`, `crypto`, `zlib` y `dns.lookup`.'));
  console.log(styleText('white', '  2. Las operaciones de red (HTTP, TCP, WebSockets) NO usan el threadpool;'));
  console.log(styleText('white', '     el kernel las gestiona con epoll/kqueue de forma no bloqueante.'));
  console.log(styleText('white', '  3. Si tu aplicación hace hashing frecuente (Bcrypt/Argon2/PBKDF2) o compresión pesada,'));
  console.log(styleText('white', '     debes arrancar Node aumentando el threadpool antes de ejecutar código:'));
  console.log(styleText(['bold', 'green'], '     UV_THREADPOOL_SIZE=16 node server.js'));
  console.log(styleText('yellow', '  ⚠️ Intentar cambiar `process.env.UV_THREADPOOL_SIZE = 16` dentro de tu código JS'));
  console.log(styleText('yellow', '     es inútil: Libuv inicializa el pool antes de que tu script empiece a ejecutarse.\n'));
}, 800);
