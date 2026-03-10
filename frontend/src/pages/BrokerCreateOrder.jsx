import React, { useState } from 'react';
import axios from 'axios';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/PublishOrder.css';
import { API_BASE_URL } from '../services/api';

const BrokerCreateOrder = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedVegetable, setSelectedVegetable] = useState(null);
    const [formData, setFormData] = useState({
        vegetableId: '',
        requiredQuantity: '',
        offeredPrice: '',
        district: '',
        village: '',
        contactNumber: ''
    });

    const districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVegetableSelect = (id, veg) => {
        const marketPrice = veg?.currentPrice || 0;
        setSelectedVegetable(veg);
        setFormData({ 
            ...formData, 
            vegetableId: id,
            offeredPrice: marketPrice
        });
    };

    const calculateTotal = () => {
        const qty = parseFloat(formData.requiredQuantity) || 0;
        const price = parseFloat(formData.offeredPrice) || 0;
        return (qty * price).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const formPayload = {
                vegetableId: formData.vegetableId,
                quantityRequired: parseInt(formData.requiredQuantity),
                collectionLocation: `${formData.district}, ${formData.village}`
            };
            const res = await axios.post(`${API_BASE_URL}/api/broker/buy-orders`, formPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Buy order published successfully!');
            setFormData({
                vegetableId: '',
                requiredQuantity: '',
                offeredPrice: '',
                district: '',
                village: '',
                contactNumber: ''
            });
            setSelectedVegetable(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create buy order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="publish-order-page">
            <div className="page-header">
                <h1>🛒 Publish Buy Order</h1>
                <p>Request vegetables from farmers</p>
            </div>

            <div className="page-content">
                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-group">
                        <VegetableSelect
                            value={formData.vegetableId}
                            onChange={handleVegetableSelect}
                            label="Select Vegetable *"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Required Quantity (Kg) *</label>
                            <input 
                                type="number" 
                                name="requiredQuantity" 
                                value={formData.requiredQuantity} 
                                onChange={handleChange} 
                                required 
                                placeholder="e.g. 500" 
                            />
                        </div>
                        <div className="form-group">
                            <label>Offered Price per Kg (₨) *</label>
                            <input 
                                type="number" 
                                name="offeredPrice" 
                                value={formData.offeredPrice} 
                                onChange={handleChange} 
                                required 
                                placeholder="e.g. 155" 
                            />
                            {selectedVegetable && (
                                <small style={{ color: '#27ae60', marginTop: '5px', display: 'block' }}>
                                    Market Price: ₨ {selectedVegetable.currentPrice}/kg
                                </small>
                            )}
                        </div>
                    </div>

                    {formData.requiredQuantity && formData.offeredPrice && (
                        <div className="form-group" style={{ 
                            background: '#e8f5e9', 
                            padding: '15px', 
                            borderRadius: '8px',
                            marginBottom: '15px'
                        }}>
                            <label style={{ color: '#2e7d32', fontWeight: '600' }}>Total Order Value:</label>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>
                                ₨ {calculateTotal()}
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>District *</label>
                            <select 
                                name="district" 
                                value={formData.district} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="">Select District</option>
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Village / Area *</label>
                            <input type="text" name="village" value={formData.village} onChange={handleChange} required placeholder="e.g. Negombo" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contact Number *</label>
                        <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required placeholder="07x xxxxxxx" />
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Publishing...' : 'Publish Buy Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BrokerCreateOrder;
