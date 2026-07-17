import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import './ResellerToast.css';

// ─────────────────────────────────────────────
// Context & Hook
// ─────────────────────────────────────────────
const ToastContext = createContext(null);

let globalToastId = 0;

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 350);
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }, []);

    const addToast = useCallback((type, message, options = {}) => {
        if (type === 'loading') {
            const existing = toasts.find(t => t.type === 'loading' && t.message === message);
            if (existing && !existing.exiting) {
                return existing.id;
            }
        }

        const id = ++globalToastId;
        const duration = options.duration ?? (type === 'loading' ? null : 3500);

        setToasts(prev => [...prev.slice(-4), { id, type, message, exiting: false }]);

        if (duration !== null) {
            timersRef.current[id] = setTimeout(() => dismiss(id), duration);
        }

        return id;
    }, [dismiss, toasts]);

    const toast = {
        loading: (msg, opts) => addToast('loading', msg, { duration: null, ...opts }),
        success: (msg, opts) => opts?.id ? toast.update(opts.id, 'success', msg, opts) : addToast('success', msg, opts),
        error:   (msg, opts) => opts?.id ? toast.update(opts.id, 'error', msg, opts) : addToast('error', msg, opts),
        warning: (msg, opts) => opts?.id ? toast.update(opts.id, 'warning', msg, opts) : addToast('warning', msg, opts),
        dismiss,
        update: (id, type, message, opts = {}) => {
            if (timersRef.current[id]) {
                clearTimeout(timersRef.current[id]);
                delete timersRef.current[id];
            }
            setToasts(prev => prev.map(t => t.id === id ? { ...t, type, message } : t));
            const duration = opts.duration ?? (type === 'loading' ? null : 3500);
            if (duration !== null) {
                timersRef.current[id] = setTimeout(() => dismiss(id), duration);
            }
        }
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
};

// ─────────────────────────────────────────────
// Toast Container
// ─────────────────────────────────────────────
const ICONS = {
    loading: <Loader2 size={18} className="toast-spinner" />,
    success: <CheckCircle size={18} />,
    error:   <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
};

const ToastContainer = ({ toasts, onDismiss }) => {
    if (!toasts.length) return null;
    return (
        <div className="reseller-toast-container" aria-live="polite">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`reseller-toast reseller-toast--${t.type} ${t.exiting ? 'reseller-toast--exit' : ''}`}
                    role={t.type === 'error' ? 'alert' : 'status'}
                >
                    <span className={`toast-icon toast-icon--${t.type}`}>
                        {ICONS[t.type]}
                    </span>
                    <span className="toast-message">{t.message}</span>
                    {t.type !== 'loading' && (
                        <button
                            className="toast-close-btn"
                            onClick={() => onDismiss(t.id)}
                            aria-label="Dismiss notification"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ToastProvider;
