import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

export default function BuyerOrders() {
  // State initialization - ALWAYS as arrays
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [vegetableId, setVegetableId] = useState("");
  const [date, setDate] = useState("");
  const [district, setDistrict] = useState("");

  const navigate = useNavigate();

  // Safe fetch wrapper
  const safeFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  // Fetch vegetables - handle response format { success, data }
  const fetchVegetables = useCallback(async () => {
    try {
      const data = await safeFetch(`${API_BASE}/vegetables`);
      // Handle both direct array and { data: [] } formats
      const vegArray = Array.isArray(data) ? data : (data?.data || []);
      setVegetables(vegArray);
    } catch (err) {
      console.error("Error fetching vegetables:", err);
      setVegetables([]);
    }
  }, []);

  // Fetch orders - handle response format { orders: [] } or direct array
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (vegetableId) params.append("vegetableId", vegetableId);
      if (date) params.append("date", date);
      if (district) params.append("district", district);

      const queryString = params.toString();
      const url = `${API_BASE}/buyer-orders${queryString ? "?" + queryString : ""}`;

      const data = await safeFetch(url);
      
      // Handle both { orders: [] } and direct array formats
      let ordersArray = [];
      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data?.orders && Array.isArray(data.orders)) {
        ordersArray = data.orders;
      } else if (data?.data && Array.isArray(data.data)) {
        ordersArray = data.data;
      }

      setOrders(ordersArray);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [vegetableId, date, district]);

  // Initial load
  useEffect(() => {
    fetchVegetables();
  }, [fetchVegetables]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Frontend filtering - search term
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    let result = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        (order.vegetable?.name || "").toLowerCase().includes(term) ||
        (order.vegetable?.vegCode || "").toLowerCase().includes(term) ||
        (order.buyerName || "").toLowerCase().includes(term) ||
        (order.location || "").toLowerCase().includes(term)
      );
    }

    // Additional frontend filters
    if (vegetableId) {
      result = result.filter(order => 
        order.vegetable?._id === vegetableId
      );
    }

    if (date) {
      const filterDate = new Date(date).toDateString();
      result = result.filter(order => {
        if (!order.deliveryDate) return false;
        return new Date(order.deliveryDate).toDateString() === filterDate;
      });
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, vegetableId, date]);

  // Handle chat
  const handleChat = (order) => {
    if (order?.buyerEmail) {
      navigate(`/broker/messages?email=${encodeURIComponent(order.buyerEmail)}`);
    } else {
      alert("Buyer email not available");
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "Invalid date";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: "#27ae60",
      "in-progress": "#f39c12",
      completed: "#3498db",
      cancelled: "#e74c3c"
    };
    return colors[status] || "#666";
  };

  // Clear all filters
  const clearFilters = () => {
    setVegetableId("");
    setDate("");
    setDistrict("");
    setSearchTerm("");
  };

  const hasFilters = vegetableId || date || district || searchTerm;

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "15px" }}>⏳</div>
        <h3 style={{ color: "#666" }}>Loading Buyer Orders...</h3>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "15px" }}>⚠️</div>
        <h3 style={{ color: "#e74c3c" }}>{error}</h3>
        <button 
          onClick={fetchOrders}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure vegetables is always an array for safe rendering
  const safeVegetables = Array.isArray(vegetables) ? vegetables : [];
  const safeFilteredOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <h2 style={{ marginBottom: "20px", color: "#27ae60", fontSize: "1.75rem", fontWeight: "700" }}>
        🛒 Buyer Orders
      </h2>

      {/* Filter Section */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        marginBottom: "30px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search by vegetable, buyer name, or location..."
            style={{
              width: "100%",
              padding: "12px 15px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "1rem"
            }}
          />
        </div>

        {/* Filter Row */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "15px",
          alignItems: "end"
        }}>
          {/* Vegetable Type - with safe rendering */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.85rem", color: "#666", fontWeight: "600" }}>
              Vegetable Type
            </label>
            <select
              value={vegetableId}
              onChange={(e) => setVegetableId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "0.95rem"
              }}
            >
              <option value="">All Vegetables</option>
              {safeVegetables.length > 0 && safeVegetables.map((v) => (
                <option key={v._id || v.id} value={v._id || v.id}>
                  {v.vegetableId} - {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.85rem", color: "#666", fontWeight: "600" }}>
              Required Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "0.95rem"
              }}
            />
          </div>

          {/* District */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.85rem", color: "#666", fontWeight: "600" }}>
              District
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Search district..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "0.95rem"
              }}
            />
          </div>

          {/* Clear Button */}
          <button
            onClick={clearFilters}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              background: "#e74c3c",
              color: "white",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Results Count */}
        <div style={{ marginTop: "15px", textAlign: "right" }}>
          <span style={{ 
            padding: "8px 16px", 
            background: "#f5f5f5", 
            borderRadius: "20px",
            fontSize: "0.9rem",
            color: "#666"
          }}>
            {safeFilteredOrders.length} orders found
          </span>
        </div>
      </div>

      {/* Empty State */}
      {safeFilteredOrders.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "80px 20px", 
          background: "white", 
          borderRadius: "12px"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📭</div>
          <h3 style={{ color: "#666", marginBottom: "10px" }}>
            No Buyer Orders Available
          </h3>
          <p style={{ color: "#999" }}>
            {hasFilters 
              ? "Try adjusting your filters to see more orders"
              : "There are no buyer orders at the moment"
            }
          </p>
        </div>
      )}

      {/* Orders Grid */}
      {safeFilteredOrders.length > 0 && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "20px" 
        }}>
          {safeFilteredOrders.map((order) => (
            <div
              key={order._id || order.id}
              style={{
                border: "1px solid #e0e0e0",
                padding: "20px",
                borderRadius: "12px",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderLeft: `4px solid ${getStatusColor(order.status)}`
              }}
            >
              {/* Header */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: "15px",
                alignItems: "center"
              }}>
                <h3 style={{ margin: 0, color: "#27ae60", fontSize: "1.1rem", fontWeight: "700" }}>
                  {order.vegetable?.vegCode || "VEG000"} - {order.vegetable?.name || "Unknown"}
                </h3>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: getStatusColor(order.status),
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  textTransform: "uppercase"
                }}>
                  {order.status || "active"}
                </span>
              </div>

              {/* Details */}
              <div style={{ fontSize: "0.95rem", lineHeight: "1.7" }}>
                <p style={{ margin: "6px 0" }}>
                  <strong>📦 Quantity:</strong> {order.quantity || 0} {order.unit || "kg"}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>💰 Price:</strong> Rs.{order.budgetPerUnit || 0}/kg
                  <span style={{ color: "#666", marginLeft: "8px" }}>
                    (Total: Rs.{(order.totalBudget || 0).toLocaleString()})
                  </span>
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>📍 Location:</strong> {order.location || "Not specified"}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>📅 Required Date:</strong> {formatDate(order.deliveryDate)}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>👤 Buyer:</strong> {order.buyerName || "Unknown"}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  onClick={() => handleChat(order)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#3498db",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => alert("Offer feature coming soon")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#27ae60",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  📤 Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
