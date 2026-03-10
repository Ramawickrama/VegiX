const BuyerOrder = require("../models/BuyerOrder");

const getBuyerOrders = async (req, res) => {
  try {
    const { vegetable, date, district, city } = req.query;
    
    let filter = {};

    // Filter by vegetable name (partial match)
    if (vegetable) {
      filter["vegetable.name"] = { $regex: vegetable, $options: "i" };
    }

    // Filter by delivery date
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.deliveryDate = {
        $gte: start,
        $lte: end
      };
    }

    // Filter by district
    if (district) {
      filter.location = { $regex: district, $options: "i" };
    }

    // Filter by city
    if (city) {
      filter.location = { 
        $regex: city, 
        $options: "i" 
      };
    }

    const orders = await BuyerOrder.find(filter)
      .populate("vegetable", "name vegCode")
      .populate("publishedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Safe transformation with defaults
    const transformedOrders = (orders || []).map(order => ({
      _id: order._id || null,
      orderNumber: order.orderNumber || "",
      vegetable: {
        _id: order.vegetable?._id || null,
        name: order.vegetable?.name || "Unknown Vegetable",
        vegCode: order.vegetable?.vegCode || "VEG000"
      },
      quantity: order.quantity || 0,
      unit: order.unit || "kg",
      budgetPerUnit: order.budgetPerUnit || 0,
      totalBudget: order.totalBudget || 0,
      location: order.location || "",
      deliveryDate: order.deliveryDate || null,
      quality: order.quality || "standard",
      description: order.description || "",
      status: order.status || "active",
      buyerId: order.publishedBy?._id || null,
      buyerName: order.publishedBy?.name || "Unknown Buyer",
      buyerEmail: order.publishedBy?.email || "",
      createdAt: order.createdAt || new Date()
    }));

    res.json(transformedOrders || []);

  } catch (err) {
    console.error("Error fetching buyer orders:", err);
    res.status(500).json({ message: err.message, orders: [] });
  }
};

module.exports = { getBuyerOrders };
