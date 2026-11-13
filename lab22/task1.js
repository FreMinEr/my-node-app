const { mysql, config, createManagedPool, run } = require('./db');
const sql = 'SELECT VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS user';
run(async () => {
  console.log('=== Одиночное соединение ===');
  const connection = await require('mysql2/promise').createConnection(config);
  try { console.table((await connection.query(sql))[0]); }
  finally { await connection.end(); console.log('Соединение закрыто'); }
  console.log('=== Пул: максимум 10 соединений, открываются по необходимости ===');
  const pool = createManagedPool();
  try {
    console.table((await pool.promise.query(sql))[0]);
    console.log('Пул доступен для повторного запроса:', (await pool.promise.query('SELECT 477 AS group_number'))[0]);
  } finally { await pool.close(); }
});
