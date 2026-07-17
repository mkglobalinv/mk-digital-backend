import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransactionBannerContext = createContext();

export const useTransactionBanner = () => {
    const context = useContext(TransactionBannerContext);
    if (!context) throw new Error("useTransactionBanner must be used within TransactionBannerProvider");
    return context;
};

export const TransactionBannerProvider = ({ children }) => {
    const [transactionState, setTransactionState] = useState({
        isActive: false,
        status: 'processing', // 'processing', 'success', 'failed'
        message: '',
        details: null, // receipt data or error
    });

    const startProcessing = useCallback((message) => {
        setTransactionState({
            isActive: true,
            status: 'processing',
            message: message || "Processing your request... Please wait.",
            details: null
        });
    }, []);

    const updateStatus = useCallback((status, message, details = null) => {
        // Trigger haptic feedback if supported
        try {
            if (status === 'success' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            } else if (status === 'failed' && navigator.vibrate) {
                navigator.vibrate([200]);
            }
        } catch (e) {}
        
        setTransactionState(prev => ({
            ...prev,
            status,
            message: message || prev.message,
            details
        }));
    }, []);

    const clearBanner = useCallback(() => {
        setTransactionState({ isActive: false, status: 'processing', message: '', details: null });
    }, []);

    return (
        <TransactionBannerContext.Provider value={{ transactionState, startProcessing, updateStatus, clearBanner }}>
            {children}
            
            {/* Global Floating Processing Banner */}
            {transactionState.isActive && (
                <div className={`global-tx-banner ${transactionState.status} animate-slide-down`} style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 50000,
                    background: transactionState.status === 'processing' ? 'var(--card-bg)' : 
                                transactionState.status === 'success' ? '#10B981' : '#EF4444',
                    color: transactionState.status === 'processing' ? 'var(--text-color)' : '#fff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: '220px',
                    maxWidth: '90vw',
                    border: transactionState.status === 'processing' ? '1px solid var(--border-color)' : 'none',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    {transactionState.status === 'processing' && <Loader2 className="animate-spin" size={16} color="#3B82F6" />}
                    {transactionState.status === 'success' && <CheckCircle size={16} color="#fff" />}
                    {transactionState.status === 'failed' && <AlertCircle size={16} color="#fff" />}
                    
                    <span style={{ fontSize: '12.5px', fontWeight: '600', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {transactionState.message}
                    </span>

                    {transactionState.status !== 'processing' && (
                        <button onClick={clearBanner} style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer'
                        }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}
        </TransactionBannerContext.Provider>
    );
};
