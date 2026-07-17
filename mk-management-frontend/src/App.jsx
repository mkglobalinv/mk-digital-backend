import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SystemHealth from './pages/SystemHealth';
import Logs from './pages/Logs';
import EmergencyActions from './pages/EmergencyActions';
import GatewaySettings from './pages/GatewaySettings';
import FuturePlatforms from './pages/FuturePlatforms';
import EmergencyData from './pages/EmergencyData';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const host = window.location.hostname;
        // In local development, you might just use a hardcoded test subdomain or 'localhost'
        const subdomain = host.includes('.') ? host.split('.')[0] : 'localhost';
        
        // Skip for main admin domain
        if (subdomain === 'admin' || subdomain === 'localhost' || subdomain === '9jasub') {
            setBrandingLoaded(true);
            return;
        }

        // We assume backend is running on port 8800 for local dev
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8800' : 'https://api.9jasub.com';
        
        const res = await fetch(`${baseUrl}/api/tenant/branding?subdomain=${subdomain}`);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.branding) {
                const b = data.branding;
                document.documentElement.style.setProperty('--primary-color', b.primaryColor || '#0f172a');
                document.documentElement.style.setProperty('--secondary-color', b.secondaryColor || '#38bdf8');
                if (b.siteName) document.title = `${b.siteName} - Admin Portal`;
                // Store in sessionStorage or context if needed by components
                sessionStorage.setItem('tenantBranding', JSON.stringify(b));
            }
        }
      } catch (err) {
        console.error("Failed to fetch tenant branding", err);
      } finally {
        setBrandingLoaded(true);
      }
    };
    fetchBranding();
  }, []);

  if (!brandingLoaded) {
      return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff' }}>Loading Portal...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="health" element={<SystemHealth />} />
          <Route path="logs" element={<Logs />} />
          <Route path="emergency" element={<EmergencyActions />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="gateways" element={<GatewaySettings />} />
          <Route path="platforms" element={<FuturePlatforms />} />
          <Route path="emergency-data" element={<EmergencyData />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
