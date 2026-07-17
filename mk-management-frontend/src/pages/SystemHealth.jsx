import React from 'react';

const SimplePage = ({ title, description }) => (
  <div>
    <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>{title}</h1>
    <p style={{ margin: '8px 0 32px', color: '#94a3b8' }}>{description}</p>
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
      Module ready for integration.
    </div>
  </div>
);

export default SimplePage;
