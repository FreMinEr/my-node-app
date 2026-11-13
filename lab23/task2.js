const { randomUUID } = require('node:crypto');
const { client, database, run } = require('./db');
run(async () => {
  const connection = client(); const runId = randomUUID();
  try {
    await connection.connect(); const students = connection.db(database).collection('students');
    await students.createIndex({ group_name: 1 });
    const doc = (name, grade) => ({ name, group_name: '477', course: 2, grade, created_at: new Date(), lab23_run: runId });
    const one = await students.insertOne(doc('Парфёнок Иван', 4.5)); console.log('insertedId:', one.insertedId);
    console.log('insertedIds:', (await students.insertMany([doc('Мария', 3.8), doc('Петр', 4.2), doc('Анна', 2.5)])).insertedIds);
    const filter = { lab23_run: runId };
    console.log('Все документы текущего запуска:', await students.find(filter).toArray());
    console.log('Группа, сортировка:', await students.find({ ...filter, group_name: '477' }).sort({ grade: -1 }).toArray());
    console.log('Пагинация:', await students.find(filter).sort({ _id: 1 }).skip(1).limit(2).toArray());
    console.log('findOne:', await students.findOne({ _id: one.insertedId }));
    console.log('Проекция:', await students.find(filter, { projection: { _id: 0, name: 1, grade: 1 } }).toArray());
    console.log('updateOne:', await students.updateOne({ _id: one.insertedId }, { $set: { grade: 4.75 }, $push: { tags: 'lab23' } }));
    console.log('Повторное значение:', await students.updateOne({ _id: one.insertedId }, { $set: { grade: 4.75 } }));
    console.log('updateMany:', await students.updateMany(filter, { $inc: { course: 1 }, $unset: { tags: '' } }));
    console.log('deleteOne:', await students.deleteOne({ _id: one.insertedId }));
    console.log('deleteMany:', await students.deleteMany({ ...filter, grade: { $lt: 3 } }));
  } finally {
    try { await connection.db(database).collection('students').deleteMany({ lab23_run: runId }); }
    finally { await connection.close(); }
  }
});
