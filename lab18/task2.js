const os = require('node:os');
const cpus = os.cpus();
console.log('=== Процессор, группа 477 ===');
console.log(`Логических ядер: ${cpus.length}; модель: ${cpus[0]?.model || 'недоступна'}`);
console.table(cpus.map((cpu, index) => ({ core: index + 1, MHz: cpu.speed })));
console.log(`Средняя частота: ${cpus.length ? (cpus.reduce((sum, cpu) => sum + cpu.speed, 0) / cpus.length).toFixed(2) : 0} МГц`);
const total = os.totalmem();
const free = os.freemem();
console.log(`Всего: ${(total / 1024 ** 3).toFixed(2)} ГБ; свободно: ${(free / 1024 ** 3).toFixed(2)} ГБ; использовано: ${(100 * (1 - free / total)).toFixed(2)}%`);
console.log(os.platform() === 'win32' ? 'Средняя загрузка за 1, 5, 15 минут недоступна в Windows.' : `Средняя загрузка (1/5/15 мин): ${os.loadavg().join(', ')}`);
function memoryMessage(totalBytes, freeBytes) {
  return freeBytes / totalBytes < 0.2 ? 'Предупреждение: свободно меньше 20% памяти!' : 'Память в норме';
}
console.log(memoryMessage(total, free));
// Демонстрация ветви предупреждения на заданных данных, без расходования реальной памяти.
if (process.argv.includes('--demo-low-memory')) console.log(`[ТЕСТ: свободно 10%] ${memoryMessage(100, 10)}`);
