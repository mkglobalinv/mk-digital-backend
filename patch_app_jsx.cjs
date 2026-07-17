const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'mk-vtu-frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Add lazy imports
const lazyImports = `
const SuperAdminDashboard = React.lazy(() => import("./superadmin/pages/SuperAdminDashboard"));
const SuperUserManager = React.lazy(() => import("./superadmin/pages/SuperUserManager"));
const SuperServiceManager = React.lazy(() => import("./superadmin/pages/SuperServiceManager"));
const SuperDataCategoryRouteWrapper = React.lazy(() => import("./superadmin/pages/SuperDataCategoryRouteWrapper"));
const SuperProfitAnalytics = React.lazy(() => import("./superadmin/pages/SuperProfitAnalytics"));
const SuperAdminLogs = React.lazy(() => import("./superadmin/pages/SuperAdminLogs"));
const SuperNotificationCenter = React.lazy(() => import("./superadmin/pages/SuperNotificationCenter"));
const SuperContentManager = React.lazy(() => import("./superadmin/pages/SuperContentManager"));
const SuperBlogManager = React.lazy(() => import("./superadmin/pages/SuperBlogManager"));
const SuperWithdrawalManager = React.lazy(() => import("./superadmin/pages/SuperWithdrawalManager"));
const SuperAdminTransactions = React.lazy(() => import("./superadmin/pages/SuperAdminTransactions"));
const SuperKYCManager = React.lazy(() => import("./superadmin/pages/SuperKYCManager"));
const SuperInternationalAnalytics = React.lazy(() => import("./superadmin/pages/SuperInternationalAnalytics"));
const SuperAdminSettings = React.lazy(() => import("./superadmin/pages/SuperAdminSettings"));
const SuperDataPlanPricing = React.lazy(() => import("./superadmin/pages/SuperDataPlanPricing"));
const SuperTierMargins = React.lazy(() => import("./superadmin/pages/SuperTierMargins"));
const SuperResellerManager = React.lazy(() => import("./superadmin/pages/SuperResellerManager"));
const SuperResellerWalletManager = React.lazy(() => import("./superadmin/pages/SuperResellerWalletManager"));
const SuperCentralPricingManager = React.lazy(() => import("./superadmin/pages/SuperCentralPricingManager"));
const SuperSaaSSettings = React.lazy(() => import("./superadmin/pages/SuperSaaSSettings"));
const SuperMonitoringDashboard = React.lazy(() => import("./superadmin/pages/SuperMonitoringDashboard"));
const SuperOperationsCenter = React.lazy(() => import("./superadmin/pages/SuperOperationsCenter"));
const SuperReconciliationPanel = React.lazy(() => import("./superadmin/pages/SuperReconciliationPanel"));
const SuperAdminAppRequests = React.lazy(() => import("./superadmin/pages/SuperAdminAppRequests"));
const SuperAdminDomainRequests = React.lazy(() => import("./superadmin/pages/SuperAdminDomainRequests"));
import SuperMarketingLayout from './superadmin/pages/MarketingCenter/SuperMarketingLayout';
import SuperCampaignManager from './superadmin/pages/MarketingCenter/SuperCampaignManager';
import SuperAnnouncementManager from './superadmin/pages/MarketingCenter/SuperAnnouncementManager';
import SuperMarketingAnalytics from './superadmin/pages/MarketingCenter/SuperMarketingAnalytics';
`;

// Insert after the existing admin lazy imports
content = content.replace("import MarketingAnalytics from './admin/pages/MarketingCenter/MarketingAnalytics';", "import MarketingAnalytics from './admin/pages/MarketingCenter/MarketingAnalytics';\n" + lazyImports);

// 2. Replace components within the super-admin route block ONLY
// The block starts with <Route path="/super-admin/*" element={
// We will isolate this block and do replacements inside it.

const startToken = '<Route path="/super-admin/*"';
const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf('</Routes>', startIndex) + '</Routes>'.length;

let superAdminBlock = content.substring(startIndex, endIndex);

superAdminBlock = superAdminBlock.replace(/<AdminDashboard/g, '<SuperAdminDashboard');
superAdminBlock = superAdminBlock.replace(/<UserManager/g, '<SuperUserManager');
superAdminBlock = superAdminBlock.replace(/<ResellerManager/g, '<SuperResellerManager');
superAdminBlock = superAdminBlock.replace(/<ResellerWalletManager/g, '<SuperResellerWalletManager');
superAdminBlock = superAdminBlock.replace(/<CentralPricingManager/g, '<SuperCentralPricingManager');
superAdminBlock = superAdminBlock.replace(/<AdminTransactions/g, '<SuperAdminTransactions');
superAdminBlock = superAdminBlock.replace(/<ServiceManager/g, '<SuperServiceManager');
superAdminBlock = superAdminBlock.replace(/<DataCategoryRouteWrapper/g, '<SuperDataCategoryRouteWrapper');
superAdminBlock = superAdminBlock.replace(/<DataPlanPricing/g, '<SuperDataPlanPricing');
superAdminBlock = superAdminBlock.replace(/<TierMargins/g, '<SuperTierMargins');
superAdminBlock = superAdminBlock.replace(/<ProfitAnalytics/g, '<SuperProfitAnalytics');
superAdminBlock = superAdminBlock.replace(/<KYCManager/g, '<SuperKYCManager');
superAdminBlock = superAdminBlock.replace(/<WithdrawalManager/g, '<SuperWithdrawalManager');
superAdminBlock = superAdminBlock.replace(/<ContentManager/g, '<SuperContentManager');
superAdminBlock = superAdminBlock.replace(/<BlogManager/g, '<SuperBlogManager');
superAdminBlock = superAdminBlock.replace(/<NotificationCenter/g, '<SuperNotificationCenter');
superAdminBlock = superAdminBlock.replace(/<InternationalAnalytics/g, '<SuperInternationalAnalytics');
superAdminBlock = superAdminBlock.replace(/<SaaSSettings/g, '<SuperSaaSSettings');
superAdminBlock = superAdminBlock.replace(/<AdminSettings/g, '<SuperAdminSettings');
superAdminBlock = superAdminBlock.replace(/<AdminLogs/g, '<SuperAdminLogs');
superAdminBlock = superAdminBlock.replace(/<ReconciliationPanel/g, '<SuperReconciliationPanel');
superAdminBlock = superAdminBlock.replace(/<MonitoringDashboard/g, '<SuperMonitoringDashboard');
superAdminBlock = superAdminBlock.replace(/<OperationsCenter/g, '<SuperOperationsCenter');
superAdminBlock = superAdminBlock.replace(/<AdminAppRequests/g, '<SuperAdminAppRequests');
superAdminBlock = superAdminBlock.replace(/<AdminDomainRequests/g, '<SuperAdminDomainRequests');
superAdminBlock = superAdminBlock.replace(/<MarketingLayout/g, '<SuperMarketingLayout');
superAdminBlock = superAdminBlock.replace(/<CampaignManager/g, '<SuperCampaignManager');
superAdminBlock = superAdminBlock.replace(/<AnnouncementManager/g, '<SuperAnnouncementManager');
superAdminBlock = superAdminBlock.replace(/<MarketingAnalytics/g, '<SuperMarketingAnalytics');

content = content.substring(0, startIndex) + superAdminBlock + content.substring(endIndex);

fs.writeFileSync(appJsxPath, content, 'utf8');
console.log('App.jsx patched successfully');
