import fs from 'fs';
import path from 'path';

const file = fs.readFileSync(path.resolve('C:/Users/userpc/mk-digital-backend/server.js'), 'utf-8');
const lines = file.split('\n');

const startIndex = lines.findIndex(l => l.includes('app.post(\'/api/vtu/data\'') || l.includes('router.post(\'/data\''));
if (startIndex !== -1) {
    console.log(lines.slice(startIndex, startIndex + 150).join('\n'));
} else {
    console.log("Could not find data purchase route in server.js");
}
