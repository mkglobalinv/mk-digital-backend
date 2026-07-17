import fs from 'fs';
import path from 'path';

function searchInDir(dir, keyword) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'builds' || file.startsWith('.')) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchInDir(fullPath, keyword);
        } else if (file.endsWith('.js') || file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.toLowerCase().includes(keyword.toLowerCase())) {
                    console.log(`Found in: ${fullPath}`);
                    const lines = content.split('\n');
                    lines.forEach((line, i) => {
                        if (line.toLowerCase().includes(keyword.toLowerCase())) {
                            console.log(`  Line ${i+1}: ${line.trim()}`);
                        }
                    });
                }
            } catch (e) {}
        }
    }
}

console.log('--- Search for connectbridge ---');
searchInDir(path.resolve('./controllers'), 'connectbridge');
searchInDir(path.resolve('./services'), 'connectbridge');
searchInDir(path.resolve('./models'), 'connectbridge');
searchInDir(path.resolve('./routes'), 'connectbridge');

console.log('\n--- Search for Smart Option ---');
searchInDir(path.resolve('./controllers'), 'smart');
searchInDir(path.resolve('./services'), 'smart');
searchInDir(path.resolve('./models'), 'smart');

console.log('\n--- Search for routing ---');
searchInDir(path.resolve('./controllers'), 'route');
searchInDir(path.resolve('./services'), 'fallback');

