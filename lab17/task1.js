const [command, ...args] = process.argv.slice(2);
const help = 'Использование: node task1.js <команда> [аргументы]\ngreet <имя> - приветствие\ninfo - информация о студенте';
if (!command || command === '--help') console.log(help);
else if (command === 'greet' && args.length === 1 && args[0].trim()) console.log(`Привет, ${args[0]}! Добро пожаловать в CLI-приложение группы 477.`);
else if (command === 'info' && args.length === 0) console.log(`Группа: 477\nСтудент: Парфёнок Иван\nЛабораторная работа: №17\nДата: ${new Date().toLocaleDateString('ru-RU')}`);
else { console.error(`Ошибка: неизвестная команда или неверные аргументы: ${command}\n${help}`); process.exitCode = 1; }
