const { Writable } = require('node:stream');
const { once } = require('node:events');
const { finished } = require('node:stream/promises');
class SlowWriter extends Writable {
  count = 0;
  _write(chunk, encoding, callback) {
    setTimeout(() => { this.count++; console.log(`[WRITE] ${chunk}`); callback(); }, 30);
  }
}
(async () => {
  const stream = new SlowWriter({ highWaterMark: 16 });
  stream.on('error', error => console.error(`[ERROR] ${error.message}`));
  stream.on('drain', () => console.log('[DRAIN] Буфер освобожден'));
  stream.on('finish', () => console.log(`[FINISH] Записано чанков: ${stream.count}`));
  for (const line of ['Группа: 477', 'Студент: Парфёнок Иван', 'Лабораторная работа: №21', 'Тема: Потоки в Node.js']) {
    const ready = stream.write(line);
    console.log(`write() вернул ${ready}`);
    if (!ready) await once(stream, 'drain');
  }
  stream.end(); await finished(stream);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
