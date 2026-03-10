const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const farmerPostController = require('../controllers/farmerPostController');

router.post('/create', authMiddleware, roleMiddleware(['farmer']), farmerPostController.createPost);
router.get('/my-posts', authMiddleware, roleMiddleware(['farmer']), farmerPostController.getMyPosts);
router.get('/all', authMiddleware, farmerPostController.getAllPosts);
router.put('/:id', authMiddleware, roleMiddleware(['farmer']), farmerPostController.updatePost);
router.delete('/:id', authMiddleware, roleMiddleware(['farmer']), farmerPostController.deletePost);
router.delete('/:id/broker', authMiddleware, roleMiddleware(['broker']), farmerPostController.brokerDeletePost);
router.patch('/:id/status', authMiddleware, roleMiddleware(['farmer']), farmerPostController.updatePostStatus);

module.exports = router;
