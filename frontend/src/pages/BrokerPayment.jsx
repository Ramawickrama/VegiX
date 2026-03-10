import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import { useToast } from '../components/Toast';
import './BrokerPayment.css';

const BrokerPayment = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || 'en';
  const { sellOrderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const getLocalizedVegetableName = (item) => {
    const name = item || {};
    if (currentLanguage === 'si' && name.vegetableNameSi) {
      return name.vegetableNameSi;
    }
    if (currentLanguage === 'ta' && name.vegetableNameTa) {
      return name.vegetableNameTa;
    }
    return name.vegetableName || name.vegetable?.name || 'N/A';
  };

  const getVegetableNameAllLanguages = (item) => {
    const name = item || {};
    const en = name.vegetableName || name.vegetable?.name || 'N/A';
    const si = name.vegetableNameSi || '';
    const ta = name.vegetableNameTa || '';
    return `${en}${si ? ' | ' + si : ''}${ta ? ' | ' + ta : ''}`;
  };

  const [formData, setFormData] = useState({
    quantityMarketKg: 0,
    marketPricePerKg: 0,
    quantityCustomKg: 0,
    customPricePerKg: 0,
    buyFromFarmersPlace: false
  });

  useEffect(() => {
    fetchPaymentData();
  }, [sellOrderId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get(`/broker/payment/${sellOrderId}`);
      
      if (response.data?.success) {
        setPaymentData(response.data.paymentData);
        setFormData(prev => ({
          ...prev,
          quantityMarketKg: response.data.paymentData.availableQuantity || 0,
          marketPricePerKg: response.data.paymentData.marketPrice || 0,
          quantityCustomKg: 0,
          customPricePerKg: response.data.paymentData.marketPrice || 0
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
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
  };

  const calculateTotals = () => {
    if (!paymentData) return null;

    const marketPrice = formData.marketPricePerKg || paymentData.marketPrice || 0;
    const quantityMarket = parseFloat(formData.quantityMarketKg) || 0;
    const quantityCustom = parseFloat(formData.quantityCustomKg) || 0;
    const customPrice = parseFloat(formData.customPricePerKg) || 0;

    const subtotalMarket = quantityMarket * marketPrice;
    const subtotalCustom = quantityCustom * customPrice;
    const totalBeforeDiscount = subtotalMarket + subtotalCustom;
    
    const discountRate = formData.buyFromFarmersPlace ? 0.02 : 0;
    const discountAmount = totalBeforeDiscount * discountRate;
    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    // Broker Estimated Profit (10%)
    const brokerProfitRate = 0.10;
    const brokerEstimatedProfit = totalAfterDiscount * brokerProfitRate;
    
    // Farmer Earnings (after broker profit deduction)
    const farmerEarnings = totalAfterDiscount - brokerEstimatedProfit;

    return {
      subtotalMarket,
      subtotalCustom,
      totalBeforeDiscount,
      discountRate,
      discountAmount,
      totalAfterDiscount,
      brokerProfitRate,
      brokerEstimatedProfit,
      farmerEarnings,
      totalQuantity: quantityMarket + quantityCustom
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentData) return;

    const totalQuantity = (parseFloat(formData.quantityMarketKg) || 0) + (parseFloat(formData.quantityCustomKg) || 0);
    if (totalQuantity <= 0) {
      toast.error('Total quantity must be greater than 0');
      return;
    }

    if (totalQuantity > paymentData.availableQuantity) {
      toast.error('Total quantity exceeds available quantity');
      return;
    }

    try {
      setProcessing(true);
      const response = await API.post('/broker/payment/pay', {
        sellOrderId,
        quantityMarketKg: formData.quantityMarketKg,
        quantityCustomKg: formData.quantityCustomKg,
        customPricePerKg: formData.customPricePerKg,
        buyFromFarmersPlace: formData.buyFromFarmersPlace
      });

      if (response.data?.success) {
        setReceipt(response.data.receipt);
        toast.success('Payment successful!');
      } else {
        toast.error(response.data?.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    const r = receipt;
    const discountLine = r.item.discountApplied 
      ? `<tr><td colspan="2">Discount (${r.item.discountRate * 100}%)</td><td>-Rs ${r.item.discountAmount.toLocaleString()}</td></tr>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${r.transactionId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #27ae60; }
          .transaction-id { color: #666; font-size: 14px; margin-top: 5px; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .party { width: 48%; }
          .party h3 { margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .item-details { margin-bottom: 30px; }
          .item-details table { width: 100%; border-collapse: collapse; }
          .item-details th, .item-details td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
          .item-details th { background: #f9f9f9; }
          .totals { margin-top: 20px; text-align: right; }
          .totals table { width: 300px; margin-left: auto; }
          .totals td { padding: 8px; }
          .totals .final { font-size: 18px; font-weight: bold; color: #27ae60; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧾 VegiX Receipt</h1>
          <div class="transaction-id">${r.transactionId}</div>
          <div class="transaction-id">${new Date(r.date).toLocaleString()}</div>
        </div>
        
        <div class="parties">
          <div class="party">
            <h3>Buyer (Broker)</h3>
            <p><strong>${r.buyer.name}</strong></p>
            <p>${r.buyer.email}</p>
            <p>${r.buyer.phone}</p>
          </div>
          <div class="party">
            <h3>Seller (Farmer)</h3>
            <p><strong>${r.seller.name}</strong></p>
            <p>${r.seller.email}</p>
            <p>${r.seller.phone}</p>
          </div>
        </div>
        
        <div class="item-details">
          <h3>Item Details</h3>
          <table>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Price/kg</th>
              <th>Subtotal</th>
            </tr>
            ${r.item.quantityMarketKg > 0 ? `
            <tr>
              <td>Market Price Portion (${r.item.vegetableName}${r.item.vegetableNameSi ? ' | ' + r.item.vegetableNameSi : ''}${r.item.vegetableNameTa ? ' | ' + r.item.vegetableNameTa : ''})</td>
              <td>${r.item.quantityMarketKg} kg</td>
              <td>Rs ${r.item.marketPricePerKg}</td>
              <td>Rs ${r.item.subtotalMarket.toLocaleString()}</td>
            </tr>
            ` : ''}
            ${r.item.quantityCustomKg > 0 ? `
            <tr>
              <td>Custom Price Portion (${r.item.vegetableName}${r.item.vegetableNameSi ? ' | ' + r.item.vegetableNameSi : ''}${r.item.vegetableNameTa ? ' | ' + r.item.vegetableNameTa : ''})</td>
              <td>${r.item.quantityCustomKg} kg</td>
              <td>Rs ${r.item.customPricePerKg}</td>
              <td>Rs ${r.item.subtotalCustom.toLocaleString()}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div class="totals">
          <table>
            <tr>
              <td>Total Before Discount:</td>
              <td>Rs ${r.item.totalBeforeDiscount.toLocaleString()}</td>
            </tr>
            ${discountLine}
            <tr class="final">
              <td>Total:</td>
              <td>Rs ${r.item.totalPaid.toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          <p>Thank you for using VegiX!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (receipt) {
    return (
      <PageLayout
        title="Payment Successful"
        subtitle="Your transaction has been completed"
      >
        <div className="receipt-success">
          <div className="success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p className="transaction-id">Transaction ID: {receipt.transactionId}</p>
          
          <div className="receipt-summary">
            <div className="summary-row">
              <span>Total Paid:</span>
              <span className="amount">Rs {receipt.item.totalPaid.toLocaleString()}</span>
            </div>
            {receipt.item.discountApplied && (
              <div className="summary-row discount">
                <span>Discount (2%):</span>
                <span>-Rs {receipt.item.discountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="receipt-actions">
            <button className="btn-print" onClick={handlePrintReceipt}>
              🖨️ Print Receipt
            </button>
            <button className="btn-dashboard" onClick={() => navigate('/broker/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout title="Payment" subtitle="Loading payment details...">
        <div className="payment-loading">
          <div className="loading-spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Payment"
        subtitle="Unable to load payment details"
      >
        <div className="payment-error">
          <p>{error}</p>
          <button onClick={fetchPaymentData}>Try Again</button>
          <button onClick={() => navigate('/broker/cart')}>Back to Cart</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Complete Payment"
      subtitle={`Purchasing: ${getVegetableNameAllLanguages(paymentData?.cartItem)}`}
    >
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="payment-layout">
          <div className="party-details buyer">
            <h3>👤 Buyer (Broker)</h3>
            <div className="party-info">
              <p><strong>Name:</strong> {paymentData?.broker?.name}</p>
              <p><strong>Email:</strong> {paymentData?.broker?.email}</p>
              <p><strong>Phone:</strong> {paymentData?.broker?.phone}</p>
            </div>
          </div>

          <div className="party-details seller">
            <h3>👨‍🌾 Seller (Farmer)</h3>
            <div className="party-info">
              <p><strong>Name:</strong> {paymentData?.farmer?.name}</p>
              <p><strong>Email:</strong> {paymentData?.farmer?.email}</p>
              <p><strong>Phone:</strong> {paymentData?.farmer?.phone}</p>
              <p><strong>Location:</strong> {paymentData?.cartItem?.location?.district}, {paymentData?.cartItem?.location?.village}</p>
            </div>
          </div>
        </div>

        <div className="pricing-section">
          <h3>💰 Pricing Details</h3>
          <p className="available-qty">Available Quantity: {paymentData?.availableQuantity} kg</p>
          <p className="market-price">Current Market Price: Rs {paymentData?.marketPrice}/kg</p>

          <div className="pricing-inputs">
            <div className="price-row">
              <label>Original Quality Price (kg)</label>
              <input
                type="number"
                name="quantityMarketKg"
                value={formData.quantityMarketKg}
                onChange={handleChange}
                min="0"
                max={paymentData?.availableQuantity}
              />
              <input
                type="number"
                name="marketPricePerKg"
                value={formData.marketPricePerKg}
                onChange={handleChange}
                min="0"
                placeholder={paymentData?.marketPrice ? `Market: Rs ${paymentData.marketPrice}/kg` : "Price/kg"}
              />
              <span className="input-hint">= Rs {totals?.subtotalMarket?.toLocaleString()}</span>
            </div>

            <div className="price-row">
              <label>Low Quality (kg)</label>
              <input
                type="number"
                name="quantityCustomKg"
                value={formData.quantityCustomKg}
                onChange={handleChange}
                min="0"
                max={paymentData?.availableQuantity}
              />
              <input
                type="number"
                name="customPricePerKg"
                value={formData.customPricePerKg}
                onChange={handleChange}
                min="0"
                placeholder={paymentData?.marketPrice ? `Market: Rs ${paymentData.marketPrice}/kg` : "Custom price/kg"}
              />
              <span className="input-hint">= Rs {totals?.subtotalCustom?.toLocaleString()}</span>
            </div>
          </div>

          <div className="discount-section">
            <label className="discount-checkbox">
              <input
                type="checkbox"
                name="buyFromFarmersPlace"
                checked={formData.buyFromFarmersPlace}
                onChange={handleChange}
              />
              <span>Buy from Farmer's Place (2% discount) / Farmer's Commission</span>
            </label>
          </div>

          <div className="totals-section">
            <div className="total-row">
              <span>Total Before Discount:</span>
              <span>Rs {totals?.totalBeforeDiscount?.toLocaleString()}</span>
            </div>
            {totals?.discountAmount > 0 && (
              <div className="total-row discount">
                <span>Farmer's Commission (2%):</span>
                <span>-Rs {totals?.discountAmount?.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row final">
              <span>Total:</span>
              <span>Rs {totals?.totalAfterDiscount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/broker/cart')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-pay"
            disabled={processing || !totals?.totalAfterDiscount || totals?.totalAfterDiscount <= 0}
          >
            {processing ? 'Processing...' : `Pay Rs ${totals?.totalAfterDiscount?.toLocaleString() || 0}`}
          </button>
        </div>
      </form>
    </PageLayout>
  );
};

export default BrokerPayment;
