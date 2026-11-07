const express = require('express');
const router = express.Router();
const readingsController = require('../controllers/readingsController');
const { requireAuth } = require('../middleware/auth');

// All readings routes require authentication
router.use(requireAuth);

router.get('/', readingsController.getReadings);
router.post('/', readingsController.createReading);
router.get('/:id', readingsController.getReadingById);
router.put('/:id', readingsController.updateReading);
router.delete('/:id', readingsController.deleteReading);

module.exports = router;
