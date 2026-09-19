const fs = require('fs');
const path = require('path');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);

class FileManagerHybrid {
  constructor(baseDir = './data-hybrid') {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      console.log(`Создана директория: ${this.baseDir}`);
    }
  }

  resolveSafe(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename is required');
    }
    if (filename.includes('\0')) {
      throw new Error('Invalid filename');
    }
    const filePath = path.resolve(this.baseDir, filename);
    const relative = path.relative(this.baseDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Path traversal is not allowed');
    }
    return filePath;
  }

  settle(promise, callback) {
    if (typeof callback === 'function') {
      promise.then((value) => callback(null, value)).catch((err) => callback(err));
      return undefined;
    }
    return promise;
  }

  createFile(filename, content, callback) {
    const work = (async () => {
      if (typeof content !== 'string') {
        throw new Error('Content must be a string');
      }
      const filePath = this.resolveSafe(filename);
      await writeFileAsync(filePath, content, 'utf8');
      return filePath;
    })();
    return this.settle(work, callback);
  }

  readFile(filename, callback) {
    const work = (async () => {
      const filePath = this.resolveSafe(filename);
      try {
        return await readFileAsync(filePath, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new Error(`File not found: ${filename}`);
        }
        throw err;
      }
    })();
    return this.settle(work, callback);
  }

  getFileStats(filename, callback) {
    const work = (async () => {
      const filePath = this.resolveSafe(filename);
      const stats = await statAsync(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile()
      };
    })();
    return this.settle(work, callback);
  }

  deleteFile(filename, callback) {
    const work = (async () => {
      const filePath = this.resolveSafe(filename);
      await unlinkAsync(filePath);
    })();
    return this.settle(work, callback);
  }

  listFiles(callback) {
    const work = (async () => {
      const files = await readdirAsync(this.baseDir);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const stats = await statAsync(path.join(this.baseDir, file));
          return { name: file, isFile: stats.isFile() };
        })
      );
      return fileStats.filter((f) => f.isFile).map((f) => f.name);
    })();
    return this.settle(work, callback);
  }
}

module.exports = FileManagerHybrid;
