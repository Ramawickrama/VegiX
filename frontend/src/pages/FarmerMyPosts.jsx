import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/DataTables.css';

const FarmerMyPosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getAllLanguagesName = (post) => {
        const names = [];
        if (post.vegetableName) names.push(post.vegetableName);
        if (post.vegetableNameSi) names.push(post.vegetableNameSi);
        if (post.vegetableNameTa) names.push(post.vegetableNameTa);
        return names.join(' | ') || 'N/A';
    };

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            const res = await API.get('/farmer/posts/my-posts');
            setPosts(res.data?.posts || []);
        } catch (err) {
            setError('Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading your posts...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>📦 My Selling Posts</h1>
                <p>Track your active vegetable listings</p>
            </div>

            <div className="page-content">
                {error && <div className="error-message">{error}</div>}

                <div className="data-card">
                    {posts.length === 0 ? (
                        <p className="empty-state">You haven't published any posts yet.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Vegetable</th>
                                    <th>Quantity</th>
                                    <th>Price/Kg</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts?.length > 0 && posts.map(post => (
                                    <tr key={post._id}>
                                        <td style={{ fontWeight: 600 }}>{getAllLanguagesName(post)}</td>
                                        <td>{post.quantity || 0} Kg</td>
                                        <td className="price">₨ {post.pricePerKg || 0}</td>
                                        <td>{post.location?.district || 'Unknown'}, {post.location?.village || ''}</td>
                                        <td><span className="badge badge-open">Active</span></td>
                                        <td>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmerMyPosts;
