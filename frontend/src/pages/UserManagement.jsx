import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (filterRole === 'all') {
        response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.get(`${API_BASE_URL}/api/admin/users-by-role/${filterRole}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/admin/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p>Manage and monitor all platform users</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="farmer">Farmers</option>
            <option value="broker">Brokers</option>
            <option value="buyer">Buyers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="data-card">
          <h2>Users ({users.length})</h2>
          {users.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td><code className="user-id-badge">{user.userId || 'N/A'}</code></td>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{user.location || '-'}</td>
                    <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
