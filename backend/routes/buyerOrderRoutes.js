const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middleware/authMiddleware");
const { getBuyerOrders } = require("../controllers/buyerOrderController");

router.get("/", authMiddleware, roleMiddleware(["broker", "admin"]), getBuyerOrders);

module.exports = router;
