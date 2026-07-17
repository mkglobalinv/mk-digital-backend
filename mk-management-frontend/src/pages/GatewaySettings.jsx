import React, { useState, useEffect } from 'react';
import GatewayCard from '../components/GatewaySettings/GatewayCard';
import axios from 'axios'; // Ensure axios is available or use fetch

const GatewaySettings = () => {
    const [gateways, setGateways] = useState({
        flutterwave: { isActive: true, isTestMode: true, testStatus: 'untested' },
        xixapay: { isActive: false, isTestMode: true, testStatus: 'untested' }
    });
    const [loading, setLoading] = useState(true);

    const fetchGateways = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('/api/admin/gateways', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const updatedGateways = { ...gateways };
            if (res.data && res.data.data) {
                res.data.data.forEach(g => {
                    if (updatedGateways[g.provider]) {
                        updatedGateways[g.provider] = {
                            isActive: g.isActive,
                            isTestMode: g.isTestMode,
                            testStatus: g.testStatus
                        };
                    }
                });
            }
            setGateways(updatedGateways);
        } catch (error) {
            console.error('Failed to load gateways:', error);
            // Non-blocking for UI demo, real implementation should show error toast
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGateways();
    }, []);

    const handleToggle = async (provider, isActive) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`/api/admin/gateways/${provider}/toggle`, { isActive }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`${provider} is now ${isActive ? 'Active' : 'Inactive'}`);
            fetchGateways();
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Failed to toggle gateway'}`);
        }
    };

    const handleTest = async (provider) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`/api/admin/gateways/${provider}/test`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Test connection successful!');
            fetchGateways();
        } catch (error) {
            alert(`Test Failed: ${error.response?.data?.message || 'Connection error'}`);
            fetchGateways();
        }
    };

    const handleSaveCredentials = async (provider, credentials, isTestMode) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`/api/admin/gateways/${provider}`, { credentials, isTestMode }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Credentials saved successfully!');
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Failed to save credentials'}`);
        }
    };

    if (loading) return <div className="p-8">Loading Gateway Configuration...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Payment Gateways</h1>
            <p className="text-gray-600 mb-8">Manage your payment providers. Only one gateway can be active at a time.</p>
            
            <GatewayCard 
                providerName="flutterwave"
                isActive={gateways.flutterwave.isActive}
                isTestMode={gateways.flutterwave.isTestMode}
                testStatus={gateways.flutterwave.testStatus}
                onToggle={handleToggle}
                onTest={handleTest}
                onSaveCredentials={handleSaveCredentials}
            />

            <GatewayCard 
                providerName="xixapay"
                isActive={gateways.xixapay.isActive}
                isTestMode={gateways.xixapay.isTestMode}
                testStatus={gateways.xixapay.testStatus}
                onToggle={handleToggle}
                onTest={handleTest}
                onSaveCredentials={handleSaveCredentials}
            />
        </div>
    );
};

export default GatewaySettings;
