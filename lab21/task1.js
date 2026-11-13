const { Readable } = require('node:stream');
class StudentStream extends Readable {
  lines = ['Группа: 477', 'Студент: Парфёнок Иван', 'Лабораторная работа: №21', 'Тема: Потоки в Node.js'];
  _read() { this.push(this.lines.length ? Buffer.from(this.lines.shift()) : null); }
}
let count = 0, bytes = 0;
const stream = new StudentStream();
stream.on('data', chunk => { count++; bytes += chunk.length; console.log(`[CHUNK ${count}] ${chunk}`); });
stream.on('end', () => console.log(`[END] Поток завершен. Чанков: ${count}; байт: ${bytes}`));
stream.on('error', error => { console.error(error.message); process.exitCode = 1; });
