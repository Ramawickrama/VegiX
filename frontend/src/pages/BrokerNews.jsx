import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';
import { API_BASE_URL } from '../services/api';

const BrokerNews = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    const markNoticesSeen = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/admin/notices/mark-seen`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('notices-marked-seen'));
        } catch (error) {
            console.error('Error marking notices as seen:', error);
        }
    };

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/broker/notices`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Sort by latest first
                const sortedNotices = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotices(sortedNotices);
            } catch (error) {
                console.error('Error fetching notices:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
        markNoticesSeen();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading news...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h1>📰 Broker News & Notices</h1>
                <p>Stay updated with Admin announcements and market news.</p>
            </div>

            {notices.length === 0 ? (
                <div className="content-section">
                    <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        No news or announcements available at the moment.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {notices.map((notice) => (
                        <div
                            key={notice._id}
                            className="content-section"
                            style={{
                                borderLeft: notice.priority === 'high' ? '4px solid #e74c3c' :
                                    notice.priority === 'medium' ? '4px solid #f39c12' : '4px solid #2ecc71'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#2ecc71' }}>{notice.title}</h2>
                                    <small style={{ color: '#666' }}>
                                        Posted: {formatDate(notice.createdAt)}
                                    </small>
                                </div>
                                {notice.priority && (
                                    <span
                                        className={`priority-badge ${notice.priority}`}
                                        style={{
                                            background: notice.priority === 'high' ? '#e74c3c' :
                                                notice.priority === 'medium' ? '#f39c12' : '#2ecc71',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {notice.priority}
                                    </span>
                                )}
                            </div>

                            {/* Notice Images Gallery */}
                            {notice.images && notice.images.length > 0 && (
                                <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {notice.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={`${API_BASE_URL}${img.url}`}
                                            alt={`${notice.title} - ${idx + 1}`}
                                            style={{ width: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* YouTube Video Thumbnail */}
                            {notice.youtubeVideoId && (
                                <div style={{ marginBottom: '15px' }}>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${notice.youtubeVideoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'block', position: 'relative', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', textDecoration: 'none' }}
                                    >
                                        <img
                                            src={`https://img.youtube.com/vi/${notice.youtubeVideoId}/hqdefault.jpg`}
                                            alt={notice.title}
                                            style={{ width: '100%', height: '225px', objectFit: 'cover', display: 'block' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '70px',
                                            height: '70px',
                                            background: 'rgba(255,0,0,0.9)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{ color: 'white', fontSize: '35px', margin: '0 0 0 5px', lineHeight: 1 }}>▶</span>
                                        </div>
                                    </a>
                                </div>
                            )}

                            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333', marginBottom: '15px' }}>
                                {notice.content}
                            </p>

                            {/* Voucher */}
                            {notice.voucher && notice.voucher.code && (
                                <div style={{
                                    background: '#fffef0',
                                    border: '2px dashed #f39c12',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    textAlign: 'center'
                                }}>
                                    <strong style={{ color: '#f39c12', fontSize: '1.1rem' }}>
                                        🎫 Voucher: {notice.voucher.code}
                                    </strong>
                                    <span style={{ marginLeft: '10px', color: '#27ae60', fontWeight: 'bold' }}>
                                        {notice.voucher.discount}% OFF
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrokerNews;
