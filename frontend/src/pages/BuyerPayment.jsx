import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils/priceUtils';
import './BuyerPayment.css';

const BuyerPayment = () => {
  const { t } = useTranslation();
  const { brokerSellOrderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const queryParams = new URLSearchParams(location.search);
  const initialView = queryParams.get('view') || 'selection';

  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [formData, setFormData] = useState({
    quantityKg: 0
  });

  useEffect(() => {
    fetchPaymentData();
  }, [brokerSellOrderId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get(`/buyer/payment/${brokerSellOrderId}`);

      if (response.data?.success) {
        setPaymentData(response.data.paymentData);
        setFormData(prev => ({
          ...prev,
          quantityKg: response.data.paymentData.availableQuantity || 0
        }));
      } else {
        setError(response.data?.message || t('errors.failedToLoad'));
      }
    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError(err.response?.data?.message || t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const calculateTotals = () => {
    if (!paymentData) return null;

    const quantity = parseFloat(formData.quantityKg) || 0;
    const basePrice = paymentData.basePrice || 0;
    const total = quantity * basePrice;

    return {
      quantity,
      basePrice,
      total
    };
  };

  const totals = calculateTotals();

  const handleSelectCash = () => {
    // Open the payment confirmation/details in a new tab as requested
    window.open(`/buyer/payment/${brokerSellOrderId}?view=pay&method=cash`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentData) return;

    const quantity = parseFloat(formData.quantityKg);
    if (!quantity || quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (quantity > paymentData.availableQuantity) {
      toast.error('Quantity exceeds available quantity');
      return;
    }

    try {
      setProcessing(true);
      const response = await API.post('/buyer/payment/pay', {
        brokerSellOrderId,
        quantityKg: formData.quantityKg,
        paymentMethod: 'cash'
      });

      if (response.data?.success) {
        setReceipt(response.data.receipt);
        toast.success('Cash payment successful!');
      } else {
        toast.error(response.data?.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      if (err.response?.data?.message?.includes('already been purchased')) {
        toast.error('This item has been purchased by someone else');
        navigate('/buyer/cart');
      } else {
        toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleBackToCart = () => {
    navigate('/buyer/cart');
  };

  const handleBackToMarket = () => {
    navigate('/buyer/buyer-broker-orders');
  };

  if (loading) {
    return (
      <PageLayout title="Payment" subtitle="Loading payment details..." loading={true} error={null}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Payment" subtitle="Unable to load payment details" loading={false} error={null}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#e74c3c', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={handleBackToCart}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Back to Cart
          </button>
        </div>
      </PageLayout>
    );
  }

  if (receipt) {
    return (
      <PageLayout title="Payment Successful" subtitle="Your transaction has been completed" loading={false} error={null}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ textAlign: 'center', padding: '30px', background: '#d4edda', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
            <h2 style={{ color: '#155724', margin: '0 0 10px 0' }}>Payment Successful!</h2>
            <p className="transaction-id" style={{ color: '#666' }}>Transaction ID: {receipt.transactionId}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>🏪 Seller (Broker)</h3>
              <p><strong>Name:</strong> {receipt.seller?.name}</p>
              <p><strong>Email:</strong> {receipt.seller?.email}</p>
              <p><strong>Phone:</strong> {receipt.seller?.phone || 'N/A'}</p>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>👤 Buyer Details</h3>
              <p><strong>Name:</strong> {receipt.buyer?.name}</p>
              <p><strong>Email:</strong> {receipt.buyer?.email}</p>
              <p><strong>Phone:</strong> {receipt.buyer?.phone || 'N/A'}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>📦 Final Invoice</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Vegetable:</span>
              <strong>{receipt.item?.vegetableName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Quantity:</span>
              <strong>{receipt.item?.quantityKg} kg</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Price per kg:</span>
              <span>{formatPrice(receipt.item?.basePricePerKg)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #333', paddingTop: '10px', fontSize: '18px' }}>
              <span>Total Paid:</span>
              <strong style={{ color: '#27ae60' }}>{formatPrice(receipt.item?.total)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} className="no-print">
            <button
              onClick={handlePrintReceipt}
              style={{
                padding: '12px 24px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🖨️ Print Invoice
            </button>
            <button
              onClick={handleBackToMarket}
              style={{
                padding: '12px 24px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Finish
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // STEP 1: SELECT PAYMENT METHOD
  if (view === 'selection') {
    return (
      <PageLayout title="Payment Method" subtitle={`Purchasing: ${paymentData?.cartItem?.vegetableName}`} loading={false} error={null}>
        <div style={{ maxWidth: '600px', margin: '50px auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '30px', color: '#2c3e50' }}>💳 Select Payment Method</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div
                onClick={handleSelectCash}
                style={{
                  padding: '30px 20px',
                  border: '2px solid #27ae60',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: '#f1f8e9',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
                className="payment-card"
              >
                <span style={{ fontSize: '40px' }}>💵</span>
                <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#27ae60' }}>Pay with Cash</span>
                <small style={{ color: '#666' }}>Pay at the counter</small>
              </div>

              <div
                style={{
                  padding: '30px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '12px',
                  cursor: 'not-allowed',
                  background: '#f5f5f5',
                  opacity: 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '40px' }}>💳</span>
                <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#7f8c8d', textDecoration: 'line-through' }}>Online Payment</span>
                <small style={{ color: '#c0392b' }}>(Not available)</small>
              </div>
            </div>

            <button
              onClick={handleBackToCart}
              style={{
                marginTop: '30px',
                background: 'none',
                border: 'none',
                color: '#3498db',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                textDecoration: 'underline'
              }}
            >
              Cancel and Return to Cart
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // STEP 2: PAYMENT DETAILS AND CONFIRMATION
  return (
    <PageLayout title="Payment Details" subtitle={`Item: ${paymentData?.cartItem?.vegetableName}`} loading={false} error={null}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* LEFT SIDE: BROKER DETAILS */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)', borderTop: '5px solid #3498db' }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '12px', marginBottom: '20px', color: '#2980b9', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🏪 Broker (Seller) Details
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Name:</span>
                <span style={{ fontWeight: '600' }}>{paymentData?.broker?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Email:</span>
                <span style={{ fontWeight: '500' }}>{paymentData?.broker?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Phone:</span>
                <span style={{ fontWeight: '600' }}>{paymentData?.broker?.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Location:</span>
                <span style={{ fontWeight: '600' }}>{paymentData?.broker?.location?.district || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: BUYER DETAILS */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)', borderTop: '5px solid #27ae60' }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '12px', marginBottom: '20px', color: '#27ae60', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👤 Buyer Details
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Name:</span>
                <span style={{ fontWeight: '600' }}>{paymentData?.buyer?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Email:</span>
                <span style={{ fontWeight: '500' }}>{paymentData?.buyer?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Phone:</span>
                <span style={{ fontWeight: '600' }}>{paymentData?.buyer?.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7f8c8d' }}>Role:</span>
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>Buyer</span>
              </div>
            </div>
          </div>
        </div>

        {/* BELOW: CALCULATION OF VEGETABLE */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '25px', color: '#2c3e50' }}>
            📦 Order Calculation
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#7f8c8d', fontWeight: '500' }}>Vegetable</label>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2e7d32' }}>{paymentData?.cartItem?.vegetableName}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#7f8c8d', fontWeight: '500' }}>Quantity to Purchase (MAX: {paymentData?.availableQuantity} kg)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="number"
                    name="quantityKg"
                    value={formData.quantityKg}
                    onChange={handleChange}
                    min="0.1"
                    max={paymentData?.availableQuantity}
                    step="0.1"
                    required
                    style={{
                      width: '150px',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}
                  />
                  <span style={{ fontSize: '1.2rem', color: '#666' }}>kg</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Unit Price:</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(totals?.basePrice)}/kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Subtotal:</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(totals?.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ddd', paddingTop: '15px', marginTop: '15px' }}>
                <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Total Amount:</span>
                <span style={{ fontWeight: '800', fontSize: '1.4rem', color: '#27ae60' }}>{formatPrice(totals?.total)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
            <button
              onClick={() => window.close()}
              style={{
                flex: 1,
                padding: '15px',
                background: '#ecf0f1',
                color: '#7f8c8d',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1rem'
              }}
            >
              Close Tab
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              style={{
                flex: 2,
                padding: '15px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
              }}
            >
              {processing ? '🔄 Processing...' : `Confirm & Pay ${formatPrice(totals?.total)} (CASH)`}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BuyerPayment;
