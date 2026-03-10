import React, { useState, useEffect } from 'react';
import API from '../services/api';
import VegetableSelect from '../components/VegetableSelect';
import PageLayout from '../components/PageLayout';
import { useToast } from '../components/Toast';
import '../styles/PublishOrder.css';

const FarmerCreatePost = () => {
    const [loading, setLoading] = useState(false);
    const [priceRecommendation, setPriceRecommendation] = useState(null);
    const toast = useToast();
    const [formData, setFormData] = useState({
        vegetableId: '',
        vegetableName: '',
        quantity: '',
        pricePerKg: '',
        district: '',
        nearCity: '',
        village: '',
        contactNumber: '',
        description: ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            newErrors.quantity = 'Please enter a valid quantity';
        }
        
        if (!formData.pricePerKg || parseFloat(formData.pricePerKg) <= 0) {
            newErrors.pricePerKg = 'Please enter a valid price';
        }
        
        if (!formData.district || formData.district.trim() === '') {
            newErrors.district = 'District is required';
        }

        if (!formData.nearCity || formData.nearCity.trim() === '') {
            newErrors.nearCity = 'Near City is required';
        }
        
        if (!formData.village || formData.village.trim() === '') {
            newErrors.village = 'Village/Area is required';
        }
        
        if (!formData.contactNumber || formData.contactNumber.trim() === '') {
            newErrors.contactNumber = 'Contact number is required';
        } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
            newErrors.contactNumber = 'Please enter a valid 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleVegetableSelect = async (id, veg) => {
        if (!veg) return;
        const fullName = [veg.name, veg.nameSi, veg.nameTa].filter(Boolean).join(' | ');
        setFormData({
            ...formData,
            vegetableId: id,
            vegetableName: fullName,
            pricePerKg: veg.currentPrice || ''
        });
        console.log(`[Post Selected] ${fullName} (Auto-filled Price: ₨${veg.currentPrice})`);
        
        try {
            const res = await API.get(`/pricing/recommendation/${id}`);
            if (res.data?.success) {
                setPriceRecommendation(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching price recommendation:', err);
            setPriceRecommendation(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.vegetableId) {
            toast.error('Please select a vegetable');
            return;
        }
        
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }
        
        setLoading(true);

        try {
            const res = await API.post('/farmer/posts/create', formData);

            if (res.data?.success) {
                toast.success('Post published successfully!');
                setFormData({
                    vegetableId: '',
                    vegetableName: '',
                    quantity: '',
                    pricePerKg: '',
                    district: '',
                    nearCity: '',
                    village: '',
                    contactNumber: '',
                    description: ''
                });
                setPriceRecommendation(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const renderError = (fieldName) => {
        if (errors[fieldName]) {
            return <span className="field-error">{errors[fieldName]}</span>;
        }
        return null;
    };

    return (
        <PageLayout
            title="Create Selling Post"
            subtitle="List your vegetables for brokers to see"
        >
            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-group">
                    <VegetableSelect
                        value={formData.vegetableId}
                        onChange={handleVegetableSelect}
                        label="Select Vegetable *"
                        required
                    />
                </div>

                {priceRecommendation && (
                    <div style={{ 
                        padding: '15px', 
                        background: priceRecommendation.marketTrend === 'Rising' ? '#ecfdf5' : priceRecommendation.marketTrend === 'Falling' ? '#fef2f2' : '#eff6ff',
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        border: `1px solid ${priceRecommendation.marketTrend === 'Rising' ? '#10b981' : priceRecommendation.marketTrend === 'Falling' ? '#ef4444' : '#3b82f6'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, color: '#1f2937' }}>💡 Smart Price Recommendation</h4>
                            <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                fontWeight: 'bold',
                                background: priceRecommendation.marketTrend === 'Rising' ? '#10b981' : priceRecommendation.marketTrend === 'Falling' ? '#ef4444' : '#6b7280',
                                color: 'white'
                            }}>
                                {priceRecommendation.marketTrend === 'Rising' ? '↑ Rising' : priceRecommendation.marketTrend === 'Falling' ? '↓ Falling' : '➡ Stable'}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Market Price</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>₨ {priceRecommendation.todayPrice || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>7-Day Avg</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>₨ {priceRecommendation.sevenDayAvgPrice || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Recommended</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: priceRecommendation.recommendedPrice > priceRecommendation.todayPrice ? '#10b981' : '#ef4444' }}>
                                    ₨ {priceRecommendation.recommendedPrice || 0}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                            Demand Index: {priceRecommendation.demandIndex} | Last 7 days: {priceRecommendation.dataPoints} price records
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label>Quantity (Kg) *</label>
                        <input 
                            type="number" 
                            name="quantity" 
                            value={formData.quantity} 
                            onChange={handleChange} 
                            required 
                            placeholder="e.g. 100"
                            className={errors.quantity ? 'input-error' : ''}
                        />
                        {renderError('quantity')}
                    </div>
                    <div className="form-group">
                        <label>Price per Kg (₨) *</label>
                        <input 
                            type="number" 
                            name="pricePerKg" 
                            value={formData.pricePerKg} 
                            onChange={handleChange} 
                            required 
                            placeholder="e.g. 150"
                            className={errors.pricePerKg ? 'input-error' : ''}
                        />
                        {renderError('pricePerKg')}
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
                            placeholder="e.g. Colombo"
                            className={errors.district ? 'input-error' : ''}
                        />
                        {renderError('district')}
                    </div>
                    <div className="form-group">
                        <label>Near City *</label>
                        <input 
                            type="text" 
                            name="nearCity" 
                            value={formData.nearCity} 
                            onChange={handleChange} 
                            required 
                            placeholder="e.g. Kandy"
                            className={errors.nearCity ? 'input-error' : ''}
                        />
                        {renderError('nearCity')}
                    </div>
                    <div className="form-group">
                        <label>Area/Village *</label>
                        <input 
                            type="text" 
                            name="village" 
                            value={formData.village} 
                            onChange={handleChange} 
                            required 
                            placeholder="e.g. Pettah"
                            className={errors.village ? 'input-error' : ''}
                        />
                        {renderError('village')}
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
                        placeholder="07x xxxxxxx"
                        className={errors.contactNumber ? 'input-error' : ''}
                    />
                    {renderError('contactNumber')}
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Additional details..."></textarea>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Publishing...' : 'Publish Post'}
                </button>
            </form>
        </PageLayout>
    );
};

export default FarmerCreatePost;
