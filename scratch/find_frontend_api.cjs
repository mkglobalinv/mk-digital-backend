const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('axios') || content.includes('fetch')) {
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.includes('/data') || line.includes('/buy') || line.includes('/purchase')) {
                        console.log(`${fullPath}:${i+1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}
searchFiles(path.join(process.cwd(), 'mk-vtu-frontend', 'src'));
