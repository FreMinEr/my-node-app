const { Command, Option } = require('commander');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createWriteStream } = require('node:fs');
const { pipeline } = require('node:stream/promises');
const PDFDocument = require('pdfkit');

const program = new Command().name('my-cli').version('1.0.0')
  .description('CLI-приложение для лабораторной работы №17').option('-v, --verbose', 'Подробный вывод');
program.command('generate')
  .addOption(new Option('-t, --type <type>', 'Тип отчета').choices(['html', 'pdf', 'json', 'csv']).default('html'))
  .option('-o, --output <path>', 'Путь для сохранения').option('-f, --force', 'Перезаписать файл')
  .option('--dry-run', 'Показать действия без записи')
  .action(async options => {
    const output = path.resolve(options.output || `output.${options.type}`);
    if (options.dryRun) { console.log(`[DRY-RUN] Тип: ${options.type}; файл: ${output}. Запись не выполнена.`); return; }
    if (program.opts().verbose) console.error(`[VERBOSE] Генерация ${options.type}: ${output}`);
    const data = { student: 'Парфёнок Иван', group: '477', lab: 17, date: new Date().toISOString() };
    if (options.type === 'pdf') {
      const fonts = [process.env.REPORT_FONT, 'C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].filter(Boolean);
      let font;
      for (const candidate of fonts) { try { await fs.access(candidate); font = candidate; break; } catch {} }
      if (!font) throw new Error('Укажите путь к TTF-шрифту с кириллицей в REPORT_FONT.');
      const document = new PDFDocument();
      const done = pipeline(document, createWriteStream(output, { flags: options.force ? 'w' : 'wx' }));
      document.font(font).fontSize(18).text('Лабораторная работа №17');
      document.moveDown().fontSize(12).text(`Студент: ${data.student}\nГруппа: ${data.group}\nДата: ${data.date}`);
      document.end(); await done;
    } else {
      const content = options.type === 'json' ? JSON.stringify(data, null, 2) : options.type === 'csv'
        ? `student,group,lab,date\n"${data.student}",${data.group},${data.lab},${data.date}\n`
        : `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Отчет</title><h1>Лабораторная работа №17</h1><p>${data.student}, группа ${data.group}</p><p>${data.date}</p></html>`;
      await fs.writeFile(output, content, { flag: options.force ? 'w' : 'wx' });
    }
    console.log(`Отчет сохранен: ${output}`);
  });
program.command('convert').requiredOption('-i, --input <path>', 'Входной JSON')
  .requiredOption('-o, --output <path>', 'Выходной CSV').option('-f, --force', 'Перезаписать')
  .action(async options => {
    const data = JSON.parse(await fs.readFile(path.resolve(options.input), 'utf8'));
    if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Ожидается JSON-объект.');
    const quote = value => `"${String(value).replaceAll('"', '""')}"`;
    await fs.writeFile(path.resolve(options.output), `${Object.keys(data).map(quote).join(',')}\n${Object.values(data).map(quote).join(',')}\n`, { flag: options.force ? 'w' : 'wx' });
    console.log('Конвертация завершена.');
  });
program.parseAsync().catch(error => { console.error(`Ошибка: ${error.message}`); process.exitCode = 1; });
