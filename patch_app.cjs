const fs = require('fs');
const file = 'mk-vtu-frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Super Admin Lazy Imports
content = content.replace(/const SuperAdminDashboard = React\.lazy\(\(\) => import\("\.\/superadmin[\s\S]*?import SuperMarketingAnalytics from '\.\/superadmin\/pages\/MarketingCenter\/SuperMarketingAnalytics';\n?/m, '');

// 2. Remove standard SuperAdmin imports
content = content.replace(/import SuperAdminLogin from "\.\/superadmin\/pages\/SuperAdminLogin";\n?/g, '');
content = content.replace(/import SuperAdminLayout from "\.\/superadmin\/components\/SuperAdminLayout";\n?/g, '');

// 3. Remove State
content = content.replace(/const \[superAdminToken, setSuperAdminToken\] = useState\(localStorage\.getItem\("superAdminToken"\)\);\n?/g, '');
content = content.replace(/const \[superAdminUser, setSuperAdminUser\] = useState\(\(\) => {[\s\S]*?}\);\n?/g, '');

// 4. Remove Super Admin Routing Block
const routeStart = '<Route path="/super-admin/*"';
if (content.includes(routeStart)) {
    const sIndex = content.indexOf(routeStart);
    let eIndex = content.indexOf('</Routes>\n                      </Suspense>\n                    </SuperAdminLayout>\n                  ) : <Navigate to="/super-admin/login" />\n                } />', sIndex);
    if (eIndex !== -1) {
        content = content.substring(0, sIndex) + content.substring(eIndex + 172);
    }
}

// 5. Remove super-admin/login Route
content = content.replace(/<Route path="\/super-admin\/login".*?\/>\n?/g, '');

// 6. Fix token checks and location checks
content = content.replace(/!location\.pathname\.startsWith\('\/super-admin'\) && /g, '');
content = content.replace(/if \(req\.url\.includes\('\/superadmin'\)\) \{[\s\S]*?\} else /g, ''); // Wait, this is in api.js, but let's check if App.jsx has interceptors
content = content.replace(/API\.interceptors\.request\.use\(\(req\) => \{[\s\S]*?return req;\n    \}\);/g, (match) => {
    return match.replace(/\|\| req\.url\.includes\('\/superadmin'\)/g, '');
});

// 7. Inject missing Super Admin capabilities into /admin/* routing block
const missingAdminRoutes = `
                          <Route path="saas-settings" element={<SaaSSettings />} />
                          <Route path="settings" element={<AdminSettings />} />
                          <Route path="logs" element={<AdminLogs />} />
                          <Route path="reconciliation" element={<ReconciliationPanel />} />
                          <Route path="monitoring" element={<MonitoringDashboard />} />
                          <Route path="operations" element={<OperationsCenter />} />
                          <Route path="app-requests" element={<AdminAppRequests />} />
                          <Route path="domain-requests" element={<AdminDomainRequests />} />`;

if (!content.includes('<Route path="saas-settings"')) {
    content = content.replace(/<Route path="international" element={<InternationalAnalytics token=\{adminToken\} \/>} \/>/g, 
        `<Route path="international" element={<InternationalAnalytics token={adminToken} />} />${missingAdminRoutes}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log('App.jsx stripped of superadmin functionality');
