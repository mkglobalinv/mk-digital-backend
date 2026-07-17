const fs = require('fs');
let content = fs.readFileSync('c:/Users/userpc/mk-digital-backend/mk-vtu-frontend/src/reseller/pages/ResellerDashboard.jsx', 'utf8');

// 1. Replace businessCards
content = content.replace(
    /const businessCards = \[[\s\S]*?\];/,
    `const businessCards = [
        { id: 'balance', title: "Main Wallet", value: \`₦\${(user?.totalBalance ?? stats?.walletBalance ?? 0).toLocaleString()}\`, icon: <Wallet size={24} color="#6366f1" />, trend: "Active", bg: "#f8fafc" },
        { id: 'commission', title: "Profit Wallet", value: \`₦\${(stats?.totalProfit || 0).toLocaleString()}\`, icon: <ShieldCheck size={24} color="#8b5cf6" />, trend: "+2.1%", bg: "#f5f3ff" },
        { id: 'todaySales', title: "Today Earnings", value: \`₦\${(stats?.todaySales || stats?.revenue || 0).toLocaleString()}\`, icon: <TrendingUp size={24} color="#f59e0b" />, trend: "+18%", bg: "#fffbeb" },
        { id: 'users', title: "Total Customers", value: stats?.totalUsers || 0, icon: <Users size={24} color="#6366f1" />, trend: "+12%", bg: "#eff6ff" },
        { id: 'tx', title: "Total Transactions", value: stats?.totalTransactions || 0, icon: <CreditCard size={24} color="#10b981" />, trend: "+5.4%", bg: "#ecfdf5" },
        { id: 'status', title: "Subscription Status", value: user?.resellerTier === 'premium' ? "Premium Active" : (user?.subdomain ? "Active" : "Pending"), icon: <Globe size={24} color={user?.subdomain ? "#10b981" : "#ef4444"} />, trend: "Online", bg: "#f8fafc" },
    ];`
);

// 2. Extract sections
const getSection = (startMarker, endMarker) => {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    if (startIndex === -1 || endIndex === -1) return '';
    return content.slice(startIndex, endIndex);
};

const onboardingTracker = getSection('{/* Onboarding Progress */}', '{/* My Website Link Section */}');
const myWebsiteLink = getSection('{/* My Website Link Section */}', '{/* Stats Grid */}');
const statsGrid = getSection('{/* Stats Grid */}', '<div className="dashboard-main-grid">');
const analyticsChart = getSection('{/* Analytics Chart */}', '{/* Quick Business Actions */}');

let quickActions = getSection('{/* Quick Business Actions */}', '</div>\n            </div>\n            {copied && (');

// Fix VIP Action Logic
quickActions = quickActions.replace(
    /{[\s\S]*?\/\* Upgrade to VIP \*\/[\s\S]*?<div onClick={\(\) => navigate\('\/reseller\/premium'\)} className="quick-action-card" style={{ background: 'linear-gradient\(135deg, #4f46e5, #9333ea\)', border: 'none' }}>[\s\S]*?<div className="quick-action-icon-box" style={{ background: 'rgba\(255,255,255,0.2\)', backdropFilter: 'blur\(4px\)' }}>[\s\S]*?<ShieldCheck size={26} color="#ffffff" \/>[\s\S]*?<\/div>[\s\S]*?<h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Upgrade to VIP<\/h4>[\s\S]*?<\/div>/,
    `{/* VIP Action Logic */}
                        {user?.resellerTier === 'premium' ? (
                            <div onClick={() => navigate('/reseller/premium')} className="quick-action-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                               <div className="quick-action-icon-box" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                                   <ShieldCheck size={26} color="#ffffff" />
                               </div>
                               <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Premium Active</h4>
                               <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>Exp: {daysUntilPremiumExpiry} days | Renew</p>
                            </div>
                        ) : (
                            <div onClick={() => navigate('/reseller/premium')} className="quick-action-card" style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', border: 'none' }}>
                               <div className="quick-action-icon-box" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                                   <ShieldCheck size={26} color="#ffffff" />
                               </div>
                               <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Upgrade to VIP</h4>
                            </div>
                        )}`
);

// 3. Rebuild
const beforeBusinessProfile = content.slice(0, content.indexOf('<ResellerBusinessProfile user={user} />'));

const rebuilt = beforeBusinessProfile +
    statsGrid +
    '            <div className="dashboard-main-grid" style={{ display: "block", marginBottom: "24px" }}>\n                ' + quickActions + 
    '\n            <div className="dashboard-main-grid">\n' +
    analyticsChart +
    '                <div>\n' +
    onboardingTracker +
    myWebsiteLink +
    '                </div>\n            </div>\n\n' +
    '            <ResellerBusinessProfile user={user} />\n\n' +
    content.slice(content.indexOf('            {copied && ('));

fs.writeFileSync('c:/Users/userpc/mk-digital-backend/mk-vtu-frontend/src/reseller/pages/ResellerDashboard.jsx', rebuilt);
console.log('Done');
