import React, { useState, useEffect } from 'react';
import API from '../api';
import { Terminal, Key, ShieldCheck, Globe, Loader2, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DeveloperApi = ({ user }) => {
    const { showToast } = useToast();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Form States
    const [webhookUrl, setWebhookUrl] = useState("");
    const [ipWhitelist, setIpWhitelist] = useState("");

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await API.get('/api/developer/config');
            if (res.data.success) {
                setConfig(res.data.data);
                setWebhookUrl(res.data.data.webhookUrl || "");
                setIpWhitelist(res.data.data.ipWhitelist.join(", ") || "");
            }
        } catch (err) {
            showToast("Failed to fetch API configuration", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateKey = async (type) => {
        if (!window.confirm(`Are you sure you want to generate a new ${type.toUpperCase()} API key? Any existing integrations using the old key will stop working immediately.`)) {
            return;
        }

        setGenerating(true);
        try {
            const res = await API.post('/api/developer/keys/generate', { type });
            if (res.data.success) {
                // Show the full key in a prompt or alert so they can copy it once
                window.prompt(
                    `${res.data.message}\n\nCOPY THIS NOW (It will not be shown again):`, 
                    res.data.data.key
                );
                showToast("API Key generated successfully!", "success");
                fetchConfig(); // Refresh masked view
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to generate key", "error");
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update Webhook
            await API.post('/api/developer/webhook', { webhookUrl });
            
            // Update IPs
            const ips = ipWhitelist.split(",").map(ip => ip.trim()).filter(ip => ip !== "");
            await API.post('/api/developer/ip-whitelist', { ips });

            showToast("Security settings saved successfully!", "success");
            fetchConfig();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Terminal className="text-blue-600" size={32} />
                        Developer Portal
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Manage your API credentials, secure your integration, and monitor usage.
                    </p>
                </div>
                <a 
                    href="/docs" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                    View API Documentation
                </a>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Keys & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    {/* API Keys Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <Key className="text-slate-600" size={20} />
                            <h2 className="font-bold text-slate-900 text-lg">API Authentication</h2>
                        </div>
                        <div className="p-6 space-y-8">
                            
                            {/* Live Key */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Live Secret Key
                                    </label>
                                    <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md">Production</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={config?.liveApiKey || "Not generated yet"} 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-600 focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => handleGenerateKey('live')}
                                        disabled={generating}
                                        className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
                                        {config?.hasLiveKey ? "Roll Key" : "Generate"}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Keep this key secret. It can perform live transactions.</p>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Test Key */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        Test Secret Key
                                    </label>
                                    <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-md">Sandbox</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={config?.testApiKey || "Not generated yet"} 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-600 focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => handleGenerateKey('test')}
                                        disabled={generating}
                                        className="px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
                                        {config?.hasTestKey ? "Roll Key" : "Generate"}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Use this key to test API integration without deducting real funds.</p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right Column - Security & Webhooks */}
                <div className="space-y-8">
                    {/* Security Settings */}
                    <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <ShieldCheck className="text-slate-600" size={20} />
                            <h2 className="font-bold text-slate-900 text-lg">Security & Hooks</h2>
                        </div>
                        <div className="p-6 space-y-6 flex-1">
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Globe size={16} className="text-slate-400" />
                                    Webhook URL
                                </label>
                                <input 
                                    type="url" 
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://your-domain.com/webhook"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                                <p className="text-xs text-slate-500 font-medium">We will send POST requests here when asynchronous transactions complete.</p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-slate-400" />
                                    IP Whitelist
                                </label>
                                <textarea 
                                    value={ipWhitelist}
                                    onChange={(e) => setIpWhitelist(e.target.value)}
                                    placeholder="192.168.1.1, 10.0.0.1"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                />
                                <p className="text-xs text-slate-500 font-medium">Comma-separated list of IP addresses allowed to make API calls. Leave blank to allow any IP.</p>
                            </div>

                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total API Calls</h4>
                    <p className="text-5xl font-black">{config?.stats?.apiCallCount?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Last API Call</h4>
                    <p className="text-2xl font-black text-slate-900">
                        {config?.stats?.lastApiCall ? new Date(config.stats.lastApiCall).toLocaleString() : "Never"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperApi;
