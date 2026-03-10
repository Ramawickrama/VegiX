import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import { useToast } from '../components/Toast';
import '../styles/Auth.css';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    location: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('auth.invalidEmail'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      registerData.email = registerData.email.toLowerCase().trim();
      await API.post('/auth/register', registerData);
      toast.success(t('auth.registerSuccess'));
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || t('auth.registerFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>🥬 {t('auth.registerTitle')}</h1>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('auth.fullName')}</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('auth.phoneNumber')}</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+94 xx xxx xxxx"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{t('auth.userRole')}</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="farmer">{t('auth.farmerSeller')}</option>
              <option value="broker">{t('auth.broker')}</option>
              <option value="buyer">{t('auth.buyerHotel')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">{t('auth.location')}</label>
            <input
              id="location"
              type="text"
              name="location"
              placeholder="Your location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">{t('auth.companyName')}</label>
            <input
              id="company"
              type="text"
              name="company"
              placeholder="Your company name"
              value={formData.company}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? t('auth.registering') : t('auth.registerButton')}
          </button>
        </form>

        <p className="auth-footer">
          {t('auth.alreadyHaveAccount')} <a href="/login">{t('auth.loginHere')}</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
