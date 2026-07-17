const fs = require('fs');
const path = require('path');

const srcAdminPages = path.join(__dirname, 'mk-vtu-frontend', 'src', 'admin', 'pages');
const srcSuperAdminPages = path.join(__dirname, 'mk-vtu-frontend', 'src', 'superadmin', 'pages');

const filesToClone = [
  { path: 'AdminDashboard.jsx', newName: 'SuperAdminDashboard' },
  { path: 'UserManager.jsx', newName: 'SuperUserManager' },
  { path: 'ServiceManager.jsx', newName: 'SuperServiceManager' },
  { path: 'DataCategoryRouteWrapper.jsx', newName: 'SuperDataCategoryRouteWrapper' },
  { path: 'ProfitAnalytics.jsx', newName: 'SuperProfitAnalytics' },
  { path: 'AdminLogs.jsx', newName: 'SuperAdminLogs' },
  { path: 'NotificationCenter.jsx', newName: 'SuperNotificationCenter' },
  { path: 'ContentManager.jsx', newName: 'SuperContentManager' },
  { path: 'BlogManager.jsx', newName: 'SuperBlogManager' },
  { path: 'WithdrawalManager.jsx', newName: 'SuperWithdrawalManager' },
  { path: 'AdminTransactions.jsx', newName: 'SuperAdminTransactions' },
  { path: 'KYCManager.jsx', newName: 'SuperKYCManager' },
  { path: 'InternationalAnalytics.jsx', newName: 'SuperInternationalAnalytics' },
  { path: 'AdminSettings.jsx', newName: 'SuperAdminSettings' },
  { path: 'DataPlanPricing.jsx', newName: 'SuperDataPlanPricing' },
  { path: 'TierMargins.jsx', newName: 'SuperTierMargins' },
  { path: 'ResellerManager.jsx', newName: 'SuperResellerManager' },
  { path: 'ResellerWalletManager.jsx', newName: 'SuperResellerWalletManager' },
  { path: 'CentralPricingManager.jsx', newName: 'SuperCentralPricingManager' },
  { path: 'SaaSSettings.jsx', newName: 'SuperSaaSSettings' },
  { path: 'MonitoringDashboard.jsx', newName: 'SuperMonitoringDashboard' },
  { path: 'OperationsCenter.jsx', newName: 'SuperOperationsCenter' },
  { path: 'ReconciliationPanel.jsx', newName: 'SuperReconciliationPanel' },
  { path: 'AdminAppRequests.jsx', newName: 'SuperAdminAppRequests' },
  { path: 'AdminDomainRequests.jsx', newName: 'SuperAdminDomainRequests' },
  { path: 'MarketingCenter/MarketingLayout.jsx', newName: 'SuperMarketingLayout' },
  { path: 'MarketingCenter/CampaignManager.jsx', newName: 'SuperCampaignManager' },
  { path: 'MarketingCenter/AnnouncementManager.jsx', newName: 'SuperAnnouncementManager' },
  { path: 'MarketingCenter/MarketingAnalytics.jsx', newName: 'SuperMarketingAnalytics' }
];

// 1. Ensure directories exist
if (!fs.existsSync(srcSuperAdminPages)) {
  fs.mkdirSync(srcSuperAdminPages, { recursive: true });
}
if (!fs.existsSync(path.join(srcSuperAdminPages, 'MarketingCenter'))) {
  fs.mkdirSync(path.join(srcSuperAdminPages, 'MarketingCenter'), { recursive: true });
}

// 2. Clone and transform files
filesToClone.forEach(fileInfo => {
  const sourcePath = path.join(srcAdminPages, fileInfo.path);
  const destPath = path.join(srcSuperAdminPages, path.dirname(fileInfo.path), `${fileInfo.newName}.jsx`);
  
  if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Replace component definition
    const oldName = path.basename(fileInfo.path, '.jsx');
    content = content.replace(new RegExp(`const ${oldName} = `, 'g'), `const ${fileInfo.newName} = `);
    content = content.replace(new RegExp(`function ${oldName}\\(`, 'g'), `function ${fileInfo.newName}(`);
    content = content.replace(new RegExp(`export default ${oldName};`, 'g'), `export default ${fileInfo.newName};`);
    
    // Replace text branding
    content = content.replace(/Admin Dashboard/g, 'Super Admin Control Center');
    content = content.replace(/Admin Portal/g, 'Super Admin Control Center');
    content = content.replace(/Admin Logs/g, 'System Audit Logs');
    content = content.replace(/Global User Manager/g, 'Super Admin Global Users');
    content = content.replace(/Admin Transactions/g, 'Global System Transactions');
    content = content.replace(/Admin Settings/g, 'Master Infrastructure Settings');
    
    // Fix relative imports (if they import css or other files like ./AdminDashboard.css)
    content = content.replace(/import '\.\//g, `import '../../admin/pages/${path.dirname(fileInfo.path) === '.' ? '' : path.dirname(fileInfo.path) + '/'}`);
    
    // Fix subcomponent imports inside MarketingLayout
    if (fileInfo.path.includes('MarketingCenter')) {
       // SuperMarketingLayout imports CampaignManager, AnnouncementManager, etc.
       content = content.replace(/import CampaignManager from '\.\/CampaignManager';/g, "import SuperCampaignManager from './SuperCampaignManager';");
       content = content.replace(/import AnnouncementManager from '\.\/AnnouncementManager';/g, "import SuperAnnouncementManager from './SuperAnnouncementManager';");
       content = content.replace(/import MarketingAnalytics from '\.\/MarketingAnalytics';/g, "import SuperMarketingAnalytics from './SuperMarketingAnalytics';");
       content = content.replace(/<CampaignManager \/>/g, "<SuperCampaignManager />");
       content = content.replace(/<AnnouncementManager \/>/g, "<SuperAnnouncementManager />");
       content = content.replace(/<MarketingAnalytics \/>/g, "<SuperMarketingAnalytics />");
    }

    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`Cloned and patched ${fileInfo.newName}`);
  } else {
    console.log(`Source file not found: ${sourcePath}`);
  }
});
