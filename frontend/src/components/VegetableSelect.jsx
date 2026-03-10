import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import '../styles/VegetableSelect.css';

/**
 * VegetableSelect Component
 * Reusable dropdown for selecting vegetables across all forms
 */
const VegetableSelect = ({
  value = '',
  onChange,
  onVegetableSelect,
  label = 'Select Vegetable',
  required = true,
  disabled = false,
  showPrice = true,
  showBuyerPrice = false,
  multiple = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVegetable, setSelectedVegetable] = useState(null);

  const getDisplayPrice = (veg) => {
    if (showBuyerPrice) {
      return (veg.currentPrice * 1.10).toFixed(2);
    }
    return veg.currentPrice;
  };

  const getDisplayName = (veg) => {
    const parts = [];
    if (veg.name) parts.push(veg.name);
    if (veg.nameSi) parts.push(veg.nameSi);
    if (veg.nameTa) parts.push(veg.nameTa);
    return parts.join(' | ');
  };

  const getTranslatedCategory = (category) => {
    return t(`categories.${category}`, category);
  };

  useEffect(() => {
    fetchVegetables();
  }, []);

  const fetchVegetables = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get('/vegetables');

      const veg = response.data.data || response.data || [];
      setVegetables(Array.isArray(veg) ? veg : []);
    } catch (err) {
      console.error('✗ Error fetching vegetables:', err);
      setError('Failed to load vegetables');
      setVegetables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
      if (onChange) {
        onChange(selectedOptions);
      }
      return;
    }

    const selectedId = e.target.value;
    const veg = vegetables.find((v) => v._id === selectedId || v.vegetableId === selectedId);

    if (veg) {
      setSelectedVegetable(veg);
      if (onChange) onChange(selectedId, veg);
      if (onVegetableSelect) {
        onVegetableSelect(veg);
      }
    }
  };

  return (
    <div className={`vegetable-select-wrapper ${className}`}>
      <label htmlFor="vegetable-select" className="vegetable-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      {error && (
        <div className="error-message">
          <span>⚠ {error}</span>
          <button type="button" className="btn-retry" onClick={fetchVegetables} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {loading && <div className="loading-spinner">{t('common.loading')}</div>}

      {!loading && vegetables.length === 0 && !error && (
        <p className="no-data-msg">{t('common.noData')}</p>
      )}

      {!loading && vegetables.length > 0 && (
        <>
          <select
            id="vegetable-select"
            multiple={multiple}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`vegetable-select ${error ? 'has-error' : ''}`}
            style={multiple ? { minHeight: '120px' } : {}}
          >
            {!multiple && <option value="">{t('common.select')}...</option>}
            {vegetables.map((veg) => (
              <option key={veg._id} value={veg._id || veg.vegetableId}>
                {veg.vegetableId} - {getDisplayName(veg)} {showPrice && veg.currentPrice ? `(₨${getDisplayPrice(veg)})` : ''}
              </option>
            ))}
          </select>

          {selectedVegetable && showPrice && (
            <div className="vegetable-details">
              <div className="detail-item">
                <span className="detail-label">{t('common.id') || 'ID'}:</span>
                <span className="detail-value">{selectedVegetable.vegetableId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('common.name') || 'Name'}:</span>
                <span className="detail-value">{getDisplayName(selectedVegetable)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('common.category')}:</span>
                <span className="detail-value">{getTranslatedCategory(selectedVegetable.category)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{showBuyerPrice ? t('cart.buyerPrice') + ' (+10%)' : t('market.currentPrices')}:</span>
                <span className="detail-value price">
                  ₨{getDisplayPrice(selectedVegetable)}/{selectedVegetable.defaultUnit || 'kg'}
                </span>
              </div>
              {!showBuyerPrice && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">{t('market.priceRange') || 'Range'}:</span>
                    <span className="detail-value text-muted">
                      ₨{selectedVegetable.minPrice} - ₨{selectedVegetable.maxPrice}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VegetableSelect;
