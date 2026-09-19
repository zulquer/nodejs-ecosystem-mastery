/**
 * ============================================================================
 * LECCIÓN 03: Transform Streams Personalizados y Async Generators (Node Moderno)
 * ============================================================================
 * 
 * 🎯 OBJETIVO SENIOR:
 * 1. Implementar un `Transform` stream personalizado resolviendo el problema clásico
 *    de "Límites de Chunk" (Chunk Boundaries): cuando una línea queda cortada por la mitad
 *    entre un chunk y el siguiente.
 * 2. Comprender el método `_transform(chunk, encoding, callback)` y `_flush(callback)`.
 * 3. Dominar el patrón moderno de Node.js: **Async Generator Functions (`async function*`)**
 *    integradas directamente en `pipeline()`, eliminando boilerplate y manteniendo
 *    Backpressure automático.
 * ============================================================================
 */

import { Transform, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { styleText } from 'node:util';

console.log(styleText(['bold', 'cyan'], '\n===================================================================='));
console.log(styleText(['bold', 'cyan'], ' 🧪 LAB 03: Transform Streams, Chunk Boundaries y Async Generators'));
console.log(styleText(['bold', 'cyan'], '====================================================================\n'));

// Simulamos chunks de un archivo CSV que llegan fragmentados por la red o disco
// Observa cómo la línea 2 ("2,Carlos,30") queda partida entre el chunk 1 y el chunk 2:
const rawCsvChunks = [
  'id,nombre,edad\n1,Ana,28\n2,Car', // Chunk 1 (termina en '2,Car')
  'los,30\n3,Beatriz,35\n4,David,',   // Chunk 2 (empieza con 'los,30\n' y termina en '4,David,')
  '42'                               // Chunk 3 (completa '42' sin salto de línea final)
];

// ----------------------------------------------------------------------------
// ENFOQUE 1: Custom Transform Stream Clásico (Manejo de Buffers residuales)
// ----------------------------------------------------------------------------
class CsvToJsonTransform extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
    this.remainder = ''; // Búfer residual para trozos partidos
    this.headers = null;
  }

  _transform(chunk, encoding, callback) {
    // Concatenamos el remanente de la iteración anterior con el nuevo chunk
    const content = this.remainder + chunk.toString();
    const lines = content.split('\n');

    // La última línea puede estar incompleta; la guardamos como remainder
    this.remainder = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      if (!this.headers) {
        this.headers = line.split(',');
        continue;
      }

      const values = line.split(',');
      const record = {};
      this.headers.forEach((header, i) => {
        record[header] = values[i];
      });

      // Emitimos el objeto hacia el siguiente stream
      this.push(record);
    }

    callback();
  }

  _flush(callback) {
    // ⚡ CLAVE SENIOR: Cuando la fuente ya no tiene más datos, _flush se llama
    // para vaciar cualquier remanente que haya quedado en memoria
    if (this.remainder && this.remainder.trim()) {
      const values = this.remainder.split(',');
      const record = {};
      this.headers.forEach((header, i) => {
        record[header] = values[i];
      });
      this.push(record);
    }
    callback();
  }
}

async function runClassicTransform() {
  console.log(styleText(['bold', 'yellow'], '--- ENFOQUE 1: Transform Stream con Manejo de Límites de Chunk (_flush) ---'));
  const source = Readable.from(rawCsvChunks);
  const parser = new CsvToJsonTransform();
  const parsedRecords = [];

  await pipeline(
    source,
    parser,
    new Writable({
      objectMode: true,
      write(record, encoding, callback) {
        parsedRecords.push(record);
        callback();
      }
    })
  );

  console.log(styleText('green', '  ✅ Registros parseados con Transform clásico (reconstituyendo fragmentos):'));
  console.log(' ', JSON.stringify(parsedRecords, null, 2));
}

// ----------------------------------------------------------------------------
// ENFOQUE 2: Async Generators en pipeline() (El estándar Senior moderno)
// ----------------------------------------------------------------------------

// Transformador moderno con generador asíncrono
async function* modernCsvLineParser(sourceChunks) {
  let remainder = '';
  for await (const chunk of sourceChunks) {
    const text = remainder + chunk.toString();
    const lines = text.split('\n');
    remainder = lines.pop(); // Guardamos el fragmento incompleto

    for (const line of lines) {
      if (line.trim()) yield line; // Emitimos línea completa
    }
  }

  // Al finalizar el bucle, emitimos el último remanente si existe
  if (remainder.trim()) {
    yield remainder;
  }
}

// Filtro / Enriquecedor intermedio (ejemplo: solo mayores de 29 años)
async function* filterSeniorAge(lines) {
  let headers = null;
  for await (const line of lines) {
    if (!headers) {
      headers = line.split(',');
      continue;
    }
    const [id, nombre, edad] = line.split(',');
    if (Number(edad) >= 30) {
      yield { id: Number(id), nombre, edad: Number(edad), seniorLevel: true };
    }
  }
}

async function runModernGenerators() {
  console.log(styleText(['bold', 'yellow'], '\n--- ENFOQUE 2: Async Generators (async function*) en pipeline() ---'));
  console.log(styleText('gray', 'Node.js permite usar generadores asíncronos directamente dentro de pipeline().'));
  console.log(styleText('gray', 'El Backpressure y la propagación de errores son manejados automáticamente.\n'));

  const source = Readable.from(rawCsvChunks);
  const results = [];

  // pipeline encadena: Source -> LineParser -> Filter -> Destino
  await pipeline(
    source,
    modernCsvLineParser,
    filterSeniorAge,
    async function(sourceRecords) {
      for await (const record of sourceRecords) {
        results.push(record);
      }
    }
  );

  console.log(styleText('green', '  ✅ Pipeline moderno completado con Async Generators:'));
  console.log(' ', JSON.stringify(results, null, 2));
}

async function main() {
  await runClassicTransform();
  await runModernGenerators();

  console.log(styleText(['bold', 'white'], '\n💡 CONCLUSIÓN SENIOR:'));
  console.log(styleText('white', '  1. Siempre que proceses streams de texto/CSV/logs por partes, debes acumular el remanente'));
  console.log(styleText('white', '     incompleto para el siguiente chunk; los chunks nunca coinciden exactamente con saltos de línea.'));
  console.log(styleText('white', '  2. En Node.js moderno, los `Async Generators` (`async function*`) reemplazan el 80% de las clases'));
  console.log(styleText('white', '     Transform heredadas: tienen sintaxis limpia, cero boilerplate y Backpressure 100% nativo.\n'));
}

main();
