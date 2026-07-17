import fs from 'fs';
import path from 'path';

const targetDir = 'c:/Users/userpc/mk-digital-backend';
const pattern = /ProviderStatus/i;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'mongodb-win32-x86_64-windows-8.2.6') {
                results = results.concat(walk(fullPath));
            }
        } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = walk(targetDir);
allFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                console.log(`${file}:${index + 1} - ${line.trim()}`);
            }
        });
    } catch (e) {
        // ignore
    }
});
