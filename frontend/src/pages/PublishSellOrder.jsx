import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/BrokerBuyer.css';
import { API_BASE_URL } from '../services/api';

const PublishSellOrder = () => {
    const [formData, setFormData] = useState({
        vegetableId: '',
        quantity: '',
        district: '',
        area: '',
        village: ''
    });
    const [pricing, setPricing] = useState({ price: 0, sellingPrice: 0, profit: 0 });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedVegetable, setSelectedVegetable] = useState(null);

    const districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    const handleVegetableSelect = (id, veg) => {
        setSelectedVegetable(veg);
        setFormData({ ...formData, vegetableId: id });

        if (veg) {
            const marketPrice = veg.price || veg.currentPrice || 0;
            const sellingPrice = marketPrice * 1.10;
            setPricing({
                price: marketPrice,
                sellingPrice: sellingPrice,
                profit: sellingPrice - marketPrice
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateTotal = () => {
        const qty = parseFloat(formData.quantity) || 0;
        return (qty * pricing.sellingPrice).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/broker/sell-orders`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Sell order published successfully! Visible to Buyers.');
            setFormData({ vegetableId: '', quantity: '', district: '', area: '', village: '' });
            setPricing({ price: 0, sellingPrice: 0, profit: 0 });
            setSelectedVegetable(null);
        } catch (error) {
            setMessage('Error: ' + error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>🚚 Publish Sell Order</h1>
                <p>Create selling orders for Buyers. System calculates 10% profit automatically.</p>
            </div>

            <div className="form-container">
                {message && <div className={`badge ${message.includes('Error') ? 'badge-open' : 'badge-fulfilled'}`} style={{ width: '100%', padding: '10px', marginBottom: '15px' }}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <VegetableSelect
                            value={formData.vegetableId}
                            onChange={handleVegetableSelect}
                            label="Select Vegetable"
                        />
                    </div>

                    <div className="price-details">
                        <div className="price-row">
                            <span>Market Price:</span>
                            <span style={{ fontWeight: 700 }}>₨ {pricing.price.toFixed(2)}/kg</span>
                        </div>
                        <div className="price-row">
                            <span>Selling Price (Price + 10%):</span>
                            <span style={{ fontWeight: 700, color: '#d63031' }}>₨ {pricing.sellingPrice.toFixed(2)}/kg</span>
                        </div>
                        <div className="price-row" style={{ marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                            <span>Your Profit:</span>
                            <span className="profit-highlight">₨ {pricing.profit.toFixed(2)}/kg</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Quantity Available (kg)</label>
                        <input 
                            type="number" 
                            name="quantity"
                            value={formData.quantity} 
                            onChange={handleChange}
                            placeholder="e.g. 200" 
                            required 
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>District</label>
                            <select 
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select District</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Area</label>
                            <input 
                                type="text" 
                                name="area"
                                value={formData.area} 
                                onChange={handleChange}
                                placeholder="e.g. Negombo" 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Village</label>
                        <input 
                            type="text" 
                            name="village"
                            value={formData.village} 
                            onChange={handleChange}
                            placeholder="e.g. Kandy Town" 
                        />
                    </div>

                    {formData.quantity && pricing.sellingPrice > 0 && (
                        <div className="form-group" style={{ 
                            background: '#e8f5e9', 
                            padding: '15px', 
                            borderRadius: '8px',
                            marginTop: '15px'
                        }}>
                            <label style={{ color: '#2e7d32', fontWeight: '600' }}>Total Order Value:</label>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>
                                ₨ {calculateTotal()}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Publishing...' : 'Publish Sell Order'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PublishSellOrder;
