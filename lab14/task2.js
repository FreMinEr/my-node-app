const { fs, path, variant, exists, run } = require('./common');

async function tree(directory, indent = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    console.log(`${indent}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);
    if (entry.isDirectory()) await tree(path.join(directory, entry.name), `${indent}  `);
  }
}

run(async () => {
  const n = variant();
  const root = path.join('.', `project_${n}`);
  if (await exists(root)) throw new Error(`${root} уже существует; используйте отдельную рабочую директорию.`);
  const folders = {
    '': 'Корень проекта', src: 'Исходный код', 'src/modules': 'Модули',
    'src/components': 'Компоненты', 'src/utils': 'Вспомогательные функции',
    data: 'Данные', 'data/input': 'Входные данные', 'data/output': 'Результаты', temp: 'Временные файлы',
  };
  if (n % 2) for (let i = 1; i <= 3; i++) folders[`src/components/${i}`] = `Компонент ${i}`;
  for (const [relative, description] of Object.entries(folders)) {
    const folder = path.join(root, relative);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, 'info.txt'), `${description}\n`, 'utf8');
    if (n % 2 === 0) await fs.writeFile(path.join(folder, 'README.md'), `${new Date().toISOString()}\n`);
  }
  console.log(`Исходная структура ${root}:`);
  await tree(root);
  await fs.rename(path.join(root, 'temp'), path.join(root, 'data', 'temp'));
  await fs.rename(path.join(root, 'data', 'output'), path.join(root, 'data', 'results'));
  // Удаляем только созданную этим запуском временную папку.
  await fs.rm(path.join(root, 'data', 'temp'), { recursive: true });
  console.log('\nОбновленная структура:');
  await tree(root);
});
