const express = require('express');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');

function createApp(stage = 3) {
  const app = express();
  const books = [];
  let nextId = 1;
  if (stage >= 3) {
    app.use((req, res, next) => {
      const start = new Date(); const clock = performance.now();
      res.on('finish', () => console.log(`[${start.toISOString()} -> ${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${(performance.now() - clock).toFixed(2)}ms`));
      next();
    });
    app.use(compression({ threshold: 0 }));
    app.use(rateLimit({ windowMs: 60000, limit: 100, standardHeaders: true, legacyHeaders: false,
      message: { error: 'Слишком много запросов', status: 429 } }));
  }
  app.use(express.json({ limit: '1mb' }));
  const html = content => `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Лаба 16</title>${content}</html>`;
  app.get('/', (req, res) => res.send(html(`<h1>Лабораторная работа №16</h1><p>Добро пожаловать! Группа 477</p><p>${new Date().toLocaleString('ru-RU')}</p><ul>${['/about', '/contacts', '/api/books', '/api/books/search', '/error', '/async-error'].map(url => `<li><a href="${url}">${url}</a></li>`).join('')}</ul>`)));
  app.get('/about', (req, res) => res.send(html('<h1>Парфёнок Иван</h1><p>Группа 477</p>')));
  app.get('/contacts', (req, res) => res.send(html('<h1>Контакты</h1><a href="https://github.com/FreMinEr">GitHub: FreMinEr</a>')));
  function error(status, message) { return Object.assign(new Error(message), { status }); }
  function validate(body, partial = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw error(400, 'Ожидается объект JSON');
    const result = {};
    for (const field of ['title', 'author', 'year']) {
      if (!(field in body) && partial) continue;
      const value = body[field];
      if (field === 'year' ? !Number.isInteger(value) || value < 1 || value > new Date().getFullYear() : typeof value !== 'string' || !value.trim()) {
        throw error(400, `Некорректное поле ${field}`);
      }
      result[field] = typeof value === 'string' ? value.trim() : value;
    }
    if (!Object.keys(result).length) throw error(400, 'Не переданы поля книги');
    return result;
  }
  function find(id) { const book = books.find(item => item.id === Number(id)); if (!book) throw error(404, 'Книга не найдена'); return book; }
  if (stage >= 2) {
    app.get('/api/books', (req, res) => res.json(books));
    // Статический маршрут должен находиться перед параметром :id.
    app.get('/api/books/search', (req, res) => {
      if (typeof req.query.author !== 'string') throw error(400, 'Укажите author');
      res.json(books.filter(book => book.author.toLocaleLowerCase().includes(req.query.author.toLocaleLowerCase())));
    });
    app.get('/api/books/:id', (req, res) => res.json(find(req.params.id)));
    app.post('/api/books', (req, res) => { const data = validate(req.body); const book = { id: nextId++, ...data }; books.push(book); res.status(201).json(book); });
    app.put('/api/books/:id', (req, res) => { const book = find(req.params.id); Object.assign(book, validate(req.body, true)); res.json(book); });
    app.delete('/api/books/:id', (req, res) => { const book = find(req.params.id); books.splice(books.indexOf(book), 1); res.json({ message: 'Книга удалена', id: book.id }); });
  }
  if (stage >= 3) {
    app.get('/error', () => { throw new Error('Тестовая ошибка'); });
    app.get('/async-error', async () => { await Promise.reject(new Error('Асинхронная ошибка')); });
  }
  app.use((req, res, next) => next(error(404, 'Маршрут не найден')));
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: status >= 500 ? 'Внутренняя ошибка сервера' : err.message, status });
  });
  return app;
}
function start(stage) {
  const server = createApp(stage).listen(Number(process.env.PORT || 3000), () => console.log(`Лаба 16, задание ${stage}: http://localhost:${server.address().port}`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createApp, start };
