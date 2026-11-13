const { Command, Option } = require('commander');
const fs = require('node:fs/promises');
const path = require('node:path');

const program = new Command().name('my-cli').version('1.0.0');
program.command('init').option('--name <name>', 'Название проекта')
  .addOption(new Option('--type <type>', 'Тип').choices(['web', 'cli', 'library', 'microservice']))
  .option('--typescript').option('--eslint').option('--prettier').option('--jest').option('--git')
  .option('--no-interactive', 'Отключить диалог')
  .action(async options => {
    if (!process.stdin.isTTY) {
      let input = '';
      for await (const chunk of process.stdin) {
        input += chunk;
        if (input.length > 4096) throw new Error('Слишком много данных stdin');
      }
      options.name ||= input.trim();
      options.interactive = false;
    }
    let features = ['typescript', 'eslint', 'prettier', 'jest'].filter(key => options[key]);
    if ((!options.name || !options.type) && options.interactive !== false) {
      const { default: inquirer } = await import('inquirer');
      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Название проекта:', when: !options.name, validate: value => /^[a-zA-Z0-9_-]+$/.test(value) || 'Латинские буквы, цифры, _ и -' },
        { type: 'select', name: 'type', message: 'Тип проекта:', choices: ['web', 'cli', 'library', 'microservice'], when: !options.type },
        { type: 'checkbox', name: 'features', message: 'Дополнительные опции:', choices: ['typescript', 'eslint', 'prettier', 'jest'], default: features },
        { type: 'confirm', name: 'git', message: 'Использовать Git?', default: Boolean(options.git) },
        { type: 'password', name: 'token', message: 'Учебный токен (не сохраняется):', mask: '*' },
      ]);
      options = { ...options, ...answers }; features = answers.features;
      delete options.token;
    }
    if (!options.name || !options.type) throw new Error('В неинтерактивном режиме необходимы --name и --type.');
    if (!/^[a-zA-Z0-9_-]+$/.test(options.name)) throw new Error('Недопустимое имя проекта.');
    const directory = path.join(process.cwd(), options.name);
    await fs.mkdir(directory); // Не перезаписываем существующий проект.
    const config = { name: options.name, type: options.type, features, git: Boolean(options.git), group: '477' };
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(config, null, 2));
    if (options.git) {
      const { execFile } = require('node:child_process');
      await require('node:util').promisify(execFile)('git', ['init'], { cwd: directory });
    }
    console.log(`Проект "${options.name}" инициализирован:\n${JSON.stringify(config, null, 2)}`);
  });
program.parseAsync().catch(error => { console.error(`Ошибка: ${error.message}`); process.exitCode = 1; });
