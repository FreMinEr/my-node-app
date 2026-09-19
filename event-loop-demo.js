setTimeout(() => {
    console.log('1. setTimeout');
}, 0);

setImmediate(() => {
    console.log('2. setImmediate');
});

process.nextTick(() => {
    console.log('3. process.nextTick');
});

Promise.resolve().then(() => {
    console.log('4. Promise.then');
});

console.log('5. Синхронный код');

/*
Порядок вывода:
5. Синхронный код
3. process.nextTick
4. Promise.then
1. setTimeout
2. setImmediate

Почему так:
- Сначала выполняется синхронный код (стек вызовов).
- Затем очередь process.nextTick (не фаза цикла событий, выполняется сразу после текущей операции).
- Затем микрозадачи Promise.then.
- Затем фаза timers: setTimeout(0).
- Затем фаза check: setImmediate.
*/
