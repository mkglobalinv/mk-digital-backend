const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

if (!content.includes("import Image from 'next/image';")) {
  content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport Image from 'next/image';");
}

// 1. Navbar logo
content = content.replace(
  '<img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10',
  '<Image src="/logo.jpg" alt="9JASUB Logo" width={40} height={40} className="w-10 h-10'
);

// 2. Hero dashboard
content = content.replace(
  '<img src="/dashboard_screenshot.png" alt="9JASUB Dashboard" className="w-full h-auto block" />',
  '<Image src="/dashboard_screenshot.png" alt="9JASUB Dashboard" width={800} height={600} className="w-full h-auto block" priority />'
);

// 3. Showcase dashboard
content = content.replace(
  '<img src="/dashboard_screenshot.png" alt="9JASUB Showcase" className="w-full h-auto block" />',
  '<Image src="/dashboard_screenshot.png" alt="9JASUB Showcase" width={800} height={600} className="w-full h-auto block" />'
);

// 4. Mobile app screenshot
content = content.replace(
  '<img src="/vtu_home_screenshot.png" alt="9JASUB Mobile App" className="w-full h-auto block" />',
  '<Image src="/vtu_home_screenshot.png" alt="9JASUB Mobile App" width={400} height={800} className="w-full h-auto block" />'
);

// 5. Footer logo
content = content.replace(
  '<img src="/logo.jpg" alt="9JASUB Logo" className="w-8 h-8 rounded-lg object-cover" />',
  '<Image src="/logo.jpg" alt="9JASUB Logo" width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />'
);

fs.writeFileSync(pagePath, content);
console.log("Images optimized successfully.");
