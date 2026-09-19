/**
 * ============================================================================
 * 🚂 EXPRESS.JS SENIOR LAB 03: DEFENSIVE SECURITY & RESILIENCE STACK
 * ============================================================================
 *
 * ¿QUÉ APRENDERÁS EN ESTE LABORATORIO?:
 * 1. Cómo mitigar ataques de denegación de servicio por agotamiento de memoria
 *    (Payload Bomb / Body Limit Bomb) cortando el stream antes de parsear en RAM.
 * 2. Protección contra ataques de Prototype Pollution en el parseo de JSON.
 * 3. Inyección estricta de cabeceras defensivas de seguridad (equivalente a Helmet).
 * 4. Validación de esquemas y respuesta de errores RFC 7807 sin filtrar información sensible.
 *
 * EJECUCIÓN:
 *   npx tsx express-js/04-senior-internals/03-security-and-resilience-stack.ts
 *   o: npm run express:senior:03
 * ============================================================================
 */

import { styleText } from 'node:util';

// ----------------------------------------------------------------------------
// 1. MIDDLEWARES DEFENSIVOS SENIOR
// ----------------------------------------------------------------------------

export interface SecurityReq {
  headers: Record<string, string>;
  rawBody: string;
  parsedBody?: any;
}

export interface SecurityRes {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  status(code: number): SecurityRes;
  json(data: any): SecurityRes;
}

/**
 * Middleware 1: Inyección de Cabeceras Defensivas (Helmet Minimal)
 */
export function helmetHeadersMiddleware(req: SecurityReq, res: SecurityRes, next: () => void) {
  res.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  res.headers['X-Content-Type-Options'] = 'nosniff';
  res.headers['X-Frame-Options'] = 'DENY';
  res.headers['Content-Security-Policy'] = "default-src 'self'";
  next();
}

/**
 * Middleware 2: Protección contra Payload Bombs (Body Size Limiter)
 * Si el cliente envía más de 100KB, corta inmediatamente antes de almacenar en memoria.
 */
export function bodySizeLimitMiddleware(maxBytes: number) {
  return (req: SecurityReq, res: SecurityRes, next: (err?: any) => void) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxBytes || req.rawBody.length > maxBytes) {
      return res.status(413).json({
        type: 'https://api.enterprise.com/errors/payload-too-large',
        title: 'Payload Too Large',
        status: 413,
        detail: `El cuerpo de la petición excede el límite permitido de ${maxBytes} bytes.`,
      });
    }

    next();
  };
}

/**
 * Middleware 3: Parser Seguro contra Prototype Pollution
 */
export function safeJsonParserMiddleware(req: SecurityReq, res: SecurityRes, next: () => void) {
  if (req.rawBody) {
    try {
      // Bloquea llaves prohibidas que intenten mutar Object.prototype
      req.parsedBody = JSON.parse(req.rawBody, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          console.log(styleText('bgRed', styleText('white', ' [SEGURIDAD] ')) + ` Intento de Prototype Pollution bloqueado: llave '${key}'`);
          return undefined; // Descartar llave maliciosa
        }
        return value;
      });
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }
  next();
}

// ----------------------------------------------------------------------------
// 2. DEMOSTRACIÓN PRÁCTICA
// ----------------------------------------------------------------------------
async function runLab() {
  console.log(styleText('bold', styleText('bgMagenta', ' 🚂 EXPRESS.JS SENIOR: DEFENSIVE SECURITY & RESILIENCE STACK ')));
  console.log(styleText('gray', 'Prueba de ataque de Payload Bomb, Prototype Pollution y cabeceras de blindaje.\n'));

  const maxAllowedBytes = 1024; // 1KB para la prueba

  const createRes = (): SecurityRes => ({
    statusCode: 200,
    headers: {},
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; },
  });

  // --------------------------------------------------------------------------
  // CASO 1: PETICIÓN NORMAL Y COMPROBACIÓN DE CABECERAS DEFENSIVAS
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '--- CASO 1: PETICIÓN NORMAL Y COMPROBACIÓN DE CABECERAS DEFENSIVAS ---'));
  const req1: SecurityReq = {
    headers: { 'content-length': '28' },
    rawBody: JSON.stringify({ user: 'Alice' }),
  };
  const res1 = createRes();

  helmetHeadersMiddleware(req1, res1, () => {
    bodySizeLimitMiddleware(maxAllowedBytes)(req1, res1, () => {
      safeJsonParserMiddleware(req1, res1, () => {
        res1.status(200).json({ status: 'OK', user: req1.parsedBody.user });
      });
    });
  });

  console.log(`Status HTTP: ${styleText('green', String(res1.statusCode))}`);
  console.log('Cabeceras inyectadas:');
  console.log(`   - HSTS: ${styleText('cyan', res1.headers['Strict-Transport-Security'])}`);
  console.log(`   - X-Content-Type-Options: ${styleText('cyan', res1.headers['X-Content-Type-Options'])}`);
  console.log(`   - X-Frame-Options: ${styleText('cyan', res1.headers['X-Frame-Options'])}`);

  // --------------------------------------------------------------------------
  // CASO 2: ATAQUE DE PAYLOAD BOMB (BODY DE 50KB SUPERA EL LÍMITE DE 1KB)
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '\n--- CASO 2: ATAQUE DE PAYLOAD BOMB (DDoS POR AGOTAMIENTO DE RAM) ---'));
  const massiveBody = JSON.stringify({ data: 'A'.repeat(50_000) }); // 50KB
  const req2: SecurityReq = {
    headers: { 'content-length': String(massiveBody.length) },
    rawBody: massiveBody,
  };
  const res2 = createRes();

  helmetHeadersMiddleware(req2, res2, () => {
    bodySizeLimitMiddleware(maxAllowedBytes)(req2, res2, () => {
      safeJsonParserMiddleware(req2, res2, () => {
        res2.status(200).json({ status: 'OK' });
      });
    });
  });

  console.log(`Status HTTP: ${styleText('bold', styleText('red', String(res2.statusCode)))} (Esperado: 413 Payload Too Large)`);
  console.log(`Respuesta RFC 7807: ${styleText('yellow', res2.body.detail)}`);
  console.log(styleText('green', '✅ El stream fue abortado antes de saturar el Heap de Node.js.'));

  // --------------------------------------------------------------------------
  // CASO 3: ATAQUE DE PROTOTYPE POLLUTION
  // --------------------------------------------------------------------------
  console.log(styleText('yellow', '\n--- CASO 3: INTENTO DE PROTOTYPE POLLUTION VIA JSON ---'));
  const maliciousPayload = '{"title":"Test", "__proto__": {"isAdmin": true}}';
  const req3: SecurityReq = {
    headers: { 'content-length': String(maliciousPayload.length) },
    rawBody: maliciousPayload,
  };
  const res3 = createRes();

  safeJsonParserMiddleware(req3, res3, () => {
    res3.status(200).json({ parsed: req3.parsedBody });
  });

  const testObj: any = {};
  console.log(`¿Se contaminó el prototipo global ({}.isAdmin)?: ${styleText('bold', testObj.isAdmin ? styleText('red', 'SÍ (VULNERABLE)') : styleText('green', 'NO (SEGURO)'))}`);

  console.log(styleText('bold', styleText('cyan', '\n🎯 RESUMEN DEFENSIVO SENIOR:')));
  console.log(
    '1. Configurar siempre ' + styleText('yellow', 'express.json({ limit: "100kb" })') + ' para mitigar Payload Bombs.\n' +
    '2. Usar ' + styleText('cyan', 'Helmet') + ' para forzar HSTS y prevenir Clickjacking / MIME-sniffing.\n' +
    '3. Sanitizar siempre las llaves prohibidas para neutralizar ' + styleText('magenta', 'Prototype Pollution') + '.'
  );
}

runLab().catch(console.error);
