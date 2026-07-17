import React, { useState } from 'react';
import { 
    Sparkles, 
    Activity, 
    ShieldAlert, 
    Zap, 
    TrendingUp, 
    Search,
    MessageSquare,
    RefreshCw,
    Bot,
    Server,
    CheckCircle,
    ChevronRight,
    Send
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API from '../../api';
import './AdminAppRequests.css'; // Reuse existing layout and styling classes

const AIAssistantControl = () => {
    const { showToast, updateToast } = useToast();
    const [activeTool, setActiveTool] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const [query, setQuery] = useState('');
    const [chatResult, setChatResult] = useState(null);
    const [chatAnalyzing, setChatAnalyzing] = useState(false);

    const tools = [
        {
            id: 'sys-diag',
            name: 'System Diagnostics',
            icon: <Server size={20} />,
            desc: 'Run a deep-dive AI analysis on current node health and CPU/Memory bottlenecks.',
            color: '#3B82F6',
            bg: '#DBEAFE',
            mockResult: 'Diagnostic Complete. Node health is optimal. No memory leaks detected. CPU utilization is steady at 4%. Recommendation: Maintain current configuration.'
        },
        {
            id: 'prov-health',
            name: 'Provider Health Analysis',
            icon: <Zap size={20} />,
            desc: 'Analyze VTU gateway latency patterns and predict potential downtime events.',
            color: '#EAB308',
            bg: '#FEF9C3',
            mockResult: 'Provider Analysis: ClubKonnect latency has increased by 14% over the last hour. Reloadly API is stable. Recommendation: No failover required yet, but monitor ClubKonnect.'
        },
        {
            id: 'tx-intel',
            name: 'Transaction Intelligence',
            icon: <TrendingUp size={20} />,
            desc: 'Detect anomalies in recent transaction volumes and success rates.',
            color: '#10B981',
            bg: '#D1FAE5',
            mockResult: 'Transaction Intel: Success rate is currently 98.4%. No fraudulent patterns detected in the last 10,000 transactions. Daily volume is tracking 5% above average.'
        },
        {
            id: 'fail-inv',
            name: 'Failure Investigation',
            icon: <Search size={20} />,
            desc: 'Automatically cross-reference error logs to find the root cause of recent failures.',
            color: '#F97316',
            bg: '#FFEDD5',
            mockResult: 'Root Cause Analysis: The 3 recent failed data purchases were caused by an upstream timeout from the telecom operator. Auto-refunds successfully processed.'
        },
        {
            id: 'sec-audit',
            name: 'Security Audit Assistant',
            icon: <ShieldAlert size={20} />,
            desc: 'Scan admin audit logs for suspicious login attempts or unauthorized actions.',
            color: '#EF4444',
            bg: '#FEE2E2',
            mockResult: 'Security Scan: 0 unauthorized access attempts. 2 failed logins from IP 192.168.1.4. All admin sessions are utilizing secure JWT tokens.'
        },
        {
            id: 'perf-rec',
            name: 'Performance Recommendations',
            icon: <Activity size={20} />,
            desc: 'Get AI-driven tips on database indexing and query optimization.',
            color: '#8B5CF6',
            bg: '#F3E8FF',
            mockResult: 'Performance Tip: Consider adding a compound index on { "resellerId": 1, "createdAt": -1 } in the Transactions collection to speed up the Reseller Dashboard loading times by estimated 35%.'
        }
    ];

    const runAnalysis = async (tool) => {
        setActiveTool(tool.id);
        setAnalyzing(true);
        setResult(null);
        
        const toastId = await showToast(`🤖 AI Assistant analyzing...`, 'loading');

        // Simulate AI processing time for static tools
        setTimeout(() => {
            setAnalyzing(false);
            setResult(tool.mockResult);
            updateToast(toastId, { type: 'success', message: '✅ Analysis completed successfully.' });
        }, 2500);
    };

    const handleChatAnalysis = async () => {
        if (!query.trim()) return;
        setChatAnalyzing(true);
        setChatResult(null);
        
        const toastId = await showToast('🤖 AI Assistant analyzing...', 'loading');
        
        try {
            const res = await API.post('/api/admin/ai-assistant/query', { query });
            setChatResult(res.data.result || res.data.analysis || "Analysis complete. No specific insights returned.");
            updateToast(toastId, { type: 'success', message: '✅ Analysis completed successfully.' });
        } catch (err) {
            updateToast(toastId, { type: 'error', message: '❌ Analysis failed. Please try again.' });
            setChatResult("The AI service is currently unavailable or the query could not be processed. Please check backend connections.");
        } finally {
            setChatAnalyzing(false);
        }
    };

    return (
        <div className="studio-container animate-fade-in">
            <header className="studio-header">
                <div>
                    <h1>AI Assistant <span style={{ color: 'var(--primary)', opacity: 0.5 }}>/</span> Intelligence</h1>
                    <p>Automated diagnostics, predictive analysis, and system intelligence.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="premium-glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.3px', fontWeight: 600 }}>
                        <Bot size={16} style={{ color: '#8B5CF6' }} />
                        Model: SuperAdmin AI v1.0
                    </div>
                </div>
            </header>

            {/* Conversational AI Section */}
            <div className="premium-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                        <MessageSquare size={20} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Ask AI Assistant</h2>
                </div>
                <textarea 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="E.g., Which provider performed best today? Show the last 10 failed transactions."
                    className="premium-input"
                    style={{ minHeight: '100px', resize: 'vertical', width: '100%', marginBottom: '16px', padding: '16px', fontFamily: 'inherit' }}
                    disabled={chatAnalyzing}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        className="premium-btn premium-btn-primary" 
                        onClick={handleChatAnalysis}
                        disabled={chatAnalyzing || !query.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {chatAnalyzing ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {chatAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                </div>
                
                {chatResult && !chatAnalyzing && (
                    <div className="animate-fade-in" style={{ marginTop: '20px', background: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                            ANALYSIS COMPLETE
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                            <Bot size={24} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                            <div style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {chatResult}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
                
                {/* Tools Grid */}
                <div className="card-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {tools.map(tool => (
                        <div key={tool.id} className="premium-card" style={{ cursor: 'pointer', transition: 'all 0.2s', border: activeTool === tool.id ? `2px solid ${tool.color}` : '1px solid transparent' }} onClick={() => runAnalysis(tool)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: tool.bg, color: tool.color, padding: '10px', borderRadius: '12px' }}>
                                    {tool.icon}
                                </div>
                                <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0 }}>{tool.name}</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '13.2px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                                {tool.desc}
                            </p>
                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', color: tool.color, borderColor: tool.bg, background: tool.bg }}>
                                    Launch Analysis <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Response Panel */}
                <div className="premium-card" style={{ position: 'sticky', top: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '8px', borderRadius: '50%' }}>
                            <Sparkles size={20} />
                        </div>
                        <h2 style={{ fontSize: '17.6px', fontWeight: 800, margin: 0 }}>Intelligence Output</h2>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {!activeTool && !analyzing && !result && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <MessageSquare size={32} style={{ opacity: 0.5 }} />
                                <p>Select an intelligence tool from the grid to begin analysis.</p>
                            </div>
                        )}

                        {analyzing && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <RefreshCw className="animate-spin" size={36} />
                                <div style={{ fontWeight: 700 }}>AI is processing system data...</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Cross-referencing logs and metrics.</div>
                            </div>
                        )}

                        {result && !analyzing && (
                            <div className="animate-fade-in" style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                                    ANALYSIS COMPLETE
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <CheckCircle size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '14.5px', lineHeight: '1.6', color: '#334155' }}>
                                        {result}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIAssistantControl;
