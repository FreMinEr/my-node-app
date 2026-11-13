const { client, database, run } = require('./db');
run(async () => {
  console.log('=== Короткоживущий MongoClient, maxPoolSize=1 ===');
  const single = client({ maxPoolSize: 1 });
  try { await single.connect(); console.log('ping:', await single.db(database).command({ ping: 1 })); }
  finally { await single.close(); }
  console.log('=== Переиспользуемый MongoClient, пул до 10 ===');
  const connection = client({ maxPoolSize: 10, heartbeatFrequencyMS: 1000 });
  connection.on('serverHeartbeatSucceeded', () => console.log(`[HEARTBEAT] Успех: ${new Date().toISOString()}`));
  connection.on('serverHeartbeatFailed', event => console.log(`[HEARTBEAT] Ошибка: ${event.failure.name}`));
  try {
    await connection.connect(); const db = connection.db(database);
    console.log('База:', database, 'ping:', await db.command({ ping: 1 }));
    console.log('Версия:', (await db.command({ buildInfo: 1 })).version);
    console.log('Доступные БД:', (await db.admin().listDatabases({ authorizedDatabases: true })).databases.map(item => item.name));
    console.log('Коллекции:', (await db.listCollections({}, { nameOnly: true }).toArray()).map(item => item.name));
    console.log('Наблюдение heartbeat 3 секунды; драйвер автоматически восстанавливает доступные соединения.');
    await new Promise(resolve => setTimeout(resolve, 3100));
    console.log('Повторный ping:', await db.command({ ping: 1 }));
  } finally { await connection.close(); console.log('MongoClient закрыт'); }
});
