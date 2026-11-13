const { createReadStream, createWriteStream } = require('node:fs');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const readline = require('node:readline');
const { fs, path, variant, exists, run } = require('./common');

run(async () => {
  const started = performance.now();
  const n = variant();
  const input = path.join('.', `data_${n}.txt`);
  if (!await exists(input)) {
    // Генератор и pipeline обеспечивают обратное давление без накопления файла в памяти.
    async function* generate() {
      for (let i = 1; i <= 100000; i++) yield `${i}, ${1 + Math.floor(Math.random() * 1000)}, Вариант ${n}\n`;
    }
    await pipeline(Readable.from(generate()), createWriteStream(input, { flags: 'wx' }));
  }
  const { size } = await fs.stat(input);
  const stream = createReadStream(input, { highWaterMark: 64 * 1024 });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const frequencies = new Array(1001).fill(0);
  let count = 0, sum = 0, min = Infinity, max = -Infinity, even = 0, bytes = 0, nextProgress = 10;
  console.log(`Обработка ${input}, размер: ${size} байт`);
  // Ошибку потока передаем итератору readline, чтобы она не осталась необработанной.
  stream.on('error', error => lines.emit('error', error));
  async function* processLines() {
    try {
      for await (const line of lines) {
        const match = line.match(/^(\d+),\s*(\d+),\s*Вариант (\d+)$/u);
        if (!match || Number(match[3]) !== n || Number(match[2]) < 1 || Number(match[2]) > 1000) {
          throw new Error(`Некорректная строка ${count + 1}`);
        }
        const value = Number(match[2]);
        count++; sum += value; min = Math.min(min, value); max = Math.max(max, value);
        frequencies[value]++; if (value % 2 === 0) even++;
        bytes += Buffer.byteLength(line) + 1;
        while (nextProgress <= 90 && bytes / size * 100 >= nextProgress) {
          console.log(`Прогресс: ${nextProgress}% (${count} строк)`); nextProgress += 10;
        }
        if (n >= 11 && n <= 15 && value > 500) yield `${line}\n`;
      }
    } finally { lines.close(); stream.destroy(); }
  }
  if (n >= 11 && n <= 15) {
    await pipeline(Readable.from(processLines()), createWriteStream(path.join('.', `filtered_${n}.txt`)));
  } else {
    for await (const unused of processLines()) { /* Все вычисления выполняются в генераторе. */ }
  }
  if (!count) throw new Error('Входной файл пуст.');
  const result = { count, sum, average: sum / count, min, max };
  if (n <= 5) Object.assign(result, { even, odd: count - even });
  else if (n <= 10) result.mostFrequent = frequencies.map((frequency, value) => ({ value, frequency }))
    .filter(item => item.frequency).sort((a, b) => b.frequency - a.frequency || a.value - b.value).slice(0, 10);
  else if (n >= 16) {
    // Гистограмма позволяет вычислить точную медиану без хранения всех строк.
    function at(rank) {
      let total = 0;
      for (let value = 1; value <= 1000; value++) { total += frequencies[value]; if (total >= rank) return value; }
    }
    result.median = (at(Math.floor((count + 1) / 2)) + at(Math.floor((count + 2) / 2))) / 2;
  }
  const output = path.join('.', `processed_${n}.txt`);
  await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log('Прогресс: 100%');
  console.log(result);
  console.log(`Сохранено: ${output}; время: ${((performance.now() - started) / 1000).toFixed(2)} с`);
});
