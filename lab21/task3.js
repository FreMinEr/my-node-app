const fs = require('node:fs/promises');
const { createReadStream, createWriteStream } = require('node:fs');
const { Transform } = require('node:stream');
const { StringDecoder } = require('node:string_decoder');
const { pipeline, finished } = require('node:stream/promises');
const path = require('node:path');

function lineTransform(transform) {
  const decoder = new StringDecoder('utf8'); let pending = '';
  return new Transform({
    transform(chunk, encoding, callback) {
      const lines = (pending + decoder.write(chunk)).split('\n'); pending = lines.pop();
      for (const line of lines) this.push(`${transform(line)}\n`); callback();
    },
    flush(callback) { pending += decoder.end(); if (pending) this.push(transform(pending)); callback(); },
  });
}
(async () => {
  const root = path.join(__dirname, 'output'); await fs.mkdir(root, { recursive: true });
  const input = path.join(root, 'input.txt');
  await fs.writeFile(input, 'Группа: 477\nСтудент: Парфёнок Иван\nПотоки Node.js\n');
  console.log('=== pipe: успешное копирование ===');
  const source = createReadStream(input); const destination = createWriteStream(path.join(root, 'output-pipe.txt'));
  source.pipe(destination);
  try { await Promise.all([finished(source), finished(destination)]); }
  finally { source.destroy(); destination.destroy(); }
  console.log('Содержимое совпало:', (await fs.readFile(input)).equals(await fs.readFile(path.join(root, 'output-pipe.txt'))));
  console.log('=== pipe: ошибка источника ===');
  const missing = createReadStream(path.join(root, 'missing.txt'));
  const orphan = createWriteStream(path.join(root, 'pipe-error.txt'));
  missing.pipe(orphan);
  try { await finished(missing); }
  catch (error) {
    console.log(`${error.code}; целевой поток destroyed=${orphan.destroyed}`);
    // pipe сам не закрывает получателя при ошибке источника: закрываем вручную.
    orphan.destroy(); await finished(orphan).catch(() => {});
  }
  console.log('=== pipeline: успешное копирование ===');
  await pipeline(createReadStream(input), createWriteStream(path.join(root, 'output-pipeline.txt')));
  console.log('Содержимое совпало:', (await fs.readFile(input)).equals(await fs.readFile(path.join(root, 'output-pipeline.txt'))));
  const failedSource = createReadStream(path.join(root, 'missing.txt'));
  const failedTarget = createWriteStream(path.join(root, 'pipeline-error.txt'));
  try { await pipeline(failedSource, failedTarget); }
  catch (error) { console.log(`pipeline ${error.code}; source.destroyed=${failedSource.destroyed}; target.destroyed=${failedTarget.destroyed}`); }
  await pipeline(createReadStream(input, { highWaterMark: 7 }), lineTransform(line => line.toUpperCase()),
    lineTransform(line => [...line].reverse().join('')), createWriteStream(path.join(root, 'output-chain.txt')));
  console.log('=== Цепочка uppercase -> reverse (по строкам) ===');
  console.log(await fs.readFile(path.join(root, 'output-chain.txt'), 'utf8'));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
