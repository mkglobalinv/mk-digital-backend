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
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.toLowerCase().includes(pattern.toLowerCase())) {
                        const lines = content.split('\n');
                        lines.forEach((line, index) => {
                            if (line.toLowerCase().includes(pattern.toLowerCase())) {
                                results.push({ file: fullPath, line: index + 1, text: line.trim() });
                            }
                        });
                    }
                } catch (e) {
                }
            }
        }
    });
    return results;
}

const root = path.join(__dirname, '..');
const terms = ['axios', 'fetch', 'got', 'request', 'post(', 'http'];
terms.forEach(term => {
    const found = searchDir(root, term);
    console.log(`Searching for "${term}": Found ${found.length} occurrences.`);
    const filtered = found.filter(f => !f.file.includes('node_modules') && !f.file.includes('scratch'));
    console.log(`Filtered (outside node_modules/scratch): ${filtered.length} occurrences.`);
    filtered.slice(0, 10).forEach(f => {
        console.log(`  ${f.file}:${f.line}: ${f.text}`);
    });
});
console.log('Search complete.');
