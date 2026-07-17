import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

class AdminErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("AdminErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', padding: '40px',
                    textAlign: 'center', fontFamily: 'var(--font-family)',
                    background: 'var(--bg-color)', color: 'var(--text-dark)'
                }}>
                    <div style={{
                        background: 'var(--danger-light)', color: 'var(--danger)',
                        padding: '24px', borderRadius: '50%', marginBottom: '24px',
                        boxShadow: '0 8px 32px rgba(244, 63, 94, 0.15)'
                    }}>
                        <AlertOctagon size={64} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>This module could not be loaded.</h2>
                    <p style={{ color: 'var(--text-gray)', fontSize: '15.4px', maxWidth: '500px', marginBottom: '32px', lineHeight: 1.6 }}>
                        An internal error occurred while rendering this interface. This is typically caused by a network interruption or corrupted cached data.
                        <br/><br/>
                        <span style={{ fontSize: '13.2px', opacity: 0.7, fontFamily: 'monospace' }}>
                            {this.state.error?.message}
                        </span>
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="premium-btn premium-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={18} /> Retry Module
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AdminErrorBoundary;
