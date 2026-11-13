require('./app').start(1).catch(error => { console.error(error.name, error.code); process.exitCode = 1; });
