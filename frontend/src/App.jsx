import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './components/Toast';
import './styles/design-system.css';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import MarketPrices from './pages/MarketPrices';
import DemandAnalysis from './pages/DemandAnalysis';
import FutureDemand from './pages/FutureDemand';
import NoticeManagement from './pages/NoticeManagement';
import CustomerSupport from './pages/CustomerSupport';
import PublishedOrders from './pages/PublishedOrders';
import DemandForecastChart from './pages/DemandForecastChart';
import AdminNationalDashboard from './pages/AdminNationalDashboard';
import AdminForecastDashboard from './pages/AdminForecastDashboard';
import AdminMarketIntelligence from './pages/AdminMarketIntelligence';
import LiveMarket from './pages/LiveMarket';
import VegetablePriceHistory from './pages/VegetablePriceHistory';

// Farmer Pages
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerCreatePost from './pages/FarmerCreatePost';
import FarmerOrders from './pages/FarmerOrders';
import FarmerBrokerOrders from './pages/FarmerBrokerOrders';
import FarmerMarketPrices from './pages/FarmerMarketPrices';
import FarmerPrediction from './pages/FarmerPrediction';
import FarmerNews from './pages/FarmerNews';

// Broker Pages
import BrokerDashboard from './pages/BrokerDashboard';
import BrokerMarketPrices from './pages/BrokerMarketPrices';
import BrokerMyOrders from './pages/BrokerMyOrders';
import BrokerBuyerDemands from './pages/BrokerBuyerDemands';
import PublishSellOrder from './pages/PublishSellOrder';
import BrokerNews from './pages/BrokerNews';
import BrokerCreateOrder from './pages/BrokerCreateOrder';
import BrokerViewFarmerOrders from './pages/BrokerViewFarmerOrders';
import BrokerViewBuyerOrders from './pages/BrokerViewBuyerOrders';
import BuyerOrders from './pages/BuyerOrders';
import BrokerCart from './pages/BrokerCart';
import BrokerPayment from './pages/BrokerPayment';

// Buyer Pages
import BuyerDashboard from './pages/BuyerDashboard';
import BuyerDemand from './pages/BuyerDemand';
import BuyerMarketOrders from './pages/BuyerMarketOrders';
import BrokerSellingPosts from './pages/BrokerSellingPosts';
import MarketOrders from './pages/MarketOrders';
import BuyerCart from './pages/BuyerCart';
import BuyerPayment from './pages/BuyerPayment';
import Conversations from './pages/Conversations';

// Common Pages
import TransactionHistory from './pages/TransactionHistory';

import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  return (
    <ToastProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/not-found" element={<NotFound />} />

              {/* Protected Route Wrapper */}
              <Route
                path="/:role/*"
                element={<ProtectedRoute user={user} onLogout={handleLogout} />}
              />

              <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <Navigate to="/login" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </ToastProvider>
  );
}

const ProtectedRoute = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!user) return <Navigate to="/login" />;

  const location = useLocation();
  // Derive active menu from path
  const pathParts = location.pathname.split('/');
  const activeMenu = pathParts[2] || 'dashboard';

  const handleNavigate = (val) => {
    navigate(`/${user.role}/${val}`);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="dashboard-layout">
      <Navbar user={user} onLogout={onLogout} onMenuToggle={toggleSidebar} />
      <div className="dashboard-main">
        <Sidebar
          userRole={user.role}
          onNavigate={handleNavigate}
          activeMenu={activeMenu}
          isOpen={sidebarOpen}
        />
        <div className="dashboard-content">
          <Routes>
            {user.role === 'admin' && (
              <>
                <Route path="/" element={<AdminDashboard user={user} />} />
                <Route path="/dashboard" element={<AdminDashboard user={user} />} />
                <Route path="/national-analytics" element={<AdminNationalDashboard />} />
                <Route path="/live-market" element={<LiveMarket user={user} />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/market-prices" element={<MarketPrices />} />
                <Route path="/demand-analysis" element={<DemandAnalysis />} />
                <Route path="/future-demand" element={<FutureDemand />} />
                <Route path="/demand-forecast" element={<ErrorBoundary><AdminForecastDashboard /></ErrorBoundary>} />
                <Route path="/market-intelligence" element={<AdminMarketIntelligence />} />
                <Route path="/vegetable-history/:id" element={<VegetablePriceHistory />} />
                <Route path="/notice-management" element={<NoticeManagement />} />
                <Route path="/customer-support" element={<CustomerSupport />} />
                <Route path="/published-orders" element={<PublishedOrders />} />
                <Route path="/admin/published-orders" element={<PublishedOrders />} />
                <Route path="/conversations" element={<Conversations />} />
                <Route path="/messages" element={<Conversations />} />
                <Route path="/admin/conversations" element={<Conversations />} />
                <Route path="/admin/messages" element={<Conversations />} />
              </>
            )}

            {user.role === 'lite-admin' && (
              <>
                <Route path="/" element={<MarketPrices />} />
                <Route path="/dashboard" element={<MarketPrices />} />
                <Route path="/market-prices" element={<MarketPrices />} />
                <Route path="/vegetable-history/:id" element={<VegetablePriceHistory />} />
              </>
            )}

            {user.role === 'farmer' && (
              <>
                <Route path="/" element={<FarmerDashboard user={user} />} />
                <Route path="/dashboard" element={<FarmerDashboard user={user} />} />
                <Route path="/publish-order" element={<FarmerCreatePost />} />
                <Route path="/my-orders" element={<FarmerOrders />} />
                <Route path="/broker-orders" element={<FarmerBrokerOrders />} />
                <Route path="/market-prices" element={<FarmerMarketPrices />} />
                <Route path="/news" element={<FarmerNews />} />
                <Route path="/predicting" element={<FarmerPrediction />} />
                <Route path="/transactions" element={<TransactionHistory user={user} />} />
                <Route path="/messages" element={<Conversations />} />
                <Route path="/farmer/conversations" element={<Conversations />} />
                <Route path="/farmer/messages" element={<Conversations />} />
              </>
            )}

            {user.role === 'broker' && (
              <>
                <Route path="/" element={<BrokerDashboard user={user} />} />
                <Route path="/dashboard" element={<BrokerDashboard user={user} />} />
                <Route path="/cart" element={<BrokerCart />} />
                <Route path="/payment/:sellOrderId" element={<BrokerPayment />} />
                <Route path="/market-prices" element={<BrokerMarketPrices />} />
                <Route path="/my-orders" element={<BrokerMyOrders user={user} />} />
                <Route path="/buyer-orders" element={<BuyerOrders />} />
                <Route path="/buyer-demands" element={<BrokerBuyerDemands user={user} />} />
                <Route path="/view-farmer-orders" element={<BrokerViewFarmerOrders />} />
                <Route path="/publish-buy" element={<BrokerCreateOrder />} />
                <Route path="/publish-sell" element={<PublishSellOrder />} />
                <Route path="/broker-news" element={<BrokerNews />} />
                <Route path="/transactions" element={<TransactionHistory user={user} />} />
                <Route path="/conversations" element={<Conversations />} />
                <Route path="/messages" element={<Conversations />} />
                <Route path="/broker/conversations" element={<Conversations />} />
                <Route path="/broker/messages" element={<Conversations />} />
              </>
            )}

            {user.role === 'buyer' && (
              <>
                <Route path="/" element={<BuyerDashboard user={user} />} />
                <Route path="/dashboard" element={<BuyerDashboard user={user} />} />
                <Route path="/buyer-demand" element={<BuyerDemand />} />
                <Route path="/buyer-broker-orders" element={<BrokerSellingPosts />} />
                <Route path="/buyer-market" element={<BrokerSellingPosts />} />
                <Route path="/market-orders" element={<MarketOrders />} />
                <Route path="/cart" element={<BuyerCart user={user} />} />
                <Route path="/buyer/cart" element={<BuyerCart user={user} />} />
                <Route path="/payment/:brokerSellOrderId" element={<BuyerPayment />} />
                <Route path="/transactions" element={<TransactionHistory user={user} />} />
                <Route path="/buyer-chat" element={<Conversations />} />
                <Route path="/messages" element={<Conversations />} />
                <Route path="/conversations" element={<Conversations />} />
              </>
            )}

            <Route path="*" element={<Navigate to={`/${user.role}/dashboard`} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
