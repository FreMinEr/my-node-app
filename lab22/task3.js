const { mysql, config, describe, createManagedPool, run } = require('./db');
async function expectError(label, action) {
  try { await action(); throw new Error(`Ожидаемая ошибка не возникла: ${label}`); }
  catch (error) { if (!error.code) throw error; console.log(`${label}: ${describe(error)}`); }
}
run(async () => {
  await expectError('Недоступный адрес', async () => {
    const connection = await require('mysql2/promise').createConnection({ ...config, host: '127.0.0.1', port: 1 });
    try { await connection.query('SELECT 1'); } finally { await connection.end(); }
  });
  await expectError('Неверный пароль', async () => {
    const connection = await require('mysql2/promise').createConnection({ ...config, password: 'intentionally-wrong-' + Date.now() });
    try { await connection.query('SELECT 1'); } finally { await connection.end(); }
  });
  const pool = createManagedPool();
  try {
    const connection = await pool.promise.getConnection();
    try {
      await connection.query('CREATE TEMPORARY TABLE lab22_errors(id INT PRIMARY KEY, name VARCHAR(100) NOT NULL)');
      await connection.execute('INSERT INTO lab22_errors VALUES (?,?)', [1, 'Иван']);
      await expectError('Синтаксис', () => connection.query('SELECT * FRM lab22_errors'));
      await expectError('Дубликат', () => connection.execute('INSERT INTO lab22_errors VALUES (?,?)', [1, 'Дубликат']));
      await expectError('NOT NULL', () => connection.execute('INSERT INTO lab22_errors VALUES (?,?)', [2, null]));
      await connection.beginTransaction();
      try {
        await connection.execute('INSERT INTO lab22_errors VALUES (?,?)', [2, 'Тест']);
        await connection.execute('INSERT INTO lab22_errors VALUES (?,?)', [1, 'Дубликат']);
        await connection.commit();
      } catch (error) { await connection.rollback(); console.log(`ROLLBACK: ${describe(error)}`); }
      console.log('После отката:', (await connection.query('SELECT COUNT(*) AS count FROM lab22_errors'))[0]);
    } finally { connection.release(); }
    console.log('Проверка обработчика пула: искусственное событие, не реальный обрыв сети');
    pool.raw.emit('error', Object.assign(new Error('Учебный обрыв'), { code: 'PROTOCOL_CONNECTION_LOST', fatal: true }));
    console.log('Новый пул работает:', (await pool.promise.query('SELECT 1 AS ok'))[0]);
    const streamConnection = await pool.promise.getConnection();
    try {
      // Временная таблица принадлежит только этому соединению.
      await streamConnection.query('CREATE TEMPORARY TABLE big_data(id INT PRIMARY KEY, value VARCHAR(100))');
      for (let start = 0; start < 100000; start += 1000) {
        const rows = Array.from({ length: 1000 }, (_, i) => [start + i, `Группа 477, запись ${start + i}`]);
        await streamConnection.query('INSERT INTO big_data VALUES ?', [rows]);
      }
      global.gc?.(); let peak = process.memoryUsage().heapUsed; const before = peak;
      const started = performance.now(); let count = 0;
      await new Promise((resolve, reject) => {
        const stream = streamConnection.connection.query('SELECT * FROM big_data').stream({ highWaterMark: 1000 });
        stream.on('data', () => { count++; if (count % 10000 === 0) { peak = Math.max(peak, process.memoryUsage().heapUsed); console.log(`[STREAM] ${count}/100000`); } });
        stream.on('end', resolve); stream.on('error', reject);
      });
      console.log(`Поток: ${count}, ${(performance.now() - started).toFixed(1)} мс; наблюдаемый прирост heap ${((peak - before) / 1024 ** 2).toFixed(2)} МБ`);
      global.gc?.(); const fullBefore = process.memoryUsage().heapUsed;
      const [all] = await streamConnection.query('SELECT * FROM big_data');
      console.log(`SELECT целиком: ${all.length}; прирост heap ${((process.memoryUsage().heapUsed - fullBefore) / 1024 ** 2).toFixed(2)} МБ`);
    } finally { streamConnection.release(); }
  } finally { await pool.close(); }
});
