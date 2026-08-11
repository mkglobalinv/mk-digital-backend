import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';

export default function ManualApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await API.get('/api/admin/manual-applications');
            setApplications(res.data.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch applications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const processCommission = async (applicationId) => {
        if (!window.confirm('Mark this application as completed and pay commission to the website owner?')) return;
        setProcessing(applicationId);
        try {
            const res = await API.post('/api/admin/manual-applications/commission', { applicationId });
            if (res.data.status === 'success') {
                showToast('Commission paid successfully', 'success');
                fetchApplications();
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Failed to process commission', 'error');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Manual Identity Applications</h1>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Manage NIN, BVN, and CAC applications submitted on reseller websites.</p>

            {loading ? (
                <div>Loading applications...</div>
            ) : applications.length === 0 ? (
                <div>No manual applications found.</div>
            ) : (
                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>App ID</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Service</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Website Owner</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Commission</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>{new Date(app.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', fontFamily: 'monospace' }}>{app.applicationId}</td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>
                                        {app.serviceType === 'nin_modification' ? 'NIN Modification' : app.serviceType === 'bvn_modification' ? 'BVN Modification' : 'CAC Registration'}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>
                                        {app.ownerId ? (
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{app.ownerId.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{app.ownerId.subdomain}.9jasub.com</div>
                                            </div>
                                        ) : 'N/A'}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', background: app.status === 'completed' ? '#dcfce7' : '#fef9c3', color: app.status === 'completed' ? '#166534' : '#854d0e' }}>
                                            {app.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', background: app.commissionStatus === 'paid' ? '#dcfce7' : '#f1f5f9', color: app.commissionStatus === 'paid' ? '#166534' : '#64748b' }}>
                                            {app.commissionStatus.toUpperCase()} {app.commissionAmount > 0 && `(₦${app.commissionAmount})`}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>
                                        {app.status === 'pending' && (
                                            <button 
                                                onClick={() => processCommission(app.applicationId)}
                                                disabled={processing === app.applicationId}
                                                style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                            >
                                                {processing === app.applicationId ? 'Processing...' : 'Mark Completed & Pay Commission'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
