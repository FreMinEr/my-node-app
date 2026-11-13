const { fs, path, variant, run } = require('./common');

run(async () => {
  const n = variant();
  const profile = JSON.parse(await fs.readFile(path.join('lab14', 'student.json'), 'utf8'));
  if (!profile.name || !profile.group || !Array.isArray(profile.favorites) ||
      profile.favorites.length !== 5 || profile.favorites.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error('Заполните имя, группу и пять любимых книг/фильмов в lab14/student.json.');
  }
  const lines = [
    `Студент: ${profile.name}`, `Группа: ${profile.group}`, `Вариант: ${n}`,
    `Дата: ${new Date().toLocaleString('ru-RU')}`, 'Любимые книги/фильмы:',
    ...profile.favorites.map((item, index) => `${index + 1}. ${item}`),
  ];
  const file = path.join('.', `student_${n}.txt`);
  await fs.writeFile(file, `${lines.join('\n')}\n`, 'utf8');
  // Считаем строки до добавления итоговой записи.
  await fs.appendFile(file, `Количество записей: ${lines.length}\n`, 'utf8');
  console.log(`Создан файл: ${file}\n${'─'.repeat(40)}`);
  console.log(await fs.readFile(file, 'utf8'));
  console.log('─'.repeat(40));
});
