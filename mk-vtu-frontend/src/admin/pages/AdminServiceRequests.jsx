import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, AlertTriangle, RefreshCw, XCircle, FileText, Download, User
} from 'lucide-react';
import API from '../../api';

const AdminServiceRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/service-requests');
            setRequests(res.data.requests);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const adminNotes = window.prompt("Enter admin notes for this status update (Optional):");
        if (adminNotes === null) return; // User cancelled

        setUpdatingId(id);
        try {
            await API.put(`/api/admin/service-requests/${id}`, { status, adminNotes });
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const fetchDocuments = async (id) => {
        setLoadingDocs(true);
        setDocuments([]);
        try {
            const res = await API.get(`/api/admin/service-requests/${id}/documents`);
            setDocuments(res.data.documents || []);
        } catch (err) {
            console.error("Failed to fetch documents", err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const openDocumentModal = (request) => {
        setSelectedRequest(request);
        fetchDocuments(request._id);
    };

    const closeDocumentModal = () => {
        setSelectedRequest(null);
        setDocuments([]);
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Assisted Service Requests</h1>
                <button 
                    onClick={fetchRequests} 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {loading ? (
                <div>Loading requests...</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>Reference</th>
                                <th style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>User</th>
                                <th style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>Service Type</th>
                                <th style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>Data</th>
                                <th style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                <th style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: '500' }}>{req.reference}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(req.createdAt).toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: '500' }}>{req.userId?.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{req.userId?.email}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{req.userId?.phone}</div>
                                        <div style={{ fontSize: '12px', color: '#10b981' }}>WA: {req.whatsappNumber}</div>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                        <span style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                                            {req.serviceType}
                                        </span>
                                        <div style={{ marginTop: '4px', fontSize: '13px' }}>₦{req.amount}</div>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', maxWidth: '250px' }}>
                                        <pre style={{ fontSize: '11px', background: '#f1f5f9', padding: '8px', borderRadius: '4px', overflowX: 'auto', margin: 0 }}>
                                            {JSON.stringify(req.submittedData, null, 2)}
                                        </pre>
                                        {req.documents?.length > 0 && (
                                            <button 
                                                onClick={() => openDocumentModal(req)}
                                                style={{ marginTop: '8px', padding: '4px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <FileText size={14} /> View {req.documents.length} Docs
                                            </button>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                            background: req.status === 'COMPLETED' ? '#dcfce7' : req.status === 'FAILED' || req.status === 'REJECTED' ? '#fee2e2' : '#fef9c3',
                                            color: req.status === 'COMPLETED' ? '#166534' : req.status === 'FAILED' || req.status === 'REJECTED' ? '#991b1b' : '#854d0e'
                                        }}>
                                            {req.status}
                                        </span>
                                        {req.adminNotes && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{req.adminNotes}</div>}
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button 
                                                disabled={updatingId === req._id || req.status === 'COMPLETED'}
                                                onClick={() => handleUpdateStatus(req._id, 'COMPLETED')}
                                                style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <CheckCircle size={14} /> Complete
                                            </button>
                                            <button 
                                                disabled={updatingId === req._id || req.status === 'FAILED' || req.status === 'REJECTED'}
                                                onClick={() => handleUpdateStatus(req._id, 'REJECTED')}
                                                style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <XCircle size={14} /> Reject/Refund
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Document Viewer Modal */}
            {selectedRequest && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Documents for {selectedRequest.reference}</h2>
                            <button onClick={closeDocumentModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={24} color="#64748b" /></button>
                        </div>
                        
                        {loadingDocs ? (
                            <div>Loading documents...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {documents.length === 0 ? (
                                    <div style={{ color: '#64748b' }}>No documents found.</div>
                                ) : (
                                    documents.map((doc, idx) => (
                                        <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{doc.documentType}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{doc.mimeType} • {(doc.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                            <a 
                                                href={doc.signedUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                style={{ padding: '8px 16px', background: '#f3f4f6', color: '#1e293b', textDecoration: 'none', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Download size={16} /> View/Download
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminServiceRequests;
