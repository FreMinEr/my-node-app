const { EventEmitter } = require('node:events');
const emitter = new EventEmitter();
let onCount = 0, onceCount = 0;
emitter.on('tick', number => { onCount++; console.log(`[tick #${number}] on`); });
emitter.once('tick', number => { onceCount++; console.log(`[tick #${number}] once`); });
for (let i = 1; i <= 3; i++) emitter.emit('tick', i);
console.log(`on: ${onCount}; once: ${onceCount}`);
function first() { console.log('1. Группа 477'); }
function second() { console.log('2. Второй слушатель'); }
function third() { console.log('3. Третий слушатель'); }
emitter.addListener('order', first).on('order', second).on('order', third);
console.log('Слушатели:', emitter.listeners('order').map(listener => listener.name));
console.log('До удаления:', emitter.listenerCount('order'));
emitter.emit('order');
emitter.removeListener('order', second);
console.log('После удаления одного:', emitter.listenerCount('order'));
emitter.removeAllListeners('order');
console.log('После удаления всех:', emitter.listenerCount('order'));
