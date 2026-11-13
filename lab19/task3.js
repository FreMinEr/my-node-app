const { EventEmitter } = require('node:events');
class DatabaseConnection extends EventEmitter {
  connected = false;
  records = [{ name: 'Парфёнок Иван', group: '477' }];
  connect() { this.connected = true; this.emit('connect', 'Соединение установлено (учебная модель БД)'); }
  query(sql) {
    if (!this.connected) { this.error(new Error('Соединение закрыто')); return; }
    let result;
    if (sql === 'SELECT * FROM students') result = [...this.records];
    else if (sql === 'INSERT INTO students') { this.records.push({ name: 'Мария', group: '477' }); result = { inserted: 1 }; }
    else { this.error(new Error('Неизвестный учебный запрос')); return; }
    this.emit('query', sql, result); return result;
  }
  close() { this.connected = false; this.emit('close', 'Соединение закрыто'); }
  error(error) { this.emit('error', error); }
}
if (require.main === module) {
  const db = new DatabaseConnection();
  db.on('connect', message => console.log(`[477][connect] ${message}`));
  db.on('query', (sql, result) => console.log(`[477][query] ${sql}`, result));
  db.on('close', message => console.log(`[477][close] ${message}`));
  db.on('error', error => console.log(`[477][error] Обработано: ${error.message}`));
  db.connect(); db.query('SELECT * FROM students'); db.query('INSERT INTO students'); db.close();
  db.error(new Error('Connection timeout'));
  try { new DatabaseConnection().error(new Error('Нет слушателя error')); }
  catch (error) { console.log(`Без слушателя error возникает исключение: ${error.message}`); }
}
module.exports = { DatabaseConnection };
