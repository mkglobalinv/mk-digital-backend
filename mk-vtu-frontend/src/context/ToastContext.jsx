import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X, Loader2, RotateCcw } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timeoutsRef = useRef({}); // Store timeouts by ID to clear them on update

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        if (timeoutsRef.current[id]) {
            clearTimeout(timeoutsRef.current[id]);
            delete timeoutsRef.current[id];
        }
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        // Prevent duplicate precise messages
        setToasts(prev => {
            if (prev.some(t => t.message === message && t.type === type)) return prev;
            
            const id = Date.now().toString() + Math.random().toString();
            
            // If it's a loading toast, duration is infinite
            const actualDuration = type === 'loading' ? null : duration;
            
            const newToast = { id, message, type };
            
            if (actualDuration) {
                timeoutsRef.current[id] = setTimeout(() => {
                    removeToast(id);
                }, actualDuration);
            }
            
            return [...prev, newToast];
        });

        // Return a helper to easily update or remove this specific toast
        // We find the ID generated inside the state setter
        return new Promise(resolve => {
            setTimeout(() => {
                setToasts(prev => {
                    const created = prev.find(t => t.message === message && t.type === type);
                    resolve(created ? created.id : null);
                    return prev;
                });
            }, 0);
        });
    }, [removeToast]);

    const updateToast = useCallback((id, updates) => {
        if (!id) return;
        setToasts(prev => prev.map(t => {
            if (t.id === id) {
                // If we are updating to a non-loading type and providing a duration
                const duration = updates.duration || (updates.type === 'error' ? 6000 : 4000);
                
                if (timeoutsRef.current[id]) {
                    clearTimeout(timeoutsRef.current[id]);
                }

                if (updates.type !== 'loading') {
                    timeoutsRef.current[id] = setTimeout(() => {
                        removeToast(id);
                    }, duration);
                }

                return { ...t, ...updates };
            }
            return t;
        }));
    }, [removeToast]);

    React.useEffect(() => {
        const handleGlobalToast = (e) => {
            showToast(e.detail.message, e.detail.type, e.detail.duration);
        };
        window.addEventListener('toast:show', handleGlobalToast);
        return () => window.removeEventListener('toast:show', handleGlobalToast);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, updateToast, removeToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-item ${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' && <CheckCircle size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                            {toast.type === 'loading' && <Loader2 size={18} className="animate-spin" />}
                        </div>
                        <div className="toast-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="toast-message">{toast.message}</div>
                            {toast.action && (
                                <button 
                                    onClick={() => {
                                        toast.action.onClick();
                                        if (toast.action.dismissOnClick !== false) removeToast(toast.id);
                                    }}
                                    style={{
                                        alignSelf: 'flex-start',
                                        background: 'transparent',
                                        border: '1px solid currentColor',
                                        color: 'inherit',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginTop: '4px',
                                        opacity: 0.8
                                    }}
                                    className="toast-action-btn"
                                >
                                    {toast.action.icon && toast.action.icon}
                                    {toast.action.label}
                                </button>
                            )}
                        </div>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
