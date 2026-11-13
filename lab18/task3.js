const os = require('node:os');
try {
  const interfaces = os.networkInterfaces();
  let primary;
  console.log('=== Сетевые интерфейсы, группа 477 ===');
  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      const maskedMac = address.mac.split(':').slice(0, 3).join(':') + ':**:**:**';
      console.log(`${name}: ${address.family} ${address.address}; MAC ${maskedMac}; внутренний: ${address.internal ? 'да' : 'нет'}`);
      if (!primary && !address.internal && (address.family === 'IPv4' || address.family === 4)) primary = `${name} (${address.address})`;
    }
  }
  console.log(`Всего интерфейсов: ${Object.keys(interfaces).length}; основной: ${primary || 'нет внешнего IPv4'}`);
  const user = os.userInfo();
  console.table({ username: user.username, uid: user.uid, gid: user.gid, home: user.homedir, shell: user.shell || 'не предоставлена ОС' });
  console.log(os.platform() === 'win32' ? 'UID/GID и проверка root неприменимы в Windows.' : user.uid === 0 ? 'Предупреждение: запущено от root!' : 'Пользователь не root.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
