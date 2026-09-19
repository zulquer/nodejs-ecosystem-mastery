/**
 * ============================================================================
 * LAB 01: El Orden Sagrado de Ejecución del Request Lifecycle en NestJS
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR / STAFF:
 * Demostrar de forma empírica y milimétrica el orden exacto en el que NestJS
 * ejecuta cada capa arquitectónica al recibir una petición HTTP.
 * 
 * 💡 PREGUNTA CLÁSICA DE ENTREVISTA SENIOR:
 * "Si tengo un Middleware, un Guard, un Pipe y un Interceptor configurados tanto
 * a nivel Global, de Controlador y de Método, ¿cuál es el orden exacto de ejecución
 * y en qué dirección se resuelven las respuestas?"
 * 
 * 🧠 RESPUESTA SENIOR (El Modelo de Cebolla de NestJS):
 * FASE DE ENTRADA (Hacia adentro: Global -> Controller -> Method):
 *   1. Global Middleware
 *   2. Module Middleware
 *   3. Global Guard -> Controller Guard -> Method Guard (Si falla, se aborta AQUÍ)
 *   4. Global Interceptor (Pre) -> Controller Interceptor (Pre) -> Method Interceptor (Pre)
 *   5. Global Pipe -> Controller Pipe -> Method Pipe -> Param Pipe
 *   6. Controller Route Handler (Lógica de Negocio)
 * 
 * FASE DE SALIDA (Hacia afuera con RxJS: Method -> Controller -> Global):
 *   7. Method Interceptor (Post) -> Controller Interceptor (Post) -> Global Interceptor (Post)
 *   8. Exception Filters (si hay error: Method -> Controller -> Global)
 *   9. Respuesta HTTP enviada al cliente.
 * ============================================================================
 */

import 'reflect-metadata';
import {
  Controller,
  Get,
  Injectable,
  NestMiddleware,
  CanActivate,
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  PipeTransform,
  ArgumentMetadata,
  UseGuards,
  UseInterceptors,
  UsePipes,
  Module,
  NestModule,
  MiddlewareConsumer,
  Query
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { styleText } from 'node:util';
import http from 'node:http';

let stepCounter = 1;
function trace(layer: string, scope: string, color: 'blue' | 'yellow' | 'magenta' | 'cyan' | 'green') {
  const step = String(stepCounter++).padStart(2, '0');
  console.log(
    `  ${styleText('gray', `[Paso ${step}]`)} ` +
    `${styleText(['bold', color], layer.padEnd(24))} ` +
    `-> ${styleText('white', scope)}`
  );
}

// ----------------------------------------------------------------------------
// 1. MIDDLEWARES (Express/Fastify level, antes de entrar al router de Nest)
// ----------------------------------------------------------------------------
class GlobalMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    trace('1. Middleware', 'Global Middleware (nivel Express)', 'blue');
    next();
  }
}

class ModuleMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    trace('2. Middleware', 'Module Middleware (vinculado al módulo)', 'blue');
    next();
  }
}

// ----------------------------------------------------------------------------
// 2. GUARDS (Autorización y Autenticación: ¿Puede el cliente entrar?)
// ----------------------------------------------------------------------------
@Injectable()
class GlobalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    trace('3. Guard', 'Global Guard', 'yellow');
    return true;
  }
}

@Injectable()
class ControllerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    trace('4. Guard', 'Controller Guard (@UseGuards a nivel clase)', 'yellow');
    return true;
  }
}

@Injectable()
class MethodGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    trace('5. Guard', 'Method Guard (@UseGuards a nivel endpoint)', 'yellow');
    return true;
  }
}

// ----------------------------------------------------------------------------
// 3. INTERCEPTORS (Pre y Post Controlador con RxJS)
// ----------------------------------------------------------------------------
@Injectable()
class GlobalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    trace('6. Interceptor (Pre)', 'Global Interceptor', 'magenta');
    return next.handle().pipe(
      tap(() => trace('14. Interceptor (Post)', 'Global Interceptor (RxJS tap)', 'magenta'))
    );
  }
}

@Injectable()
class ControllerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    trace('7. Interceptor (Pre)', 'Controller Interceptor', 'magenta');
    return next.handle().pipe(
      tap(() => trace('13. Interceptor (Post)', 'Controller Interceptor (RxJS tap)', 'magenta'))
    );
  }
}

@Injectable()
class MethodInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    trace('8. Interceptor (Pre)', 'Method Interceptor', 'magenta');
    return next.handle().pipe(
      tap(() => trace('12. Interceptor (Post)', 'Method Interceptor (RxJS tap)', 'magenta'))
    );
  }
}

// ----------------------------------------------------------------------------
// 4. PIPES (Transformación y Validación de Argumentos de Entrada)
// ----------------------------------------------------------------------------
@Injectable()
class GlobalPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    trace('9. Pipe', 'Global Pipe (useGlobalPipes)', 'cyan');
    return value;
  }
}

@Injectable()
class ControllerPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    trace('10. Pipe', 'Controller Pipe (@UsePipes a nivel clase)', 'cyan');
    return value;
  }
}

@Injectable()
class MethodPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    trace('11. Pipe', 'Method Pipe (@UsePipes a nivel ruta)', 'cyan');
    return value;
  }
}

// ----------------------------------------------------------------------------
// 5. CONTROLLER (Destino final de la petición)
// ----------------------------------------------------------------------------
@Controller('orders')
@UseGuards(ControllerGuard)
@UseInterceptors(ControllerInterceptor)
@UsePipes(ControllerPipe)
class OrdersController {
  @Get('checkout')
  @UseGuards(MethodGuard)
  @UseInterceptors(MethodInterceptor)
  @UsePipes(MethodPipe)
  checkout(@Query('item') item: string) {
    trace('★ ROUTE HANDLER', `OrdersController.checkout() ejecutando negocio para item: "${item}"`, 'green');
    return { status: 'success', item, orderId: 9942 };
  }
}

// ----------------------------------------------------------------------------
// 6. MODULE & BOOTSTRAP
// ----------------------------------------------------------------------------
@Module({
  controllers: [OrdersController]
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicamos ModuleMiddleware para todas las rutas
    consumer.apply(ModuleMiddleware).forRoutes('*');
  }
}

async function startLab() {
  console.log(styleText(['bold', 'cyan'], '\n============================================================================='));
  console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 01: El Orden de Ejecución Sagrado del Request Lifecycle en NestJS'));
  console.log(styleText(['bold', 'cyan'], '=============================================================================\n'));

  // Creamos la aplicación NestJS sin logs molestos de arranque
  const app = await NestFactory.create(AppModule, { logger: false });

  // Registramos las capas Globales
  app.use(new GlobalMiddleware().use);
  app.useGlobalGuards(new GlobalGuard());
  app.useGlobalInterceptors(new GlobalInterceptor());
  app.useGlobalPipes(new GlobalPipe());

  const PORT = 3030;
  await app.listen(PORT);

  console.log(styleText('yellow', `⚡ Servidor NestJS escuchando en http://localhost:${PORT}`));
  console.log(styleText('gray', 'Enviando petición HTTP: GET /orders/checkout?item=MacBookPro...\n'));

  // Realizamos la petición HTTP para disparar la cascada
  await new Promise<void>((resolve) => {
    http.get(`http://localhost:${PORT}/orders/checkout?item=MacBookPro`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(styleText('green', `\n  HTTP ${res.statusCode} Response Body: ${body}`));
        resolve();
      });
    });
  });

  await app.close();

  console.log(styleText(['bold', 'white'], '\n📋 CONCLUSIÓN ARQUITECTÓNICA SENIOR / STAFF:'));
  console.log(styleText('white', '  1. Los GUARDS se ejecutan ANTES que los Interceptors y Pipes. Si un cliente no está'));
  console.log(styleText('white', '     autorizado, jamás se gasta CPU parseando datos en Pipes ni ejecutando Interceptors.'));
  console.log(styleText('white', '  2. Los PIPES se ejecutan inmediatamente ANTES del handler de ruta, pero DESPUÉS de la fase Pre'));
  console.log(styleText('white', '     de los Interceptors.'));
  console.log(styleText('white', '  3. En la fase POST (salida), los Interceptors se ejecutan en orden INVERSO (Cebolla RxJS):'));
  console.log(styleText('magenta', '     Method Interceptor -> Controller Interceptor -> Global Interceptor.\n'));
}

startLab();
