const { randomUUID } = require('node:crypto');
const { client, database, run } = require('./db');
run(async () => {
  const connection = client();
  const suffix = randomUUID().replaceAll('-', '');
  let students, groups;
  const count = Number(process.env.LAB23_COUNT || 1000000);
  if (!Number.isInteger(count) || count < 1 || count > 1000000) throw new Error('LAB23_COUNT: от 1 до 1000000');
  try {
    await connection.connect(); const db = connection.db(database);
    students = db.collection(`lab23_big_${suffix}`); groups = db.collection(`lab23_groups_${suffix}`);
    await groups.insertMany(['477', '478', '479'].map(name => ({ name, curator: `Куратор ${name}` })));
    console.log(`Генерация ${count} документов порциями по 1000`);
    for (let start = 0; start < count; start += 1000) {
      await students.insertMany(Array.from({ length: Math.min(1000, count - start) }, (_, i) => {
        const id = start + i;
        return { name: id % 2 ? `Мария ${id}` : `Иван ${id}`, email: `student${id}@example.test`,
          group_name: String(477 + id % 3), course: 1 + id % 4, grade: 2 + (id % 301) / 100 };
      }));
      if ((start + 1000) % 100000 === 0) console.log(`Создано: ${start + 1000}`);
    }
    const sample = students.find().batchSize(1000);
    try { console.log('cursor.next():', await sample.next()); } finally { await sample.close(); }
    global.gc?.(); let peak = process.memoryUsage().heapUsed; const before = peak;
    let processed = 0; const started = performance.now();
    const cursor = students.find().batchSize(1000);
    try {
      for await (const doc of cursor) {
        processed++;
        if (processed % 10000 === 0) peak = Math.max(peak, process.memoryUsage().heapUsed);
      }
    } finally { await cursor.close(); }
    console.log(`Курсор: ${processed}; ${(performance.now() - started).toFixed(0)} мс; наблюдаемый прирост heap: ${((peak - before) / 1024 ** 2).toFixed(2)} МБ`);
    global.gc?.(); const fullBefore = process.memoryUsage().heapUsed;
    let all = await students.find().toArray();
    console.log(`toArray: ${all.length}; прирост heap: ${((process.memoryUsage().heapUsed - fullBefore) / 1024 ** 2).toFixed(2)} МБ`);
    all = null; global.gc?.();
    console.log('Средний балл:', await students.aggregate([{ $match: { grade: { $gte: 2 } } }, { $group: { _id: '$group_name', average: { $avg: '$grade' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray());
    console.log('По курсам:', await students.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray());
    console.log('Топ-10:', await students.aggregate([{ $sort: { grade: -1 } }, { $limit: 10 }, { $project: { _id: 0, name: 1, grade: 1 } }]).toArray());
    console.log('JOIN:', await students.aggregate([{ $group: { _id: '$group_name', count: { $sum: 1 } } }, { $lookup: { from: groups.collectionName, localField: '_id', foreignField: 'name', as: 'group' } }]).toArray());
    const query = { group_name: '477', grade: { $gte: 4.9 } };
    const beforeIndex = await students.find(query).explain('executionStats');
    await students.createIndex({ group_name: 1 });
    await students.createIndex({ group_name: 1, grade: -1 });
    await students.createIndex({ email: 1 }, { unique: true });
    const afterIndex = await students.find(query).explain('executionStats');
    for (const [label, stats] of [['Без индекса', beforeIndex], ['С индексом', afterIndex]]) {
      console.log(label, { ms: stats.executionStats.executionTimeMillis, docsExamined: stats.executionStats.totalDocsExamined, returned: stats.executionStats.nReturned });
    }
    await students.createIndex({ name: 'text' }, { default_language: 'russian' });
    console.log('Текстовый поиск:', await students.find({ $text: { $search: 'Иван' } }, { projection: { name: 1, score: { $meta: 'textScore' } } }).sort({ score: { $meta: 'textScore' } }).limit(5).toArray());
  } finally {
    // Удаляем только уникальные коллекции, созданные этим запуском.
    try {
      for (const collection of [students, groups]) if (collection) await collection.drop().catch(error => { if (error.code !== 26) throw error; });
    } finally { await connection.close(); }
  }
});
