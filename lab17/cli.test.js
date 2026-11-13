const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
test('Аргументы, форматы, dry-run, защита перезаписи и stdin', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'lab17-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const run = (task, args, input = '') => spawnSync(process.execPath, [path.join(__dirname, `task${task}.js`), ...args], { cwd, input, encoding: 'utf8' });
  assert.match(run(1, []).stdout, /Использование/);
  assert.equal(run(1, ['greet', 'Иван']).status, 0);
  assert.equal(run(1, ['unknown']).status, 1);
  assert.equal(run(2, ['generate', '--type', 'invalid']).status, 1);
  assert.equal(run(2, ['generate', '--dry-run']).status, 0);
  assert.equal(fs.readdirSync(cwd).length, 0);
  for (const type of ['json', 'csv', 'html', 'pdf']) {
    const result = run(2, ['generate', '--type', type]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.statSync(path.join(cwd, `output.${type}`)).size > 0);
  }
  assert.equal(run(2, ['generate', '--type', 'json']).status, 1);
  assert.equal(run(2, ['generate', '--type', 'json', '--force']).status, 0);
  assert.equal(run(3, ['init', '--no-interactive']).status, 1);
  assert.equal(run(3, ['init', '--type', 'cli'], 'demo-pipe').status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, 'demo-pipe/project.json'))).name, 'demo-pipe');
  assert.equal(run(3, ['init', '--name', '../outside', '--type', 'cli']).status, 1);
});
