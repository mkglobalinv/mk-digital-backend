const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('cost_price') || content.includes('selling_price')) {
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.includes('cost_price') || line.includes('selling_price')) {
                        console.log(`${fullPath}:${i+1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}
searchFiles(__dirname);
