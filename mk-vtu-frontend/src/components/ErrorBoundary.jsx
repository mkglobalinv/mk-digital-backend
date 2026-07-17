import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Caught an exception:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container" style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: '#fff',
                    borderRadius: '16px',
                    border: '1px solid #fee2e2',
                    margin: '20px'
                }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: '#fef2f2', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 20px',
                        color: '#ef4444'
                    }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Component Crash Detected</h2>
                    <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                        A modular part of the interface failed to render. The rest of the platform remains operational.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#1e293b',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <RefreshCcw size={18} /> Reload Platform
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <div style={{ 
                            marginTop: '20px', 
                            textAlign: 'left', 
                            background: '#f8fafc', 
                            padding: '15px', 
                            borderRadius: '8px',
                            fontSize: '13.2px',
                            overflow: 'auto',
                            maxHeight: '200px',
                            color: '#dc2626'
                        }}>
                            <code>{this.state.error?.toString()}</code>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
