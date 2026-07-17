import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Save, RefreshCcw } from 'lucide-react';
import './AdminSettings.css'; // Reuse settings CSS for layout

const TierMargins = () => {
    const [margins, setMargins] = useState({
        basic: { airtime: 0.02, cable: 0.01, electricity: 0.01, betting: 0.01 },
        vip: { airtime: 0.025, cable: 0.015, electricity: 0.015, betting: 0.015 },
        premium: { airtime: 0.03, cable: 0.02, electricity: 0.02, betting: 0.02 }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMargins();
    }, []);

    const fetchMargins = async () => {
        try {
            const res = await API.get('/api/admin/system-settings');
            if (res.data && res.data.tierMargins) {
                setMargins(res.data.tierMargins);
            }
        } catch (err) {
            console.error("Failed to fetch tier margins", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (tier, service, value) => {
        setMargins(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                [service]: Number(value) / 100 // Convert percentage to decimal
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.post('/api/admin/system-settings', { tierMargins: margins });
            alert("Tier margins saved successfully!");
        } catch (err) {
            alert("Failed to save margins.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading margins...</div>;

    const renderTierTable = (tierName, tierKey) => (
        <div className="settings-card" style={{ marginBottom: '20px' }}>
            <h3>{tierName} Tier Margins (Profit %)</h3>
            <p className="settings-desc">Set the global profit margin percentage for {tierName} resellers.</p>
            <div className="settings-grid">
                <div className="setting-item">
                    <label>Airtime Margin (%)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={(margins[tierKey]?.airtime || 0) * 100} 
                        onChange={(e) => handleChange(tierKey, 'airtime', e.target.value)}
                    />
                </div>
                <div className="setting-item">
                    <label>Cable TV Margin (%)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={(margins[tierKey]?.cable || 0) * 100} 
                        onChange={(e) => handleChange(tierKey, 'cable', e.target.value)}
                    />
                </div>
                <div className="setting-item">
                    <label>Electricity Margin (%)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={(margins[tierKey]?.electricity || 0) * 100} 
                        onChange={(e) => handleChange(tierKey, 'electricity', e.target.value)}
                    />
                </div>
                <div className="setting-item">
                    <label>Betting Margin (%)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={(margins[tierKey]?.betting || 0) * 100} 
                        onChange={(e) => handleChange(tierKey, 'betting', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-settings-container">
            <div className="page-header">
                <div>
                    <h2>Tier Margins Configuration</h2>
                    <p style={{color: 'var(--text-secondary)'}}>Manage global profit margins for non-data services.</p>
                </div>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCcw size={16} className="spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Margins'}
                </button>
            </div>

            <div className="settings-sections">
                {renderTierTable("Basic", "basic")}
                {renderTierTable("VIP", "vip")}
                {renderTierTable("Premium", "premium")}
            </div>
        </div>
    );
};

export default TierMargins;
