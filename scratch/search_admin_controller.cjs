const fs = require('fs');
const content = fs.readFileSync('controllers/adminController.js', 'utf8');
const lines = content.split('\n');
console.log("Searching for 'pwa' in adminController.js:");
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('pwa') || line.toLowerCase().includes('rebuild') || line.toLowerCase().includes('build')) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
});
