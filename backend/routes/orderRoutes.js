const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middleware/authMiddleware");
const orderController = require("../controllers/orderController");

// Get buyer orders (for brokers)
router.get("/buyer-orders", authMiddleware, roleMiddleware(["broker", "admin"]), orderController.getBuyerOrders);

// Get all orders (admin)
router.get("/", authMiddleware, roleMiddleware(["admin"]), orderController.getAllOrders);

// Create new order
router.post("/", authMiddleware, roleMiddleware(["farmer", "broker", "buyer"]), orderController.createOrder);

// Update order status
router.put("/:id/status", authMiddleware, orderController.updateOrderStatus);

// Get single order
router.get("/:id", authMiddleware, orderController.getOrderById);

module.exports = router;
