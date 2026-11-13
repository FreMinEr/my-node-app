const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

function createApp(stage = 3) {
  const app = new Koa();
  const router = new Router();
  const users = [];
  let nextId = 1;
  if (stage >= 3) app.use(async (ctx, next) => {
    const start = new Date();
    const clock = performance.now();
    try { await next(); }
    finally { console.log(`[${start.toISOString()} -> ${new Date().toISOString()}] ${ctx.method} ${ctx.path} ${ctx.status} - ${(performance.now() - clock).toFixed(2)}ms`); }
  });
  app.use(async (ctx, next) => {
    try {
      await next();
      if (ctx.status === 404 && !ctx.body) ctx.throw(404, 'Маршрут не найден');
    } catch (error) {
      ctx.status = error.status || 500;
      ctx.body = { error: ctx.status === 500 ? 'Внутренняя ошибка сервера' : error.message, status: ctx.status };
    }
  });
  app.use(bodyParser({ jsonLimit: '1mb' }));
  router.get('/', ctx => {
    ctx.type = 'html';
    ctx.body = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Лаба 15</title><h1>Лабораторная работа №15</h1><p>Добро пожаловать!</p><p>Парфёнок Иван, группа 477</p><p>${new Date().toLocaleString('ru-RU')}</p></html>`;
  });
  if (stage >= 2) {
    function validate(ctx) {
      const body = ctx.request.body;
      ctx.assert(body && typeof body.name === 'string' && body.name.trim() &&
        typeof body.group === 'string' && body.group.trim(), 400, 'Нужны непустые name и group');
      return { name: body.name.trim(), group: body.group.trim() };
    }
    function find(ctx) {
      const user = users.find(item => item.id === Number(ctx.params.id));
      ctx.assert(user, 404, 'Пользователь не найден'); return user;
    }
    router.get('/api/users', ctx => { ctx.body = users; });
    router.get('/api/users/:id', ctx => { ctx.body = find(ctx); });
    router.post('/api/users', ctx => {
      const data = validate(ctx);
      const user = { id: nextId++, ...data }; users.push(user);
      ctx.status = 201; ctx.body = user;
    });
    router.put('/api/users/:id', ctx => { const user = find(ctx); Object.assign(user, validate(ctx)); ctx.body = user; });
    router.delete('/api/users/:id', ctx => {
      const user = find(ctx); users.splice(users.indexOf(user), 1);
      ctx.body = { message: 'Пользователь удален', id: user.id };
    });
  }
  if (stage >= 3) {
    router.get('/protected', async (ctx, next) => {
      // В учебном задании проверяется только наличие заголовка, не подлинность токена.
      ctx.assert(ctx.get('Authorization').trim(), 401, 'Требуется Authorization'); await next();
    }, ctx => { ctx.body = { message: 'Доступ разрешен', group: '477' }; });
    router.get('/error', () => { throw new Error('Тестовая ошибка'); });
  }
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}

function start(stage) {
  const server = createApp(stage).listen(Number(process.env.PORT || 3000), () => console.log(`Лаба 15, задание ${stage}: http://localhost:${server.address().port}`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createApp, start };
