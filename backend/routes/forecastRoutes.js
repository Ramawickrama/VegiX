const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const forecastController = require('../controllers/forecastController');

router.get('/:vegetableId', authMiddleware, forecastController.getForecast);

router.get('/', authMiddleware, forecastController.getAllForecasts);

router.get('/national/all', authMiddleware, roleMiddleware(['admin']), forecastController.getNationalForecast);

router.get('/date-range/:vegetableId', authMiddleware, forecastController.getForecastByDate);

router.post('/generate', authMiddleware, roleMiddleware(['admin']), forecastController.generateForecast);

module.exports = router;
