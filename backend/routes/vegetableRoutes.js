const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const vegetableController = require('../controllers/vegetableController');
const upload = require('../middleware/uploadMiddleware');

// ========== PUBLIC ROUTES (All authenticated users) ==========

/**
 * GET /api/vegetables
 * Fetch all active vegetables
 */
router.get('/', authMiddleware, vegetableController.getAllVegetables);

/**
 * GET /api/vegetables/search
 * Search vegetables by name or category
 */
router.get('/search', authMiddleware, vegetableController.searchVegetables);

/**
 * POST /api/vegetables/:id/image
 * Upload vegetable image (Admin only) - MUST be before /:id routes
 */
router.post('/:id/image', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  upload.single('image'), 
  vegetableController.uploadImage
);

/**
 * POST /api/vegetables/by-code/:vegCode/image
 * Upload vegetable image by vegCode (Admin only)
 */
router.post('/by-code/:vegCode/image', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  upload.single('image'), 
  vegetableController.uploadImageByCode
);

/**
 * GET /api/vegetables/:id
 * Fetch single vegetable by vegetableId or MongoDB _id
 */
router.get('/:id', authMiddleware, vegetableController.getVegetableById);

// ========== ADMIN ROUTES ==========

/**
 * POST /api/vegetables
 * Create new vegetable (Admin only)
 */
router.post('/', authMiddleware, roleMiddleware(['admin']), vegetableController.createVegetable);

/**
 * PUT /api/vegetables/:id
 * Update vegetable (Admin only)
 */
router.put('/:id', authMiddleware, roleMiddleware(['admin']), vegetableController.updateVegetable);

/**
 * PUT /api/vegetables/:id/price
 * Update vegetable price (Admin only)
 */
router.put('/:id/price', authMiddleware, roleMiddleware(['admin']), vegetableController.updatePrice);

/**
 * DELETE /api/vegetables/:id
 * Delete vegetable - soft delete (Admin only)
 */
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), vegetableController.deleteVegetable);

module.exports = router;
