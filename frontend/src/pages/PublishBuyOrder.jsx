import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const PublishBuyOrder = () => {
    const [formData, setFormData] = useState({
        vegetableId: '',
        quantityRequired: '',
        collectionLocation: ''
    });
    const [adminPrice, setAdminPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [vegetableDetails, setVegetableDetails] = useState([]);

    useEffect(() => {
        // Fetch vegetables for price reference
        const fetchRef = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/broker/market-prices/today`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVegetableDetails(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRef();
    }, []);

    const handleVegChange = (ids) => {
        const vegId = Array.isArray(ids) ? ids[0] : ids;
        const selected = vegetableDetails.find(v => v.vegetableId === vegId || v._id === vegId);
        setFormData({ ...formData, vegetableId: ids });
        setAdminPrice(selected ? selected.adminPrice : 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const vegId = Array.isArray(formData.vegetableId) ? formData.vegetableId[0] : formData.vegetableId;
            await axios.post(`${API_BASE_URL}/api/broker/buy-orders`, { ...formData, vegetableId: vegId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Buy order published successfully! Visible only to Farmers.');
            setFormData({ vegetableId: '', quantityRequired: '', collectionLocation: '' });
            setAdminPrice(0);
        } catch (error) {
            setMessage('Error: ' + error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>📦 Publish Buy Order</h1>
                <p>Create buy orders visible to Farmers. Price is fixed to Admin Market Price.</p>
            </div>

            <div className="form-container">
                {message && <div className={`badge ${message.includes('Error') ? 'badge-open' : 'badge-fulfilled'}`} style={{ width: '100%', padding: '10px', marginBottom: '15px' }}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <VegetableSelect
                            multiple
                            value={Array.isArray(formData.vegetableId) ? formData.vegetableId : (formData.vegetableId ? [formData.vegetableId] : [])}
                            onChange={handleVegChange}
                            label="Select Vegetable(s)"
                        />
                    </div>

                    <div className="price-details">
                        <div className="price-row">
                            <span>Admin Market Price:</span>
                            <span style={{ fontWeight: 700 }}>₨ {adminPrice}/kg</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Quantity Required (kg)</label>
                        <input type="number" value={formData.quantityRequired} onChange={e => setFormData({ ...formData, quantityRequired: e.target.value })} placeholder="e.g. 500" required />
                    </div>

                    <div className="form-group">
                        <label>Collection Location</label>
                        <input type="text" value={formData.collectionLocation} onChange={e => setFormData({ ...formData, collectionLocation: e.target.value })} placeholder="e.g. Dambulla Economy Center" required />
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Publishing...' : 'Publish Buy Order'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PublishBuyOrder;
