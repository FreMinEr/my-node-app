const { scrypt, randomBytes } = require('node:crypto');
const derive = require('node:util').promisify(scrypt);
async function hash(password) {
  if (!password) return undefined;
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await derive(password, salt, 64)).toString('hex')}`;
}
const failure = (status, message) => Object.assign(new Error(message), { status });
function createUserService(User) {
  return {
    list: options => User.findAll(options), stats: () => User.stats(), export: options => User.exportCursor(options),
    async get(id) { const user = await User.findById(id); if (!user) throw failure(404, 'User not found'); return user; },
    async create(data) {
      if (await User.findByEmail(data.email)) throw failure(409, 'Email already exists');
      const user = await User.create(data, await hash(data.password));
      console.log(`[SERVICE] Создан пользователь ${user._id}; email-уведомление: ИМИТАЦИЯ (не отправлялось)`);
      return user;
    },
    async update(id, data) {
      await this.get(id);
      if (data.email) { const other = await User.findByEmail(data.email); if (other && other._id.toString() !== id) throw failure(409, 'Email already exists'); }
      const user = await User.update(id, data, await hash(data.password));
      if (!user) throw failure(404, 'User not found');
      console.log(`[SERVICE] Обновлен пользователь ${id}`); return user;
    },
    async delete(id) { if (!await User.delete(id)) throw failure(404, 'User not found'); console.log(`[SERVICE] Удален пользователь ${id}`); return { id, deleted: true }; },
  };
}
module.exports = { createUserService };
