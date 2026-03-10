import React, { useState, useEffect } from 'react';
import VegetableSelect from '../components/VegetableSelect';
import '../styles/BrokerBuyer.css';
import API from '../services/api';

const BuyerDemand = () => {
    const [formData, setFormData] = useState({
        vegetableId: '',
        quantity: '',
        deliveryDate: '',
        location: {
            district: '',
            city: '',
            area: ''
        }
    });

    const getVegetableNameAllLanguages = (item) => {
        const en = item.vegetableName || '';
        const si = item.vegetableNameSi || '';
        const ta = item.vegetableNameTa || '';
        return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}` || 'N/A';
    };

    const districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ];

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [myDemands, setMyDemands] = useState([]);
    const [demandsLoading, setDemandsLoading] = useState(true);

    useEffect(() => {
        fetchMyDemands();
    }, []);

    const fetchMyDemands = async () => {
        try {
            const res = await API.get('/buyer/my-demands');
            setMyDemands(res.data || []);
        } catch (error) {
            console.error('Error fetching demands:', error);
        } finally {
            setDemandsLoading(false);
        }
    };

    const handleDelete = async (demandId) => {
        if (!window.confirm('Are you sure you want to delete this demand?')) return;
        try {
            await API.delete(`/buyer/demand/${demandId}`);
            setMyDemands(myDemands.filter(d => d._id !== demandId));
            alert('Demand deleted!');
        } catch (error) {
            alert('Error deleting demand');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const vegId = Array.isArray(formData.vegetableId) ? formData.vegetableId[0] : formData.vegetableId;
            await API.post('/buyer/demand', { ...formData, vegetableId: vegId });
            setMessage('Demand published successfully! Brokers will contact you soon.');
            setFormData({
                vegetableId: '',
                quantity: '',
                deliveryDate: '',
                location: { district: '', city: '', area: '' }
            });
            fetchMyDemands();
        } catch (error) {
            setMessage('Error: ' + error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="broker-buyer-page">
            <div className="page-header">
                <h1>📈 Publish Demand</h1>
                <p>Let brokers know what you need. They will find the best supply for you.</p>
            </div>

            <div className="form-container">
                {message && <div className={`badge ${message.includes('Error') ? 'badge-open' : 'badge-fulfilled'}`} style={{ width: '100%', padding: '10px', marginBottom: '15px' }}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <VegetableSelect
                            multiple
                            showBuyerPrice={true}
                            value={Array.isArray(formData.vegetableId) ? formData.vegetableId : (formData.vegetableId ? [formData.vegetableId] : [])}
                            onChange={(ids) => setFormData({ ...formData, vegetableId: ids })}
                            label="Select Vegetable(s)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Quantity Needed (kg)</label>
                        <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g. 1000" required />
                    </div>

                    <div className="form-group">
                        <label>Required Delivery Date</label>
                        <input type="date" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>Target Delivery Location</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <select
                                value={formData.location.district}
                                onChange={e => setFormData({ ...formData, location: { ...formData.location, district: e.target.value } })}
                                required
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="">Select District</option>
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                value={formData.location.city}
                                onChange={e => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                placeholder="City"
                                required
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />

                            <input
                                type="text"
                                value={formData.location.area}
                                onChange={e => setFormData({ ...formData, location: { ...formData.location, area: e.target.value } })}
                                placeholder="Area/Wholesale Store"
                                required
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Publishing...' : 'Publish Demand'}
                    </button>
                </form>
            </div>

            {/* My Published Demands Section */}
            <div className="form-container" style={{ marginTop: '30px' }}>
                <h2 style={{ marginBottom: '20px' }}>📋 My Published Demands</h2>

                {demandsLoading ? (
                    <p>Loading...</p>
                ) : myDemands.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No demands published yet.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vegetable</th>
                                <th>Quantity (kg)</th>
                                <th>Location</th>
                                <th>Delivery Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myDemands.map(demand => (
                                <tr key={demand._id}>
                                    <td>{getVegetableNameAllLanguages(demand)}</td>
                                    <td>{demand.quantity}</td>
                                    <td>
                                        {typeof demand.location === 'object' && demand.location !== null
                                            ? `${demand.location.area}, ${demand.location.city}, ${demand.location.district}`
                                            : demand.location}
                                    </td>
                                    <td>{new Date(demand.deliveryDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${demand.status === 'open' ? 'badge-success' : 'badge-warning'}`}>
                                            {demand.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        {demand.status === 'open' && (
                                            <button
                                                onClick={() => handleDelete(demand._id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#e74c3c',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BuyerDemand;
