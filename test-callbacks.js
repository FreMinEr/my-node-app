const FileManager = require('./fileOperations');

const fileManager = new FileManager('./test-data');

console.log('=== ТЕСТИРОВАНИЕ КОЛБЭКОВ ===\n');

console.log('1. Создание файла...');
fileManager.createFile('test1.txt', 'Привет, мир!', (err, filePath) => {
  if (err) {
    console.error(' ❌ Ошибка создания:', err.message);
    return;
  }
  console.log(` ✅ Файл создан: ${filePath}`);

  console.log('\n2. Чтение файла...');
  fileManager.readFile('test1.txt', (readErr, content) => {
    if (readErr) {
      console.error(' ❌ Ошибка чтения:', readErr.message);
      return;
    }
    console.log(` ✅ Содержимое: "${content}"`);

    console.log('\n3. Получение статистики...');
    fileManager.getFileStats('test1.txt', (statsErr, stats) => {
      if (statsErr) {
        console.error(' ❌ Ошибка статистики:', statsErr.message);
        return;
      }
      console.log(' ✅ Статистика:');
      console.log(` Размер: ${stats.size} байт`);
      console.log(` Создан: ${stats.created}`);
      console.log(` Изменён: ${stats.modified}`);

      console.log('\n4. Создание второго файла...');
      fileManager.createFile('test2.txt', 'Второй файл для демонстрации', (err2, filePath2) => {
        if (err2) {
          console.error(' ❌ Ошибка создания второго файла:', err2.message);
          return;
        }
        console.log(` ✅ Второй файл создан: ${filePath2}`);

        console.log('\n5. Список файлов...');
        fileManager.listFiles((listErr, files) => {
          if (listErr) {
            console.error(' ❌ Ошибка получения списка:', listErr.message);
            return;
          }
          console.log(' ✅ Файлы в директории:');
          files.forEach((file) => console.log(` - ${file}`));

          console.log('\n6. Очистка...');
          fileManager.deleteFile('test1.txt', (delErr1) => {
            if (delErr1) {
              console.error(' ❌ Ошибка удаления test1.txt:', delErr1.message);
              return;
            }
            console.log(' ✅ test1.txt удалён');
            fileManager.deleteFile('test2.txt', (delErr2) => {
              if (delErr2) {
                console.error(' ❌ Ошибка удаления test2.txt:', delErr2.message);
                return;
              }
              console.log(' ✅ test2.txt удалён');
              console.log('\n✅ Все операции завершены!');
              console.log('⚠ Обратите внимание на глубину вложенности колбэков!');
            });
          });
        });
      });
    });
  });
});
