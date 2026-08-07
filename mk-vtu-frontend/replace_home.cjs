const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Home.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const marker = 'const { successfulTodayCount, recentlyFundedStatus } = getMiniSummaryMetrics();';
const returnStart = content.indexOf(marker);
if (returnStart === -1) throw new Error('Could not find marker');

// Find the first '  return (' after the marker
const actualReturnStart = content.indexOf('  return (', returnStart);
if (actualReturnStart === -1) throw new Error('Could not find actual return (');

// Find the last export default Home;
const exportEnd = content.lastIndexOf('export default Home;');
if (exportEnd === -1) throw new Error('Could not find export default');

const replacement = `  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div className="fintech-dashboard-wrapper">
      <MarketingPopup user={user} />
      <BiometricSetupPrompt user={user} />

      <div className="fintech-glow glow-top-right"></div>
      <div className="fintech-glow glow-bottom-left"></div>

      <div className="fintech-content-area animate-fade-in">
        {/* --- 1. Top Navigation --- */}
        <header className="fintech-top-nav">
          <div className="nav-profile-group" onClick={() => navigate('/profile')}>
            <div className="nav-avatar">{getUserInitials()}</div>
            <div className="nav-greeting">
              <span className="greeting-text">{greeting},</span>
              <span className="user-name">{user?.name?.split(' ')[0] || user?.username || 'Member'}</span>
            </div>
          </div>
          <div className="nav-actions">
            <button className="icon-btn" onClick={() => fetchUserInfo()} title="Refresh Balance"><RefreshCcw size={18} /></button>
            <button className="icon-btn" onClick={() => navigate('/notifications')}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
          </div>
        </header>

        {/* Alerts */}
        {user && user.isEmailVerified === false && (
           <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', color: '#ef4444', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verify your email to secure your account.</span>
              <button onClick={() => navigate('/verify-email', { state: { email: user.email } })} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Verify</button>
           </div>
        )}

        {/* --- 2. Premium Wallet Card --- */}
        <div className="fintech-wallet-card">
          <div className="wallet-header">
            <div className="wallet-label">
              <span>Total Balance</span>
              <button className="eye-btn" onClick={toggleBalancePrivacy}>
                {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {recentlyFundedStatus && (
              <div className="wallet-badge"><CheckCircle size={10} /> Active</div>
            )}
          </div>
          
          <div className="wallet-balance-row">
            <div className={"wallet-balance " + (hideBalance ? "blurred" : "")}>
              {hideBalance ? '₦ ****.**' : \`₦\${(user?.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`}
            </div>
          </div>

          <div className="wallet-actions">
            <div className="action-item primary" onClick={() => navigate('/wallet')}>
              <div className="action-icon-wrap"><ArrowDownLeft size={20} /></div>
              <span>Fund</span>
            </div>
            <div className="action-item" onClick={() => navigate('/wallet')}>
              <div className="action-icon-wrap"><ArrowUpRight size={20} /></div>
              <span>Transfer</span>
            </div>
            <div className="action-item" onClick={() => {
                const url = \`https://\${user?.domain || '9jasub.com'}\`;
                window.open(url, '_blank');
              }}>
              <div className="action-icon-wrap"><Globe size={20} /></div>
              <span>Web</span>
            </div>
            <div className="action-item" onClick={() => setShowMoreMenu(true)}>
              <div className="action-icon-wrap"><LayoutGrid size={20} /></div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* --- 3. Promotional Banners --- */}
        {banners && banners.length > 0 && (
          <div className="promo-carousel animate-fade-in">
            {banners.map((banner, index) => (
              <div key={banner._id || index} className="promo-slide" onClick={() => handleLinkClick(banner)}>
                <img src={banner.image || banner.imageUrl} alt={banner.title || "Promo"} />
                <div className="promo-slide-overlay">
                  <h4>{banner.title}</h4>
                  <p>{banner.message || banner.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- 4. Quick Services Grid --- */}
        <div className="section-header">
          <h3>Quick Services</h3>
        </div>
        <div className="services-grid animate-fade-in">
          <div className="service-card srv-yellow" onClick={() => handleServiceClick('data')}>
            <div className="service-icon-wrap"><Wifi size={24} /></div>
            <span>Data</span>
          </div>
          <div className="service-card srv-green" onClick={() => handleServiceClick('airtime')}>
            <div className="service-icon-wrap"><Smartphone size={24} /></div>
            <span>Airtime</span>
          </div>
          <div className="service-card srv-red" onClick={() => handleServiceClick('cable')}>
            <div className="service-icon-wrap"><PlaySquare size={24} /></div>
            <span>Cable TV</span>
          </div>
          <div className="service-card srv-orange" onClick={() => handleServiceClick('electricity')}>
            <div className="service-icon-wrap"><Zap size={24} /></div>
            <span>Electric</span>
          </div>
          <div className="service-card srv-pink" onClick={() => handleServiceClick('epin')}>
            <div className="service-icon-wrap"><Hash size={24} /></div>
            <span>EPins</span>
          </div>
          <div className="service-card srv-blue" onClick={() => handleServiceClick('education')}>
            <div className="service-icon-wrap"><GraduationCap size={24} /></div>
            <span>Education</span>
          </div>
          <div className="service-card srv-cyan" onClick={() => navigate('/transactions')}>
            <div className="service-icon-wrap"><History size={24} /></div>
            <span>History</span>
          </div>
          <div className="service-card srv-purple" onClick={() => navigate('/profile')}>
            <div className="service-icon-wrap"><User size={24} /></div>
            <span>Profile</span>
          </div>
        </div>

        {/* --- 5. Identity Services Grid (CheckMyNINBVN) --- */}
        <div className="section-header">
          <h3>Identity Services</h3>
        </div>
        <div className="services-grid animate-fade-in">
          <div className="service-card srv-green" onClick={() => navigate('/identity/nin-verify')}>
            <div className="service-icon-wrap"><ShieldCheck size={24} /></div>
            <span>NIN Verify</span>
          </div>
          <div className="service-card srv-yellow" onClick={() => navigate('/identity/nin-phone')}>
            <div className="service-icon-wrap"><Phone size={24} /></div>
            <span>NIN Phone</span>
          </div>
          <div className="service-card srv-cyan" onClick={() => navigate('/identity/nin-tracking')}>
            <div className="service-icon-wrap"><FileCheck size={24} /></div>
            <span>Tracking ID</span>
          </div>
          <div className="service-card srv-purple" onClick={() => navigate('/identity/nin-demographics')}>
            <div className="service-icon-wrap"><Users size={24} /></div>
            <span>Demographics</span>
          </div>
          <div className="service-card srv-blue" onClick={() => navigate('/identity/bvn-verify')}>
            <div className="service-icon-wrap"><Fingerprint size={24} /></div>
            <span>BVN Verify</span>
          </div>
          <div className="service-card srv-pink" onClick={() => navigate('/identity/bvn-phone')}>
            <div className="service-icon-wrap"><PhoneCall size={24} /></div>
            <span>BVN Phone</span>
          </div>
          <div className="service-card srv-red" onClick={() => navigate('/identity/nin-modification')}>
            <div className="service-icon-wrap"><FileEdit size={24} /></div>
            <span>NIN Modify</span>
          </div>
        </div>

        {/* --- 6. Recent Activity --- */}
        <div className="section-header">
          <h3>Recent Activity</h3>
          <span onClick={() => navigate('/transactions')}>View All</span>
        </div>
        <div className="activity-list animate-fade-in">
          {transactions.length === 0 && !isLoadingTx ? (
             <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
               <Clock size={32} style={{ opacity: 0.5, margin: '0 auto 8px' }} />
               <p>No recent activity</p>
             </div>
          ) : (
             transactions.slice(0, 5).map(tx => {
               const isCredit = tx.type === 'credit';
               const isFailed = tx.status === 'failed';
               const isPending = tx.status === 'pending';
               
               let iconClass = 'icon-debit';
               let amtClass = 'amt-debit';
               let statusClass = 'status-success';

               if (isCredit) { iconClass = 'icon-credit'; amtClass = 'amt-credit'; }
               if (isFailed) { iconClass = 'icon-failed'; amtClass = 'amt-failed'; statusClass = 'status-failed'; }
               if (isPending) { iconClass = 'icon-pending'; statusClass = 'status-pending'; }

               return (
                 <div key={tx._id} className="activity-item" onClick={() => setSelectedTx(tx)}>
                    <div className="activity-left">
                       <div className={"activity-icon " + iconClass}>
                         {isPending ? <Clock size={18} /> : isFailed ? <XCircle size={18} /> : isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                       </div>
                       <div className="activity-details">
                          <h5>{tx.description}</h5>
                          <p>{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                    <div className="activity-right">
                       <h5 className={"activity-amt " + amtClass}>
                         {isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}
                       </h5>
                       <span className={"activity-status " + statusClass}>{tx.status}</span>
                    </div>
                 </div>
               )
             })
          )}
        </div>
      </div>

      {/* --- Modals / Overlays --- */}
      {selectedTx && (
        <div className="modal-overlay animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)', position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex: 3000 }}>
          <div className="fintech-tx-modal animate-scale-in" style={{ 
              margin: 'auto', 
              width: '90%', maxWidth: '400px',
              background: 'var(--bg-surface)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-dark)'
          }}>
            <div style={{ textAlign: 'center', margin: '0 auto 20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Transaction Receipt</h3>
            </div>
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '16px', fontSize: '14px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reference:</span>
                <strong>{selectedTx.reference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <strong>{selectedTx.description}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>₦{selectedTx.amount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedTx.status === 'failed' ? '#ef4444' : '#10b981' }}>{selectedTx.status}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1.5, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }} onClick={() => setSelectedTx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom More Bottom Sheet --- */}
      {showMoreMenu && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-drag-handle"></div>
            <div className="bottom-sheet-menu">
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/wallet'); }}>
                 <div className="sheet-menu-icon"><ArrowDownLeft size={20} /></div>
                 <div className="sheet-menu-text">
                   <h4>Fund Wallet</h4>
                   <p>Add money to your account instantly</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/wallet'); }}>
                 <div className="sheet-menu-icon"><ArrowUpRight size={20} /></div>
                 <div className="sheet-menu-text">
                   <h4>Transfer & Withdraw</h4>
                   <p>Send money to other users or withdraw</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/transactions'); }}>
                 <div className="sheet-menu-icon"><History size={20} /></div>
                 <div className="sheet-menu-text">
                   <h4>Transaction History</h4>
                   <p>View all your past activities</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/profile'); }}>
                 <div className="sheet-menu-icon"><User size={20} /></div>
                 <div className="sheet-menu-text">
                   <h4>Settings</h4>
                   <p>Manage your account and security</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/support'); }}>
                 <div className="sheet-menu-icon"><Headphones size={20} /></div>
                 <div className="sheet-menu-text">
                   <h4>Help & Support</h4>
                   <p>Contact us for assistance</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
`;

content = content.substring(0, actualReturnStart) + replacement;

fs.writeFileSync(filePath, content);
console.log('Successfully replaced Home.jsx return block.');
