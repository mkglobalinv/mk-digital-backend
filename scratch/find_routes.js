import fs from 'fs';

const content = fs.readFileSync('c:/Users/userpc/mk-digital-backend/server.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('app.post') || line.includes('/buy-') || line.includes('/purchase')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
