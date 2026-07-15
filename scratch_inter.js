const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/trofeiCronologia.json', 'utf8'));
console.log(data.filter(t => t.team === 'inter').map(t => `${t.year} - ${t.name}`));
