const fs = require('fs');
const path = require('path');

function setupLogger(app) {
    const logFile = path.join(__dirname, 'logs.txt');

    const logEvent = (eventName, data) => {
        const timestamp = new Date().toISOString();
        const logMessage = '[' + timestamp + '] ' + eventName + ': ' + JSON.stringify(data) + '\n';

        fs.appendFile(logFile, logMessage, (err) => {
            if (err) console.error('Ошибка записи в лог:', err);
        });
    };

    app.on('server:started', (port) => logEvent('server:started', { port: port }));
    app.on('server:stopped', () => logEvent('server:stopped', {}));
    app.on('request:received', (request) => logEvent('request:received', request));

    console.log('Логгер инициализирован');
}

module.exports = { setupLogger };
