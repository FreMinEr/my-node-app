const { createManagedPool, run } = require('./db');
run(async () => {
  const pool = createManagedPool();
  try {
    await pool.promise.query(`CREATE TABLE IF NOT EXISTS students (
      id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL,
      group_name VARCHAR(20) NOT NULL, course INT NOT NULL, grade DECIMAL(3,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('Таблица students создана');
    const connection = await pool.promise.getConnection();
    try {
      // Демонстрация в транзакции: в конце откат, существующие данные сохраняются.
      await connection.beginTransaction();
      const [insert] = await connection.execute('INSERT INTO students(name,group_name,course,grade) VALUES (?,?,?,?)', ['Парфёнок Иван', '477', 2, 4.5]);
      console.log('INSERT:', { insertId: insert.insertId, affectedRows: insert.affectedRows });
      const [bulk] = await connection.query('INSERT INTO students(name,group_name,course,grade) VALUES ?', [[['Мария', '477', 2, 3.8], ['Петр', '477', 3, 4.2], ['Анна', '477', 1, 4.9]]]);
      console.log('INSERT MANY:', bulk.affectedRows);
      console.log('Все студенты:'); console.table((await connection.query('SELECT * FROM students'))[0]);
      console.log('Фильтр и сортировка:'); console.table((await connection.execute('SELECT * FROM students WHERE group_name=? ORDER BY grade DESC', ['477']))[0]);
      console.log('Пагинация:'); console.table((await connection.query('SELECT * FROM students ORDER BY id LIMIT ? OFFSET ?', [2, 1]))[0]);
      for (let i = 0; i < 2; i++) {
        const [update] = await connection.execute('UPDATE students SET grade=? WHERE id=?', [4.75, insert.insertId]);
        console.log('UPDATE:', { affectedRows: update.affectedRows, changedRows: update.changedRows });
      }
      const injection = "' OR 1=1 -- ";
      console.log('Небезопасная конкатенация (только SELECT в учебной транзакции):');
      console.log('Строк:', (await connection.query(`SELECT id FROM students WHERE name='${injection}'`))[0].length);
      console.log('Плейсхолдер, строк:', (await connection.execute('SELECT id FROM students WHERE name=?', [injection]))[0].length);
      console.log('DELETE ONE:', (await connection.execute('DELETE FROM students WHERE id=?', [insert.insertId]))[0].affectedRows);
      console.log('DELETE GROUP (будет отменено):', (await connection.execute('DELETE FROM students WHERE group_name=?', ['477']))[0].affectedRows);
    } finally { await connection.rollback(); connection.release(); console.log('Демонстрационные изменения отменены'); }
  } finally { await pool.close(); }
});
