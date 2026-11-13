require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });
const { MongoClient } = require('mongodb');
function client(options = {}) {
  if (!process.env.MONGODB_URI) throw new Error('Заполните MONGODB_URI в lab23/.env');
  return new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000, ...options });
}
const database = process.env.MONGODB_DATABASE || 'group_477';
function run(main) { main().catch(error => { console.error(`${error.name}: ${error.codeName || error.code || 'Ошибка MongoDB'}`); process.exitCode = 1; }); }
module.exports = { client, database, run };
