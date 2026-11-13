const fs = require('node:fs/promises');
const path = require('node:path');

function variant() {
  const value = Number(process.env.LAB_VARIANT ?? 17);
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error('Укажите LAB_VARIANT: целое число от 1 до 20.');
  }
  return value;
}

async function exists(file) {
  try { await fs.access(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

// Не следуем символическим ссылкам: обход не выходит за исходное дерево.
async function walk(directory, skip = () => false) {
  const files = [];
  const directories = [];
  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(current, entry.name);
      if (entry.isSymbolicLink() || skip(entry, file)) continue;
      if (entry.isDirectory()) {
        directories.push(file);
        await visit(file);
      } else if (entry.isFile()) {
        const stat = await fs.stat(file);
        files.push({ path: file, size: stat.size, modified: stat.mtimeMs });
      }
    }
  }
  await visit(directory);
  return { files, directories };
}

function run(main) {
  main().catch(error => {
    console.error(`Ошибка${error.code ? ` (${error.code})` : ''}: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { fs, path, variant, exists, walk, run };
