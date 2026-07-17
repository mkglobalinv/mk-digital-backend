const fs = require('fs');
const path = require('path');
const file = path.join('c:/Users/userpc/mk-digital-backend/mk-vtu-frontend/src/admin/pages/ResellerManager.jsx');
let code = fs.readFileSync(file, 'utf8');

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

if (!code.includes('showCustAdjustModal && selectedCustomer')) {
    code = code.replace(
        '        </div>\n    );\n};',
        modalsHtml + '\n        </div>\n    );\n};'
    );
    fs.writeFileSync(file, code);
    console.log("Modals injected successfully.");
} else {
    console.log("Modals already exist.");
}
