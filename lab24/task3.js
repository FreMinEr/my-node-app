require('./app').start(3).catch(error => { console.error(error.name, error.code); process.exitCode = 1; });
