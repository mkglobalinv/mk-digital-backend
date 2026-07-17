import fs from 'fs';

const serverFile = 'c:\\Users\\userpc\\mk-digital-backend\\server.js';
let lines = fs.readFileSync(serverFile, 'utf8').split('\n');

// Comment out pay-activation (lines 510 to 598, 0-indexed: 509 to 597)
for (let i = 509; i <= 597; i++) {
    lines[i] = '// [DEPRECATED] ' + lines[i];
}

// Comment out upgrade-premium (lines 1425 to 1482, 0-indexed: 1424 to 1481)
for (let i = 1424; i <= 1481; i++) {
    lines[i] = '// [DEPRECATED] ' + lines[i];
}

fs.writeFileSync(serverFile, lines.join('\n'), 'utf8');
console.log('Successfully commented out legacy routes.');
