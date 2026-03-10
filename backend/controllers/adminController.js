const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'farmer', 'broker', 'buyer'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const users = await User.find({ role }).select('-password');
    res.status(200).json({
      role,
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, location, company, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, location, company, isActive },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const farmers = await User.countDocuments({ role: 'farmer' });
    const brokers = await User.countDocuments({ role: 'broker' });
    const buyers = await User.countDocuments({ role: 'buyer' });
    const admins = await User.countDocuments({ role: 'admin' });

    res.status(200).json({
      totalUsers,
      farmers,
      brokers,
      buyers,
      admins,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
