import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    priority: 'medium',
    visibility: ['farmer', 'broker', 'buyer'],
    voucherCode: '',
    voucherDiscount: '',
    images: [],
    youtubeUrl: '',
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(response.data.notices || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5;

    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      alert('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert('Each image must be less than 5MB');
      return;
    }

    const totalImages = (newNotice.images?.length || 0) + files.length;
    if (totalImages > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const res = await axios.post(`${API_BASE_URL}/api/admin/upload-notice-images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success && res.data.images) {
        const newImages = [...(newNotice.images || []), ...res.data.images];
        setNewNotice({ ...newNotice, images: newImages });
        
        const newPreviews = res.data.images.map(img => ({
          url: img.url,
          isNew: true
        }));
        setImagePreviews([...imagePreviews, ...newPreviews]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...newNotice.images];
    newImages.splice(index, 1);
    setNewNotice({ ...newNotice, images: newImages });
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const noticeData = {
        title: newNotice.title,
        content: newNotice.content,
        priority: newNotice.priority,
        visibility: newNotice.visibility,
        image: newNotice.image,
        youtubeUrl: newNotice.youtubeUrl,
      };

      if (newNotice.voucherCode) {
        noticeData.voucher = {
          code: newNotice.voucherCode,
          discount: parseFloat(newNotice.voucherDiscount),
        };
      }

      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/admin/notice/${editingId}`, noticeData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/notice`, noticeData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setNewNotice({
        title: '',
        content: '',
        priority: 'medium',
        visibility: ['farmer', 'broker', 'buyer'],
        voucherCode: '',
        voucherDiscount: '',
        image: '',
        images: newNotice.images,
        youtubeUrl: '',
      });
      setImagePreview(null);
      setEditingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchNotices();
      alert(editingId ? 'Notice updated!' : 'Notice posted!');
    } catch (error) {
      console.error('Error sharing notice:', error);
      alert('Operation failed');
    }
  };

  const handleEdit = (notice) => {
    setEditingId(notice._id);
    setNewNotice({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      visibility: notice.visibility || ['farmer', 'broker', 'buyer'],
      voucherCode: notice.voucher?.code || '',
      voucherDiscount: notice.voucher?.discount || '',
      image: notice.image || '',
      images: notice.images || [],
      youtubeUrl: notice.youtubeUrl || '',
    });
    setImagePreview(notice.image || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/notice/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  if (loading) return <div className="loading">Loading notices...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>📢 Notice Management</h1>
        <p>Post announcements and promotional offers</p>
      </div>

      <div className="page-content">
        <div className="form-card">
          <h2>{editingId ? 'Edit Notice' : 'Post New Notice'}</h2>
          <form onSubmit={handlePostNotice}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Notice title"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                placeholder="Notice content"
                rows="4"
                value={newNotice.content}
                onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newNotice.priority}
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Voucher Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g., SAVE20"
                value={newNotice.voucherCode}
                onChange={(e) => setNewNotice({ ...newNotice, voucherCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Discount % (Optional)</label>
              <input
                type="number"
                placeholder="e.g., 20"
                value={newNotice.voucherDiscount}
                onChange={(e) => setNewNotice({ ...newNotice, voucherDiscount: e.target.value })}
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label>Image (Optional)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '120px',
                    height: '120px',
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: '#f9f9f9',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontSize: '30px', color: '#999' }}>➕</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>Add Photos</span>
                  <span style={{ fontSize: '10px', color: '#999' }}>(max 5)</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: '120px',
                      height: '120px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #ddd'
                    }}
                  >
                    <img
                      src={`${API_BASE_URL}${preview.url}`}
                      alt={`Preview ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#e74c3c',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {uploading && <p style={{ color: '#666', marginTop: '5px' }}>Uploading...</p>}
            </div>

            {/* YouTube Link */}
            <div className="form-group">
              <label>YouTube Video Link (Optional)</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={newNotice.youtubeUrl}
                onChange={(e) => setNewNotice({ ...newNotice, youtubeUrl: e.target.value })}
              />
              <small style={{ color: '#666' }}>Paste a YouTube video URL to embed</small>
            </div>

            <div className="button-group">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Notice' : 'Post Notice'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={() => {
                  setEditingId(null);
                  setNewNotice({ title: '', content: '', priority: 'medium', visibility: ['farmer', 'broker', 'buyer'], voucherCode: '', voucherDiscount: '', images: [], youtubeUrl: '' });
                  setImagePreviews([]);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="data-card">
          <h2>Recent Notices</h2>
          {notices.length > 0 ? (
            <div className="notices-list">
              {notices.map((notice) => (
                <div key={notice._id} className="notice-item">
                  <div className="notice-header">
                    <div>
                      <h3>{notice.title}</h3>
                      <small>Posted: {new Date(notice.postedDate).toLocaleDateString()}</small>
                    </div>
                    <span className={`priority ${notice.priority}`}>{notice.priority.toUpperCase()}</span>
                  </div>

                  {/* Notice Images Gallery */}
                  {notice.images && notice.images.length > 0 && (
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {notice.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`${API_BASE_URL}${img.url}`}
                          alt={`${notice.title} - ${idx + 1}`}
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }}
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
                        style={{ display: 'block', position: 'relative', width: '320px', borderRadius: '8px', overflow: 'hidden' }}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${notice.youtubeVideoId}/hqdefault.jpg`}
                          alt={notice.title}
                          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60px',
                          height: '60px',
                          background: 'rgba(255,0,0,0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ color: 'white', fontSize: '30px' }}>▶</span>
                        </div>
                      </a>
                    </div>
                  )}

                  <p>{notice.content}</p>
                  {notice.voucher && notice.voucher.code && (
                    <div className="voucher-info">
                      <strong>Voucher Code:</strong> {notice.voucher.code} - {notice.voucher.discount}% Off
                    </div>
                  )}
                  <div className="notice-actions">
                    <button className="btn-edit" onClick={() => handleEdit(notice)}>✏️ Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(notice._id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No notices posted yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeManagement;
