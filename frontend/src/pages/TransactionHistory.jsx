import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { formatPrice } from '../utils/priceUtils';
import '../styles/ViewOrders.css';

const TransactionHistory = ({ user }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTransactions();
    fetchSummary();
  }, [user, navigate, filterType, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/transactions/history?page=${page}&limit=20&type=${filterType}`);
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await API.get('/transactions/summary');
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'active': return '#3498db';
      case 'cancelled': return '#e74c3c';
      default: return '#666';
    }
  };

  const SummaryCards = () => (
    <div className="summary-cards" style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
      <div className="stat-card" style={{ flex: '1 1 200px', borderLeft: '4px solid #27ae60' }}>
        <h3>Total Sold</h3>
        <p className="stat-value">Rs {(summary?.totalSold || 0).toLocaleString()}</p>
        <span className="stat-label">{summary?.totalSoldCount || 0} transactions</span>
      </div>
    </div>
  );

  const TransactionTable = () => (
    <div style={{ overflowX: 'auto' }}>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Vegetable</th>
            <th>Quantity (kg)</th>
            <th>Price/kg</th>
            <th>Total</th>
            <th>Status</th>
            <th>Other Party</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id}>
              <td>{formatDate(tx.createdAt)}</td>
              <td>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  background: tx.type === 'sold' ? '#d4edda' : '#cce5ff',
                  color: tx.type === 'sold' ? '#155724' : '#004085'
                }}>
                  {tx.type === 'sold' ? 'Sold' : 'Bought'}
                </span>
              </td>
              <td>{tx.vegetableName || 'N/A'}</td>
              <td>{tx.quantityKg || 0}</td>
              <td>{formatPrice(tx.pricePerKg || 0)}</td>
              <td style={{ fontWeight: 'bold' }}>{formatPrice(tx.finalAmount || 0)}</td>
              <td>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: getStatusColor(tx.status) + '20',
                  color: getStatusColor(tx.status)
                }}>
                  {tx.status || 'completed'}
                </span>
              </td>
              <td>{tx.otherParty?.name || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Pagination = () => (
    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{
          padding: '8px 16px',
          background: page === 1 ? '#ddd' : '#3498db',
          color: page === 1 ? '#999' : 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: page === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        Previous
      </button>
      <span style={{ padding: '8px 16px', alignSelf: 'center' }}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        style={{
          padding: '8px 16px',
          background: page === totalPages ? '#ddd' : '#3498db',
          color: page === totalPages ? '#999' : 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: page === totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next
      </button>
    </div>
  );

  const FilterTabs = () => (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      {['all', 'sold'].map((type) => (
        <button
          key={type}
          onClick={() => { setFilterType(type); setPage(1); }}
          style={{
            padding: '10px 20px',
            background: filterType === type ? '#3498db' : 'white',
            color: filterType === type ? 'white' : '#333',
            border: '1px solid #3498db',
            borderRadius: '6px',
            cursor: 'pointer',
            textTransform: 'capitalize'
          }}
        >
          {type === 'all' ? 'All Transactions' : 'Sold'}
        </button>
      ))}
    </div>
  );

  const DashboardContent = () => {
    if (loading) {
      return (
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} height="80px" />)}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon="⚠️"
          title="Unable to load transactions"
          message={error}
          actionLabel="Try Again"
          onAction={fetchTransactions}
        />
      );
    }

    return (
      <>
        {summary && <SummaryCards />}
        <FilterTabs />
        
        {transactions.length > 0 ? (
          <>
            <TransactionTable />
            {totalPages > 1 && <Pagination />}
          </>
        ) : (
          <EmptyState
            icon="📋"
            title="No transactions yet"
            message="Your transaction history will appear here once you start buying or selling vegetables."
          />
        )}
      </>
    );
  };

  return (
    <PageLayout
      title="Transaction History"
      subtitle={`View all your past transactions, ${user?.name || 'User'}`}
      loading={false}
      error={null}
      onRetry={fetchTransactions}
    >
      <DashboardContent />
    </PageLayout>
  );
};

export default TransactionHistory;
