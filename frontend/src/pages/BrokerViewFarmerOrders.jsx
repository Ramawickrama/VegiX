import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import OrderCard from '../components/OrderCard';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';
import '../styles/ViewOrders.css';

const BrokerViewFarmerOrders = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactingFarmer, setContactingFarmer] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await API.get('/farmer/posts/all');
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load farmer posts');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (post) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/login', { state: { from: '/broker/view-farmer-orders' } });
      return;
    }

    if (user.role !== 'broker') {
      toast.error('Only brokers can contact farmers');
      return;
    }

    setContactingFarmer(post._id);

    try {
      const response = await API.post(`/broker/farmer-orders/${post._id}/contact`);

      if (response.data.success) {
        const farmerEmail = response.data.otherUser.email;
        navigate(`/broker/messages?email=${encodeURIComponent(farmerEmail)}`);
      } else {
        toast.error(response.data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error contacting farmer:', error);
      toast.error(error.response?.data?.message || 'Failed to contact farmer');
    } finally {
      setContactingFarmer(null);
    }
  };

  const handleAddToCart = async (post) => {
    try {
      setAddingToCart(post._id);
      const response = await API.post(`/broker/cart/${post._id}`);
      
      if (response.data?.success) {
        toast.success('Added to cart!');
        navigate('/broker/cart');
      } else {
        toast.error(response.data?.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingPost(postId);
      const response = await API.delete(`/farmer/posts/${postId}/broker`);
      
      if (response.data?.success) {
        toast.success('Post deleted successfully');
        setPosts(posts.filter(post => post._id !== postId));
      } else {
        toast.error(response.data?.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeletingPost(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-open">In Stock</span>;
      case 'bought':
        return <span className="badge badge-bought">Bought</span>;
      case 'sold':
        return <span className="badge badge-completed">Sold</span>;
      default:
        return <span className="badge badge-pending">{status}</span>;
    }
  };

  const getAllLanguagesName = (post) => {
    const names = [];
    if (post.vegetableName) names.push(post.vegetableName);
    if (post.vegetableNameSi) names.push(post.vegetableNameSi);
    if (post.vegetableNameTa) names.push(post.vegetableNameTa);
    return names.join(' | ') || 'N/A';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="orders-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} height="200px" />
          ))}
        </div>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <EmptyState
          icon="🚜"
          title="No farmer posts available"
          message="There are no vegetable posts from farmers at the moment. Check back later!"
          actionLabel="Refresh"
          onAction={fetchPosts}
        />
      );
    }

    return (
      <div className="orders-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
        {posts.map(post => (
          <div key={post._id} className="notice-item" style={{ borderLeft: '4px solid #27ae60', background: 'white' }}>
            <div className="notice-header">
              <h3>{getAllLanguagesName(post)}</h3>
              {getStatusBadge(post.status)}
            </div>
            <div style={{ margin: '10px 0' }}>
              <p><strong>Quantity:</strong> {post.quantity} Kg</p>
              <p><strong>Price:</strong> <span className="price">₨ {post.pricePerKg}</span> /Kg</p>
              <p><strong>Total Value:</strong> <span className="price">₨ {post.totalValue?.toLocaleString() || (post.quantity * post.pricePerKg)}</span></p>
              <p><strong>Location:</strong> {post.location?.district || 'N/A'} | {post.location?.nearCity || 'N/A'} | {post.location?.village || 'N/A'}</p>
              <p><strong>Contact:</strong> {post.contactNumber}</p>
            </div>
            <div className="notice-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span>Farmer: {post.farmerId?.name || 'N/A'}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {post.status === 'active' && (
                  <button
                    className="btn-add-cart"
                    onClick={() => handleAddToCart(post)}
                    disabled={addingToCart === post._id}
                  >
                    {addingToCart === post._id ? '⏳ Adding...' : '🛒 Add to Cart'}
                  </button>
                )}
                <button
                  className="btn-submit"
                  onClick={() => handleChat(post)}
                  disabled={contactingFarmer === post._id}
                  title="Chat with farmer"
                >
                  {contactingFarmer === post._id ? '⏳' : '💬'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageLayout
      title="Farmer Posts"
      subtitle="Browse vegetables listed by farmers for sale"
      loading={loading}
    >
      {renderContent()}
    </PageLayout>
  );
};

export default BrokerViewFarmerOrders;
