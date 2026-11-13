require('./app').start(2).catch(error => { console.error(error.name, error.code); process.exitCode = 1; });
