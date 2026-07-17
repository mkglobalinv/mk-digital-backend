const fs = require('fs');
const path = require('path');

const skipDirs = ['node_modules', '.git', 'dist', 'build', 'backups', 'scratch'];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (skipDirs.includes(file)) continue;

        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.json') || fullPath.endsWith('.html') || fullPath.endsWith('.env.local') || fullPath.endsWith('.env')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('mksubdata.com')) {
                // Be careful not to replace package names if any, but since it's a domain it's usually inside strings.
                content = content.replace(/mksubdata\.com/gi, '9jasub.com');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory('C:/Users/userpc/mk-digital-backend');
