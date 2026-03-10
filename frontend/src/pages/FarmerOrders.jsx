import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import VegetableSelect from '../components/VegetableSelect';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/Skeleton';
import '../styles/DataTables.css';
import '../styles/PublishOrder.css';

const FarmerOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, orderId: null });
  const toast = useToast();

  const getLocalizedVegetableName = (order) => {
    const en = order.vegetableName || order.vegetable?.name || '';
    const si = order.vegetableNameSi || '';
    const ta = order.vegetableNameTa || '';
    return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'N/A';
  };

  const [formData, setFormData] = useState({
    vegetableId: '',
    vegetableName: '',
    quantity: '',
    pricePerKg: '',
    district: '',
    nearCity: '',
    village: '',
    contactNumber: '',
    deliveryDate: '',
    description: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/farmer/posts/my-posts');
      setOrders(res.data?.posts || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVegetableSelect = (id, veg) => {
    if (!veg) return;
    setFormData(prev => ({
      ...prev,
      vegetableId: id,
      vegetableName: veg.name,
      pricePerKg: veg.currentPrice || ''
    }));
  };

  const resetForm = () => {
    setFormData({
      vegetableId: '',
      vegetableName: '',
      quantity: '',
      pricePerKg: '',
      district: '',
      nearCity: '',
      village: '',
      contactNumber: '',
      deliveryDate: '',
      description: ''
    });
    setEditingOrder(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingOrder) {
        await API.put(`/farmer/posts/${editingOrder._id}`, formData);
        toast.success('Order updated successfully!');
      } else {
        await API.post('/farmer/posts/create', formData);
        toast.success('Order created successfully!');
      }

      setTimeout(() => {
        resetForm();
        setShowForm(false);
        fetchOrders();
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save order');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      vegetableId: order.vegetable?._id || '',
      vegetableName: order.vegetableName || '',
      quantity: order.quantity?.toString() || '',
      pricePerKg: order.pricePerKg?.toString() || '',
      district: order.location?.district || '',
      nearCity: order.location?.nearCity || '',
      village: order.location?.village || '',
      contactNumber: order.contactNumber || '',
      deliveryDate: order.deliveryDate ? order.deliveryDate.split('T')[0] : '',
      description: order.description || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (orderId) => {
    setDeleteDialog({ isOpen: true, orderId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await API.delete(`/farmer/posts/${deleteDialog.orderId}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleteDialog({ isOpen: false, orderId: null });
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await API.patch(`/farmer/posts/${orderId}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { class: 'badge-open', text: 'Active' },
      'sold': { class: 'badge-completed', text: 'Sold' },
      'cancelled': { class: 'badge-cancelled', text: 'Cancelled' }
    };
    const s = statusMap[status] || { class: 'badge-pending', text: status || 'Unknown' };
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  };

  const renderContent = () => {
    if (loading) {
      return <SkeletonTable rows={5} columns={5} />;
    }

    if (error) {
      return (
        <EmptyState
          icon="⚠️"
          title="Failed to load orders"
          message={error}
          actionLabel="Try Again"
          onAction={fetchOrders}
        />
      );
    }

    return (
      <>
        {/* Action Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="btn-submit"
            style={{ background: showForm ? '#6c757d' : '#27ae60' }}
          >
            {showForm ? 'Cancel' : '+ New Order'}
          </button>
          <button onClick={fetchOrders} className="btn-submit" style={{ background: '#3498db' }}>
            Refresh
          </button>
        </div>

        {/* Order Form */}
        {showForm && (
          <div className="data-card" style={{ marginBottom: '30px', padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingOrder ? '✏️ Edit Order' : '🌱 Create New Order'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Vegetable *</label>
                  <VegetableSelect
                    value={formData.vegetableId}
                    onChange={handleVegetableSelect}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity (Kg) *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price per Kg (Rs) *</label>
                  <input
                    type="number"
                    name="pricePerKg"
                    value={formData.pricePerKg}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g. 150"
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Kandy"
                  />
                </div>
                <div className="form-group">
                  <label>Near City *</label>
                  <input
                    type="text"
                    name="nearCity"
                    value={formData.nearCity}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Peradeniya"
                  />
                </div>
                <div className="form-group">
                  <label>Area/Village *</label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Udawela"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  placeholder="07x xxxxxx"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional details about your produce..."
                />
              </div>

              <button type="submit" className="btn-submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
              </button>
            </form>
          </div>
        )}

        {/* Orders Table */}
        <div className="data-card">
          {orders.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No orders yet"
              message="Start by creating your first selling order to list your vegetables."
              actionLabel="Create New Order"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vegetable</th>
                    <th>Quantity</th>
                    <th>Price/Kg</th>
                    <th>Total</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Publish Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 600 }}>
                        {getLocalizedVegetableName(order)}
                      </td>
                      <td>{Number(order.quantity || 0).toLocaleString()} Kg</td>
                      <td className="price">Rs {(Number(order.pricePerKg) || 0).toFixed(2)}</td>
                      <td className="price" style={{ fontWeight: 'bold' }}>
                        Rs {((Number(order.quantity) || 0) * (Number(order.pricePerKg) || 0)).toLocaleString()}
                      </td>
                      <td>
                        {order.location?.district || 'N/A'} | {order.location?.nearCity || 'N/A'} | {order.location?.village || 'N/A'}
                      </td>
                      <td>
                        <select
                          value={order.status || 'active'}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                          <option value="active">Active</option>
                          <option value="sold">Sold</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleEdit(order)}
                            style={{
                              padding: '5px 10px',
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order._id)}
                            style={{
                              padding: '5px 10px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ConfirmationDialog
          isOpen={deleteDialog.isOpen}
          title="Delete Order"
          message="Are you sure you want to delete this order? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog({ isOpen: false, orderId: null })}
          type="danger"
        />
      </>
    );
  };

  return (
    <PageLayout
      title="My Selling Orders"
      subtitle="Manage your vegetable selling orders"
      loading={loading}
      error={error}
      onRetry={fetchOrders}
    >
      {renderContent()}
    </PageLayout>
  );
};

export default FarmerOrders;
