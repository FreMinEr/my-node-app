const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./app');
test('CRUD, поиск, gzip/deflate, ошибки и лимит 100 запросов', async t => {
  const server = createApp().listen(0);
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://localhost:${server.address().port}`;
  const request = (url, method = 'GET', body) => fetch(base + url, { method,
    headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  let response = await request('/api/books', 'POST', { title: 'Книга', author: 'Автор', year: 2020 });
  assert.equal(response.status, 201); const book = await response.json();
  assert.equal((await (await request('/api/books/search?author=' + encodeURIComponent('Автор'))).json()).length, 1);
  assert.equal((await request(`/api/books/${book.id}`, 'PUT', { year: 'bad' })).status, 400);
  assert.equal((await request(`/api/books/${book.id}`, 'PUT', { year: 2021 })).status, 200);
  assert.equal((await request(`/api/books/${book.id}`, 'DELETE')).status, 200);
  assert.equal((await request(`/api/books/${book.id}`)).status, 404);
  for (const url of ['/error', '/async-error']) assert.equal((await request(url)).status, 500);
  for (const encoding of ['gzip', 'deflate']) {
    response = await fetch(base, { headers: { 'Accept-Encoding': encoding } });
    assert.equal(response.headers.get('content-encoding'), encoding);
    assert.match(await response.text(), /Группа 477/);
  }
  // Осталось 90 успешных запросов из 100 в текущем окне.
  for (let i = 0; i < 90; i++) assert.equal((await request('/')).status, 200);
  response = await request('/'); assert.equal(response.status, 429);
  assert.ok(response.headers.get('retry-after'));
});
