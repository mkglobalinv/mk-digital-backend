import React, { useState, useEffect } from 'react';
import API from '../../api';
import './InternationalAnalytics.css';
import { Globe, BarChart2, Activity } from 'lucide-react';

const InternationalAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await API.get('/api/admin/international-stats');
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading Analytics...</div>;

    return (
        <div className="analytics-wrapper">
            <div className="analytics-header">
                <h1>International Demand Analytics</h1>
                <p>Tracking user interest for global airtime and data services.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><Globe /></div>
                    <div className="stat-info">
                        <h3>Total Interests</h3>
                        <p className="stat-value">{stats?.totalRequests || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f3e5f5', color: '#7b1fa2' }}><Activity /></div>
                    <div className="stat-info">
                        <h3>Top Country</h3>
                        <p className="stat-value">{stats?.requestsByCountry?.[0]?._id || 'N/A'}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}><BarChart2 /></div>
                    <div className="stat-info">
                        <h3>Main Service</h3>
                        <p className="stat-value">{stats?.requestsByService?.[0]?._id?.toUpperCase() || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="analytics-card">
                    <h2>Requests by Country</h2>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Country</th>
                                    <th>Total Requests</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.requestsByCountry?.map(item => (
                                    <tr key={item._id}>
                                        <td><strong>{item._id}</strong></td>
                                        <td>{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="analytics-card">
                    <h2>Recent Interested Users</h2>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Service</th>
                                    <th>Country</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentRequests?.map(req => (
                                    <tr key={req._id}>
                                        <td>
                                            <div className="user-cell">
                                                <span>{req.userId?.name || 'Deleted User'}</span>
                                                <small>{req.userId?.email}</small>
                                            </div>
                                        </td>
                                        <td><span className={`status-badge ${req.serviceType === 'airtime' ? 'status-pending' : 'status-approved'}`}>{req.serviceType}</span></td>
                                        <td>{req.country}</td>
                                        <td>{new Date(req.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternationalAnalytics;
