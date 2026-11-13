const os = require('node:os');
const seconds = Math.floor(os.uptime());
console.log('=== Информация о системе: Парфёнок Иван, группа 477 ===');
console.table({ platform: os.platform(), type: os.type(), architecture: os.arch(),
  release: os.release(), hostname: os.hostname(), uptimeSeconds: seconds,
  uptime: `${Math.floor(seconds / 3600)} ч ${Math.floor(seconds % 3600 / 60)} мин ${seconds % 60} сек` });
console.log(({ win32: 'Вы работаете в Windows', linux: 'Вы работаете в Linux', darwin: 'Вы работаете в macOS' })[os.platform()] || 'Неизвестная платформа');
