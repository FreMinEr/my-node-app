const { createReadStream, createWriteStream } = require('node:fs');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { createHash } = require('node:crypto');
const { StringDecoder } = require('node:string_decoder');
const { fs, path, variant, exists, walk, run } = require('./common');

const textExtensions = new Set(['.txt', '.js', '.json']);
function compactWhitespace() {
  const decoder = new StringDecoder('utf8');
  let pending = '';
  // Обрабатываем целые строки, сохраняя символы UTF-8 на границах чанков.
  return new Transform({
    transform(chunk, encoding, callback) {
      const lines = (pending + decoder.write(chunk)).split('\n');
      pending = lines.pop();
      for (const line of lines) this.push(`${line.replace(/[\t ]+/g, ' ').trim()}\n`);
      callback();
    },
    flush(callback) {
      pending += decoder.end();
      if (pending) this.push(pending.replace(/[\t ]+/g, ' ').trim());
      callback();
    },
  });
}

async function digest(file, compact = false, algorithm = 'sha256') {
  const hash = createHash(algorithm);
  const stages = [createReadStream(file, { highWaterMark: 64 * 1024 })];
  if (compact) stages.push(compactWhitespace());
  stages.push(hash);
  await pipeline(...stages);
  return hash.digest('hex');
}

async function createSource(root) {
  if (await exists(root)) return;
  await fs.mkdir(root);
  const extensions = ['.txt', '.js', '.json', '.jpg', '.png', '.gif'];
  async function make(file, index) {
    // Для изображений нужны только тестовые байты: они не предназначены для просмотра.
    const isText = textExtensions.has(path.extname(file));
    const line = path.extname(file) === '.json' ? '{ "example": "data" }\n' : 'example   data\n';
    const total = index === 0 ? 1200000 : (index + 1) * 3000;
    async function* data() {
      let written = 0;
      while (written < total) {
        const chunk = isText ? Buffer.from(line.repeat(100)) : Buffer.alloc(4096, index);
        yield chunk; written += chunk.length;
      }
    }
    await pipeline(Readable.from(data()), createWriteStream(file, { flags: 'wx' }));
  }
  for (let i = 0; i < 20; i++) await make(path.join(root, `file_${i + 1}${extensions[i % extensions.length]}`), i);
  for (let i = 1; i <= 3; i++) {
    const folder = path.join(root, `folder_${i}`);
    await fs.mkdir(folder);
    await make(path.join(folder, `nested_${i}.txt`), i);
  }
  const { files } = await walk(root);
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(files.map(file => ({
    path: path.relative(root, file.path), size: file.size,
  })), null, 2));
}

async function compare(source, backup, n) {
  const sourceFiles = (await walk(source)).files;
  const backupFiles = await exists(backup) ? (await walk(backup)).files : [];
  const target = new Map(backupFiles.map(file => [path.relative(backup, file.path), file]));
  const report = { added: [], deleted: [], changed: [], identical: [] };
  for (const file of sourceFiles) {
    const relative = path.relative(source, file.path);
    const other = target.get(relative);
    if (!other) report.added.push(relative);
    else {
      const compressed = n <= 5 && textExtensions.has(path.extname(file.path));
      // Сравниваем именно ожидаемую копию, учитывая удаление лишних пробелов.
      const same = await digest(file.path, compressed) === await digest(other.path);
      report[same ? 'identical' : 'changed'].push(relative);
    }
    target.delete(relative);
  }
  report.deleted = [...target.keys()];
  return report;
}

run(async () => {
  const n = variant();
  const source = path.join('.', `source_${n}`);
  const backup = path.join('.', `backup_${n}`);
  const reportFile = path.join('.', `sync_report_${n}.txt`);
  if (process.argv.includes('--compare')) {
    const report = await compare(source, backup, n);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    console.log(report); return;
  }
  await createSource(source);
  const before = await compare(source, backup, n);
  const changed = new Set([...before.added, ...before.changed]);
  await fs.mkdir(backup, { recursive: true });
  const { files, directories } = await walk(source);
  for (const folder of directories) await fs.mkdir(path.join(backup, path.relative(source, folder)), { recursive: true });
  let copied = 0, skipped = 0, streamed = 0;
  for (const file of files) {
    const relative = path.relative(source, file.path);
    if (n >= 11 && n <= 15 && !changed.has(relative)) { skipped++; continue; }
    const target = path.join(backup, relative);
    const text = textExtensions.has(path.extname(file.path));
    if (text || file.size > 1024 * 1024) {
      const stages = [createReadStream(file.path, { highWaterMark: file.size > 1024 * 1024 ? 512 * 1024 : 64 * 1024 })];
      if (text && n <= 5) stages.push(compactWhitespace());
      stages.push(createWriteStream(target));
      await pipeline(...stages); streamed++;
    } else await fs.copyFile(file.path, target);
    if (n >= 6 && n <= 10 && file.size > 500 * 1024) {
      if (await digest(file.path, false, 'md5') !== await digest(target, false, 'md5')) throw new Error(`MD5 не совпадает: ${relative}`);
      console.log(`MD5 проверен: ${relative}`);
    }
    copied++; console.log(`Копирование: ${copied + skipped}/${files.length} - ${relative}`);
  }
  if (n >= 16) {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    const completion = pipeline(archive, createWriteStream(path.join('.', `backup_${n}.zip`)));
    archive.directory(backup, false);
    await Promise.all([completion, archive.finalize()]);
  }
  const after = await compare(source, backup, n);
  const report = { before, after, copied, skipped, streamed, ordinary: copied - streamed };
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(report);
});
