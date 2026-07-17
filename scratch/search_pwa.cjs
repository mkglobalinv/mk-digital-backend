const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
    let results = [];
    let list;
    try {
        list = fs.readdirSync(dir);
    } catch (e) {
        return results;
    }
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (e) {
            return;
        }
        if (stat && stat.isDirectory()) {
            if (file === 'node_modules' || file === '.next' || file === 'dist' || file === '.git' || file === 'mongodb-win32-x86_64-windows-8.2.6') {
                return;
            }
            results = results.concat(searchDir(fullPath, pattern));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.html')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.toLowerCase().includes(pattern.toLowerCase())) {
                            // ignore line if it only contains pwa_enabled or pwa-enabled
                            const l = line.toLowerCase();
                            if (l.includes('pwa_enabled') || l.includes('pwa-enabled')) {
                                // but keep it if it has other stuff
                            }
                            results.push({ file: fullPath, line: index + 1, text: line.trim() });
                        }
                    });
                } catch (e) {
                }
            }
        }
    });
    return results;
}

const root = path.join(__dirname, '..');
const found = searchDir(root, 'pwa');
console.log(`Found ${found.length} occurrences of PWA:`);
found.forEach(f => {
    console.log(`${f.file}:${f.line}: ${f.text}`);
});
console.log('Search complete.');
