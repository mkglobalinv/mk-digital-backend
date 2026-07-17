const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'mk-vtu-frontend', 'src', 'admin', 'pages');

const filesToFix = [
  'AdminAppRequests.jsx',
  'AdminDashboard.jsx',
  'MonitoringDashboard.jsx',
  'OperationsCenter.jsx',
  'PromotionGridManager.jsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/localStorage\.getItem\('adminToken'\)/g, "(localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'))");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
