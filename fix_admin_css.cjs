const fs = require('fs');
const path = require('path');

const cssDirPages = path.join(__dirname, 'mk-vtu-frontend', 'src', 'admin', 'pages');
const cssDirComponents = path.join(__dirname, 'mk-vtu-frontend', 'src', 'admin', 'components');

const replacements = [
    { regex: /background(-color)?:\s*(#ffffff|#fff|white)\s*;/gi, replace: 'background$1: var(--bg-card);' },
    { regex: /background(-color)?:\s*(#f8fafc|#f1f5f9)\s*;/gi, replace: 'background$1: var(--bg-color);' },
    { regex: /color:\s*(#000000|#000|black|#0f172a|#1e293b)\s*;/gi, replace: 'color: var(--text-dark);' },
    { regex: /color:\s*(#334155|#475569)\s*;/gi, replace: 'color: var(--text-gray);' },
    { regex: /color:\s*(#64748b|#94a3b8)\s*;/gi, replace: 'color: var(--text-light);' },
    { regex: /border(-[a-z]+)?:\s*([^;]+)(#e2e8f0|#cbd5e1)\s*;/gi, replace: 'border$1: $2var(--border-color);' },
];

function processDir(directory) {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.css') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (file.endsWith('.css')) {
                for (const r of replacements) {
                    if (r.regex.test(content)) {
                        content = content.replace(r.regex, r.replace);
                        modified = true;
                    }
                }
            } else if (file.endsWith('.jsx')) {
                // For JSX inline styles
                const inlineReplacements = [
                    { regex: /color:\s*['"](#000000|#000|black|#0f172a|#1e293b)['"]/gi, replace: "color: 'var(--text-dark)'" },
                    { regex: /color:\s*['"](#334155|#475569)['"]/gi, replace: "color: 'var(--text-gray)'" },
                    { regex: /color:\s*['"](#64748b|#94a3b8)['"]/gi, replace: "color: 'var(--text-light)'" },
                    { regex: /background(Color)?:\s*['"](#ffffff|#fff|white)['"]/gi, replace: "background$1: 'var(--bg-card)'" },
                    { regex: /background(Color)?:\s*['"](#f8fafc|#f1f5f9)['"]/gi, replace: "background$1: 'var(--bg-color)'" }
                ];
                for (const r of inlineReplacements) {
                    if (r.regex.test(content)) {
                        content = content.replace(r.regex, r.replace);
                        modified = true;
                    }
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDir(cssDirPages);
processDir(cssDirComponents);
console.log('CSS Audit and Replacement Complete!');
