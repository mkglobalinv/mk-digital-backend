import React from 'react';
import logo from '../assets/9jasub.jpg';

const GlobalLoader = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        padding: '5px',
        background: 'linear-gradient(45deg, #3B82F6, #10B981)',
        animation: 'spin 2s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img src={logo} alt="Loading" style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          objectFit: 'cover'
        }} />
      </div>
      <h2 style={{ color: 'white', marginTop: '20px', fontSize: '19.8px', letterSpacing: '2px' }}>9JASUB</h2>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;
