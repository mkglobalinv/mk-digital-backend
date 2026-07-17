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
            if (file === 'node_modules' || file === '.next' || file === 'dist' || file === '.git' || file === 'mongodb-win32-x86_64-windows-8.2.6' || file === 'builds' || file === 'backups' || file === 'temp_extract' || file === 'temp_extract_2' || file === 'temp_extract_3') {
                return;
            }
            results = results.concat(searchDir(fullPath, pattern));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.css')) {
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
const terms = ['pwaa', 'builder', 'buildApp', 'triggerPWAA', 'sendToBuilder'];
terms.forEach(term => {
    console.log(`Searching for "${term}"...`);
    const found = searchDir(root, term);
    console.log(`Found ${found.length} occurrences.`);
    found.slice(0, 10).forEach(f => {
        console.log(`  ${f.file}:${f.line}: ${f.text}`);
    });
    if (found.length > 10) console.log(`  ... and ${found.length - 10} more.`);
});
console.log('Search complete.');
