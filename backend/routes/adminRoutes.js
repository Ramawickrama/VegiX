const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const adminDashboardController = require('../controllers/adminDashboardController');
const vegetableController = require('../controllers/vegetableController');
const upload = require('../middleware/uploadMiddleware');

const noticeUploadDir = path.join(__dirname, '../uploads/notices');
if (!fs.existsSync(noticeUploadDir)) {
  fs.mkdirSync(noticeUploadDir, { recursive: true });
}

const noticeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, noticeUploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'notice-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .webp formats allowed!'));
  }
});

// Vegetable Management
router.get('/vegetables', authMiddleware, roleMiddleware(['admin', 'lite-admin']), vegetableController.getAllVegetables);
router.post('/vegetables', authMiddleware, roleMiddleware(['admin']), vegetableController.createVegetable);
router.put('/vegetables/by-code/:vegCode', authMiddleware, roleMiddleware(['admin']), vegetableController.updateVegetableByCode);
router.put('/vegetables/:id/price', authMiddleware, roleMiddleware(['admin', 'lite-admin']), vegetableController.updatePrice);
router.put('/vegetables/:id', authMiddleware, roleMiddleware(['admin', 'lite-admin']), vegetableController.updateVegetable);

router.get('/users', authMiddleware, roleMiddleware(['admin']), adminController.getAllUsers);
router.get('/users-by-role/:role', authMiddleware, roleMiddleware(['admin']), adminController.getUsersByRole);
router.get('/user-stats', authMiddleware, roleMiddleware(['admin']), adminController.getUserStats);
router.put('/user/:userId', authMiddleware, roleMiddleware(['admin']), adminController.updateUser);
router.delete('/user/:userId', authMiddleware, roleMiddleware(['admin']), adminController.deleteUser);

router.put('/market-price', authMiddleware, roleMiddleware(['admin', 'lite-admin']), adminDashboardController.updateMarketPrice);
router.get('/market-prices', authMiddleware, roleMiddleware(['admin', 'lite-admin']), adminDashboardController.getMarketPrices);
router.get('/price-history/:vegetableId', authMiddleware, roleMiddleware(['admin', 'lite-admin']), adminDashboardController.getPriceHistory);

router.post('/notice', authMiddleware, roleMiddleware(['admin']), adminDashboardController.postNotice);
router.get('/notices', authMiddleware, adminDashboardController.getAllNotices);
router.get('/notices/unread-count', authMiddleware, adminDashboardController.getUnreadNoticeCount);
router.post('/notices/mark-seen', authMiddleware, adminDashboardController.markNoticesSeen);
router.put('/notice/:id', authMiddleware, roleMiddleware(['admin']), adminDashboardController.updateNotice);
router.delete('/notice/:id', authMiddleware, roleMiddleware(['admin']), adminDashboardController.deleteNotice);

// Upload multiple notice images
router.post('/upload-notice-images', authMiddleware, roleMiddleware(['admin']), noticeUpload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }
    if (req.files.length > 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 images allowed' });
    }
    const imageUrls = req.files.map(file => ({
      url: `/uploads/notices/${file.filename}`,
      filename: file.filename
    }));
    res.status(200).json({ success: true, images: imageUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload-notice-image', authMiddleware, roleMiddleware(['admin']), noticeUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    const imageUrl = `/uploads/notices/${req.file.filename}`;
    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/feedback', authMiddleware, roleMiddleware(['admin']), adminDashboardController.getFeedback);
router.put('/feedback/:feedbackId', authMiddleware, roleMiddleware(['admin']), adminDashboardController.updateFeedbackStatus);

router.get('/demand-analysis', authMiddleware, roleMiddleware(['admin']), adminDashboardController.getDemandAnalysis);
router.post('/analyze-demand', authMiddleware, roleMiddleware(['admin']), adminDashboardController.analyzeDemandAndSupply);
router.get('/demand-forecast', authMiddleware, roleMiddleware(['admin']), adminDashboardController.getAdvancedDemandForecast);
router.get('/demand-analysis-3tier', authMiddleware, roleMiddleware(['admin']), adminDashboardController.get3TierDemandForecast);

router.get('/published-orders', authMiddleware, roleMiddleware(['admin']), adminDashboardController.getPublishedOrders);

module.exports = router;
