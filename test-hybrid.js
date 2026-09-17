const FileManagerHybrid = require('./fileOperationsHybrid');

const manager = new FileManagerHybrid('./test-data-hybrid');

async function testHybrid() {
  console.log('=== ТЕСТИРОВАНИЕ ГИБРИДНОГО API ===\n');

  await new Promise((resolve, reject) => {
    manager.createFile('hybrid.txt', 'callback style', (err, filePath) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Callback create:', filePath);
      resolve();
    });
  });

  const viaPromise = await manager.createFile('hybrid-promise.txt', 'promise style');
  console.log('Promise create:', viaPromise);

  try {
    await manager.readFile('../secret.txt');
    console.log('ERROR: path traversal was not blocked');
  } catch (err) {
    console.log('Caught path traversal:', err.message);
  }

  try {
    await manager.readFile('missing.txt');
  } catch (err) {
    console.log('Caught missing file:', err.message);
  }

  const files = await manager.listFiles();
  console.log('Files:', files.join(', '));

  await manager.deleteFile('hybrid.txt');
  await manager.deleteFile('hybrid-promise.txt');
  console.log('Hybrid tests finished');
}

testHybrid().catch((err) => {
  console.error('Hybrid test failed:', err);
  process.exitCode = 1;
});
