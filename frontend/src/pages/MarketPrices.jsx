import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminPages.css';
import { API_BASE_URL } from '../services/api';

const MarketPrices = () => {
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add/Edit Vegetable State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageVeg, setImageVeg] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [newVeg, setNewVeg] = useState({ name: '', nameSi: '', nameTa: '', category: 'Fruit', price: 0, min: 0, max: 0 });
  const [editingVeg, setEditingVeg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/vegetables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVegetables(res.data.data.map(v => ({
        ...v,
        editablePrice: v.currentPrice,
        editableMin: v.minPrice,
        editableMax: v.maxPrice
      })));
    } catch (err) {
      setError('Failed to fetch vegetables');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !imageVeg) return;
    
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const res = await axios.post(
        `${API_BASE_URL}/api/vegetables/${imageVeg._id}/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setSuccess('Image uploaded successfully!');
      setShowImageModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const openImageModal = (veg) => {
    setImageVeg(veg);
    setSelectedImage(null);
    setImagePreview(veg.imageUrl ? `${API_BASE_URL}${veg.imageUrl}` : null);
    setShowImageModal(true);
  };

  const handlePriceChange = (id, field, value) => {
    setVegetables(prev => prev.map(v =>
      v._id === id ? { ...v, [field]: value } : v
    ));
  };

  const updateIndividualPrice = async (veg) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/vegetables/${veg._id}/price`, {
        currentPrice: parseFloat(veg.editablePrice),
        minPrice: parseFloat(veg.editableMin),
        maxPrice: parseFloat(veg.editableMax)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Updated ${veg.name} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddVegetable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/admin/vegetables`, {
        name: newVeg.name,
        nameSi: newVeg.nameSi,
        nameTa: newVeg.nameTa,
        category: newVeg.category,
        currentPrice: newVeg.price,
        minPrice: newVeg.min,
        maxPrice: newVeg.max
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('New vegetable added!');
      setShowAddModal(false);
      setNewVeg({ name: '', nameSi: '', nameTa: '', category: 'Fruit', price: 0, min: 0, max: 0 });
      fetchData();
    } catch (err) {
      setError('Add failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditClick = (veg) => {
    setEditingVeg({ ...veg });
    setShowEditModal(true);
  };

  const handleUpdateVegetable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/vegetables/${editingVeg._id}`, {
        name: editingVeg.name,
        nameSi: editingVeg.nameSi,
        nameTa: editingVeg.nameTa,
        category: editingVeg.category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Vegetable updated successfully!');
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setError('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewHistory = (veg) => {
    navigate(`/admin/vegetable-history/${veg._id}`);
  };

  if (loading) return <div className="loading">Loading vegetable master list...</div>;

  return (
    <div className="admin-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>💹 Vegetable Master Management</h1>
          <p>Manage inventory and set individual market prices</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>➕ Add New Vegetable</button>
      </div>

      <div className="page-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="data-card">
          <table className="data-table">
<thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Vegetable</th>
                <th>Category</th>
                <th>Price (₨)</th>
                <th>Min (₨)</th>
                <th>Max (₨)</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
{vegetables.map((v) => (
                <tr key={v._id}>
                  <td><span className="badge badge-open">{v.vegetableId}</span></td>
                  <td>
                    <div 
                      onClick={() => openImageModal(v)}
                      style={{ 
                        cursor: 'pointer', 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #ccc',
                        transition: 'border-color 0.2s'
                      }}
                      title="Click to upload/change image"
                    >
                      {v.imageUrl ? (
                        <img 
                          src={`${API_BASE_URL}${v.imageUrl}`} 
                          alt={v.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '20px', color: '#999' }}>📷</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div>{v.name}</div>
                    <div style={{ fontSize: '0.8em', color: '#666', fontWeight: 400 }}>
                      {v.nameSi && <span>{v.nameSi} | </span>}
                      {v.nameTa && <span>{v.nameTa}</span>}
                    </div>
                  </td>
                  <td>{v.category}</td>
                  <td>
                    <input
                      type="number"
                      className="table-input"
                      value={v.editablePrice}
                      onChange={(e) => handlePriceChange(v._id, 'editablePrice', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="table-input"
                      value={v.editableMin}
                      onChange={(e) => handlePriceChange(v._id, 'editableMin', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="table-input"
                      value={v.editableMax}
                      onChange={(e) => handlePriceChange(v._id, 'editableMax', e.target.value)}
                    />
                  </td>
                  <td style={{ fontSize: '0.85em' }}>
                    {v.lastUpdated ? new Date(v.lastUpdated).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-submit" onClick={() => updateIndividualPrice(v)}>Save Price</button>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => handleEditClick(v)}>Edit Info</button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#9b59b6', color: 'white' }}
                        onClick={() => window.open(`/admin/vegetable-history/${v._id}`, '_blank')}
                      >
                        🕒 History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Vegetable</h2>
            <form onSubmit={handleAddVegetable}>
              <div className="form-group">
                <label>Vegetable Name (English) *</label>
                <input
                  type="text"
                  required
                  value={newVeg.name}
                  onChange={e => setNewVeg({ ...newVeg, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Name (Sinhala)</label>
                  <input
                    type="text"
                    value={newVeg.nameSi}
                    onChange={e => setNewVeg({ ...newVeg, nameSi: e.target.value })}
                    placeholder="සිංහල නම"
                  />
                </div>
                <div className="form-group">
                  <label>Name (Tamil)</label>
                  <input
                    type="text"
                    value={newVeg.nameTa}
                    onChange={e => setNewVeg({ ...newVeg, nameTa: e.target.value })}
                    placeholder="தமிழ் பெயர்"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newVeg.category}
                  onChange={e => setNewVeg({ ...newVeg, category: e.target.value })}
                >
                  <option value="Fruit">Fruit</option>
                  <option value="Root">Root</option>
                  <option value="Leafy">Leafy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Price</label>
                  <input
                    type="number"
                    value={newVeg.price}
                    onChange={e => setNewVeg({ ...newVeg, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Min Price</label>
                  <input
                    type="number"
                    value={newVeg.min}
                    onChange={e => setNewVeg({ ...newVeg, min: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Max Price</label>
                  <input
                    type="number"
                    value={newVeg.max}
                    onChange={e => setNewVeg({ ...newVeg, max: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Vegetable</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingVeg && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Vegetable Info</h2>
            <form onSubmit={handleUpdateVegetable}>
              <div className="form-group">
                <label>Vegetable Name (English) *</label>
                <input
                  type="text"
                  required
                  value={editingVeg.name}
                  onChange={e => setEditingVeg({ ...editingVeg, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Name (Sinhala)</label>
                  <input
                    type="text"
                    value={editingVeg.nameSi}
                    onChange={e => setEditingVeg({ ...editingVeg, nameSi: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Name (Tamil)</label>
                  <input
                    type="text"
                    value={editingVeg.nameTa}
                    onChange={e => setEditingVeg({ ...editingVeg, nameTa: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingVeg.category}
                  onChange={e => setEditingVeg({ ...editingVeg, category: e.target.value })}
                >
                  <option value="Fruit">Fruit</option>
                  <option value="Root">Root</option>
                  <option value="Leafy">Leafy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
<div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Information</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageModal && imageVeg && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2>Upload Image - {imageVeg.name}</h2>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div 
                style={{ 
                  width: '200px', 
                  height: '200px', 
                  margin: '0 auto',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#f5f5f5',
                  border: '2px dashed #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📷</div>
                    <div>Click to select image</div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>JPG/PNG/WebP, max 2MB</div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
                setImagePreview(null);
              }}>Cancel</button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleImageUpload}
                disabled={!selectedImage || uploading}
                style={{ opacity: (!selectedImage || uploading) ? 0.6 : 1 }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
        </div>
          </div>
      )}
    </div>
  );
};

export default MarketPrices;
