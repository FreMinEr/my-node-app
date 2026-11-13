const Router = require('@koa/router');
const controller = require('../controllers/users');
const { Joi, createSchema, updateSchema, querySchema, validationMiddleware: validate } = require('../validation');
function routes(stage) {
  const router = new Router({ prefix: '/api/users' });
  if (stage >= 3) {
    router.get('/search', validate(querySchema.append({ q: Joi.string().trim().min(1).max(100).required() }), 'query'), controller.search);
    router.get('/stats', controller.stats);
    router.get('/export', validate(querySchema, 'query'), controller.export);
  }
  router.get('/', validate(querySchema, 'query'), controller.list);
  router.get('/:id', controller.get);
  router.post('/', validate(createSchema), controller.create);
  router.put('/:id', validate(updateSchema), controller.update);
  router.delete('/:id', controller.delete);
  return router;
}
module.exports = { routes };
