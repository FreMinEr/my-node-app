const { ObjectId } = require('mongodb');
const { createSchema, updateSchema, validate } = require('../validation');
function createUserModel(db) {
  const collection = db.collection('users');
  const idValue = id => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : null;
  const publicFields = { passwordHash: 0 };
  function filter(options) {
    const result = {};
    if (options.group_name) result.group_name = options.group_name;
    if (options.course) result.course = options.course;
    if (options.age_min !== undefined || options.age_max !== undefined) {
      result.age = {};
      if (options.age_min !== undefined) result.age.$gte = options.age_min;
      if (options.age_max !== undefined) result.age.$lte = options.age_max;
    }
    if (options.search) result.$text = { $search: options.search };
    return result;
  }
  return class User {
    static async findAll(options = {}) {
      const { page = 1, limit = 10, sort } = options;
      const query = filter(options);
      const projection = { ...publicFields, ...(options.search ? { score: { $meta: 'textScore' } } : {}) };
      const order = sort ? { [sort.replace(/^-/, '')]: sort.startsWith('-') ? -1 : 1, _id: 1 }
        : options.search ? { score: { $meta: 'textScore' }, _id: 1 } : { created_at: -1, _id: 1 };
      const [data, total] = await Promise.all([
        collection.find(query, { projection }).sort(order).skip((page - 1) * limit).limit(limit).toArray(),
        collection.countDocuments(query),
      ]);
      return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
    }
    static async findById(id) { const value = idValue(id); return value ? collection.findOne({ _id: value }, { projection: publicFields }) : null; }
    static async findByEmail(email) { return collection.findOne({ email }, { projection: publicFields }); }
    static async create(data, passwordHash) {
      const checked = validate(createSchema, data);
      const { password, ...safe } = checked;
      const document = { ...safe, created_at: new Date(), ...(passwordHash ? { passwordHash } : {}) };
      const { insertedId } = await collection.insertOne(document);
      return this.findById(insertedId.toHexString());
    }
    static async update(id, data, passwordHash) {
      const checked = validate(updateSchema, data); const value = idValue(id); if (!value) return null;
      const { password, ...safe } = checked;
      await collection.updateOne({ _id: value }, { $set: { ...safe, updated_at: new Date(), ...(passwordHash ? { passwordHash } : {}) } });
      return this.findById(id);
    }
    static async delete(id) { const value = idValue(id); return value ? (await collection.deleteOne({ _id: value })).deletedCount : 0; }
    static async stats() {
      const [result] = await collection.aggregate([{ $facet: {
        summary: [{ $group: { _id: null, total: { $sum: 1 }, averageAge: { $avg: '$age' } } }],
        byGroup: [{ $group: { _id: '$group_name', count: { $sum: 1 } } }],
        byCourse: [{ $group: { _id: '$course', count: { $sum: 1 } } }],
      } }]).toArray();
      return { total: result.summary[0]?.total || 0, averageAge: result.summary[0]?.averageAge ?? null,
        byGroup: Object.fromEntries(result.byGroup.map(item => [item._id, item.count])),
        byCourse: Object.fromEntries(result.byCourse.map(item => [item._id ?? 'не указан', item.count])) };
    }
    static exportCursor(options) { return collection.find(filter(options), { projection: publicFields }).sort({ _id: 1 }).batchSize(1000); }
  };
}
module.exports = { createUserModel };
