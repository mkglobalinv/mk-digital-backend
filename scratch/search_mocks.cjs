const fs = require('fs');
const path = require('path');

const keywords = ['Math.random', 'seedValue', 'mock', 'demo', 'fallback', 'placeholder', 'fake', 'sampleData', 'dummy', 'testData'];

const searchDir = (dir) => {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.gemini') && !fullPath.includes('scratch')) {
                    searchDir(fullPath);
                }
            } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    const l = line.toLowerCase();
                    if (keywords.some(k => l.includes(k.toLowerCase()))) {
                        console.log(`${fullPath}:${i + 1}: ${line.trim()}`);
                    }
                });
            }
        });
    } catch (e) {
        // ignore permissions
    }
};

searchDir('.');
