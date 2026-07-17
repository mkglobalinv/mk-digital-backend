import fs from 'fs';
import path from 'path';

const keyword = process.argv[2];
if (!keyword) {
  console.log("Usage: node search.js <keyword>");
  process.exit(1);
}

const ignoreDirs = ['node_modules', '.git', '.next', 'dist', 'builds'];

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.mjs') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir(path.resolve('.'));
