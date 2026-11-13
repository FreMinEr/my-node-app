const http = require('node:http');
const escapeHtml = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const html = content => `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Лаба 20</title>${content}</html>`;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0, rejected = false;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (rejected) return;
      if (bytes > 1024 * 1024) {
        rejected = true; chunks.length = 0;
        reject(Object.assign(new Error('Payload Too Large'), { status: 413 }));
      } else chunks.push(chunk);
    });
    req.on('end', () => { if (!rejected) { console.log(`Размер тела: ${bytes} байт`); resolve(Buffer.concat(chunks)); } });
    req.on('error', reject);
    req.on('aborted', () => reject(Object.assign(new Error('Запрос прерван'), { status: 400 })));
  });
}
function createServer(stage = 3) {
  return http.createServer(async (req, res) => {
    const started = new Date().toISOString();
    res.on('finish', () => console.log(`[${started}] ${req.method} ${req.url} ${res.statusCode}`));
    function send(status, content, type = 'application/json') {
      res.statusCode = status; res.setHeader('Content-Type', `${type}${type.startsWith('text/') || type === 'application/json' ? '; charset=utf-8' : ''}`);
      res.end(req.method === 'HEAD' ? undefined : Buffer.isBuffer(content) || typeof content === 'string' ? content : JSON.stringify(content));
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      if (stage >= 2) {
        res.setHeader('X-Powered-By', 'Node.js'); res.setHeader('X-Group', '477'); res.setHeader('Cache-Control', 'no-cache');
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (url.pathname === '/') return send(200, html('<h1>Лабораторная работа №20</h1><p>Группа 477</p>'), 'text/html');
        if (url.pathname === '/about') return send(200, html('<h1>Парфёнок Иван</h1><p>Группа 477</p>'), 'text/html');
        if (stage >= 2) {
          if (url.pathname === '/headers') return send(200, { headers: req.headers, method: req.method, url: req.url, httpVersion: req.httpVersion });
          if (url.pathname === '/headers/set') { res.setHeader('X-Custom', 'lab20'); return send(200, html('<h1>Заголовки установлены</h1>'), 'text/html'); }
          if (url.pathname === '/headers/check') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Temporary', 'remove-me');
            const beforeRemoval = res.getHeader('X-Temporary'); res.removeHeader('X-Temporary');
            return send(200, { hasContentType: res.hasHeader('Content-Type'), hasXGroup: res.hasHeader('X-Group'), hasUnknown: res.hasHeader('Unknown'), group: res.getHeader('X-Group'), beforeRemoval, afterRemoval: res.hasHeader('X-Temporary') });
          }
        }
      }
      if (stage >= 3 && req.method === 'POST' && ['/echo', '/form'].includes(url.pathname)) {
        const body = await readBody(req);
        const type = (req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim().toLowerCase();
        if (url.pathname === '/form' && type !== 'application/x-www-form-urlencoded') return send(415, { error: 'Ожидается application/x-www-form-urlencoded' });
        if (type === 'application/json') {
          let value;
          try { value = JSON.parse(body.toString('utf8')); } catch { return send(400, { error: 'Некорректный JSON' }); }
          if (!value || typeof value !== 'object' || Array.isArray(value)) return send(400, { error: 'Ожидается JSON-объект' });
          return send(200, { ...value, group: '477' });
        }
        if (type === 'application/x-www-form-urlencoded') return send(200, Object.fromEntries(new URLSearchParams(body.toString('utf8'))));
        if (type === 'text/plain' || type === 'application/octet-stream') return send(200, body, type);
        return send(415, { error: 'Неподдерживаемый Content-Type' });
      }
      send(404, html(`<h1>404 Not Found</h1><p>Путь ${escapeHtml(url.pathname)} не найден</p>`), 'text/html');
    } catch (error) {
      if (!res.headersSent && !res.destroyed) send(error.status || 500, { error: error.status ? error.message : 'Внутренняя ошибка' });
    }
  });
}
function start(stage) {
  const server = createServer(stage);
  server.listen(Number(process.env.PORT || 3000), () => console.log(`Лаба 20, задание ${stage}: http://localhost:${server.address().port}`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createServer, start };
