const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const { connect } = require('./db');
const { routes } = require('./routes/users');
const { dbMiddleware, errorMiddleware, loggerMiddleware } = require('./middleware');
function createApp(db, stage = 3) {
  const app = new Koa();
  app.use(loggerMiddleware).use(errorMiddleware).use(bodyParser({ jsonLimit: '1mb' })).use(dbMiddleware(db));
  const router = routes(stage); app.use(router.routes()).use(router.allowedMethods());
  return app;
}
async function start(stage = 3) {
  const { client, db } = await connect();
  const server = createApp(db, stage).listen(Number(process.env.PORT || 3000), () => console.log(`MongoDB подключена; группа 477; http://localhost:${server.address().port}`));
  server.on('error', async error => { console.error(error.code); await client.close(); process.exitCode = 1; });
  const close = () => server.close(async () => { await client.close(); });
  process.once('SIGINT', close); process.once('SIGTERM', close);
}
if (require.main === module) start().catch(error => { console.error(error.name, error.code || 'Проверьте подключение'); process.exitCode = 1; });
module.exports = { createApp, start };
