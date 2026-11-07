const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { requireAuth } = require('../middleware/auth');

// All reports routes require authentication
router.use(requireAuth);

router.get('/', reportsController.getAllReports);
router.get('/daily', reportsController.getDailyReport);
router.get('/month-to-date', reportsController.getMonthToDateReport);
router.get('/monthly', reportsController.getMonthlyReport);

module.exports = router;
