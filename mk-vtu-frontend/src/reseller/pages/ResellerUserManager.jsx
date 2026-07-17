import React, { useState, useEffect } from 'react';
import API from '../../api';
import './Reseller.css';

const ResellerUserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await API.get('/api/reseller/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reseller-container">
            <header className="reseller-header">
                <h1>Customer Management</h1>
                <p>Manage users registered on your platform</p>
            </header>

            <div className="reseller-table-container">
                <table className="reseller-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>₦{user.totalBalance?.toLocaleString()}</td>
                                <td>
                                    <span className={`status-badge ${user.isSuspended ? 'suspended' : 'active'}`}>
                                        {user.isSuspended ? 'Suspended' : 'Active'}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResellerUserManager;
