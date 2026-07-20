import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');

const rootFiles = ['package.json', 'package-lock.json', 'server.js', 'app.js', '.env.example'];
const includeFolders = ['services', 'controllers', 'routes', 'middlewares', 'utils', 'config', 'templates'];
const excludeList = ['.env', 'node_modules', '.git', 'logs', 'uploads', 'backups', 'snapshots', 'build', 'dist', 'coverage'];
const keywords = ['nodemailer', 'createTransport', 'sendMail', 'transporter', 'smtp', 'mail', 'email', 'otp', 'password reset', 'verification email'];

const zip = new AdmZip();
let fileCount = 0;
const addedFiles = new Set();

function shouldExclude(itemPath) {
    // Avoid double exclusions and ensure exact `.env` matching
    if (path.basename(itemPath) === '.env') return true;
    for (const ex of excludeList) {
        if (itemPath.includes(path.sep + ex + path.sep) || itemPath.endsWith(path.sep + ex)) {
            return true;
        }
    }
    return false;
}

function addFile(filePath, archivePath) {
    if (addedFiles.has(filePath)) return;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        if (shouldExclude(filePath)) return;
        const targetDirName = path.dirname(archivePath).replace(/\\/g, '/');
        const targetDir = targetDirName === '.' ? 'Nodemailer_Security_Review' : 'Nodemailer_Security_Review/' + targetDirName;
        zip.addLocalFile(filePath, targetDir);
        addedFiles.add(filePath);
        fileCount++;
    }
}

function addFolder(folderPath, basePath) {
    if (!fs.existsSync(folderPath)) return;
    const items = fs.readdirSync(folderPath);
    for (const item of items) {
        const fullPath = path.join(folderPath, item);
        const relPath = path.join(basePath, item);
        if (shouldExclude(fullPath)) continue;
        if (fs.statSync(fullPath).isDirectory()) {
            addFolder(fullPath, relPath);
        } else {
            addFile(fullPath, relPath);
        }
    }
}

// 1. Add root files
for (const file of rootFiles) {
    addFile(path.join(process.cwd(), file), file);
}

// 2. Add include folders
for (const folder of includeFolders) {
    addFolder(path.join(process.cwd(), folder), folder);
}

// 3. Keyword search in remaining files
function searchAndAdd(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (shouldExclude(fullPath)) continue;
        
        // Skip already added files
        if (addedFiles.has(fullPath)) continue;

        if (fs.statSync(fullPath).isDirectory()) {
            searchAndAdd(fullPath);
        } else {
            // Check extension
            const ext = path.extname(fullPath).toLowerCase();
            if (['.js', '.cjs', '.mjs', '.html', '.ejs', '.hbs', '.txt', '.md'].includes(ext)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
                    const hasKeyword = keywords.some(kw => content.includes(kw.toLowerCase()));
                    if (hasKeyword) {
                        const relPath = path.relative(process.cwd(), fullPath);
                        addFile(fullPath, relPath);
                    }
                } catch (e) {
                    // Ignore read errors
                }
            }
        }
    }
}

searchAndAdd(process.cwd());

zip.writeZip('Nodemailer_Security_Review_Package.zip');

console.log(`ZIP created successfully.`);
console.log(`Total files included: ${fileCount}`);

const structure = {};
for (const file of addedFiles) {
    const relPath = path.relative(process.cwd(), file);
    const parts = relPath.split(path.sep);
    const topLevel = parts.length > 1 ? parts[0] + '/' : 'Root';
    structure[topLevel] = (structure[topLevel] || 0) + 1;
}
console.log('Folder structure included:');
for (const [folder, count] of Object.entries(structure)) {
    console.log(`- ${folder}: ${count} files`);
}

