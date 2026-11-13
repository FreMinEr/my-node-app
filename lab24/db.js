require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });
const { MongoClient } = require('mongodb');
async function connect() {
  if (!process.env.MONGODB_URI) throw new Error('Заполните MONGODB_URI в .env');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'group_477');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ name: 'text', email: 'text' }, { default_language: 'russian' });
    return { client, db };
  } catch (error) { await client.close(); throw error; }
}
module.exports = { connect };
