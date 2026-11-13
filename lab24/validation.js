const Joi = require('joi');
// Методичка использует ББМО-XX-XX; дополнительно разрешена реальная группа автора 477.
const group = Joi.string().pattern(/^(?:477|ББМО-\d{2}-\d{2})$/);
const fields = {
  name: Joi.string().trim().min(2).max(100), email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }),
  group_name: group, age: Joi.number().integer().min(16).max(100), course: Joi.number().integer().min(1).max(4),
  password: Joi.string().min(8).max(100),
};
const createSchema = Joi.object({ ...fields, name: fields.name.required(), email: fields.email.required(), group_name: group.required() });
const updateSchema = Joi.object(fields).min(1);
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).max(1000000).default(1), limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', '-name', 'age', '-age', 'created_at', '-created_at', 'email', '-email', 'course', '-course'),
  group_name: group, course: Joi.number().integer().min(1).max(4), age_min: Joi.number().integer().min(16).max(100),
  age_max: Joi.number().integer().min(Joi.ref('age_min', { adjust: value => value ?? 16 })).max(100),
  search: Joi.string().trim().min(1).max(100),
});
function validate(schema, data, convert = false) {
  const { value, error } = schema.validate(data, { abortEarly: false, convert, allowUnknown: false });
  if (error) throw Object.assign(new Error('Validation failed'), { status: 400,
    details: error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message })) });
  return value;
}
function validationMiddleware(schema, source = 'body') {
  return async (ctx, next) => {
    ctx.state[source] = validate(schema, source === 'body' ? ctx.request.body : ctx.query, source === 'query');
    await next();
  };
}
module.exports = { createSchema, updateSchema, querySchema, validate, validationMiddleware, Joi };
