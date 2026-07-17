import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Assuming we reuse the backend's standard auth endpoint
      const res = await axios.post('http://localhost:8800/auth/login', { email, password });
      
      const { token, user } = res.data;
      
      if (user.role !== 'admin') {
        setError('Unauthorized: Super Admin access required.');
        setLoading(false);
        return;
      }

      localStorage.setItem('adminToken', token);
      
      // Log the login action in the new MaintenanceLog
      await axios.post('http://localhost:8800/api/management/logs', {
        action: 'LOGIN',
        details: { email },
        status: 'SUCCESS'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '32px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#38bdf820', color: '#38bdf8', marginBottom: '16px' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>MKOps Secure Portal</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Authorized Personnel Only</p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#ef444420', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid #ef444450' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="superadmin@9jasub.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Security Key / Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••••••"
                required
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
