const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'mk-vtu-frontend', 'src', 'superadmin', 'pages', 'MarketingCenter');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the CSS import path (it should be ../../../admin/pages/...)
  if (content.includes("import '../../admin/pages/")) {
    content = content.replace(/import '\.\.\/\.\.\/admin\/pages\//g, "import '../../../admin/pages/");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed CSS imports in ${file}`);
  }
});
