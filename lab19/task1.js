const { EventEmitter } = require('node:events');
const emitter = new EventEmitter();
emitter.on('greet', name => console.log(`[greet] Привет, ${name}!`));
emitter.on('info', () => console.log('[info] Парфёнок Иван, группа 477'));
emitter.on('bye', () => console.log('[bye] До свидания!'));
for (const [name, value] of [['greet', 'Иван'], ['info'], ['bye'], ['unknown']]) {
  console.log(`emit(${name}) -> ${emitter.emit(name, value)}`);
}
