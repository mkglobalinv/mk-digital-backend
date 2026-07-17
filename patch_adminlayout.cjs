const fs = require('fs');

const file = 'mk-vtu-frontend/src/admin/components/AdminLayout.jsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure Server icon is imported
if (!content.includes('Server,')) {
    content = content.replace('import { \n  LayoutDashboard, ', 'import { \n  Server,\n  Activity,\n  HardDrive,\n  LayoutDashboard, ');
}

// Add the dynamic menu group injection
const injectionPoint = `  ];

  const findCurrentPage = () => {`;

const newLogic = `  ];

  // Dynamically inject Super Admin Control Center if the owner is logged in
  if (admin?.email === 'unuktar1@gmail.com') {
    menuGroups.push({
      title: 'SUPER ADMIN CONTROL CENTER',
      items: [
        { name: 'Deployment Center', path: '/admin/app-requests', icon: <Layout size={18} />, badge: 'ROOT' },
        { name: 'Snapshots', path: '/admin/saas-settings', icon: <Database size={18} /> },
        { name: 'Rollback', path: '/admin/saas-settings', icon: <History size={18} /> },
        { name: 'System Health', path: '/admin/monitoring', icon: <Activity size={18} /> },
        { name: 'Infrastructure', path: '/admin/operations', icon: <Server size={18} /> },
        { name: 'Audit Logs', path: '/admin/logs', icon: <History size={18} /> },
        { name: 'Maintenance', path: '/admin/operations', icon: <Settings size={18} /> },
        { name: 'Admin Settings', path: '/admin/settings', icon: <Settings size={18} /> },
        { name: 'Provider Monitoring', path: '/admin/monitoring', icon: <ShieldCheck size={18} /> },
      ]
    });
  }

  const findCurrentPage = () => {`;

if (!content.includes('SUPER ADMIN CONTROL CENTER')) {
    content = content.replace(injectionPoint, newLogic);
}

fs.writeFileSync(file, content, 'utf8');
console.log('AdminLayout.jsx successfully patched with Super Admin Control Center');
