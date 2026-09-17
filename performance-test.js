const fs = require('fs');
const path = require('path');
const FileManager = require('./fileOperations');
const FileManagerPromises = require('./fileOperationsPromises');


const COUNT = 200;
const CONTENT = 'x'.repeat(256);

function ensureDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function benchSync(dir) {
  const started = process.hrtime.bigint();
  for (let i = 0; i < COUNT; i += 1) {
    fs.writeFileSync(path.join(dir, `sync-${i}.txt`), CONTENT, 'utf8');
  }
  return Number(process.hrtime.bigint() - started) / 1e6;
}

function benchCallbacks(dir) {
  const manager = new FileManager(dir);
  const started = process.hrtime.bigint();
  return new Promise((resolve, reject) => {
    let done = 0;
    for (let i = 0; i < COUNT; i += 1) {
      manager.createFile(`cb-${i}.txt`, CONTENT, (err) => {
        if (err) {
          reject(err);
          return;
        }
        done += 1;
        if (done === COUNT) {
          resolve(Number(process.hrtime.bigint() - started) / 1e6);
        }
      });
    }
  });
}

async function benchPromises(dir) {
  const manager = new FileManagerPromises(dir);
  const started = process.hrtime.bigint();
  const jobs = [];
  for (let i = 0; i < COUNT; i += 1) {
    jobs.push(manager.createFile(`p-${i}.txt`, CONTENT));
  }
  await Promise.all(jobs);
  return Number(process.hrtime.bigint() - started) / 1e6;
}

async function main() {
  const root = path.join(__dirname, 'perf-data');
  ensureDir(root);

  const syncDir = path.join(root, 'sync');
  fs.mkdirSync(syncDir, { recursive: true });
  const syncMs = benchSync(syncDir);
  const callbackMs = await benchCallbacks(path.join(root, 'callbacks'));
  const promiseMs = await benchPromises(path.join(root, 'promises'));

  console.log(`Files written: ${COUNT}`);
  console.log(`Sync:      ${syncMs.toFixed(2)} ms`);
  console.log(`Callbacks: ${callbackMs.toFixed(2)} ms`);
  console.log(`Promises:  ${promiseMs.toFixed(2)} ms`);
  console.log('Sync blocks the event loop; async APIs overlap disk I/O.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
