const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { connect } = require('./db');
const { createApp } = require('./app');
test('REST API на реальной MongoDB: CRUD, уникальность, фильтры, поиск и CSV', async t => {
  const { client, db } = await connect();
  const ids = []; const prefix = randomUUID();
  const server = createApp(db).listen(0);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await db.collection('users').deleteMany({ email: { $regex: '^' + prefix } });
    await client.close();
  });
  const base = `http://localhost:${server.address().port}/api/users`;
  const request = async (url = '', method = 'GET', body) => {
    const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    assert.equal(response.headers.get('x-group'), '477');
    return response;
  };
  for (let i = 0; i < 3; i++) {
    const response = await request('', 'POST', { name: `Иван ${i}`, email: `${prefix}${i}@example.test`, group_name: '477', age: 20 + i, course: 2, password: 'demo-password' });
    assert.equal(response.status, 201, await response.clone().text());
    const { data } = await response.json(); ids.push(data._id);
    assert.equal(data.password, undefined); assert.equal(data.passwordHash, undefined);
  }
  assert.equal((await request('', 'POST', { name: 'Иван', email: `${prefix}0@example.test`, group_name: '477' })).status, 409);
  assert.equal((await request('', 'POST', { name: 'X', email: 'bad', group_name: 'wrong' })).status, 400);
  assert.equal((await request('/invalid-id')).status, 404);
  assert.equal((await request('?page=0')).status, 400);
  assert.equal((await request('?limit=101')).status, 400);
  assert.equal((await request('?sort=passwordHash')).status, 400);
  assert.equal((await request('?age_min=30&age_max=20')).status, 400);
  assert.equal((await request('?unknown=1')).status, 400);
  const filtered = await (await request('?group_name=477&course=2&age_min=20&age_max=22&sort=-age&limit=1')).json();
  assert.equal(filtered.data.length, 1); assert.equal(filtered.data[0].age, 22);
  assert.ok(filtered.pagination.total >= 3);
  assert.equal((await request('/' + ids[0], 'PUT', { age: 25 })).status, 200);
  assert.equal((await request('/' + ids[0], 'PUT', { email: `${prefix}1@example.test` })).status, 409);
  const searchResponse = await request('/search?q=' + encodeURIComponent('Иван'));
  assert.equal(searchResponse.status, 200, await searchResponse.clone().text());
  assert.ok((await searchResponse.json()).found >= 3);
  assert.ok((await (await request('/stats')).json()).data.total >= 3);
  const csv = await request('/export'); assert.match(csv.headers.get('content-type'), /text\/csv/);
  const csvText = await csv.text(); assert.match(csvText, /id,name,email,group_name,age,course/); assert.ok(csvText.includes(prefix)); assert.ok(!csvText.includes('scrypt:'));
  assert.equal((await request('/' + ids[0], 'DELETE')).status, 200);
  assert.equal((await request('/' + ids[0])).status, 404);
  console.log('Проверены: 201, 400, 404, 409; фильтры, сортировка, поиск, stats, CSV и скрытие хэша.');
});
