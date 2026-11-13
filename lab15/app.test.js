const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./app');
test('HTML, CRUD, валидация, авторизация и обработка ошибок', async t => {
  const server = createApp().listen(0);
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://localhost:${server.address().port}`;
  const request = (url, method = 'GET', body) => fetch(base + url, { method,
    headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.match(await (await request('/')).text(), /группа 477/);
  assert.equal((await request('/api/users', 'POST', {})).status, 400);
  let response = await request('/api/users', 'POST', { name: 'Иван', group: '477' });
  assert.equal(response.status, 201); const user = await response.json();
  assert.equal((await (await request(`/api/users/${user.id}`)).json()).name, 'Иван');
  assert.equal((await request(`/api/users/${user.id}`, 'PUT', { name: 'Петр', group: '477' })).status, 200);
  assert.equal((await request(`/api/users/${user.id}`, 'DELETE')).status, 200);
  assert.equal((await request(`/api/users/${user.id}`)).status, 404);
  assert.equal((await request('/protected')).status, 401);
  assert.equal((await fetch(base + '/protected', { headers: { Authorization: 'demo' } })).status, 200);
  assert.equal((await request('/error')).status, 500);
  assert.equal((await request('/unknown')).status, 404);
  assert.equal((await fetch(base + '/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
});
