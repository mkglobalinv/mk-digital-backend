const fs = require('fs');
const content = fs.readFileSync('routes/adminRoutes.js', 'utf8');
const lines = content.split('\n');
console.log("Searching routes/adminRoutes.js for 'app-requests':");
lines.forEach((line, idx) => {
    if (line.includes('app-requests') || line.includes('appRequests')) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
});
