const { fs, path, variant, walk, run } = require('./common');

run(async () => {
  const n = variant();
  const directory = path.relative(process.cwd(), path.resolve(process.argv[2] || '.')) || '.';
  const result = await walk(directory, entry => n >= 6 && n <= 10 &&
    entry.isDirectory() && ['node_modules', '.git'].includes(entry.name));
  const files = result.files.filter(file => {
    if (n <= 5) return file.size <= 10 * 1024 * 1024;
    if (n >= 11 && n <= 15) return ['.js', '.json', '.txt', '.md'].includes(path.extname(file.path).toLowerCase());
    return true;
  });
  const byExtension = {};
  for (const file of files) {
    const extension = path.extname(file.path).toLowerCase() || '(без расширения)';
    (byExtension[extension] ??= []).push(file);
  }
  const bytes = files.reduce((sum, file) => sum + file.size, 0);
  const sorted = [...files].sort((a, b) => a.size - b.size || a.path.localeCompare(b.path));
  const report = {
    directory, variant: n, fileCount: files.length, directoryCount: result.directories.length,
    bytes, kilobytes: bytes / 1024, megabytes: bytes / 1024 ** 2, byExtension,
    smallest: sorted.slice(0, 5), largest: sorted.slice(-5).reverse(),
    ...(n >= 16 ? { matchingVariant: files.filter(file => path.basename(file.path).includes(String(n))) } : {}),
  };
  console.log(JSON.stringify(report, null, 2));
  const output = path.join('.', `report_${n}.json`);
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Отчет сохранен: ${output}`);
});
