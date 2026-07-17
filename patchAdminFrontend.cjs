const fs = require('fs');
const path = require('path');
const file = path.join('c:/Users/userpc/mk-digital-backend/mk-vtu-frontend/src/admin/pages/ResellerManager.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add States
if (!code.includes('const [selectedCustomer, setSelectedCustomer]')) {
    code = code.replace(
        'const [customers, setCustomers] = useState([]);',
        `const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustAdjustModal, setShowCustAdjustModal] = useState(false);
    const [custAdjustData, setCustAdjustData] = useState({ wallet: 'normal', type: 'credit', amount: '', reason: '', fundingPassword: '' });
    const [showCustOTPModal, setShowCustOTPModal] = useState(false);
    const [custOtpData, setCustOtpData] = useState({ intentToken: '', otp: '' });
    const [showCustNotifyModal, setShowCustNotifyModal] = useState(false);
    const [custNotifyData, setCustNotifyData] = useState({ subject: '', message: '' });`
    );
}

// 2. Add Handlers before useEffect
if (!code.includes('handleCustAdjustWallet')) {
    const handlers = `
    const handleCustAdjustWallet = async (e) => {
        e.preventDefault();
        const amt = Number(custAdjustData.amount);
        if (isNaN(amt) || amt <= 0) return showToast("Invalid amount", "warning");
        if (!custAdjustData.reason || custAdjustData.reason.trim().length < 4) return showToast("Detailed reason required", "warning");
        if (!custAdjustData.fundingPassword) return showToast("Admin funding password required", "warning");

        setAdjusting(true);
        try {
            const res = await API.post('/api/admin/users/wallet/initiate', {
                userId: selectedCustomer._id,
                amount: amt,
                action: custAdjustData.type,
                reason: custAdjustData.reason,
                fundingPassword: custAdjustData.fundingPassword
            });
            setCustOtpData({ intentToken: res.data.intentToken, otp: '' });
            setShowCustAdjustModal(false);
            setShowCustOTPModal(true);
            showToast("OTP sent to your email", "info");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to initiate adjustment", "error");
        } finally {
            setAdjusting(false);
        }
    };

    const handleCustConfirmAdjust = async (e) => {
        e.preventDefault();
        setAdjusting(true);
        try {
            const res = await API.post('/api/admin/users/wallet/confirm', {
                intentToken: custOtpData.intentToken,
                otp: custOtpData.otp
            });
            showToast(res.data.message || "Wallet adjusted successfully", "success");
            setShowCustOTPModal(false);
            setCustOtpData({ intentToken: '', otp: '' });
            setCustAdjustData({ wallet: 'normal', type: 'credit', amount: '', reason: '', fundingPassword: '' });
            if (selectedReseller) viewProfile(selectedReseller);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to confirm adjustment", "error");
        } finally {
            setAdjusting(false);
        }
    };

    const handleCustNotify = async (e) => {
        e.preventDefault();
        setSendingBroadcast(true);
        try {
            await API.post('/api/admin/notifications', {
                userId: selectedCustomer._id,
                title: custNotifyData.subject,
                message: custNotifyData.message,
                type: 'system'
            });
            showToast("Notification sent successfully", "success");
            setShowCustNotifyModal(false);
            setCustNotifyData({ subject: '', message: '' });
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to send notification", "error");
        } finally {
            setSendingBroadcast(false);
        }
    };
    `;
    code = code.replace('useEffect(() => {', handlers + '\n    useEffect(() => {');
}

// 3. Update Table Headers
code = code.replace(
    /<th>Name \/ Email<\/th>\s*<th>Combined Balance<\/th>\s*<th>Status<\/th>/g,
    '<th>Name / Email</th>\n                                <th>Combined Balance</th>\n                                <th>Status</th>\n                                <th>Actions</th>'
);

// 4. Update Table Rows (add td)
const tdHtml = `
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => { setSelectedCustomer(c); setShowCustAdjustModal(true); }}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                                                title="Manage Wallet"
                                            >
                                                <CreditCard size={18} />
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedCustomer(c); setShowCustNotifyModal(true); }}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                                                title="Send Notification"
                                            >
                                                <Mail size={18} />
                                            </button>
                                        </div>
                                    </td>
`;
code = code.replace(/<span className=\{\`badge \$\{c\.isSuspended \? 'badge-warning' : 'badge-success'\}\`\}>\s*\{c\.isSuspended \? 'Suspended' : 'Active'\}\s*<\/span>\s*<\/td>/, (match) => match + '\n' + tdHtml);

// Fix colSpan
code = code.replace(/colSpan="3"/g, 'colSpan="4"');

// 5. Add Modals
const modalsHtml = `
            {showCustAdjustModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Manage Wallet: {selectedCustomer.name}</h3>
                            <button className="close-btn" onClick={() => setShowCustAdjustModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCustAdjustWallet}>
                                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: \`1px solid \${custAdjustData.type === 'credit' ? '#10B981' : 'var(--border-color)'}\`, borderRadius: '8px', cursor: 'pointer', background: custAdjustData.type === 'credit' ? '#ECFDF5' : 'transparent', color: custAdjustData.type === 'credit' ? '#10B981' : 'var(--text-main)' }}>
                                        <input type="radio" name="cust_adj_type" value="credit" checked={custAdjustData.type === 'credit'} onChange={() => setCustAdjustData({...custAdjustData, type: 'credit'})} style={{ display: 'none' }} />
                                        <ArrowUpRight size={18} /> Credit (Add)
                                    </label>
                                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: \`1px solid \${custAdjustData.type === 'debit' ? '#EF4444' : 'var(--border-color)'}\`, borderRadius: '8px', cursor: 'pointer', background: custAdjustData.type === 'debit' ? '#FEF2F2' : 'transparent', color: custAdjustData.type === 'debit' ? '#EF4444' : 'var(--text-main)' }}>
                                        <input type="radio" name="cust_adj_type" value="debit" checked={custAdjustData.type === 'debit'} onChange={() => setCustAdjustData({...custAdjustData, type: 'debit'})} style={{ display: 'none' }} />
                                        <ArrowDownRight size={18} /> Debit (Deduct)
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>Amount (₦)</label>
                                    <input type="number" value={custAdjustData.amount} onChange={(e) => setCustAdjustData({...custAdjustData, amount: e.target.value})} placeholder="e.g. 5000" required />
                                </div>
                                <div className="form-group">
                                    <label>Tracking Reason</label>
                                    <input type="text" value={custAdjustData.reason} onChange={(e) => setCustAdjustData({...custAdjustData, reason: e.target.value})} placeholder="e.g. Reversal for failed Tx #1234" required />
                                </div>
                                <div className="form-group">
                                    <label>Admin Funding Password</label>
                                    <input type="password" value={custAdjustData.fundingPassword} onChange={(e) => setCustAdjustData({...custAdjustData, fundingPassword: e.target.value})} placeholder="Enter your secure funding PIN/password" required />
                                </div>
                                <button type="submit" className="premium-btn premium-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={adjusting}>
                                    {adjusting ? 'Initiating...' : 'Continue to Verification'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showCustOTPModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Security Verification</h3>
                            <button className="close-btn" onClick={() => setShowCustOTPModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '16px', color: 'var(--text-light)', fontSize: '14.3px' }}>
                                A one-time password has been sent to your admin email address. Please enter it below to confirm this manual wallet adjustment.
                            </p>
                            <form onSubmit={handleCustConfirmAdjust}>
                                <div className="form-group">
                                    <label>Enter 6-Digit OTP</label>
                                    <input type="text" value={custOtpData.otp} onChange={(e) => setCustOtpData({...custOtpData, otp: e.target.value})} placeholder="••••••" maxLength="6" style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }} required />
                                </div>
                                <button type="submit" className="premium-btn premium-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={adjusting}>
                                    {adjusting ? 'Verifying...' : 'Confirm & Apply Adjustment'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showCustNotifyModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Notify Customer: {selectedCustomer.name}</h3>
                            <button className="close-btn" onClick={() => setShowCustNotifyModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCustNotify}>
                                <div className="form-group">
                                    <label>Message Title / Subject</label>
                                    <input type="text" value={custNotifyData.subject} onChange={(e) => setCustNotifyData({...custNotifyData, subject: e.target.value})} placeholder="e.g. Account Update" required />
                                </div>
                                <div className="form-group">
                                    <label>Message Content</label>
                                    <textarea value={custNotifyData.message} onChange={(e) => setCustNotifyData({...custNotifyData, message: e.target.value})} placeholder="Type your message..." rows="5" required></textarea>
                                </div>
                                <button type="submit" className="premium-btn premium-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={sendingBroadcast}>
                                    {sendingBroadcast ? 'Sending...' : 'Send Notification'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
`;

code = code.replace(/(<\/[Dd]iv>\s*<\/[Dd]iv>\s*)$/, (match) => modalsHtml + match);

fs.writeFileSync(file, code);
console.log("Patched successfully.");
