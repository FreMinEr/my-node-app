# Лабораторная работа №19

Парфёнок Иван, группа 477. Задания 1-3, встроенный EventEmitter.

```powershell
node lab19/task1.js
node lab19/task2.js
node lab19/task3.js
```

1. События greet/info/bye, возвращаемые true и false от emit.
2. on вызывается три раза, once один; addListener, listeners, listenerCount,
   removeListener, removeAllListeners; последовательность вызова слушателей.
3. DatabaseConnection наследует EventEmitter и моделирует БД в памяти.
   connect/query/close/error логируются. Отдельно показано исключение при
   отсутствии обработчика error; оно перехвачено, чтобы завершить демонстрацию.

Внешняя база данных и зависимости для этой лабораторной не нужны.

## Результаты запуска

[Протоколы, изображения и результаты проверок](report/README.md).
