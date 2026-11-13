# Лабораторная работа №17

Парфёнок Иван, группа 477. Задания 1-3.

```powershell
cd lab17
npm ci
node task1.js
node task1.js greet Иван
node task1.js info
node task1.js unknown
$LASTEXITCODE
node task2.js --help
node task2.js generate --help
node task2.js generate --type json --output output.json --verbose
node task2.js generate --type html --dry-run
node task2.js generate --type unknown
node task2.js --version
node task3.js init
node task3.js init --name demo-cli --type cli --typescript --prettier --git
node task3.js init --no-interactive
'demo-pipe' | node task3.js init --type cli
npm test
```

Задание 1 демонстрирует аргументы и коды выхода 0/1. Задание 2 использует
commander: generate создает настоящий HTML/PDF/JSON/CSV, convert переводит
плоский JSON в CSV. PDF требует TTF-шрифт с кириллицей (можно задать REPORT_FONT).
Существующий файл защищен от перезаписи без `--force`, dry-run не пишет файлы.
Задание 3 использует пять типов вопросов inquirer; при наличии имени и типа
или при вводе через stdin вопросов нет. Создается каталог с project.json,
при `--git` выполняется git init. Ввод токена учебный, токен не сохраняется.

## Результаты запуска

[Протоколы, изображения и результаты проверок](report/README.md).
