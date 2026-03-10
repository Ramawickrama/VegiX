import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const CustomerSupport = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback(response.data.feedback || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (feedbackId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/admin/feedback/${feedbackId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFeedback();
    } catch (error) {
      console.error('Error updating feedback status:', error);
    }
  };

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>💬 Customer Support</h1>
        <p>Manage customer feedback and support tickets</p>
      </div>

      <div className="page-content">
        <div className="data-card">
          <h2>Customer Feedback ({feedback.length})</h2>
          {feedback.length > 0 ? (
            <div className="feedback-list">
              {feedback.map((item) => (
                <div key={item._id} className="feedback-item">
                  <div className="feedback-header">
                    <div>
                      <h3>{item.subject}</h3>
                      <p className="feedback-author">From: {item.name} ({item.email})</p>
                    </div>
                    <span className={`feedback-status ${item.status}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="feedback-message">{item.message}</p>
                  <div className="feedback-footer">
                    <div className="feedback-meta">
                      <span>Category: <strong>{item.category}</strong></span>
                      <span>Rating: <strong>{'⭐'.repeat(item.rating)}</strong></span>
                    </div>
                    <div className="feedback-actions">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No feedback received yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
