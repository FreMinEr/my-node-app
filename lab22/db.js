require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });
const mysql = require('mysql2');
const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'student', password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'group_477', charset: 'utf8mb4', connectTimeout: 3000,
};
if (config.user === 'root') throw new Error('Используйте отдельного пользователя student, не root.');
function describe(error) {
  const categories = { ECONNREFUSED: 'Сеть', ETIMEDOUT: 'Сеть', ENOTFOUND: 'Сеть',
    PROTOCOL_CONNECTION_LOST: 'Сеть', ER_ACCESS_DENIED_ERROR: 'Авторизация',
    ER_PARSE_ERROR: 'Синтаксис', ER_DUP_ENTRY: 'Конфликт', ER_BAD_NULL_ERROR: 'Ограничение',
    ER_NO_REFERENCED_ROW_2: 'Внешний ключ' };
  return `[${error.code || error.name}] ${categories[error.code] || 'Ошибка БД'}`;
}
function createManagedPool() {
  let current, stopped = false;
  function make() {
    const pool = mysql.createPool({ ...config, connectionLimit: 10 });
    pool.on('error', error => {
      console.error(`[POOL] ${describe(error)}`);
      if (error.fatal && !stopped && current === pool) {
        current = make(); pool.end(() => {}); console.log('[POOL] Пул пересоздан');
      }
    });
    return pool;
  }
  current = make();
  return { get raw() { return current; }, get promise() { return current.promise(); },
    async close() { stopped = true; await current.promise().end(); } };
}
function run(main) { main().catch(error => { console.error(describe(error)); process.exitCode = 1; }); }
module.exports = { mysql, config, describe, createManagedPool, run };
