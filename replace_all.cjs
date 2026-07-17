const fs = require('fs');

const skipFiles = [
    'App.jsx', 
    'Login.jsx', 
    'Home.jsx', 
    'ResellerOnboarding.jsx', 
    'whiteLabel.js', 
    'adminController.js', 
    'authController.js', 
    'resellerController.js', 
    'appAssetService.js'
];

const data = fs.readFileSync('C:\\Users\\userpc\\search_results.txt', 'utf8');
const lines = data.split('\n');

const filesToProcess = new Set();
for (let line of lines) {
    if (!line.trim()) continue;
    // Match the Windows file path (e.g., C:\Users\...)
    const match = line.match(/^([A-Za-z]:\\[^:]+):/);
    if (match) {
        const filePath = match[1];
        const fileName = filePath.split('\\').pop();
        if (!skipFiles.includes(fileName)) {
            filesToProcess.add(filePath);
        }
    }
}

console.log(`Found ${filesToProcess.size} files to process.`);

let count = 0;
for (const file of filesToProcess) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('mksubdata.com')) {
            content = content.replace(/mksubdata\.com/g, '9jasub.com');
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated ${file}`);
            count++;
        }
    } catch (e) {
        console.error(`Failed to process ${file}:`, e.message);
    }
}

console.log(`Updated ${count} files.`);
