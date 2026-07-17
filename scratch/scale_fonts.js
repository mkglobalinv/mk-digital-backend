import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = 'c:/Users/userpc/mk-digital-backend/mk-vtu-frontend/src';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

walk(srcDir, (filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        if (filePath.endsWith('.css')) {
            newContent = content.replace(/font-size:\s*(\d+(\.\d+)?)px/g, (match, p1) => {
                let newVal = parseFloat(p1) * 1.1;
                return `font-size: ${newVal.toFixed(1)}px`;
            });
        } else if (filePath.endsWith('.jsx')) {
            // Handle fontSize: 14, fontSize: '14px', fontSize: "14px"
            newContent = content.replace(/fontSize:\s*['"]?(\d+(\.\d+)?)px?['"]?/g, (match, p1) => {
                let newVal = parseFloat(p1) * 1.1;
                // Preserve the original format (string with px) but standardize to string with px for safety in JSX styles
                return `fontSize: '${newVal.toFixed(1)}px'`;
            });
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});
