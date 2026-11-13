const { createUserModel } = require('./models/user');
const { createUserService } = require('./services/userService');
function dbMiddleware(db) {
  const userService = createUserService(createUserModel(db));
  return async (ctx, next) => { ctx.db = db; ctx.state.userService = userService; await next(); };
}
async function errorMiddleware(ctx, next) {
  ctx.set('X-Group', '477');
  try { await next(); if (ctx.status === 404 && !ctx.body) ctx.throw(404, 'Not found'); }
  catch (error) {
    const status = error.code === 11000 ? 409 : error.status || 500;
    ctx.status = status;
    ctx.body = { data: null, error: status === 409 ? 'Email already exists' : status >= 500 ? 'Internal server error' : error.message,
      status, ...(error.details ? { details: error.details } : {}) };
  }
}
async function loggerMiddleware(ctx, next) {
  const started = performance.now();
  try { await next(); } finally { console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.path} ${ctx.status} ${(performance.now() - started).toFixed(1)}ms`); }
}
module.exports = { dbMiddleware, errorMiddleware, loggerMiddleware };
