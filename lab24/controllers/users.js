const { Readable } = require('node:stream');
const service = ctx => ctx.state.userService;
module.exports = {
  async list(ctx) {
    const result = await service(ctx).list(ctx.state.query || {});
    ctx.body = { ...result, error: null };
  },
  async get(ctx) { ctx.body = { data: await service(ctx).get(ctx.params.id), error: null }; },
  async create(ctx) { ctx.body = { data: await service(ctx).create(ctx.state.body), error: null }; ctx.status = 201; },
  async update(ctx) { ctx.body = { data: await service(ctx).update(ctx.params.id, ctx.state.body), error: null }; },
  async delete(ctx) { ctx.body = { data: await service(ctx).delete(ctx.params.id), error: null }; },
  async stats(ctx) { ctx.body = { data: await service(ctx).stats(), error: null }; },
  async search(ctx) { const result = await service(ctx).list({ ...ctx.state.query, search: ctx.state.query.q }); ctx.body = { ...result, found: result.pagination.total, error: null }; },
  async export(ctx) {
    const cursor = service(ctx).export(ctx.state.query);
    const quote = value => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return `"${text.replaceAll('"', '""')}"`;
    };
    async function* csv() {
      try {
        yield '\uFEFFid,name,email,group_name,age,course\r\n';
        for await (const user of cursor) yield [user._id, user.name, user.email, user.group_name, user.age, user.course].map(quote).join(',') + '\r\n';
      } finally { await cursor.close(); }
    }
    ctx.type = 'text/csv; charset=utf-8'; ctx.attachment('users.csv'); ctx.body = Readable.from(csv());
  },
};
