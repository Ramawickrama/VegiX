import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { initializeSocket } from "../services/socketService";

const API_BASE = "/api";

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false);
  
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token");
      }
      
      const url = `${API_BASE}/orders/buyer-orders`;

      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch (${res.status}): ${errText}`);
      }

      const data = await res.json();
      
      // Handle multiple response formats safely
      let ordersArray = [];
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          ordersArray = data;
        } else if (Array.isArray(data.data)) {
          ordersArray = data.data;
        } else if (data.success && Array.isArray(data.data)) {
          ordersArray = data.data;
        }
      }

      // Ensure all items have required fields
      ordersArray = ordersArray.map(order => ({
        id: order.id || order._id,
        _id: order._id || order.id,
        vegetableName: order.vegetableName || order.vegetable?.name || "Unknown",
        vegCode: order.vegCode || order.vegetable?.vegCode || "VEG000",
        quantity: order.quantity || 0,
        unit: order.unit || "kg",
        pricePerKg: order.pricePerKg || order.pricePerUnit || 0,
        totalPrice: order.totalPrice || 0,
        location: order.location || "",
        deliveryDate: order.deliveryDate,
        status: order.status || "active",
        createdBy: order.createdBy || "Unknown",
        creatorEmail: order.creatorEmail || "",
        createdAt: order.createdAt
      }));

      setOrders(ordersArray);
    } catch (err) {
      console.error("Error fetching buyer orders:", err);
      setError(err.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const transformOrder = (order) => ({
    id: order.id || order._id,
    _id: order._id || order.id,
    vegetableName: order.vegetableName || order.vegetable?.name || "Unknown",
    vegCode: order.vegCode || order.vegetable?.vegCode || "VEG000",
    quantity: order.quantity || 0,
    unit: order.unit || "kg",
    pricePerKg: order.pricePerKg || order.pricePerUnit || 0,
    totalPrice: order.totalPrice || 0,
    location: order.location || "",
    deliveryDate: order.deliveryDate,
    status: order.status || "active",
    createdBy: order.createdBy || "Unknown",
    creatorEmail: order.creatorEmail || "",
    createdAt: order.createdAt
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const socket = initializeSocket(token);
      
      if (socket) {
        socket.emit('join_orders_room');
        setIsRealtime(true);

        socket.on('buyer-order-created', (newOrder) => {
          console.log('[BuyerOrders] New order received:', newOrder);
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id || o._id === newOrder._id)) {
              return prev;
            }
            return [transformOrder(newOrder), ...prev];
          });
        });

        socket.on('marketplace:new-order', (newOrder) => {
          console.log('[BuyerOrders] New marketplace order:', newOrder);
          if (newOrder.orderType === "buyer-order") {
            setOrders(prev => {
              if (prev.some(o => o.id === newOrder.id || o._id === newOrder._id)) {
                return prev;
              }
              return [transformOrder(newOrder), ...prev];
            });
          }
        });

        socket.on('order:update', (updatedOrder) => {
          console.log('[BuyerOrders] Order updated:', updatedOrder);
          setOrders(prev => 
            prev.map(o => (o.id === updatedOrder.id || o._id === updatedOrder._id) ? transformOrder(updatedOrder) : o)
          );
        });

        return () => {
          socket.off('buyer-order-created');
          socket.off('marketplace:new-order');
          socket.off('order:update');
        };
      }
    }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "15px" }}>⏳</div>
        <h3 style={{ color: "#666" }}>Loading Buyer Orders...</h3>
      </div>
    );
  }

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

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: "0", color: "#27ae60", fontSize: "1.75rem", fontWeight: "700" }}>
            📋 Buyer Orders
          </h2>
          <p style={{ margin: "5px 0 0", color: "#666" }}>
            Browse buyer purchase requests - Updates automatically
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ 
            width: "10px", 
            height: "10px", 
            borderRadius: "50%", 
            background: isRealtime ? "#27ae60" : "#f39c12",
            animation: isRealtime ? "pulse 2s infinite" : "none"
          }}></span>
          <small style={{ color: isRealtime ? "#27ae60" : "#f39c12", fontWeight: "600" }}>
            {isRealtime ? "🔴 Live" : "📡"}
          </small>
        </div>
      </div>

      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ 
            padding: "8px 16px", 
            background: "#f5f5f5", 
            borderRadius: "20px",
            fontSize: "0.9rem",
            color: "#666"
          }}>
            {orders.length} orders found
          </span>
        </div>
      </div>

      {orders.length === 0 && (
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
            There are no buyer orders at the moment
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "20px" 
        }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: "1px solid #e0e0e0",
                padding: "20px",
                borderRadius: "12px",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderLeft: "4px solid #e67e22"
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: "15px",
                alignItems: "center"
              }}>
                <h3 style={{ margin: 0, color: "#27ae60", fontSize: "1.1rem", fontWeight: "700" }}>
                  {order.vegCode || "VEG"} - {order.vegetableName}
                </h3>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: order.status === "active" ? "#27ae60" : "#95a5a6",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  textTransform: "uppercase"
                }}>
                  {order.status || "active"}
                </span>
              </div>

              <div style={{ fontSize: "0.95rem", lineHeight: "1.7" }}>
                <p style={{ margin: "6px 0" }}>
                  <strong>📦 Quantity Needed:</strong> {order.quantity || 0} {order.unit || "kg"}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>💰 Expected Price:</strong> Rs.{order.pricePerKg || order.pricePerUnit || 0}/kg
                  <span style={{ color: "#666", marginLeft: "8px" }}>
                    (Total: Rs.{(order.totalPrice || 0).toLocaleString()})
                  </span>
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>📍 Location:</strong> {order.location || "Not specified"}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>📅 Required Date:</strong> {formatDate(order.deliveryDate)}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>👤 Buyer:</strong> {order.createdBy || "Unknown"}
                </p>
              </div>

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
                  onClick={() => alert("Send Offer - Coming soon!")}
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
                  📤 Send Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
