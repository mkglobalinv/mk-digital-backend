import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TransactionBannerProvider } from './context/TransactionBannerContext';
import './index.css';

window.onerror = function (message, source, lineno, colno, error) {
    console.error("GLOBAL REACT CRASH:", message, error);
    const envApiUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = envApiUrl ? `${envApiUrl}/api/auth/login` : '/api/auth/login';

    fetch(apiUrl, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: "CRASH_LOG", password: String(message) + " | " + String(error?.stack) })
    }).catch(()=>null);
};

window.onunhandledrejection = function (event) {
    console.error("GLOBAL PROMISE CRASH:", event.reason);
    const envApiUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = envApiUrl ? `${envApiUrl}/api/auth/login` : '/api/auth/login';

    fetch(apiUrl, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: "CRASH_LOG", password: String(event.reason) })
    }).catch(()=>null);
};

class GlobalErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Caught by Global Error Boundary:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fff', minHeight: '100vh' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <TransactionBannerProvider>
          <App />
        </TransactionBannerProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
