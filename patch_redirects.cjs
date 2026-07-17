const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'mk-vtu-frontend', 'src', 'admin', 'pages');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'AdminLogin.jsx');

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes("navigate('/admin/login')")) {
    content = content.replace(/navigate\('\/admin\/login'\)/g, "navigate(window.location.pathname.startsWith('/super-admin') ? '/super-admin/login' : '/admin/login')");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched redirects in ${file}`);
  }
});
