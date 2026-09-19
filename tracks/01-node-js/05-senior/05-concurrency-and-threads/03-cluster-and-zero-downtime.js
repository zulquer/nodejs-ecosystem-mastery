/**
 * ============================================================================
 * LECCIÓN 03: Cluster Module y Reinicio sin Caídas (Zero-Downtime Rolling Restart)
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Comprender el módulo `node:cluster`: cómo múltiples procesos de Node.js
 *    escuchan en el mismo puerto TCP gracias al balanceo Round-Robin del proceso Primary.
 * 2. Entender por qué un reinicio abrupto genera errores 502 / Connection Refused.
 * 3. Implementar el patrón arquitectónico de **Rolling Restart (Zero-Downtime)**:
 *    levantar un nuevo worker, esperar a que esté escuchando (`listening`), y luego
 *    desconectar el worker antiguo de forma segura (`worker.disconnect()`) permitiendo
 *    que termine sus peticiones en vuelo.
 * ============================================================================
 */

import cluster from 'node:cluster';
import http from 'node:http';
import { styleText } from 'node:util';

const PORT = 8085;
const NUM_WORKERS = 2;

// ----------------------------------------------------------------------------
// PROCESO PRIMARIO (Primary / Master)
// ----------------------------------------------------------------------------
if (cluster.isPrimary) {
  console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
  console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 03: Cluster Module y Rolling Restart con Zero-Downtime'));
  console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

  console.log(styleText('white', `[Primary PID: ${process.pid}] Iniciando clúster con ${NUM_WORKERS} workers en puerto ${PORT}...`));

  const workers = [];

  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = cluster.fork();
    workers.push(worker);
  }

  // Esperamos a que todos los workers estén listos
  let onlineCount = 0;
  cluster.on('listening', (worker, address) => {
    onlineCount++;
    console.log(styleText('green', `  🟢 [Worker PID: ${worker.process.pid}] Listo y escuchando en puerto ${address.port}`));

    if (onlineCount === NUM_WORKERS) {
      console.log(styleText('gray', '\nClúster 100% operativo. Ejecutando prueba de tráfico continuo...\n'));
      startTrafficAndRollingRestart();
    }
  });

  // Función para simular peticiones HTTP continuas mientras reiniciamos workers
  async function startTrafficAndRollingRestart() {
    let requestsSuccess = 0;
    let requestsFailed = 0;

    // Lanzamos ráfagas de peticiones cada 40ms
    const interval = setInterval(() => {
      http.get(`http://localhost:${PORT}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) requestsSuccess++;
        });
      }).on('error', () => {
        requestsFailed++;
      });
    }, 40);

    // Esperar 200ms de tráfico estable
    await new Promise(r => setTimeout(r, 200));

    // ⚡ CLAVE SENIOR: Realizar Rolling Restart (Reinicio por turnos sin caída)
    console.log(styleText(['bold', 'yellow'], '--- INICIANDO ROLLING RESTART EN CALIENTE (Cero Caída de Servicio) ---'));

    const currentWorkerIds = Object.keys(cluster.workers);

    for (const id of currentWorkerIds) {
      const oldWorker = cluster.workers[id];
      if (!oldWorker) continue;

      console.log(styleText('yellow', `  🔄 Levantando nuevo worker de reemplazo...`));
      const newWorker = cluster.fork();

      // Esperamos a que el nuevo worker esté 100% listo para recibir conexiones
      await new Promise(resolve => newWorker.once('listening', resolve));
      console.log(styleText('green', `  ✅ Nuevo [Worker PID: ${newWorker.process.pid}] activo. Desconectando viejo [Worker PID: ${oldWorker.process.pid}]...`));

      // Desconectamos el viejo: deja de aceptar peticiones nuevas pero termina las actuales
      oldWorker.disconnect();
      await new Promise(resolve => oldWorker.once('exit', resolve));
      console.log(styleText('gray', `     Viejo Worker PID: ${oldWorker.process.pid} cerrado limpiamente.`));
    }

    // Dejamos un poco más de tráfico para certificar que el servicio sigue 100% vivo
    await new Promise(r => setTimeout(r, 250));
    clearInterval(interval);

    console.log(styleText(['bold', 'yellow'], '\n--- RESULTADOS DE DISPONIBILIDAD DEL SERVICIO ---'));
    console.log(`  • Peticiones exitosas (HTTP 200): ${styleText(['bold', 'green'], `${requestsSuccess}`)}`);
    console.log(`  • Peticiones fallidas (Errores/Drop): ${styleText(requestsFailed === 0 ? 'green' : 'red', `${requestsFailed}`)}`);

    if (requestsFailed === 0) {
      console.log(styleText(['bold', 'green'], '  🎉 CERO DOWNTIME ALCANZADO: Ninguna petición de usuario fue rechazada durante el despliegue.\n'));
    }

    // Apagar clúster limpiamente
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill();
    }

    console.log(styleText(['bold', 'white'], '💡 CONCLUSIÓN SENIOR:'));
    console.log(styleText('white', '  1. `cluster` distribuye conexiones entrantes de forma balanceada entre los procesos de CPU.'));
    console.log(styleText('white', '  2. El patrón `Rolling Restart` es el principio que herramientas como PM2 (`pm2 reload`),'));
    console.log(styleText('white', '     Kubernetes (RollingUpdate) y Nginx utilizan para actualizar código en producción'));
    console.log(styleText('white', '     sin perder ni una sola petición de usuario.\n'));
  }

// ----------------------------------------------------------------------------
// PROCESO WORKER (Worker HTTP Server)
// ----------------------------------------------------------------------------
} else {
  const server = http.createServer((req, res) => {
    // Simulamos un leve tiempo de procesamiento
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Respondido por Worker PID ${process.pid}`);
    }, 10);
  });

  server.listen(PORT);
}
