import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../api';
import { ShieldCheck, Loader2, Key, HelpCircle, History, Smartphone, Settings } from 'lucide-react';
import './AdminSettings.css';

const AdminSettings = ({ token }) => {
    const location = useLocation();
    const setupRequired = location.state?.setupRequired || false;

    const [activeTab, setActiveTab] = useState(setupRequired ? 'security' : 'password');
    const [securityStatus, setSecurityStatus] = useState(null);

    // Password States
    const [pwdData, setPwdData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    
    // Security Questions States
    const [questions, setQuestions] = useState([
        { question: 'What is your favorite childhood book?', answer: '' },
        { question: 'What was the name of your first pet?', answer: '' }
    ]);
    
    // Funding Password States
    const [fundingData, setFundingData] = useState({ fundingPassword: '', confirmFundingPassword: '', currentPassword: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSecurityStatus();
    }, []);

    const fetchSecurityStatus = async () => {
        try {
            const res = await API.get('/api/admin/security/status', { headers: { Authorization: token } });
            setSecurityStatus(res.data);
        } catch (err) {
            console.error("Failed to fetch security status");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (pwdData.newPassword !== pwdData.confirmPassword) return setError("Passwords do not match");
        setLoading(true);
        try {
            await API.post('/api/admin/change-password', 
                { oldPassword: pwdData.oldPassword, newPassword: pwdData.newPassword },
                { headers: { Authorization: token } }
            );
            setSuccess("Password updated successfully!");
            setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || "Update failed");
        } finally { setLoading(false); }
    };

    const handleSecuritySetup = async (e) => {
        e.preventDefault();
        if (questions.some(q => !q.answer.trim())) return setError("Please answer all questions");
        setLoading(true);
        try {
            await API.post('/api/admin/security/setup-questions', { questions }, { headers: { Authorization: token } });
            setSuccess("Security questions saved!");
            fetchSecurityStatus();
        } catch (err) {
            setError(err.response?.data?.message || "Setup failed");
        } finally { setLoading(false); }
    };

    const handleFundingSetup = async (e) => {
        e.preventDefault();
        if (fundingData.fundingPassword !== fundingData.confirmFundingPassword) return setError("Funding passwords do not match");
        setLoading(true);
        try {
            await API.post('/api/admin/security/setup-funding-password', 
                { fundingPassword: fundingData.fundingPassword, currentPassword: fundingData.currentPassword },
                { headers: { Authorization: token } }
            );
            setSuccess("Funding password established!");
            fetchSecurityStatus();
        } catch (err) {
            setError(err.response?.data?.message || "Setup failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="admin-settings-container">
            <div className="settings-sidebar">
                <div className="sidebar-header">
                    <Settings size={20} />
                    <span>Control Center</span>
                </div>
                <button className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>
                    <Key size={18} /> Password
                </button>
                <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
                    <HelpCircle size={18} /> Security Questions
                    {securityStatus?.securityQuestionsSet && <span className="status-dot green"></span>}
                </button>
                <button className={activeTab === 'funding' ? 'active' : ''} onClick={() => setActiveTab('funding')}>
                    <ShieldCheck size={18} /> Funding Password
                    {securityStatus?.fundingPasswordSet && <span className="status-dot green"></span>}
                </button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
                    <History size={18} /> Security Logs
                </button>
            </div>

            <div className="settings-main">
                <div className="settings-header">
                    <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h1>
                    {setupRequired && <div className="setup-alert">Required Security Setup Active</div>}
                </div>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                <div className="settings-card-modern">
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Login Password</label>
                                <input type="password" value={pwdData.oldPassword} onChange={e => setPwdData({...pwdData, oldPassword: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>New Login Password</label>
                                <input type="password" value={pwdData.newPassword} onChange={e => setPwdData({...pwdData, newPassword: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" value={pwdData.confirmPassword} onChange={e => setPwdData({...pwdData, confirmPassword: e.target.value})} required />
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleSecuritySetup}>
                            <p className="hint">These questions will be used to verify your identity during suspicious login attempts.</p>
                            {questions.map((q, idx) => (
                                <div className="form-group" key={idx}>
                                    <label>{q.question}</label>
                                    <input 
                                        type="text" 
                                        value={q.answer} 
                                        onChange={e => {
                                            const newQ = [...questions];
                                            newQ[idx].answer = e.target.value;
                                            setQuestions(newQ);
                                        }} 
                                        required 
                                        placeholder="Your answer..."
                                    />
                                </div>
                            ))}
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Save Security Questions'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'funding' && (
                        <form onSubmit={handleFundingSetup}>
                            <p className="hint">This password is required for all financial operations (wallet funding, credits, etc.). It must be different from your login password.</p>
                            <div className="form-group">
                                <label>New Funding Password</label>
                                <input type="password" value={fundingData.fundingPassword} onChange={e => setFundingData({...fundingData, fundingPassword: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Confirm Funding Password</label>
                                <input type="password" value={fundingData.confirmFundingPassword} onChange={e => setFundingData({...fundingData, confirmFundingPassword: e.target.value})} required />
                            </div>
                            <hr />
                            <div className="form-group">
                                <label>Authorize with Current Login Password</label>
                                <input type="password" value={fundingData.currentPassword} onChange={e => setFundingData({...fundingData, currentPassword: e.target.value})} required />
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Establish Funding Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
