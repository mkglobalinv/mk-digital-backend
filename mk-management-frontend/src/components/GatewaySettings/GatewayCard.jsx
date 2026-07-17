import React, { useState } from 'react';

const GatewayCard = ({ providerName, isActive, isTestMode, testStatus, onToggle, onTest, onSaveCredentials }) => {
    const [credentials, setCredentials] = useState({
        publicKey: '',
        secretKey: '',
        encryptionKey: '',
        merchantId: ''
    });

    const [showCreds, setShowCreds] = useState(false);

    const handleSave = () => {
        onSaveCredentials(providerName, credentials, isTestMode);
    };

    const handleToggle = () => {
        if (!isActive) {
            const confirmed = window.confirm(`Are you sure you want to activate ${providerName}? This will disable any other active gateway.`);
            if (confirmed) onToggle(providerName, true);
        } else {
            const confirmed = window.confirm(`Are you sure you want to deactivate ${providerName}? The platform will not be able to process payments until a gateway is active.`);
            if (confirmed) onToggle(providerName, false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-4 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold capitalize">{providerName}</h3>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button 
                        onClick={handleToggle}
                        className={`px-4 py-2 rounded text-sm font-medium text-white ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {isActive ? 'Disable' : 'Activate'}
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Test Connection Status: <span className="font-semibold">{testStatus || 'Untested'}</span></p>
                <button 
                    onClick={() => onTest(providerName)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100"
                >
                    Test Connection
                </button>
            </div>

            <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">Credentials</h4>
                    <button 
                        onClick={() => setShowCreds(!showCreds)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        {showCreds ? 'Hide' : 'Show'} Config
                    </button>
                </div>

                {showCreds && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                            <input 
                                type="password" 
                                className="w-full border rounded p-2 text-sm"
                                placeholder="••••••••••••••••"
                                onChange={(e) => setCredentials({...credentials, publicKey: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                            <input 
                                type="password" 
                                className="w-full border rounded p-2 text-sm"
                                placeholder="••••••••••••••••"
                                onChange={(e) => setCredentials({...credentials, secretKey: e.target.value})}
                            />
                        </div>
                        {providerName === 'flutterwave' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Key</label>
                                <input 
                                    type="password" 
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder="••••••••••••••••"
                                    onChange={(e) => setCredentials({...credentials, encryptionKey: e.target.value})}
                                />
                            </div>
                        )}
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleSave}
                                className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
                            >
                                Save Credentials
                            </button>
                        </div>
                        <p className="text-xs text-yellow-600 mt-2">* Note: Saving credentials will overwrite existing stored secrets. They are stored encrypted in the database.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GatewayCard;
